"use client";

import { useState, useCallback, useEffect } from "react";
import {
  AlertCircle,
  CalendarDays,
  Filter,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Users,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { PrestadorModal } from "@/components/prestadores/prestador-modal";
import {
  STATUS_VINCULO_COR,
  STATUS_VINCULO_LABEL,
  TIPO_VINCULO_LABEL,
  formatCurrency,
  getPaymentAlert,
  type PrestadorListItem,
  type StatusVinculo,
  type TipoVinculo,
} from "@/components/prestadores/prestador-types";

type OrderByField = "nome" | "cargo" | "diaPagamento" | "createdAt";
type OrderDir = "asc" | "desc";

const STATUS_OPTIONS = Object.keys(STATUS_VINCULO_LABEL) as StatusVinculo[];
const TIPO_OPTIONS = Object.keys(TIPO_VINCULO_LABEL) as TipoVinculo[];

const ORDER_OPTIONS: { value: `${OrderByField}:${OrderDir}`; label: string }[] = [
  { value: "nome:asc", label: "Nome A-Z" },
  { value: "nome:desc", label: "Nome Z-A" },
  { value: "diaPagamento:asc", label: "Dia pagamento (cedo)" },
  { value: "diaPagamento:desc", label: "Dia pagamento (tarde)" },
  { value: "createdAt:desc", label: "Mais recentes" },
  { value: "createdAt:asc", label: "Mais antigos" },
];

interface FetchMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function PrestadoresPage() {
  const [prestadores, setPrestadores] = useState<PrestadorListItem[]>([]);
  const [meta, setMeta] = useState<FetchMeta | null>(null);
  const [loading, setLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusVinculo | "TODOS">("TODOS");
  const [tipoFilter, setTipoFilter] = useState<TipoVinculo | "TODOS">("TODOS");
  const [order, setOrder] = useState<`${OrderByField}:${OrderDir}`>("nome:asc");
  const [page, setPage] = useState(1);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrestador, setEditingPrestador] =
    useState<PrestadorListItem | null>(null);

  const [orderBy, orderDir] = order.split(":") as [OrderByField, OrderDir];

  const fetchPrestadores = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        orderBy,
        order: orderDir,
        page: String(page),
        pageSize: "20",
      });
      if (statusFilter !== "TODOS") params.set("statusVinculo", statusFilter);
      if (tipoFilter !== "TODOS") params.set("tipoVinculo", tipoFilter);

      const res = await fetch(`/api/prestadores?${params}`);
      if (!res.ok) throw new Error("Erro ao carregar");
      const json = await res.json();
      setPrestadores(json.data ?? []);
      setMeta(json.meta ?? null);
    } catch {
      setPrestadores([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, tipoFilter, orderBy, orderDir, page]);

  useEffect(() => {
    fetchPrestadores();
  }, [fetchPrestadores]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, tipoFilter, order]);

  function openNew() {
    setEditingPrestador(null);
    setModalOpen(true);
  }

  function openEdit(p: PrestadorListItem) {
    setEditingPrestador(p);
    setModalOpen(true);
  }

  function resetFilters() {
    setStatusFilter("TODOS");
    setTipoFilter("TODOS");
    setOrder("nome:asc");
    setPage(1);
  }

  const hasActiveFilters = statusFilter !== "TODOS" || tipoFilter !== "TODOS";

  const urgentCount = prestadores.filter((p) => {
    const alert = getPaymentAlert(p.proximoPagamento, p.diaPagamento);
    return alert?.isUrgent;
  }).length;

  return (
    <DashboardShell>
      <PageHeader
        title="Prestadores"
        description="Gerencie cadastros, contratos, documentos e pagamentos."
      >
        {urgentCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-950/50 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5" />
            {urgentCount} pagamento{urgentCount > 1 ? "s" : ""} em breve
          </span>
        )}
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Prestador
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusVinculo | "TODOS")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_VINCULO_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={tipoFilter}
          onValueChange={(v) => setTipoFilter(v as TipoVinculo | "TODOS")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Vínculo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos os vínculos</SelectItem>
            {TIPO_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {TIPO_VINCULO_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={order} onValueChange={(v) => setOrder(v as typeof order)}>
          <SelectTrigger className="w-52">
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
            {meta.total} prestador{meta.total !== 1 ? "es" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      {loading && prestadores.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : prestadores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-lg font-semibold text-muted-foreground">
            {hasActiveFilters
              ? "Nenhum prestador encontrado"
              : "Nenhum prestador cadastrado"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {hasActiveFilters
              ? "Tente ajustar os filtros."
              : 'Clique em "Novo Prestador" para começar.'}
          </p>
          {!hasActiveFilters && (
            <Button className="mt-4" onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Prestador
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Vínculo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Salário</TableHead>
                  <TableHead>Próx. Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prestadores.map((p) => {
                  const alert = getPaymentAlert(p.proximoPagamento, p.diaPagamento);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {p.cargo ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {TIPO_VINCULO_LABEL[p.tipoVinculo]}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_VINCULO_COR[p.statusVinculo]}`}
                        >
                          {STATUS_VINCULO_LABEL[p.statusVinculo]}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {formatCurrency(p.salario)}
                      </TableCell>
                      <TableCell>
                        {alert ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              alert.isUrgent
                                ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {alert.isUrgent && (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            <CalendarDays className="h-3 w-3" />
                            {alert.label}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Editar"
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {loading && (
            <div className="flex justify-center mt-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((prev) => prev - 1)}
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
                onClick={() => setPage((prev) => prev + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}

      <PrestadorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        prestador={editingPrestador}
        onSuccess={fetchPrestadores}
      />
    </DashboardShell>
  );
}
