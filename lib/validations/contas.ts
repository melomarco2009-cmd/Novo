import { z } from "zod";

export const statusContaValues = [
  "A_PAGAR",
  "PAGA",
  "ATRASADA",
  "CANCELADA",
] as const;

export const recorrenciaValues = [
  "NENHUMA",
  "SEMANAL",
  "QUINZENAL",
  "MENSAL",
  "BIMESTRAL",
  "TRIMESTRAL",
  "SEMESTRAL",
  "ANUAL",
] as const;

export const contaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(200, "Nome muito longo"),
  valor: z.coerce
    .number({ invalid_type_error: "Valor inválido" })
    .min(0.01, "Valor deve ser maior que zero"),
  vencimento: z.string().min(1, "Vencimento é obrigatório"),
  dataPagamento: z.string().optional().nullable(),
  status: z.enum(statusContaValues).default("A_PAGAR"),
  mesReferencia: z
    .string()
    .min(1, "Mês de referência é obrigatório")
    .regex(/^\d{4}-\d{2}$/, "Formato inválido. Use AAAA-MM"),
  recorrencia: z.enum(recorrenciaValues).default("NENHUMA"),
  observacao: z.string().max(1000, "Observação muito longa").optional().nullable(),
  comprovanteUploadId: z.string().optional().nullable(),
});

export type ContaInput = z.infer<typeof contaSchema>;

export const contaPatchSchema = contaSchema.partial();
export type ContaPatchInput = z.infer<typeof contaPatchSchema>;
