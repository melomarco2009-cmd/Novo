"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

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

import { compromissoSchema, type CompromissoInput } from "@/lib/validations/agenda";
import {
  TIPO_LABEL,
  RECORRENCIA_LABEL,
  type Compromisso,
} from "./agenda-types";

const TIPOS = Object.entries(TIPO_LABEL) as [keyof typeof TIPO_LABEL, string][];
const RECORRENCIAS = Object.entries(RECORRENCIA_LABEL) as [
  keyof typeof RECORRENCIA_LABEL,
  string
][];

const ALERTA_OPTIONS = [
  { value: "0", label: "No início" },
  { value: "5", label: "5 minutos antes" },
  { value: "10", label: "10 minutos antes" },
  { value: "15", label: "15 minutos antes" },
  { value: "30", label: "30 minutos antes" },
  { value: "60", label: "1 hora antes" },
  { value: "120", label: "2 horas antes" },
  { value: "1440", label: "1 dia antes" },
];

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}

interface CompromissoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compromisso?: Compromisso | null;
  defaultDate?: Date | null;
  onSuccess: () => void;
}

export function CompromissoModal({
  open,
  onOpenChange,
  compromisso,
  defaultDate,
  onSuccess,
}: CompromissoModalProps) {
  const isEdit = !!compromisso;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<CompromissoInput>({
    resolver: zodResolver(compromissoSchema),
    defaultValues: {
      titulo: "",
      descricao: null,
      local: null,
      dataInicio: defaultDate
        ? format(defaultDate, "yyyy-MM-dd'T'HH:mm")
        : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      dataFim: null,
      diaInteiro: false,
      tipo: "PESSOAL",
      cor: null,
      recorrencia: "NENHUMA",
      recorrenciaFim: null,
      alertaMinutos: null,
      observacao: null,
    },
  });

  const diaInteiro = form.watch("diaInteiro");
  const recorrencia = form.watch("recorrencia");

  // Populate form when editing
  useEffect(() => {
    if (open && compromisso) {
      form.reset({
        titulo: compromisso.titulo,
        descricao: compromisso.descricao ?? null,
        local: compromisso.local ?? null,
        dataInicio: toDatetimeLocal(compromisso.dataInicio),
        dataFim: toDatetimeLocal(compromisso.dataFim),
        diaInteiro: compromisso.diaInteiro,
        tipo: compromisso.tipo,
        cor: compromisso.cor ?? null,
        recorrencia: compromisso.recorrencia,
        recorrenciaFim: toDatetimeLocal(compromisso.recorrenciaFim),
        alertaMinutos: compromisso.alertaMinutos ?? null,
        observacao: compromisso.observacao ?? null,
      });
    } else if (open && !compromisso) {
      form.reset({
        titulo: "",
        descricao: null,
        local: null,
        dataInicio: defaultDate
          ? format(defaultDate, "yyyy-MM-dd'T'HH:mm")
          : format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        dataFim: null,
        diaInteiro: false,
        tipo: "PESSOAL",
        cor: null,
        recorrencia: "NENHUMA",
        recorrenciaFim: null,
        alertaMinutos: null,
        observacao: null,
      });
    }
  }, [open, compromisso, defaultDate, form]);

  async function onSubmit(data: CompromissoInput) {
    setSaving(true);
    try {
      const payload = {
        ...data,
        dataInicio: data.dataInicio
          ? new Date(data.dataInicio).toISOString()
          : data.dataInicio,
        dataFim: data.dataFim ? new Date(data.dataFim).toISOString() : null,
        recorrenciaFim: data.recorrenciaFim
          ? new Date(data.recorrenciaFim).toISOString()
          : null,
        descricao: data.descricao || null,
        local: data.local || null,
        observacao: data.observacao || null,
        alertaMinutos: data.alertaMinutos ?? null,
      };

      const url = isEdit ? `/api/agenda/${compromisso!.id}` : "/api/agenda";
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

      toast.success(isEdit ? "Compromisso atualizado!" : "Compromisso criado!");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!compromisso) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/agenda/${compromisso.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success("Compromisso excluído!");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Compromisso" : "Novo Compromisso"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Título */}
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do compromisso" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo */}
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIPOS.map(([value, label]) => (
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

            {/* Dia inteiro toggle */}
            <FormField
              control={form.control}
              name="diaInteiro"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="diaInteiro"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <FormLabel htmlFor="diaInteiro" className="cursor-pointer mb-0">
                      Dia inteiro
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Data início / fim */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {diaInteiro ? "Data *" : "Início *"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type={diaInteiro ? "date" : "datetime-local"}
                        {...field}
                        value={
                          diaInteiro && field.value
                            ? field.value.slice(0, 10)
                            : field.value ?? ""
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(
                            diaInteiro ? v + "T00:00" : v
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!diaInteiro && (
                <FormField
                  control={form.control}
                  name="dataFim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fim</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Local */}
            <FormField
              control={form.control}
              name="local"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Endereço ou link"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes do compromisso..."
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recorrência */}
            <div className="grid grid-cols-2 gap-4">
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

              {recorrencia !== "NENHUMA" && (
                <FormField
                  control={form.control}
                  name="recorrenciaFim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fim da recorrência</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={
                            field.value ? field.value.slice(0, 10) : ""
                          }
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? e.target.value + "T00:00" : null
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Alerta */}
            <FormField
              control={form.control}
              name="alertaMinutos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alerta</FormLabel>
                  <Select
                    onValueChange={(v) =>
                      field.onChange(v === "null" ? null : parseInt(v, 10))
                    }
                    value={field.value === null || field.value === undefined ? "null" : String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sem alerta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="null">Sem alerta</SelectItem>
                      {ALERTA_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      <AlertDialogTitle>Excluir compromisso?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Excluir
                      </AlertDialogAction>
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
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
