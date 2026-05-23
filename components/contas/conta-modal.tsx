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

import { contaSchema, type ContaInput } from "@/lib/validations/contas";
import {
  STATUS_LABEL,
  RECORRENCIA_LABEL,
  toDateInputValue,
  toMonthInputValue,
  type Conta,
} from "./conta-types";
import { DatePicker } from "@/components/ui/date-picker";

const STATUSES = Object.entries(STATUS_LABEL) as [keyof typeof STATUS_LABEL, string][];
const RECORRENCIAS = Object.entries(RECORRENCIA_LABEL) as [
  keyof typeof RECORRENCIA_LABEL,
  string
][];

interface ContaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: Conta | null;
  onSuccess: () => void;
}

export function ContaModal({ open, onOpenChange, conta, onSuccess }: ContaModalProps) {
  const isEdit = !!conta;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Comprovante upload state
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [existingComprovante, setExistingComprovante] = useState<
    Conta["comprovante"]
  >(null);
  const [uploadingComprovante, setUploadingComprovante] = useState(false);
  const comprovanteRef = useRef<HTMLInputElement>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const form = useForm<ContaInput>({
    resolver: zodResolver(contaSchema),
    defaultValues: {
      nome: "",
      valor: 0,
      vencimento: "",
      dataPagamento: null,
      status: "A_PAGAR",
      mesReferencia: currentMonth,
      recorrencia: "NENHUMA",
      observacao: null,
      comprovanteUploadId: null,
    },
  });

  useEffect(() => {
    if (!open) {
      setComprovanteFile(null);
      setExistingComprovante(null);
      return;
    }

    if (conta) {
      form.reset({
        nome: conta.nome,
        valor: parseFloat(conta.valor),
        vencimento: toDateInputValue(conta.vencimento),
        dataPagamento: toDateInputValue(conta.dataPagamento) || null,
        status: conta.status,
        mesReferencia: toMonthInputValue(conta.mesReferencia),
        recorrencia: conta.recorrencia,
        observacao: conta.observacao ?? null,
        comprovanteUploadId: null,
      });
      setExistingComprovante(conta.comprovante);
      setComprovanteFile(null);
    } else {
      form.reset({
        nome: "",
        valor: 0,
        vencimento: "",
        dataPagamento: null,
        status: "A_PAGAR",
        mesReferencia: currentMonth,
        recorrencia: "NENHUMA",
        observacao: null,
        comprovanteUploadId: null,
      });
      setExistingComprovante(null);
      setComprovanteFile(null);
    }
  }, [open, conta, form, currentMonth]);

  function handleComprovanteChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setComprovanteFile(file);
  }

  function removeComprovanteFile() {
    setComprovanteFile(null);
    if (comprovanteRef.current) comprovanteRef.current.value = "";
  }

  async function onSubmit(data: ContaInput) {
    setSaving(true);
    try {
      let finalComprovanteUploadId: string | null = null;

      if (comprovanteFile) {
        setUploadingComprovante(true);
        try {
          const fd = new FormData();
          fd.append("file", comprovanteFile);
          const res = await fetch("/api/uploads/contas", { method: "POST", body: fd });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error ?? "Erro ao enviar comprovante");
          }
          const json = await res.json();
          finalComprovanteUploadId = json.data.id as string;
        } finally {
          setUploadingComprovante(false);
        }
      }

      const payload: ContaInput = {
        ...data,
        comprovanteUploadId: finalComprovanteUploadId,
        dataPagamento: data.dataPagamento || null,
        observacao: data.observacao || null,
      };

      const url = isEdit ? `/api/contas/${conta!.id}` : "/api/contas";
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

      toast.success(isEdit ? "Conta atualizada!" : "Conta criada!");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!conta) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contas/${conta.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success("Conta excluída!");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  }

  const isUploading = uploadingComprovante;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Conta" : "Nova Conta"}</DialogTitle>
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
                    <Input placeholder="Aluguel, Energia, Internet..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor + Vencimento */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0,00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimento *</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={(v) => field.onChange(v ?? "")}
                        placeholder="Selecionar data"
                        clearable={false}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Mês Referência + Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mesReferencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês de Referência *</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map(([value, label]) => (
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

            {/* Data Pagamento + Recorrência */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Pagamento</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={(v) => field.onChange(v || null)}
                        placeholder="Selecionar data"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recorrencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recorrência</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RECORRENCIAS.map(([value, label]) => (
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

            {/* Comprovante Upload */}
            <div className="space-y-1.5">
              <span className="text-sm font-medium">Comprovante</span>

              {existingComprovante && !comprovanteFile && (
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <a
                    href={`/api/uploads/${existingComprovante.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 truncate hover:underline"
                  >
                    {existingComprovante.originalName}
                  </a>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {(existingComprovante.sizeBytes / 1024).toFixed(0)} KB
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => comprovanteRef.current?.click()}
                  disabled={isUploading}
                >
                  {uploadingComprovante ? (
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3 mr-1.5" />
                  )}
                  {comprovanteFile
                    ? comprovanteFile.name
                    : existingComprovante
                    ? "Substituir comprovante"
                    : "Anexar comprovante"}
                </Button>
                {comprovanteFile && (
                  <button
                    type="button"
                    onClick={removeComprovanteFile}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <p className="text-xs text-muted-foreground">PDF ou imagem. Máx. 10 MB</p>
              </div>

              <input
                ref={comprovanteRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleComprovanteChange}
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
                      <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
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
