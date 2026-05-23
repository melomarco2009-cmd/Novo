"use client";

import { useState, useCallback, useEffect } from "react";
import {
  AlertTriangle,
  Filter,
  Loader2,
  Plus,
  RotateCcw,
} from "lucide-react";

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

import { ServicoCard } from "@/components/servicos/servico-card";
import { ServicoModal } from "@/components/servicos/servico-modal";
import {
  CATEGORIA_LABEL,
  STATUS_LABEL,
  daysUntilVencimento,
  formatCurrency,
  type Servico,
  type CategoriaServico,
  type StatusServico,
} from "@/components/servicos/servico-types";

type OrderByField = "nome" | "valorMensal" | "diaVencimento" | "createdAt";
type OrderDir = "asc" | "desc";

const categorias = Object.keys(CATEGORIA_LABEL) as CategoriaServico[];
const statuses = Object.keys(STATUS_LABEL) as StatusServico[];

const ORDER_OPTIONS: { value: `${OrderByField}:${OrderDir}`; label: string }[] =
  [
    { value: "nome:asc", label: "Nome A-Z" },
    { value: "nome:desc", label: "Nome Z-A" },
    { value: "valorMensal:asc", label: "Menor valor" },
    { value: "valorMensal:desc", label: "Maior valor" },
    { value: "diaVencimento:asc", label: "Vencimento (cedo)" },
    { value: "diaVencimento:desc", label: "Vencimento (tarde)" },
    { value: "createdAt:desc", label: "Mais recentes" },
    { value: "createdAt:asc", label: "Mais antigos" },
  ];

interface FetchMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  totalMensal: string;
}

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [meta, setMeta] = useState<FetchMeta | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [categoria, setCategoria] = useState<CategoriaServico | "TODOS">("TODOS");
  const [status, setStatus] = useState<StatusServico | "TODOS">("TODOS");
  const [order, setOrder] = useState<`${OrderByField}:${OrderDir}`>("nome:asc");
  const [page, setPage] = useState(1);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);

  const [orderBy, orderDir] = order.split(":") as [OrderByField, OrderDir];

  const fetchServicos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        orderBy,
        order: orderDir,
        page: String(page),
        pageSize: "12",
      });
      if (categoria !== "TODOS") params.set("categoria", categoria);
      if (status !== "TODOS") params.set("status", status);

      const res = await fetch(`/api/servicos?${params}`);
      if (!res.ok) throw new Error("Erro ao carregar");
      const json = await res.json();
      setServicos(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch {
      setServicos([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [categoria, status, orderBy, orderDir, page]);

  useEffect(() => {
    fetchServicos();
  }, [fetchServicos]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [categoria, status, order]);

  function openNew() {
    setEditingServico(null);
    setModalOpen(true);
  }

  function openEdit(servico: Servico) {
    setEditingServico(servico);
    setModalOpen(true);
  }

  function resetFilters() {
    setCategoria("TODOS");
    setStatus("TODOS");
    setOrder("nome:asc");
    setPage(1);
  }

  const hasActiveFilters = categoria !== "TODOS" || status !== "TODOS";

  const alertCount = servicos.filter(
    (s) => s.status === "ATIVO" && daysUntilVencimento(s.diaVencimento) <= 7
  ).length;

  return (
    <DashboardShell>
      <PageHeader
        title="Acessos e Assinaturas"
        description="Gerencie seus serviços, assinaturas e senhas."
      >
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Serviço
        </Button>
      </PageHeader>

      {/* Total mensal + alert summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Total mensal (ativos)</p>
          <p className="mt-1 text-3xl font-bold">
            {meta ? formatCurrency(meta.totalMensal) : "—"}
          </p>
          {meta && (
            <p className="mt-1 text-xs text-muted-foreground">
              {meta.total} serviço{meta.total !== 1 ? "s" : ""} cadastrado
              {meta.total !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {alertCount > 0 && (
          <div className="rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-5 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                {alertCount} renovação
                {alertCount !== 1 ? "es" : ""} nos próximos 7 dias
              </p>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
                Verifique os serviços destacados em vermelho.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

        <Select
          value={categoria}
          onValueChange={(v) => setCategoria(v as CategoriaServico | "TODOS")}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todas categorias</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORIA_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(v) => setStatus(v as StatusServico | "TODOS")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos status</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={order} onValueChange={(v) => setOrder(v as typeof order)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Ordenar por" />
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

        {meta && (
          <span className="ml-auto text-xs text-muted-foreground">
            {meta.total} resultado{meta.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Grid */}
      {loading && servicos.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-3">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : servicos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-muted-foreground">
            {hasActiveFilters
              ? "Nenhum serviço encontrado"
              : "Nenhum serviço cadastrado"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {hasActiveFilters
              ? "Tente ajustar os filtros."
              : 'Clique em "Novo Serviço" para começar.'}
          </p>
          {!hasActiveFilters && (
            <Button className="mt-4" onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Serviço
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {servicos.map((s) => (
              <ServicoCard key={s.id} servico={s} onEdit={openEdit} />
            ))}
          </div>

          {loading && (
            <div className="flex justify-center mt-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Página {meta.page} de {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}

      <ServicoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        servico={editingServico}
        onSuccess={fetchServicos}
      />
    </DashboardShell>
  );
}
