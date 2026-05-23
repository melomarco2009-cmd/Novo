import { z } from "zod";

export const categoriaServicoValues = [
  "STREAMING",
  "SOFTWARE",
  "HOSPEDAGEM",
  "DOMINIO",
  "EDUCACAO",
  "BANCO",
  "REDES_SOCIAIS",
  "UTILITARIO",
  "OUTRO",
] as const;

export const statusServicoValues = [
  "ATIVO",
  "PAUSADO",
  "CANCELADO",
  "ATRASADO",
] as const;

export const servicoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(200, "Nome muito longo"),
  login: z.string().min(1, "Login é obrigatório").max(200, "Login muito longo"),
  senha: z.string().min(1, "Senha é obrigatória"),
  url: z
    .string()
    .url("URL inválida")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  categoria: z.enum(categoriaServicoValues, {
    required_error: "Categoria é obrigatória",
  }),
  valorMensal: z.coerce
    .number({ invalid_type_error: "Valor inválido" })
    .min(0, "Valor deve ser positivo"),
  diaVencimento: z.coerce
    .number({ invalid_type_error: "Dia inválido" })
    .int("Dia deve ser inteiro")
    .min(1, "Dia mínimo é 1")
    .max(31, "Dia máximo é 31"),
  status: z.enum(statusServicoValues).default("ATIVO"),
  observacao: z.string().max(1000, "Observação muito longa").optional().nullable(),
  logoUploadId: z.string().optional().nullable(),
});

export type ServicoInput = z.infer<typeof servicoSchema>;

export const servicoPatchSchema = servicoSchema
  .omit({ senha: true })
  .extend({ senha: z.string().min(1).optional().nullable() })
  .partial();

export type ServicoPatchInput = z.infer<typeof servicoPatchSchema>;
