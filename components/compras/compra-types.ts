export const URGENCIA_LABEL: Record<string, string> = {
  ALTA: "Urgente",
  MEDIA: "Precisa Logo",
  BAIXA: "Pode Esperar",
};

export const URGENCIA_COR: Record<string, string> = {
  ALTA: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  MEDIA: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400",
  BAIXA: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export const URGENCIA_BORDER: Record<string, string> = {
  ALTA: "border-l-red-500",
  MEDIA: "border-l-yellow-400",
  BAIXA: "border-l-gray-300 dark:border-l-gray-600",
};

export const CATEGORIA_LABEL: Record<string, string> = {
  ALIMENTO: "Alimentos",
  LIMPEZA: "Limpeza",
  HIGIENE: "Higiene",
  FARMACIA: "Saúde/Medicamento",
  CASA: "Casa",
  ESCRITORIO: "Escritório",
  ELETRONICO: "Eletrônicos",
  ROUPA: "Roupas",
  OUTRO: "Outro",
};

export const UNIDADE_LABEL: Record<string, string> = {
  un: "un",
  kg: "kg",
  L: "L",
  cx: "cx",
  pct: "pct",
  outro: "outro",
};

export interface ItemCompra {
  id: string;
  nome: string;
  quantidade: string | null;
  unidade: string | null;
  localCompra: string | null;
  urgencia: string;
  categoria: string;
  observacao: string | null;
  comprado: boolean;
  dataCompra: string | null;
  valorEstimado: string | null;
  valorReal: string | null;
  origemItemId: string | null;
  createdAt: string;
  updatedAt: string;
  notaFiscal?: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  } | null;
}

export interface ComprasSummary {
  totalItens: number;
  totalUrgentes: number;
  totalComprados: number;
}

export function formatCurrency(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "—";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatQtd(qtd: string | null, unidade: string | null): string {
  if (!qtd) return "";
  const num = parseFloat(qtd);
  const qtdStr = Number.isInteger(num) ? String(num) : num.toFixed(2).replace(/\.?0+$/, "");
  return unidade ? `${qtdStr} ${unidade}` : qtdStr;
}
