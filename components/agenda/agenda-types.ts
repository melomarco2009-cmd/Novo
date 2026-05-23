export type TipoCompromisso =
  | "REUNIAO"
  | "CONSULTA"
  | "ENTREGA"
  | "EVENTO"
  | "PESSOAL"
  | "PROFISSIONAL"
  | "OUTRO";

export type RecorrenciaTipo =
  | "NENHUMA"
  | "DIARIA"
  | "SEMANAL"
  | "QUINZENAL"
  | "MENSAL"
  | "ANUAL";

export interface Compromisso {
  id: string;
  userId: string;
  titulo: string;
  descricao: string | null;
  local: string | null;
  dataInicio: string;
  dataFim: string | null;
  diaInteiro: boolean;
  tipo: TipoCompromisso;
  cor: string | null;
  recorrencia: RecorrenciaTipo;
  recorrenciaFim: string | null;
  alertaMinutos: number | null;
  observacao: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FiltroTipo = TipoCompromisso | "TODOS";

export interface AgendaFilters {
  tipo: FiltroTipo;
  from?: string;
  to?: string;
}

export const TIPO_LABEL: Record<TipoCompromisso, string> = {
  REUNIAO: "Reunião",
  CONSULTA: "Consulta",
  ENTREGA: "Entrega",
  EVENTO: "Evento",
  PESSOAL: "Pessoal",
  PROFISSIONAL: "Profissional",
  OUTRO: "Outro",
};

export const TIPO_COR: Record<TipoCompromisso, string> = {
  PESSOAL: "bg-blue-500",
  PROFISSIONAL: "bg-purple-500",
  CONSULTA: "bg-red-500",
  REUNIAO: "bg-indigo-500",
  ENTREGA: "bg-orange-500",
  EVENTO: "bg-green-500",
  OUTRO: "bg-gray-500",
};

export const TIPO_COR_BORDER: Record<TipoCompromisso, string> = {
  PESSOAL: "border-blue-500",
  PROFISSIONAL: "border-purple-500",
  CONSULTA: "border-red-500",
  REUNIAO: "border-indigo-500",
  ENTREGA: "border-orange-500",
  EVENTO: "border-green-500",
  OUTRO: "border-gray-500",
};

export const TIPO_COR_TEXT: Record<TipoCompromisso, string> = {
  PESSOAL: "text-blue-600 dark:text-blue-400",
  PROFISSIONAL: "text-purple-600 dark:text-purple-400",
  CONSULTA: "text-red-600 dark:text-red-400",
  REUNIAO: "text-indigo-600 dark:text-indigo-400",
  ENTREGA: "text-orange-600 dark:text-orange-400",
  EVENTO: "text-green-600 dark:text-green-400",
  OUTRO: "text-gray-600 dark:text-gray-400",
};

export const TIPO_COR_BG_SOFT: Record<TipoCompromisso, string> = {
  PESSOAL: "bg-blue-50 dark:bg-blue-950/40",
  PROFISSIONAL: "bg-purple-50 dark:bg-purple-950/40",
  CONSULTA: "bg-red-50 dark:bg-red-950/40",
  REUNIAO: "bg-indigo-50 dark:bg-indigo-950/40",
  ENTREGA: "bg-orange-50 dark:bg-orange-950/40",
  EVENTO: "bg-green-50 dark:bg-green-950/40",
  OUTRO: "bg-gray-50 dark:bg-gray-950/40",
};

export const RECORRENCIA_LABEL: Record<RecorrenciaTipo, string> = {
  NENHUMA: "Sem recorrência",
  DIARIA: "Diária",
  SEMANAL: "Semanal",
  QUINZENAL: "Quinzenal",
  MENSAL: "Mensal",
  ANUAL: "Anual",
};

export function isToday(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr);
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
