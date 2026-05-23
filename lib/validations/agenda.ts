import { z } from "zod";

export const tipoCompromissoValues = [
  "REUNIAO",
  "CONSULTA",
  "ENTREGA",
  "EVENTO",
  "PESSOAL",
  "PROFISSIONAL",
  "OUTRO",
] as const;

export const recorrenciaTipoValues = [
  "NENHUMA",
  "DIARIA",
  "SEMANAL",
  "QUINZENAL",
  "MENSAL",
  "ANUAL",
] as const;

export const compromissoSchema = z.object({
  titulo: z
    .string()
    .min(1, "Título é obrigatório")
    .max(200, "Título muito longo"),
  descricao: z.string().max(1000).optional().nullable(),
  local: z.string().max(200).optional().nullable(),
  dataInicio: z.string().min(1, "Data de início é obrigatória"),
  dataFim: z.string().optional().nullable(),
  diaInteiro: z.boolean().default(false),
  tipo: z.enum(tipoCompromissoValues, {
    required_error: "Tipo é obrigatório",
  }),
  cor: z.string().optional().nullable(),
  recorrencia: z.enum(recorrenciaTipoValues).default("NENHUMA"),
  recorrenciaFim: z.string().optional().nullable(),
  alertaMinutos: z.coerce.number().int().optional().nullable(),
  observacao: z.string().max(1000).optional().nullable(),
});

export type CompromissoInput = z.infer<typeof compromissoSchema>;

export const compromissoPatchSchema = compromissoSchema.partial();
export type CompromissoPatchInput = z.infer<typeof compromissoPatchSchema>;
