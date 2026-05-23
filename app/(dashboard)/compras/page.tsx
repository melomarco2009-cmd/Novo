"use client";

import { useState, useCallback, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Filter,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  ShoppingBag,
  ShoppingCart,
  Trash2,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { CompraModal } from "@/components/compras/compra-modal";
import {
  URGENCIA_LABEL,
  URGENCIA_COR,
  URGENCIA_BORDER,
  CATEGORIA_LABEL,
  formatCurrency,
  formatQtd,
  type ItemCompra,
  type ComprasSummary,
} from "@/components/compras/compra-types";

type UrgenciaFilter = "TODOS" | "ALTA" | "MEDIA" | "BAIXA";
type CategoriaFilter = "TODOS" | string;
type OrderOption = "createdAt:desc" | "nome:asc" | "urgencia:asc";

const URGENCIA_OPTIONS: { value: UrgenciaFilter; label: string }[] = [
  { value: "TODOS", label: "Todas urgências" },
  { value: "ALTA", label: "Urgente" },
  { value: "MEDIA", label: "Precisa Logo" },
  { value: "BAIXA", label: "Pode Esperar" },
];

const CATEGORIA_OPTIONS = [
  { value: "TODOS", label: "Todas categorias" },
  ...Object.entries(CATEGORIA_LABEL).map(([value, label]) => ({ value, label })),
];

const ORDER_OPTIONS: { value: OrderOption; label: string }[] = [
  { value: "createdAt:desc", label: "Mais recentes" },
  { value: "nome:asc", label: "Nome A-Z" },
  { value: "urgencia:asc", label: "Urgência" },
];

interface FetchMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface SummaryCardProps {
  label: string;
  value: number | string;
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
        <Skeleton className="h-7 w-16" />
      ) : (
        <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      )}
    </div>
  );
}

interface ItemCardProps {
  item: ItemCompra;
  onEdit: (item: ItemCompra) => void;
  onToggleBought: (item: ItemCompra) => void;
  onDuplicate: (item: ItemCompra) => void;
  toggling: boolean;
  duplicating: boolean;
}

