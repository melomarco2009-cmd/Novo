"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Filter,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Target,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { MetaModal } from "@/components/metas/meta-modal";
import {
  CATEGORIA_META_LABEL,
  STATUS_META_LABEL,
  STATUS_META_COR,
  STATUS_META_BORDER,
  PRIORIDADE_LABEL,
  PRIORIDADE_COR,
  formatDate,
  type Meta,
} from "@/components/metas/meta-types";

type StatusFilter = "TODOS" | string;
type CategoriaFilter = "TODOS" | string;
type PrioridadeFilter = "TODOS" | string;
type OrderOption = "createdAt:desc" | "prazo:asc" | "titulo:asc" | "prioridade:desc";

const STATUS_OPTIONS = [
  { value: "TODOS", label: "Todos os status" },
  ...Object.entries(STATUS_META_LABEL).map(([value, label]) => ({ value, label })),
];

const CATEGORIA_OPTIONS = [
  { value: "TODOS", label: "Todas categorias" },
  ...Object.entries(CATEGORIA_META_LABEL).map(([value, label]) => ({ value, label })),
];

const PRIORIDADE_OPTIONS = [
  { value: "TODOS", label: "Todas prioridades" },
  ...Object.entries(PRIORIDADE_LABEL).map(([value, label]) => ({ value, label })),
];

const ORDER_OPTIONS: { value: OrderOption; label: string }[] = [
  { value: "createdAt:desc", label: "Mais recentes" },
  { value: "prazo:asc", label: "Prazo mais próximo" },
  { value: "titulo:asc", label: "Título A-Z" },
  { value: "prioridade:desc", label: "Prioridade" },
];

interface FetchMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full bg-blue-500 transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

interface MetaCardProps {
  meta: Meta;
  onEdit: (m: Meta) => void;
}

function MetaCard({ meta, onEdit }: MetaCardProps) {
  const router = useRouter();
  const borderCls = STATUS_META_BORDER[meta.status] ?? "border-l-slate-400";
  const statusCls = STATUS_META_COR[meta.status] ?? STATUS_META_COR.NAO_INICIADA;
  const prioridadeCls = PRIORIDADE_COR[meta.prioridade] ?? PRIORIDADE_COR.MEDIA;
  const progresso = meta.progresso ?? 0;
  const totalMarcos = meta.totalMarcos ?? 0;
  const marcosFeitos = meta.marcosFeitos ?? 0;

  return (
    <div
      className={`rounded-lg border border-l-4 ${borderCls} bg-card p-4 cursor-pointer hover:shadow-sm transition-shadow`}
      onClick={() => router.push(`/metas/${meta.id}`)}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-sm truncate">{meta.titulo}</span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusCls}`}
            >
              {STATUS_META_LABEL[meta.status]}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${prioridadeCls}`}
            >
              {PRIORIDADE_LABEL[meta.prioridade]}
            </span>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mb-2">
            <Badge variant="outline" className="text-xs">
              {CATEGORIA_META_LABEL[meta.categoria]}
            </Badge>
            {meta.prazo && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(meta.prazo)}
              </span>
            )}
          </div>

          {/* Progresso */}
          {totalMarcos > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {marcosFeitos}/{totalMarcos} marcos
                </span>
                <span>{progresso}%</span>
              </div>
              <ProgressBar value={progresso} />
            </div>
          )}
        </div>

        {/* Edit button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          title="Editar meta"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(meta);
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function MetasPage() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [fetchMeta, setFetchMeta] = useState<FetchMeta | null>(null);
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TODOS");
  const [categoriaFilter, setCategoriaFilter] = useState<CategoriaFilter>("TODOS");
  const [prioridadeFilter, setPrioridadeFilter] = useState<PrioridadeFilter>("TODOS");
  const [order, setOrder] = useState<OrderOption>("createdAt:desc");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);

  const [orderBy, orderDir] = order.split(":") as [string, "asc" | "desc"];

  const fetchMetas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        orderBy,
        order: orderDir,
        page: String(page),
        pageSize: "30",
      });
      if (statusFilter !== "TODOS") params.set("status", statusFilter);
      if (categoriaFilter !== "TODOS") params.set("categoria", categoriaFilter);
      if (prioridadeFilter !== "TODOS") params.set("prioridade", prioridadeFilter);

      const res = await fetch(`/api/metas?${params}`);
      if (!res.ok) throw new Error("Erro ao carregar");
      const json = await res.json();
      setMetas(json.data ?? []);
      setFetchMeta(json.meta ?? null);
    } catch {
      toast.error("Erro ao carregar metas");
      setMetas([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoriaFilter, prioridadeFilter, orderBy, orderDir, page]);

  useEffect(() => {
    fetchMetas();
  }, [fetchMetas]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, categoriaFilter, prioridadeFilter, order]);

  function openNew() {
    setEditingMeta(null);
    setModalOpen(true);
  }

  function openEdit(m: Meta) {
    setEditingMeta(m);
    setModalOpen(true);
  }

  function resetFilters() {
    setStatusFilter("TODOS");
    setCategoriaFilter("TODOS");
    setPrioridadeFilter("TODOS");
    setOrder("createdAt:desc");
    setPage(1);
  }

  const hasActiveFilters =
    statusFilter !== "TODOS" || categoriaFilter !== "TODOS" || prioridadeFilter !== "TODOS";

  const ativas = metas.filter((m) => m.status !== "CONCLUIDA" && m.status !== "CANCELADA");
  const concluidas = metas.filter((m) => m.status === "CONCLUIDA");

  return (
    <DashboardShell>
      <PageHeader
        title="Metas"
        description="Objetivos com marcos, diário e progresso automático."
      >
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIA_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            {PRIORIDADE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={order} onValueChange={(v) => setOrder(v as OrderOption)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Limpar
          </Button>
        )}

        {fetchMeta && (
          <span className="ml-auto text-xs text-muted-foreground">
            {fetchMeta.total} resultado{fetchMeta.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      {loading && metas.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : metas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">
            {hasActiveFilters ? "Nenhuma meta encontrada" : "Nenhuma meta ainda"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {hasActiveFilters
              ? "Tente ajustar os filtros."
              : 'Clique em "Nova Meta" para começar.'}
          </p>
          {!hasActiveFilters && (
            <Button className="mt-4" onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Metas Ativas */}
          {ativas.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <Target className="h-4 w-4" />
                Metas Ativas ({ativas.length})
              </h2>
              <div className="space-y-2">
                {ativas.map((m) => (
                  <MetaCard key={m.id} meta={m} onEdit={openEdit} />
                ))}
              </div>
            </section>
          )}

          {/* Metas Concluídas */}
          {concluidas.length > 0 && (
            <section>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <CheckCircle2 className="h-4 w-4" />
                Metas Concluídas ({concluidas.length})
              </h2>
              <div className="space-y-2 opacity-80">
                {concluidas.map((m) => (
                  <MetaCard key={m.id} meta={m} onEdit={openEdit} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Pagination */}
      {fetchMeta && fetchMeta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Página {fetchMeta.page} de {fetchMeta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= fetchMeta.totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

      {loading && metas.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      <MetaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        meta={editingMeta}
        onSuccess={fetchMetas}
      />
    </DashboardShell>
  );
}
