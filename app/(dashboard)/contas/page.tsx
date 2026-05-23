"use client";

import { useState, useCallback, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Filter,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  TrendingDown,
  Wallet,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ContaModal } from "@/components/contas/conta-modal";
import {
  STATUS_LABEL,
  STATUS_COR,
  formatCurrency,
  formatDate,
  formatMes,
  getEffectiveStatus,
  type Conta,
  type ContaSummary,
  type StatusConta,
} from "@/components/contas/conta-types";

type OrderByField = "nome" | "valor" | "vencimento" | "createdAt";
type OrderDir = "asc" | "desc";

const STATUSES = Object.keys(STATUS_LABEL) as StatusConta[];

const ORDER_OPTIONS: { value: `${OrderByField}:${OrderDir}`; label: string }[] = [
  { value: "vencimento:asc", label: "Vencimento (cedo)" },
  { value: "vencimento:desc", label: "Vencimento (tarde)" },
  { value: "nome:asc", label: "Nome A-Z" },
  { value: "nome:desc", label: "Nome Z-A" },
  { value: "valor:asc", label: "Menor valor" },
  { value: "valor:desc", label: "Maior valor" },
  { value: "createdAt:desc", label: "Mais recentes" },
];

interface FetchMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

interface SummaryCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  wrapperClass: string;
  labelClass: string;
  valueClass: string;
  iconClass: string;
  loading?: boolean;
}

function SummaryCard({
  label,
  value,
  icon,
  wrapperClass,
  labelClass,
  valueClass,
  iconClass,
  loading,
}: SummaryCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${wrapperClass}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs font-medium ${labelClass}`}>{label}</p>
        <span className={iconClass}>{icon}</span>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
      )}
    </div>
  );
}

export default function ContasPage() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [summary, setSummary] = useState<ContaSummary | null>(null);
  const [meta, setMeta] = useState<FetchMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusConta | "TODOS">("TODOS");
  const [mes, setMes] = useState<string>(getCurrentMonth());
  const [order, setOrder] = useState<`${OrderByField}:${OrderDir}`>("vencimento:asc");
  const [page, setPage] = useState(1);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<Conta | null>(null);

  const [orderBy, orderDir] = order.split(":") as [OrderByField, OrderDir];

  const fetchContas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        orderBy,
        order: orderDir,
        page: String(page),
        pageSize: "20",
      });
      if (statusFilter !== "TODOS") params.set("status", statusFilter);
      if (mes) params.set("mes", mes);

      const res = await fetch(`/api/contas?${params}`);
      if (!res.ok) throw new Error("Erro ao carregar");
      const json = await res.json();
      setContas(json.data ?? []);
      setSummary(json.summary ?? null);
      setMeta(json.meta ?? null);
    } catch {
      setContas([]);
      setSummary(null);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, mes, orderBy, orderDir, page]);

  useEffect(() => {
    fetchContas();
  }, [fetchContas]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, mes, order]);

  async function handleMarkPaid(conta: Conta) {
    setMarkingPaid(conta.id);
    try {
      const res = await fetch(`/api/contas/${conta.id}/mark-paid`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataPagamento: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Erro ao marcar como paga");
      toast.success(`"${conta.nome}" marcada como paga!`);
      fetchContas();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao marcar como paga");
    } finally {
      setMarkingPaid(null);
    }
  }

  function openNew() {
    setEditingConta(null);
    setModalOpen(true);
  }

  function openEdit(conta: Conta) {
    setEditingConta(conta);
    setModalOpen(true);
  }

  function resetFilters() {
    setStatusFilter("TODOS");
    setMes(getCurrentMonth());
    setOrder("vencimento:asc");
    setPage(1);
  }

  const hasActiveFilters = statusFilter !== "TODOS" || mes !== getCurrentMonth();

  return (
    <DashboardShell>
      <PageHeader
        title="Contas a Pagar"
        description="Controle financeiro com recorrência e atraso automático."
      >
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="Total do mês"
          value={summary ? formatCurrency(summary.totalMes) : "—"}
          icon={<Wallet className="h-4 w-4" />}
          wrapperClass="border-border bg-card"
          labelClass="text-muted-foreground"
          valueClass="text-foreground"
          iconClass="text-muted-foreground"
          loading={loading && !summary}
        />
        <SummaryCard
          label="Pago"
          value={summary ? formatCurrency(summary.totalPago) : "—"}
          icon={<CheckCircle2 className="h-4 w-4" />}
          wrapperClass="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
          labelClass="text-green-700 dark:text-green-400"
          valueClass="text-green-800 dark:text-green-200"
          iconClass="text-green-600 dark:text-green-400"
          loading={loading && !summary}
        />
        <SummaryCard
          label="Pendente"
          value={summary ? formatCurrency(summary.totalPendente) : "—"}
          icon={<TrendingDown className="h-4 w-4" />}
          wrapperClass="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30"
          labelClass="text-yellow-700 dark:text-yellow-400"
          valueClass="text-yellow-800 dark:text-yellow-200"
          iconClass="text-yellow-600 dark:text-yellow-400"
          loading={loading && !summary}
        />
        <SummaryCard
          label="Em atraso"
          value={summary ? formatCurrency(summary.totalAtrasado) : "—"}
          icon={<AlertCircle className="h-4 w-4" />}
          wrapperClass="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
          labelClass="text-red-700 dark:text-red-400"
          valueClass="text-red-800 dark:text-red-200"
          iconClass="text-red-600 dark:text-red-400"
          loading={loading && !summary}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />

        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusConta | "TODOS")}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            {STATUSES.map((s) => (
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

      {/* Content */}
      {loading && contas.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : contas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-muted-foreground">
            {hasActiveFilters
              ? "Nenhuma conta encontrada"
              : "Nenhuma conta cadastrada"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {hasActiveFilters
              ? "Tente ajustar os filtros."
              : 'Clique em "Nova Conta" para começar.'}
          </p>
          {!hasActiveFilters && (
            <Button className="mt-4" onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
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
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Mês Ref.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contas.map((conta) => {
                  const effStatus = getEffectiveStatus(conta);
                  return (
                    <TableRow key={conta.id}>
                      <TableCell className="font-medium">{conta.nome}</TableCell>
                      <TableCell className="tabular-nums">
                        {formatCurrency(conta.valor)}
                      </TableCell>
                      <TableCell>{formatDate(conta.vencimento)}</TableCell>
                      <TableCell>{formatMes(conta.mesReferencia)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COR[effStatus]}`}
                        >
                          {STATUS_LABEL[effStatus]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {effStatus !== "PAGA" && effStatus !== "CANCELADA" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                              title="Marcar como paga"
                              disabled={markingPaid === conta.id}
                              onClick={() => handleMarkPaid(conta)}
                            >
                              {markingPaid === conta.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Editar"
                            onClick={() => openEdit(conta)}
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

      <ContaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        conta={editingConta}
        onSuccess={fetchContas}
      />
    </DashboardShell>
  );
}
