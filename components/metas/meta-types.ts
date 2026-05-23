export const CATEGORIA_META_LABEL: Record<string, string> = {
  PESSOAL: "Pessoal",
  PROFISSIONAL: "Profissional",
  FINANCEIRA: "Financeira",
  SAUDE: "Saúde",
  ESTUDO: "Estudo",
  RELACIONAMENTO: "Relacionamento",
  OUTRO: "Outro",
};

export const STATUS_META_LABEL: Record<string, string> = {
  NAO_INICIADA: "Não Iniciada",
  EM_ANDAMENTO: "Em Andamento",
  CONCLUIDA: "Concluída",
  PAUSADA: "Pausada",
  CANCELADA: "Cancelada",
};

export const PRIORIDADE_LABEL: Record<string, string> = {
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
};

// Status colors (text + bg classes)
export const STATUS_META_COR: Record<string, string> = {
  NAO_INICIADA: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  EM_ANDAMENTO: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  CONCLUIDA: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  PAUSADA: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  CANCELADA: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

// Status border-left accent
export const STATUS_META_BORDER: Record<string, string> = {
  NAO_INICIADA: "border-l-slate-400",
  EM_ANDAMENTO: "border-l-blue-500",
  CONCLUIDA: "border-l-green-500",
  PAUSADA: "border-l-yellow-500",
  CANCELADA: "border-l-red-500",
};

// Prioridade colors
export const PRIORIDADE_COR: Record<string, string> = {
  ALTA: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  MEDIA: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  BAIXA: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

export type MetaStatus = "NAO_INICIADA" | "EM_ANDAMENTO" | "CONCLUIDA" | "PAUSADA" | "CANCELADA";
export type MetaCategoria =
  | "PESSOAL"
  | "PROFISSIONAL"
  | "FINANCEIRA"
  | "SAUDE"
  | "ESTUDO"
  | "RELACIONAMENTO"
  | "OUTRO";
export type MetaPrioridade = "BAIXA" | "MEDIA" | "ALTA";

export interface Marco {
  id: string;
  titulo: string;
  descricao: string | null;
  ordem: number;
  concluido: boolean;
  concluidoEm: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EntradaDiario {
  id: string;
  conteudo: string;
  humor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnexoMeta {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface Meta {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: MetaCategoria;
  prazo: string | null;
  status: MetaStatus;
  prioridade: MetaPrioridade;
  motivacao: string | null;
  concluidaEm: string | null;
  createdAt: string;
  updatedAt: string;
  totalMarcos?: number;
  marcosFeitos?: number;
  progresso?: number;
  marcos?: Marco[];
  diario?: EntradaDiario[];
  anexos?: AnexoMeta[];
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR");
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
