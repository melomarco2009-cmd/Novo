"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

import { prestadorSchema, type PrestadorInput } from "@/lib/validations/prestadores";
import {
  STATUS_VINCULO_LABEL,
  TIPO_VINCULO_LABEL,
  TIPO_DOCUMENTO_LABEL,
  toDateInputValue,
  type Prestador,
  type PrestadorListItem,
  type DocumentoInfo,
  type TipoDocumentoPrestador,
} from "./prestador-types";

const TIPO_VINCULO_OPTIONS = Object.entries(TIPO_VINCULO_LABEL) as [
  keyof typeof TIPO_VINCULO_LABEL,
  string
][];

const STATUS_VINCULO_OPTIONS = Object.entries(STATUS_VINCULO_LABEL) as [
  keyof typeof STATUS_VINCULO_LABEL,
  string
][];

const TIPO_DOC_OPTIONS = Object.entries(TIPO_DOCUMENTO_LABEL) as [
  TipoDocumentoPrestador,
  string
][];

interface PrestadorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prestador?: PrestadorListItem | null;
  onSuccess: () => void;
}

const DEFAULT_VALUES: PrestadorInput = {
  nome: "",
  cpf: null,
  rg: null,
  dataNascimento: null,
  naturalidade: null,
  email: null,
  telefone: null,
  cep: null,
  logradouro: null,
  numero: null,
  complemento: null,
  bairro: null,
  cidade: null,
  estado: null,
  cargo: null,
  tipoVinculo: "CLT",
  statusVinculo: "ATIVO",
  dataInicio: null,
  dataFim: null,
  salario: null,
  diaPagamento: null,
  formaPagamento: null,
  pixChave: null,
  bancoNome: null,
  bancoAgencia: null,
  bancoConta: null,
  observacao: null,
};

function nullableStr(v: string | null | undefined): string | null {
  if (!v || v.trim() === "") return null;
  return v.trim();
}

