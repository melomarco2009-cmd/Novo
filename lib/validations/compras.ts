import { z } from "zod";

export const urgenciaValues = ["ALTA", "MEDIA", "BAIXA"] as const;

export const categoriaProdutoValues = [
  "ALIMENTO",
  "LIMPEZA",
  "HIGIENE",
  "FARMACIA",
  "CASA",
  "ESCRITORIO",
  "ELETRONICO",
  "ROUPA",
  "OUTRO",
] as const;

export const unidadeValues = ["un", "kg", "L", "cx", "pct", "outro"] as const;

export const itemCompraSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(200, "Nome muito longo"),
  quantidade: z.coerce
    .number({ invalid_type_error: "Quantidade inválida" })
    .min(0.01, "Quantidade deve ser maior que zero")
    .optional()
    .nullable(),
  unidade: z.enum(unidadeValues).optional().nullable(),
  localCompra: z.string().max(200, "Local muito longo").optional().nullable(),
  urgencia: z.enum(urgenciaValues).default("MEDIA"),
  categoria: z.enum(categoriaProdutoValues).default("OUTRO"),
  observacao: z.string().max(1000, "Observação muito longa").optional().nullable(),
  comprado: z.boolean().default(false),
  dataCompra: z.string().optional().nullable(),
  valorEstimado: z.coerce
    .number({ invalid_type_error: "Valor inválido" })
    .min(0, "Valor não pode ser negativo")
    .optional()
    .nullable(),
  valorReal: z.coerce
    .number({ invalid_type_error: "Valor inválido" })
    .min(0, "Valor não pode ser negativo")
    .optional()
    .nullable(),
  notaFiscalUploadId: z.string().optional().nullable(),
});

export type ItemCompraInput = z.infer<typeof itemCompraSchema>;

export const itemCompraPatchSchema = itemCompraSchema.partial();
export type ItemCompraPatchInput = z.infer<typeof itemCompraPatchSchema>;
