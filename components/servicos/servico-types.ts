import type { CategoriaServico, StatusServico } from "@prisma/client";

export type { CategoriaServico, StatusServico };

export interface ServicoLogoUpload {
  id: string;
  storagePath: string;
  originalName: string;
  mimeType: string;
}

export interface Servico {
  id: string;
  userId: string;
  nome: string;
  logoUploadId: string | null;
  login: string;
  senhaEncrypted: string;
  senhaIv: string;
  senhaAuthTag: string;
  url: string | null;
  categoria: CategoriaServico;
  valorMensal: string; // Decimal serializes as string in JSON
  diaVencimento: number;
  status: StatusServico;
  observacao: string | null;
  logoUpload: ServicoLogoUpload | null;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORIA_LABEL: Record<CategoriaServico, string> = {
  STREAMING: "Streaming",
  SOFTWARE: "Software",
  HOSPEDAGEM: "Hospedagem",
  DOMINIO: "Domínio",
  EDUCACAO: "Educação",
  BANCO: "Banco",
  REDES_SOCIAIS: "Redes Sociais",
  UTILITARIO: "Utilitário",
  OUTRO: "Outro",
};

export const CATEGORIA_COR: Record<CategoriaServico, string> = {
  STREAMING: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  SOFTWARE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  HOSPEDAGEM: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  DOMINIO: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  EDUCACAO: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  BANCO: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  REDES_SOCIAIS: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  UTILITARIO: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  OUTRO: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

export const STATUS_LABEL: Record<StatusServico, string> = {
  ATIVO: "Ativo",
  PAUSADO: "Pausado",
  CANCELADO: "Cancelado",
  ATRASADO: "Atrasado",
};

export const STATUS_COR: Record<StatusServico, string> = {
  ATIVO: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  PAUSADO: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  CANCELADO: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  ATRASADO: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

/** Returns days until next occurrence of diaVencimento (1-31). */
export function daysUntilVencimento(diaVencimento: number): number {
  const now = new Date();
  const todayDay = now.getDate();
  const year = now.getFullYear();
  const month = now.getMonth();

  let nextDate: Date;
  if (diaVencimento >= todayDay) {
    nextDate = new Date(year, month, diaVencimento);
  } else {
    nextDate = new Date(year, month + 1, diaVencimento);
  }

  const todayMidnight = new Date(year, month, todayDay);
  const diffMs = nextDate.getTime() - todayMidnight.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function formatCurrency(value: string | number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}
