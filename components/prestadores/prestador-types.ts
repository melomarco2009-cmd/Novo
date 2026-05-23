import type { TipoDocumentoPrestador, TipoVinculo, StatusVinculo } from "@prisma/client";

export type { TipoVinculo, StatusVinculo, TipoDocumentoPrestador };

export interface DocumentoInfo {
  id: string;
  tipo: TipoDocumentoPrestador;
  nome: string;
  descricao: string | null;
  uploadId: string;
  upload: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  };
  createdAt: string;
}

export interface PrestadorListItem {
  id: string;
  nome: string;
  cargo: string | null;
  tipoVinculo: TipoVinculo;
  statusVinculo: StatusVinculo;
  diaPagamento: number | null;
  salario: string | null;
  telefone: string | null;
  email: string | null;
  proximoPagamento: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Prestador extends PrestadorListItem {
  cpf: string | null;
  rg: string | null;
  dataNascimento: string | null;
  naturalidade: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  formaPagamento: string | null;
  pixChave: string | null;
  bancoNome: string | null;
  bancoAgencia: string | null;
  bancoConta: string | null;
  observacao: string | null;
  documentos?: DocumentoInfo[];
}

export const STATUS_VINCULO_LABEL: Record<StatusVinculo, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  SUSPENSO: "Suspenso",
  ENCERRADO: "Encerrado",
};

export const STATUS_VINCULO_COR: Record<StatusVinculo, string> = {
  ATIVO:
    "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-400",
  INATIVO:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  SUSPENSO:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-400",
  ENCERRADO:
    "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400",
};

export const TIPO_VINCULO_LABEL: Record<TipoVinculo, string> = {
  CLT: "CLT",
  PJ: "PJ",
  FREELANCER: "Freelancer",
  TEMPORARIO: "Temporário",
  ESTAGIO: "Estágio",
  OUTRO: "Outro",
};

export const TIPO_DOCUMENTO_LABEL: Record<TipoDocumentoPrestador, string> = {
  RG: "RG",
  CPF: "CPF",
  CNH: "CNH",
  COMPROVANTE_RESIDENCIA: "Comprovante de Residência",
  CONTRATO: "Contrato",
  CERTIFICADO: "Certificado",
  OUTRO: "Outro",
};

export function toDateInputValue(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(typeof value === "string" ? parseFloat(value) : value);
}

export interface PaymentAlert {
  label: string;
  daysUntil: number;
  isUrgent: boolean;
}

export function getPaymentAlert(
  proximoPagamento: string | null,
  diaPagamento: number | null
): PaymentAlert | null {
  if (!proximoPagamento || !diaPagamento) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(proximoPagamento);
  next.setHours(0, 0, 0, 0);
  const daysUntil = Math.round(
    (next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const label =
    daysUntil < 0
      ? "Atrasado"
      : daysUntil === 0
      ? "Hoje"
      : daysUntil === 1
      ? "Amanhã"
      : `Dia ${diaPagamento}`;
  return { label, daysUntil, isUrgent: daysUntil <= 3 };
}
