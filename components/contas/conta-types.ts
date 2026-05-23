import type { StatusConta, Recorrencia } from "@prisma/client";

export type { StatusConta, Recorrencia };

export interface ContaUpload {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface Conta {
  id: string;
  userId: string;
  nome: string;
  valor: string; // Decimal serializes as string in JSON
  vencimento: string;
  dataPagamento: string | null;
  status: StatusConta;
  mesReferencia: string;
  recorrencia: Recorrencia;
  observacao: string | null;
  comprovante: ContaUpload | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContaSummary {
  totalMes: string;
  totalPago: string;
  totalPendente: string;
  totalAtrasado: string;
}

export const STATUS_LABEL: Record<StatusConta, string> = {
  A_PAGAR: "A Pagar",
  PAGA: "Paga",
  ATRASADA: "Atrasada",
  CANCELADA: "Cancelada",
};

export const STATUS_COR: Record<StatusConta, string> = {
  PAGA: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  A_PAGAR: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  ATRASADA: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  CANCELADA: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

export const RECORRENCIA_LABEL: Record<Recorrencia, string> = {
  NENHUMA: "Única",
  SEMANAL: "Semanal",
  QUINZENAL: "Quinzenal",
  MENSAL: "Mensal",
  BIMESTRAL: "Bimestral",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
};

export function formatCurrency(value: string | number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function formatMes(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

export function getEffectiveStatus(conta: Conta): StatusConta {
  if (conta.status === "PAGA" || conta.status === "CANCELADA") return conta.status;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const venc = new Date(conta.vencimento);
  if (venc < today) return "ATRASADA";
  return conta.status;
}

export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function toMonthInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 7);
  } catch {
    return "";
  }
}
