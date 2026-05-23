"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
  BookOpen,
  Flag,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
import { Skeleton } from "@/components/ui/skeleton";

import { MetaModal } from "@/components/metas/meta-modal";
import {
  CATEGORIA_META_LABEL,
  STATUS_META_LABEL,
  STATUS_META_COR,
  PRIORIDADE_LABEL,
  PRIORIDADE_COR,
  formatDate,
  formatDateTime,
  type Meta,
  type Marco,
  type EntradaDiario,
  type AnexoMeta,
} from "@/components/metas/meta-types";

function ProgressBar({ value }: { value: number }) {
  const color =
    value >= 100
      ? "bg-green-500"
      : value >= 50
      ? "bg-blue-500"
      : value > 0
      ? "bg-blue-400"
      : "bg-muted-foreground/20";

  return (
    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function isImageMime(mime: string) {
  return mime.startsWith("image/");
}

export default function MetaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const metaId = params.id as string;

  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Marcos
  const [addingMarco, setAddingMarco] = useState(false);
  const [novoMarcoTitulo, setNovoMarcoTitulo] = useState("");
  const [novoMarcoDesc, setNovoMarcoDesc] = useState("");
  const [savingMarco, setSavingMarco] = useState(false);
  const [togglingMarcoId, setTogglingMarcoId] = useState<string | null>(null);
  const [deletingMarcoId, setDeletingMarcoId] = useState<string | null>(null);
  const [editingMarco, setEditingMarco] = useState<Marco | null>(null);
  const [editMarcoTitulo, setEditMarcoTitulo] = useState("");
  const [editMarcoDesc, setEditMarcoDesc] = useState("");
  const [savingEditMarco, setSavingEditMarco] = useState(false);

  // Diário
  const [novaDiarioConteudo, setNovaDiarioConteudo] = useState("");
  const [novaDiarioHumor, setNovaDiarioHumor] = useState("");
  const [savingDiario, setSavingDiario] = useState(false);
  const [deletingEntradaId, setDeletingEntradaId] = useState<string | null>(null);

  // Anexos
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);
  const [deletingAnexoId, setDeletingAnexoId] = useState<string | null>(null);

  const fetchMeta = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/metas/${metaId}`);
      if (!res.ok) {
        if (res.status === 404) router.push("/metas");
        throw new Error("Não encontrado");
      }
      const json = await res.json();
      setMeta(json.data);
    } catch {
      toast.error("Erro ao carregar meta");
    } finally {
      setLoading(false);
    }
  }, [metaId, router]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  // ─── Marcos ────────────────────────────────────────────────────────────────

  async function handleAddMarco() {
    if (!novoMarcoTitulo.trim()) return;
    setSavingMarco(true);
    try {
      const res = await fetch(`/api/metas/${metaId}/marcos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: novoMarcoTitulo.trim(), descricao: novoMarcoDesc || null }),
      });
      if (!res.ok) throw new Error("Erro ao criar marco");
      toast.success("Marco adicionado!");
      setNovoMarcoTitulo("");
      setNovoMarcoDesc("");
      setAddingMarco(false);
      fetchMeta();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar marco");
    } finally {
      setSavingMarco(false);
    }
  }

  async function handleToggleMarco(marco: Marco) {
    setTogglingMarcoId(marco.id);
    try {
      const res = await fetch(`/api/metas/${metaId}/marcos/${marco.id}/toggle`, { method: "PATCH" });
      if (!res.ok) throw new Error("Erro ao atualizar");
      fetchMeta();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar marco");
    } finally {
      setTogglingMarcoId(null);
    }
  }

  async function handleDeleteMarco(marcoId: string) {
    setDeletingMarcoId(marcoId);
    try {
      const res = await fetch(`/api/metas/${metaId}/marcos/${marcoId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir marco");
      toast.success("Marco removido!");
      fetchMeta();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir marco");
    } finally {
      setDeletingMarcoId(null);
    }
  }

  function startEditMarco(marco: Marco) {
    setEditingMarco(marco);
    setEditMarcoTitulo(marco.titulo);
    setEditMarcoDesc(marco.descricao ?? "");
  }

  async function handleSaveEditMarco() {
    if (!editingMarco || !editMarcoTitulo.trim()) return;
    setSavingEditMarco(true);
    try {
      const res = await fetch(`/api/metas/${metaId}/marcos/${editingMarco.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: editMarcoTitulo.trim(),
          descricao: editMarcoDesc || null,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      toast.success("Marco atualizado!");
      setEditingMarco(null);
      fetchMeta();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar marco");
    } finally {
      setSavingEditMarco(false);
    }
  }

  // ─── Diário ────────────────────────────────────────────────────────────────

  async function handleAddDiario() {
    if (!novaDiarioConteudo.trim()) return;
    setSavingDiario(true);
    try {
      const res = await fetch(`/api/metas/${metaId}/diario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conteudo: novaDiarioConteudo.trim(),
          humor: novaDiarioHumor.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar entrada");
      toast.success("Entrada adicionada!");
      setNovaDiarioConteudo("");
      setNovaDiarioHumor("");
      fetchMeta();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar entrada");
    } finally {
      setSavingDiario(false);
    }
  }

  async function handleDeleteEntrada(entradaId: string) {
    setDeletingEntradaId(entradaId);
    try {
      const res = await fetch(`/api/metas/${metaId}/diario/${entradaId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir entrada");
      toast.success("Entrada removida!");
      fetchMeta();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir entrada");
    } finally {
      setDeletingEntradaId(null);
    }
  }

  // ─── Anexos ────────────────────────────────────────────────────────────────

  async function handleAnexoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAnexo(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/metas/${metaId}/anexos`, { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erro ao enviar arquivo");
      }
      const json = await res.json();
      toast.success(`"${json.data.originalName}" enviado!`);
      fetchMeta();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setUploadingAnexo(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDeleteAnexo(anexoId: string) {
    setDeletingAnexoId(anexoId);
    try {
      const res = await fetch(`/api/uploads/${anexoId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao remover anexo");
      toast.success("Anexo removido!");
      fetchMeta();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    } finally {
      setDeletingAnexoId(null);
    }
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </DashboardShell>
    );
  }

  if (!meta) return null;

  const progresso = meta.progresso ?? 0;
  const totalMarcos = meta.totalMarcos ?? 0;
  const marcosFeitos = meta.marcosFeitos ?? 0;
  const marcos = meta.marcos ?? [];
  const diario = meta.diario ?? [];
  const anexos = meta.anexos ?? [];
  const statusCls = STATUS_META_COR[meta.status] ?? STATUS_META_COR.NAO_INICIADA;
  const prioridadeCls = PRIORIDADE_COR[meta.prioridade] ?? PRIORIDADE_COR.MEDIA;

  return (
    <DashboardShell>
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 -ml-2"
        onClick={() => router.push("/metas")}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">{meta.titulo}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusCls}`}>
              {STATUS_META_LABEL[meta.status]}
            </span>
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${prioridadeCls}`}>
              <Flag className="h-3 w-3 mr-1" />
              {PRIORIDADE_LABEL[meta.prioridade]}
            </span>
            <Badge variant="outline">{CATEGORIA_META_LABEL[meta.categoria]}</Badge>
            {meta.prazo && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Prazo: {formatDate(meta.prazo)}
              </span>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
          <Pencil className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Description + Motivation */}
      {(meta.descricao || meta.motivacao) && (
        <div className="grid gap-4 mb-6 sm:grid-cols-2">
          {meta.descricao && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Descrição
              </p>
              <p className="text-sm whitespace-pre-wrap">{meta.descricao}</p>
            </div>
          )}
          {meta.motivacao && (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Motivação
              </p>
              <p className="text-sm whitespace-pre-wrap">{meta.motivacao}</p>
            </div>
          )}
        </div>
      )}

      {/* Progress Card */}
      <div className="rounded-lg border bg-card p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold">Progresso</p>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{progresso}%</span>
        </div>
        <ProgressBar value={progresso} />
        {totalMarcos > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            {marcosFeitos} de {totalMarcos} marcos concluídos
          </p>
        )}
        {totalMarcos === 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Adicione marcos para acompanhar o progresso
          </p>
        )}
      </div>

      {/* ─── Marcos ─────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Marcos / Etapas
            {totalMarcos > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({marcosFeitos}/{totalMarcos})
              </span>
            )}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddingMarco((v) => !v)}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Adicionar Marco
          </Button>
        </div>

        {/* Add marco form */}
        {addingMarco && (
          <div className="rounded-lg border bg-muted/30 p-4 mb-4 space-y-3">
            <Input
              placeholder="Título do marco *"
              value={novoMarcoTitulo}
              onChange={(e) => setNovoMarcoTitulo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddMarco()}
            />
            <Textarea
              placeholder="Descrição (opcional)"
              rows={2}
              value={novoMarcoDesc}
              onChange={(e) => setNovoMarcoDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddMarco} disabled={savingMarco || !novoMarcoTitulo.trim()}>
                {savingMarco && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Salvar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAddingMarco(false);
                  setNovoMarcoTitulo("");
                  setNovoMarcoDesc("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Marco list */}
        {marcos.length === 0 && !addingMarco ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhum marco adicionado ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {marcos.map((marco) => {
              const isEditing = editingMarco?.id === marco.id;
              const isToggling = togglingMarcoId === marco.id;
              const isDeleting = deletingMarcoId === marco.id;

              return (
                <div
                  key={marco.id}
                  className={`rounded-lg border bg-card p-3 transition-opacity ${
                    marco.concluido ? "opacity-70" : ""
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editMarcoTitulo}
                        onChange={(e) => setEditMarcoTitulo(e.target.value)}
                        placeholder="Título *"
                      />
                      <Textarea
                        value={editMarcoDesc}
                        onChange={(e) => setEditMarcoDesc(e.target.value)}
                        rows={2}
                        placeholder="Descrição (opcional)"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEditMarco} disabled={savingEditMarco || !editMarcoTitulo.trim()}>
                          {savingEditMarco && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                          Salvar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditingMarco(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleMarco(marco)}
                        disabled={isToggling}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          marco.concluido
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-muted-foreground hover:border-green-500"
                        }`}
                      >
                        {isToggling ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : marco.concluido ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Circle className="h-3 w-3 opacity-0" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${marco.concluido ? "line-through text-muted-foreground" : ""}`}>
                          {marco.titulo}
                        </p>
                        {marco.descricao && (
                          <p className="text-xs text-muted-foreground mt-0.5">{marco.descricao}</p>
                        )}
                        {marco.concluidoEm && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                            Concluído em {formatDateTime(marco.concluidoEm)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => startEditMarco(marco)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir marco?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteMarco(marco.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Separator className="mb-8" />

      {/* ─── Diário ──────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <h2 className="text-base font-semibold flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4" />
          Diário da Meta
        </h2>

        {/* New entry form */}
        <div className="rounded-lg border bg-muted/30 p-4 mb-4 space-y-3">
          <Textarea
            placeholder="O que você está pensando sobre essa meta hoje?"
            rows={3}
            value={novaDiarioConteudo}
            onChange={(e) => setNovaDiarioConteudo(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <Input
              placeholder="Humor (ex: animado, focado, cansado...)"
              value={novaDiarioHumor}
              onChange={(e) => setNovaDiarioHumor(e.target.value)}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleAddDiario}
              disabled={savingDiario || !novaDiarioConteudo.trim()}
            >
              {savingDiario && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
              Registrar
            </Button>
          </div>
        </div>

        {/* Entries */}
        {diario.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma entrada no diário ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {diario.map((entrada) => {
              const isDeleting = deletingEntradaId === entrada.id;
              return (
                <div key={entrada.id} className="rounded-lg border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(entrada.createdAt)}
                        </span>
                        {entrada.humor && (
                          <Badge variant="outline" className="text-xs">
                            {entrada.humor}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{entrada.conteudo}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir entrada?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteEntrada(entrada.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Separator className="mb-8" />

      {/* ─── Anexos ──────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Anexos de Inspiração
            {anexos.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">({anexos.length})</span>
            )}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAnexo}
          >
            {uploadingAnexo ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5 mr-1.5" />
            )}
            Adicionar Anexo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleAnexoUpload}
          />
        </div>

        {anexos.length === 0 ? (
          <div
            className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-8 text-center cursor-pointer hover:border-muted-foreground/40 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Clique para adicionar imagens ou documentos de inspiração
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">Imagens e PDF. Máx. 10 MB</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {anexos.map((anexo) => {
              const isImg = isImageMime(anexo.mimeType);
              const isDeleting = deletingAnexoId === anexo.id;
              return (
                <div key={anexo.id} className="group relative rounded-lg border bg-card overflow-hidden">
                  {isImg ? (
                    <a href={`/api/uploads/${anexo.id}`} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/uploads/${anexo.id}`}
                        alt={anexo.originalName}
                        className="w-full h-24 object-cover"
                      />
                    </a>
                  ) : (
                    <a
                      href={`/api/uploads/${anexo.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center h-24 gap-2 hover:bg-muted/50 transition-colors"
                    >
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground text-center px-2 truncate w-full">
                        {anexo.originalName}
                      </span>
                    </a>
                  )}
                  <div className="p-2 border-t">
                    <p className="text-xs text-muted-foreground truncate">{anexo.originalName}</p>
                    <p className="text-xs text-muted-foreground/60">
                      {(anexo.sizeBytes / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAnexo(anexo.id)}
                    disabled={isDeleting}
                    className="absolute top-1 right-1 rounded-full bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-black/80"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </button>
                </div>
              );
            })}

            {/* Add more button */}
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border-2 border-dashed border-muted-foreground/20 h-full min-h-[120px] flex flex-col items-center justify-center gap-2 hover:border-muted-foreground/40 transition-colors"
            >
              <Plus className="h-6 w-6 text-muted-foreground/40" />
              <span className="text-xs text-muted-foreground/60">Adicionar</span>
            </button>
          </div>
        )}
      </section>

      {/* Edit Modal */}
      <MetaModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        meta={meta}
        onSuccess={() => {
          fetchMeta();
        }}
      />
    </DashboardShell>
  );
}
