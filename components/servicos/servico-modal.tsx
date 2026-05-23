"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";

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

import { servicoSchema, type ServicoInput } from "@/lib/validations/servicos";
import {
  CATEGORIA_LABEL,
  STATUS_LABEL,
  type Servico,
} from "./servico-types";

const CATEGORIAS = Object.entries(CATEGORIA_LABEL) as [
  keyof typeof CATEGORIA_LABEL,
  string
][];
const STATUSES = Object.entries(STATUS_LABEL) as [
  keyof typeof STATUS_LABEL,
  string
][];

interface ServicoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servico?: Servico | null;
  onSuccess: () => void;
}

export function ServicoModal({
  open,
  onOpenChange,
  servico,
  onSuccess,
}: ServicoModalProps) {
  const isEdit = !!servico;
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [currentLogoUploadId, setCurrentLogoUploadId] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Comprovante upload state
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [uploadingComprovante, setUploadingComprovante] = useState(false);
  const comprovanteInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ServicoInput>({
    resolver: zodResolver(servicoSchema),
    defaultValues: {
      nome: "",
      login: "",
      senha: "",
      url: null,
      categoria: "OUTRO",
      valorMensal: 0,
      diaVencimento: 1,
      status: "ATIVO",
      observacao: null,
      logoUploadId: null,
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setLogoFile(null);
      setLogoPreview(null);
      setCurrentLogoUploadId(null);
      setComprovanteFile(null);
      setShowPassword(false);
      return;
    }

    if (servico) {
      form.reset({
        nome: servico.nome,
        login: servico.login,
        senha: "", // Never pre-fill password
        url: servico.url ?? null,
        categoria: servico.categoria,
        valorMensal: parseFloat(servico.valorMensal),
        diaVencimento: servico.diaVencimento,
        status: servico.status,
        observacao: servico.observacao ?? null,
        logoUploadId: servico.logoUploadId ?? null,
      });

      if (servico.logoUpload) {
        setCurrentLogoUploadId(servico.logoUploadId);
        setLogoPreview(`/api/uploads/${servico.logoUpload.id}`);
      } else {
        setCurrentLogoUploadId(null);
        setLogoPreview(null);
      }
    } else {
      form.reset({
        nome: "",
        login: "",
        senha: "",
        url: null,
        categoria: "OUTRO",
        valorMensal: 0,
        diaVencimento: 1,
        status: "ATIVO",
        observacao: null,
        logoUploadId: null,
      });
      setLogoPreview(null);
      setCurrentLogoUploadId(null);
    }
  }, [open, servico, form]);

  async function uploadFile(
    file: File,
    categoria: "logo" | "comprovante"
  ): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("categoria", categoria);

    const res = await fetch("/api/uploads/servicos", {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Erro ao enviar arquivo");
    }

    const json = await res.json();
    return json.data.id as string;
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleComprovanteChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setComprovanteFile(file);
  }

  function removeLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    setCurrentLogoUploadId(null);
    form.setValue("logoUploadId", null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  async function onSubmit(data: ServicoInput) {
    setSaving(true);
    try {
      let logoUploadId = currentLogoUploadId ?? data.logoUploadId ?? null;

      // Upload logo if a new file was selected
      if (logoFile) {
        setUploadingLogo(true);
        try {
          logoUploadId = await uploadFile(logoFile, "logo");
        } finally {
          setUploadingLogo(false);
        }
      }

      // Upload comprovante if selected (linked to entity after creation)
      let comprovanteUploadId: string | null = null;
      if (comprovanteFile) {
        setUploadingComprovante(true);
        try {
          comprovanteUploadId = await uploadFile(comprovanteFile, "comprovante");
        } finally {
          setUploadingComprovante(false);
        }
      }

      const payload = {
        ...data,
        logoUploadId: logoUploadId ?? null,
        // In edit mode, if senha is empty string, don't change password
        ...(isEdit && !data.senha ? { senha: undefined } : {}),
      };

      const url = isEdit ? `/api/servicos/${servico!.id}` : "/api/servicos";
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

      const json = await res.json();
      const servicoId = json.data?.id;

      // Link comprovante upload to the servico entity if we have it
      if (comprovanteUploadId && servicoId) {
        await fetch(`/api/uploads/${comprovanteUploadId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entityId: servicoId }),
        }).catch(() => {/* non-critical */});
      }

      toast.success(isEdit ? "Serviço atualizado!" : "Serviço criado!");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!servico) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/servicos/${servico.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir");
      toast.success("Serviço excluído!");
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  }

  const isUploading = uploadingLogo || uploadingComprovante;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Serviço" : "Novo Serviço"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Logo */}
            <div className="space-y-2">
              <span className="text-sm font-medium">Logo</span>
              <div className="flex items-center gap-3">
                {logoPreview ? (
                  <div className="relative h-16 w-16 rounded-lg border overflow-hidden bg-muted">
                    <Image
                      src={logoPreview}
                      alt="Logo"
                      fill
                      className="object-contain p-1"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute top-0.5 right-0.5 rounded-full bg-background/80 p-0.5 hover:bg-background"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-lg border border-dashed flex items-center justify-center bg-muted/50 text-muted-foreground">
                    <Upload className="h-5 w-5" />
                  </div>
                )}
                <div className="space-y-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3 mr-1.5" />
                    )}
                    Escolher logo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG ou WebP. Máx. 10 MB
                  </p>
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>

            {/* Nome + Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Netflix, Spotify..." {...field} />
                    </FormControl>
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
                          <SelectValue placeholder="Categoria" />
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

            {/* Login */}
            <FormField
              control={form.control}
              name="login"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Login / E-mail *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="usuario@email.com"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Senha */}
            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Senha {isEdit ? "(deixe em branco para não alterar)" : "*"}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={isEdit ? "••••••••" : "Senha do serviço"}
                        autoComplete="new-password"
                        className="pr-10"
                        {...field}
                        value={field.value ?? ""}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* URL */}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://netflix.com"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor + Dia vencimento + Status */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="valorMensal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Mensal (R$) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="29.90"
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
                name="diaVencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia Vencimento *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="15"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10) || 1)
                        }
                      />
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

            {/* Comprovante */}
            <div className="space-y-1.5">
              <span className="text-sm font-medium">Comprovante</span>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => comprovanteInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {uploadingComprovante ? (
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3 mr-1.5" />
                  )}
                  {comprovanteFile
                    ? comprovanteFile.name
                    : "Anexar comprovante"}
                </Button>
                {comprovanteFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setComprovanteFile(null);
                      if (comprovanteInputRef.current)
                        comprovanteInputRef.current.value = "";
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <input
                ref={comprovanteInputRef}
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
                      <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
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