function ItemCard({
  item,
  onEdit,
  onToggleBought,
  onDuplicate,
  toggling,
  duplicating,
}: ItemCardProps) {
  const urgenciaCor = URGENCIA_COR[item.urgencia] ?? URGENCIA_COR.BAIXA;
  const urgenciaBorder = URGENCIA_BORDER[item.urgencia] ?? URGENCIA_BORDER.BAIXA;
  const qtd = formatQtd(item.quantidade, item.unidade);

  return (
    <div
      className={`rounded-lg border border-l-4 ${urgenciaBorder} bg-card p-3 transition-opacity ${
        item.comprado ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Toggle comprado */}
        <button
          onClick={() => onToggleBought(item)}
          disabled={toggling}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            item.comprado
              ? "border-green-500 bg-green-500 text-white"
              : "border-muted-foreground hover:border-green-500"
          }`}
          title={item.comprado ? "Marcar como não comprado" : "Marcar como comprado"}
        >
          {toggling ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : item.comprado ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : null}
        </button>

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-medium text-sm ${
                item.comprado ? "line-through text-muted-foreground" : "text-foreground"
              }`}
            >
              {item.nome}
            </span>
            {qtd && (
              <span className="text-xs text-muted-foreground">({qtd})</span>
            )}
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${urgenciaCor}`}
            >
              {URGENCIA_LABEL[item.urgencia]}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>{CATEGORIA_LABEL[item.categoria] ?? item.categoria}</span>
            {item.localCompra && <span>📍 {item.localCompra}</span>}
            {item.valorEstimado && (
              <span>
                Est: {formatCurrency(item.valorEstimado)}
                {item.valorReal ? ` → Real: ${formatCurrency(item.valorReal)}` : ""}
              </span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Duplicar item"
            disabled={duplicating}
            onClick={() => onDuplicate(item)}
          >
            {duplicating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Editar"
            onClick={() => onEdit(item)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ComprasPage() {
  const [itens, setItens] = useState<ItemCompra[]>([]);
  const [summary, setSummary] = useState<ComprasSummary | null>(null);
  const [meta, setMeta] = useState<FetchMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [clearingDone, setClearingDone] = useState(false);

  // Filters
  const [urgenciaFilter, setUrgenciaFilter] = useState<UrgenciaFilter>("TODOS");
  const [categoriaFilter, setCategoriaFilter] = useState<CategoriaFilter>("TODOS");
  const [localFilter, setLocalFilter] = useState("");
  const [order, setOrder] = useState<OrderOption>("createdAt:desc");
  const [page, setPage] = useState(1);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemCompra | null>(null);

  const [orderBy, orderDir] = order.split(":") as [string, "asc" | "desc"];

  const fetchItens = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        orderBy,
        order: orderDir,
        page: String(page),
        pageSize: "50",
      });
      if (urgenciaFilter !== "TODOS") params.set("urgencia", urgenciaFilter);
      if (categoriaFilter !== "TODOS") params.set("categoria", categoriaFilter);
      if (localFilter.trim()) params.set("local", localFilter.trim());

      const res = await fetch(`/api/compras?${params}`);
      if (!res.ok) throw new Error("Erro ao carregar");
      const json = await res.json();
      setItens(json.data ?? []);
      setSummary(json.summary ?? null);
      setMeta(json.meta ?? null);
    } catch {
      setItens([]);
      setSummary(null);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [urgenciaFilter, categoriaFilter, localFilter, orderBy, orderDir, page]);

  useEffect(() => {
    fetchItens();
  }, [fetchItens]);

  useEffect(() => {
    setPage(1);
  }, [urgenciaFilter, categoriaFilter, localFilter, order]);

  async function handleToggleBought(item: ItemCompra) {
    setTogglingId(item.id);
    try {
      const res = await fetch(`/api/compras/${item.id}/toggle-bought`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Erro ao atualizar");
      toast.success(item.comprado ? `"${item.nome}" desmarcado` : `"${item.nome}" comprado!`);
      fetchItens();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDuplicate(item: ItemCompra) {
    setDuplicatingId(item.id);
    try {
      const res = await fetch(`/api/compras/${item.id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Erro ao duplicar");
      toast.success(`"${item.nome}" duplicado!`);
      fetchItens();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao duplicar");
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleClearDone() {
    setClearingDone(true);
    try {
      const comprados = itens.filter((i) => i.comprado);
      await Promise.all(
        comprados.map((i) =>
          fetch(`/api/compras/${i.id}`, { method: "DELETE" })
        )
      );
      toast.success(`${comprados.length} item(s) removido(s)!`);
      fetchItens();
    } catch {
      toast.error("Erro ao limpar itens concluídos");
    } finally {
      setClearingDone(false);
    }
  }

  function openNew() {
    setEditingItem(null);
    setModalOpen(true);
  }

  function openEdit(item: ItemCompra) {
    setEditingItem(item);
    setModalOpen(true);
  }

  function resetFilters() {
    setUrgenciaFilter("TODOS");
    setCategoriaFilter("TODOS");
    setLocalFilter("");
    setOrder("createdAt:desc");
    setPage(1);
  }

  const hasActiveFilters =
    urgenciaFilter !== "TODOS" || categoriaFilter !== "TODOS" || localFilter.trim() !== "";

  const aComprar = itens.filter((i) => !i.comprado);
  const comprados = itens.filter((i) => i.comprado);

  return (
    <DashboardShell>
      <PageHeader
        title="Lista de Compras"
        description="Itens com urgência, duplicação e comparativo estimado vs real."
      >
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Item
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          label="Total de itens"
          value={summary?.totalItens ?? 0}
          icon={<ShoppingCart className="h-4 w-4" />}
          wrapperClass="border-border bg-card"
          labelClass="text-muted-foreground"
          valueClass="text-foreground"
          iconClass="text-muted-foreground"
          loading={loading && !summary}
        />
        <SummaryCard
          label="Urgentes"
          value={summary?.totalUrgentes ?? 0}
          icon={<AlertCircle className="h-4 w-4" />}
          wrapperClass="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
          labelClass="text-red-700 dark:text-red-400"
          valueClass="text-red-800 dark:text-red-200"
          iconClass="text-red-600 dark:text-red-400"
          loading={loading && !summary}
        />
        <SummaryCard
          label="Comprados"
          value={summary?.totalComprados ?? 0}
          icon={<ShoppingBag className="h-4 w-4" />}
          wrapperClass="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
          labelClass="text-green-700 dark:text-green-400"
          valueClass="text-green-800 dark:text-green-200"
          iconClass="text-green-600 dark:text-green-400"
          loading={loading && !summary}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />

        <Select
          value={urgenciaFilter}
          onValueChange={(v) => setUrgenciaFilter(v as UrgenciaFilter)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Urgência" />
          </SelectTrigger>
          <SelectContent>
            {URGENCIA_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoriaFilter}
          onValueChange={(v) => setCategoriaFilter(v)}
        >
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

        <input
          type="text"
          value={localFilter}
          onChange={(e) => setLocalFilter(e.target.value)}
          placeholder="Filtrar por local..."
          className="h-9 w-36 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        <Select value={order} onValueChange={(v) => setOrder(v as OrderOption)}>
          <SelectTrigger className="w-40">
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

        {comprados.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30"
                disabled={clearingDone}
              >
                {clearingDone ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                )}
                Limpar concluídos ({comprados.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar itens concluídos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso removerá {comprados.length} item(s) marcado(s) como comprado. Esta ação não
                  pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearDone}>Limpar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {meta && (
          <span className={`text-xs text-muted-foreground ${comprados.length === 0 ? "ml-auto" : ""}`}>
            {meta.total} resultado{meta.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      {loading && itens.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : itens.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">
            {hasActiveFilters ? "Nenhum item encontrado" : "Lista de compras vazia"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {hasActiveFilters
              ? "Tente ajustar os filtros."
              : 'Clique em "Novo Item" para começar.'}
          </p>
          {!hasActiveFilters && (
            <Button className="mt-4" onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* A comprar */}
          {aComprar.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                A comprar ({aComprar.length})
              </h2>
              <div className="space-y-2">
                {aComprar.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onEdit={openEdit}
                    onToggleBought={handleToggleBought}
                    onDuplicate={handleDuplicate}
                    toggling={togglingId === item.id}
                    duplicating={duplicatingId === item.id}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Comprados */}
          {comprados.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Comprados ({comprados.length})
              </h2>
              <div className="space-y-2">
                {comprados.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onEdit={openEdit}
                    onToggleBought={handleToggleBought}
                    onDuplicate={handleDuplicate}
                    toggling={togglingId === item.id}
                    duplicating={duplicatingId === item.id}
                  />
                ))}
              </div>
            </section>
          )}
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

      <CompraModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        item={editingItem}
        onSuccess={fetchItens}
      />
    </DashboardShell>
  );
}