export function PrestadorModal({
  open,
  onOpenChange,
  prestador,
  onSuccess,
}: PrestadorModalProps) {
  const isEdit = !!prestador;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadingFull, setLoadingFull] = useState(false);

  // Document management state
  const [docs, setDocs] = useState<DocumentoInfo[]>([]);
  const [newDocTipo, setNewDocTipo] = useState<TipoDocumentoPrestador>("OUTRO");
  const [newDocNome, setNewDocNome] = useState("");
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const docFileRef = useRef<HTMLInputElement>(null);

  const form = useForm<PrestadorInput>({
    resolver: zodResolver(prestadorSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // Fetch full prestador (with documents) when modal opens in edit mode
  useEffect(() => {
    if (!open) {
      form.reset(DEFAULT_VALUES);
      setDocs([]);
      setNewDocNome("");
      setNewDocFile(null);
      setNewDocTipo("OUTRO");
      return;
    }

    if (!prestador) {
      form.reset(DEFAULT_VALUES);
      setDocs([]);
      return;
    }

    setLoadingFull(true);
    fetch(`/api/prestadores/${prestador.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) return;
        const p = json.data as Prestador;
        setDocs(p.documentos ?? []);
        form.reset({
          nome: p.nome,
          cpf: p.cpf ?? null,
          rg: p.rg ?? null,
          dataNascimento: toDateInputValue(p.dataNascimento) || null,
          naturalidade: p.naturalidade ?? null,
          email: p.email ?? null,
          telefone: p.telefone ?? null,
          cep: p.cep ?? null,
          logradouro: p.logradouro ?? null,
          numero: p.numero ?? null,
          complemento: p.complemento ?? null,
          bairro: p.bairro ?? null,
          cidade: p.cidade ?? null,
          estado: p.estado ?? null,
          cargo: p.cargo ?? null,
          tipoVinculo: p.tipoVinculo,
          statusVinculo: p.statusVinculo,
          dataInicio: toDateInputValue(p.dataInicio) || null,
          dataFim: toDateInputValue(p.dataFim) || null,
          salario: p.salario ? parseFloat(p.salario) : null,
          diaPagamento: p.diaPagamento ?? null,
          formaPagamento: p.formaPagamento ?? null,
          pixChave: p.pixChave ?? null,
          bancoNome: p.bancoNome ?? null,
          bancoAgencia: p.bancoAgencia ?? null,
          bancoConta: p.bancoConta ?? null,
          observacao: p.observacao ?? null,
        });
      })
      .catch(() => toast.error("Erro ao carregar prestador"))
      .finally(() => setLoadingFull(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prestador?.id]);

  async function onSubmit(data: PrestadorInput) {
    setSaving(true);
    try {
      const payload: PrestadorInput = {
        ...data,
        cpf: nullableStr(data.cpf),
        rg: nullableStr(data.rg),
        email: nullableStr(data.email),
        telefone: nullableStr(data.telefone),
        naturalidade: nullableStr(data.naturalidade),
        cep: nullableStr(data.cep),
        logradouro: nullableStr(data.logradouro),
        numero: nullableStr(data.numero),
        complemento: nullableStr(data.complemento),
        bairro: nullableStr(data.bairro),
        cidade: nullableStr(data.cidade),
        estado: nullableStr(data.estado),
        cargo: nullableStr(data.cargo),
        dataNascimento: data.dataNascimento || null,
        dataInicio: data.dataInicio || null,
        dataFim: data.dataFim || null,
        formaPagamento: nullableStr(data.formaPagamento),
        pixChave: nullableStr(data.pixChave),
        bancoNome: nullableStr(data.bancoNome),
        bancoAgencia: nullableStr(data.bancoAgencia),
        bancoConta: nullableStr(data.bancoConta),
        observacao: nullableStr(data.observacao),
      };

      const url = isEdit ? `/api/prestadores/${prestador!.id}` : "/api/prestadores";
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

      toast.success(isEdit ? "Prestador atualizado!" : "Prestador criado!");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!prestador) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/prestadores/${prestador.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success("Prestador excluído!");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDocUpload() {
    if (!prestador || !newDocFile || !newDocNome.trim()) {
      toast.error("Preencha o nome e selecione um arquivo");
      return;
    }
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append("file", newDocFile);
      fd.append("tipo", newDocTipo);
      fd.append("nome", newDocNome.trim());

      const res = await fetch(
        `/api/prestadores/${prestador.id}/documentos`,
        { method: "POST", body: fd }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Erro ao enviar documento");
      }
      const json = await res.json();
      setDocs((prev) => [json.data as DocumentoInfo, ...prev]);
      setNewDocNome("");
      setNewDocFile(null);
      if (docFileRef.current) docFileRef.current.value = "";
      toast.success("Documento adicionado!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setUploadingDoc(false);
    }
  }

  async function handleDocDelete(docId: string) {
    if (!prestador) return;
    setDeletingDocId(docId);
    try {
      const res = await fetch(
        `/api/prestadores/${prestador.id}/documentos/${docId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Erro ao excluir documento");
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      toast.success("Documento excluído!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setDeletingDocId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Prestador" : "Novo Prestador"}
          </DialogTitle>
        </DialogHeader>

        {loadingFull ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Tabs defaultValue="pessoal" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="pessoal">Dados Pessoais</TabsTrigger>
                  <TabsTrigger value="contratual">Dados Contratuais</TabsTrigger>
                  <TabsTrigger value="documentos">
                    Documentos
                    {docs.length > 0 && (
                      <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        {docs.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* ─── TAB: DADOS PESSOAIS ─── */}
                <TabsContent value="pessoal" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="000.000.000-00"
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
                    <FormField
                      control={form.control}
                      name="rg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RG</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00.000.000-0"
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dataNascimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
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
                    <FormField
                      control={form.control}
                      name="naturalidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Naturalidade</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Cidade/Estado"
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="email@exemplo.com"
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
                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(11) 99999-9999"
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
                  </div>

                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">
                    Endereço
                  </p>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00000-000"
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
                    <FormField
                      control={form.control}
                      name="bairro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Bairro"
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
                    <FormField
                      control={form.control}
                      name="estado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="SP"
                              maxLength={2}
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
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name="logradouro"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logradouro</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Rua, Avenida..."
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
                    </div>
                    <FormField
                      control={form.control}
                      name="numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="123"
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="complemento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complemento</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Apto, Bloco..."
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
                    <FormField
                      control={form.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Cidade"
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
                  </div>
                </TabsContent>

                {/* ─── TAB: DADOS CONTRATUAIS ─── */}
                <TabsContent value="contratual" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cargo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cargo</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Cozinheiro, Motorista..."
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
                    <FormField
                      control={form.control}
                      name="tipoVinculo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Vínculo *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIPO_VINCULO_OPTIONS.map(([value, label]) => (
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

                  <FormField
                    control={form.control}
                    name="statusVinculo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status do Vínculo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STATUS_VINCULO_OPTIONS.map(([value, label]) => (
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dataInicio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Início</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
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
                    <FormField
                      control={form.control}
                      name="dataFim"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Fim</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
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
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="salario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salário (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0,00"
                              value={
                                field.value !== null &&
                                field.value !== undefined
                                  ? String(field.value)
                                  : ""
                              }
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? null
                                    : parseFloat(e.target.value)
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="diaPagamento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dia de Pagamento</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="31"
                              placeholder="1 – 31"
                              value={
                                field.value !== null &&
                                field.value !== undefined
                                  ? String(field.value)
                                  : ""
                              }
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? null
                                    : parseInt(e.target.value, 10)
                                )
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="formaPagamento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Forma de Pagamento</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="PIX, transferência..."
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
                    <FormField
                      control={form.control}
                      name="pixChave"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chave PIX</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="CPF, telefone, e-mail..."
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
                  </div>

                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">
                    Dados Bancários
                  </p>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="bancoNome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banco</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Bradesco, Itaú..."
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
                    <FormField
                      control={form.control}
                      name="bancoAgencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Agência</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="0000-0"
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
                    <FormField
                      control={form.control}
                      name="bancoConta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conta</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00000-0"
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
                  </div>

                  <FormField
                    control={form.control}
                    name="observacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observação</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notas adicionais..."
                            rows={3}
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
                </TabsContent>

                {/* ─── TAB: DOCUMENTOS ─── */}
                <TabsContent value="documentos" className="space-y-4">
                  {!isEdit ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Salve o prestador primeiro para adicionar documentos.
                    </p>
                  ) : (
                    <>
                      {/* Existing documents */}
                      {docs.length > 0 ? (
                        <div className="space-y-2">
                          {docs.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2"
                            >
                              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {doc.nome}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {TIPO_DOCUMENTO_LABEL[doc.tipo]} &middot;{" "}
                                  {doc.upload.originalName} &middot;{" "}
                                  {(doc.upload.sizeBytes / 1024).toFixed(0)} KB
                                </p>
                              </div>
                              <a
                                href={`/api/uploads/${doc.upload.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline shrink-0"
                              >
                                Ver
                              </a>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                    disabled={deletingDocId === doc.id}
                                  >
                                    {deletingDocId === doc.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Excluir documento?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      O arquivo será removido permanentemente.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDocDelete(doc.id)}
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum documento cadastrado.
                        </p>
                      )}

                      <Separator />
                      <p className="text-sm font-medium">Adicionar Documento</p>

                      {/* New document form */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Tipo</label>
                          <Select
                            value={newDocTipo}
                            onValueChange={(v) =>
                              setNewDocTipo(v as TipoDocumentoPrestador)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIPO_DOC_OPTIONS.map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Nome</label>
                          <Input
                            placeholder="Ex: RG frente"
                            value={newDocNome}
                            onChange={(e) => setNewDocNome(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => docFileRef.current?.click()}
                          disabled={uploadingDoc}
                        >
                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                          {newDocFile ? newDocFile.name : "Selecionar arquivo"}
                        </Button>
                        {newDocFile && (
                          <button
                            type="button"
                            onClick={() => {
                              setNewDocFile(null);
                              if (docFileRef.current)
                                docFileRef.current.value = "";
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleDocUpload}
                          disabled={uploadingDoc || !newDocFile || !newDocNome.trim()}
                        >
                          {uploadingDoc ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          Upload
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        PDF ou imagem. Máx. 10 MB
                      </p>

                      <input
                        ref={docFileRef}
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) =>
                          setNewDocFile(e.target.files?.[0] ?? null)
                        }
                      />
                    </>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="flex items-center gap-2 pt-4 mt-2 border-t">
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
                        <AlertDialogTitle>Excluir prestador?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Todos os documentos e dados serão excluídos. Esta ação
                          não pode ser desfeita.
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
                <Button type="submit" disabled={saving || loadingFull}>
                  {saving && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {isEdit ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
