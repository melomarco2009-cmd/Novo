"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FileText, Loader2, Trash2, Upload, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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

import { itemCompraSchema, type ItemCompraInput } from "@/lib/validations/compras";
import {
  URGENCIA_LABEL,
  CATEGORIA_LABEL,
  UNIDADE_LABEL,
  type ItemCompra,
} from "./compra-types";

const URGENCIAS = Object.entries(URGENCIA_LABEL) as [string, string][];
const CATEGORIAS = Object.entries(CATEGORIA_LABEL) as [string, string][];
const UNIDADES = Object.entries(UNIDADE_LABEL) as [string, string][];

interface CompraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ItemCompra | null;
  onSuccess: () => void;
}

export function CompraModal({ open, onOpenChange, item, onSuccess }: CompraModalProps) {
  const isEdit = !!item;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [notaFile, setNotaFile] = useState<File | null>(null);
  const [existingNota, setExistingNota] = useState<ItemCompra["notaFiscal"]>(null);
  const [uploadingNota, setUploadingNota] = useState(false);
  const notaRef = useRef<HTMLInputElement>(null);

  const form = useForm<ItemCompraInput>({
    resolver: zodResolver(itemCompraSchema),
    defaultValues: {
      nome: "",
      quantidade: null,
      unidade: null,
      localCompra: null,
      urgencia: "MEDIA",
      categoria: "OUTRO",
      observacao: null,
      comprado: false,
      dataCompra: null,
      valorEstimado: null,
      valorReal: null,
      notaFiscalUploadId: null,
    },
  });

  useEffect(() => {
    if (!open) {
      setNotaFile(null);
      setExistingNota(null);
      return;
    }

    if (item) {
      form.reset({
        nome: item.nome,
        quantidade: item.quantidade ? parseFloat(item.quantidade) : null,
        unidade: (item.unidade as ItemCompraInput["unidade"]) ?? null,
        localCompra: item.localCompra ?? null,
        urgencia: item.urgencia as ItemCompraInput["urgencia"],
        categoria: item.categoria as ItemCompraInput["categoria"],
        observacao: item.observacao ?? null,
        comprado: item.comprado,
        dataCompra: item.dataCompra ? item.dataCompra.slice(0, 10) : null,
        valorEstimado: item.valorEstimado ? parseFloat(item.valorEstimado) : null,
        valorReal: item.valorReal ? parseFloat(item.valorReal) : null,
        notaFiscalUploadId: null,
      });
      setExistingNota(item.notaFiscal ?? null);
      setNotaFile(null);
    } else {
      form.reset({
        nome: "",
        quantidade: null,
        unidade: null,
        localCompra: null,
        urgencia: "MEDIA",
        categoria: "OUTRO",
        observacao: null,
        comprado: false,
        dataCompra: null,
        valorEstimado: null,
        valorReal: null,
        notaFiscalUploadId: null,
      });
      setExistingNota(null);
      setNotaFile(null);
    }
  }, [open, item, form]);

  function handleNotaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNotaFile(file);
  }

  function removeNotaFile() {
    setNotaFile(null);
    if (notaRef.current) notaRef.current.value = "";
  }

  async function onSubmit(data: ItemCompraInput) {
    setSaving(true);
    try {
      let finalNotaUploadId: string | null = null;

      if (notaFile) {
        setUploadingNota(true);
        try {
          const fd = new FormData();
          fd.append("file", notaFile);
          const res = await fetch("/api/uploads/compras", { method: "POST", body: fd });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? "Erro ao enviar nota fiscal");
          }
          const json = await res.json();
          finalNotaUploadId = json.data.id as string;
        } finally {
          setUploadingNota(false);
        }
      }

      const payload: ItemCompraInput = {
        ...data,
        notaFiscalUploadId: finalNotaUploadId,
        observacao: data.observacao || null,
        localCompra: data.localCompra || null,
        quantidade: data.quantidade ?? null,
        valorEstimado: data.valorEstimado ?? null,
        valorReal: data.valorReal ?? null,
      };

      const url = isEdit ? `/api/compras/${item!.id}` : "/api/compras";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erro ao salvar");
      }

      toast.success(isEdit ? "Item atualizado!" : "Item criado!");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!item) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/compras/${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success("Item excluído!");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  }

  const isUploading = uploadingNota;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Item" : "Novo Item"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Nome */}
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Arroz, Detergente, Paracetamol..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Quantidade + Unidade */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="1"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIDADES.map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Urgência + Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="urgencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgência *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {URGENCIAS.map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIAS.map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Local de Compra */}
            <FormField
              control={form.control}
              name="localCompra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local de Compra</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Supermercado, Farmácia, Online..."
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor Estimado + Valor Real */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valorEstimado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Estimado (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valorReal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Real (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Observação */}
            <FormField
              control={form.control}
              name="observacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionais..."
                      rows={2}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nota Fiscal / Comprovante Upload */}
            <div className="space-y-1.5">
              <span className="text-sm font-medium">Nota Fiscal / Comprovante</span>

              {existingNota && !notaFile && (
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <a
                    href={`/api/uploads/${existingNota.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 truncate hover:underline"
                  >
                    {existingNota.originalName}
                  </a>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {(existingNota.sizeBytes / 1024).toFixed(0)} KB
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => notaRef.current?.click()}
                  disabled={isUploading}
                >
                  {uploadingNota ? (
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3 mr-1.5" />
                  )}
                  {notaFile
                    ? notaFile.name
                    : existingNota
                    ? "Substituir arquivo"
                    : "Anexar nota / comprovante"}
                </Button>
                {notaFile && (
                  <button
                    type="button"
                    onClick={removeNotaFile}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <p className="text-xs text-muted-foreground">PDF ou imagem. Máx. 10 MB</p>
              </div>

              <input
                ref={notaRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleNotaChange}
              />
            </div>

            <DialogFooter className="flex items-center gap-2 pt-2">
              {isEdit && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={deleting}
                      className="mr-auto"
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir item?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || isUploading}>
                {(saving || isUploading) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isEdit ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
