import { z } from "zod";

export const categoriaMetaValues = [
  "PESSOAL",
  "PROFISSIONAL",
  "FINANCEIRA",
  "SAUDE",
  "ESTUDO",
  "RELACIONAMENTO",
  "OUTRO",
] as const;

export const statusMetaValues = [
  "NAO_INICIADA",
  "EM_ANDAMENTO",
  "CONCLUIDA",
  "PAUSADA",
  "CANCELADA",
] as const;

export const prioridadeValues = ["BAIXA", "MEDIA", "ALTA"] as const;

export const metaSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório").max(200, "Título muito longo"),
  descricao: z.string().max(2000, "Descrição muito longa").optional().nullable(),
  categoria: z.enum(categoriaMetaValues, { required_error: "Categoria é obrigatória" }),
  prazo: z.string().optional().nullable(),
  status: z.enum(statusMetaValues).default("NAO_INICIADA"),
  prioridade: z.enum(prioridadeValues).default("MEDIA"),
  motivacao: z.string().max(2000, "Motivação muito longa").optional().nullable(),
});

export type MetaInput = z.infer<typeof metaSchema>;

export const metaPatchSchema = metaSchema.partial();
export type MetaPatchInput = z.infer<typeof metaPatchSchema>;

export const marcoSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório").max(200, "Título muito longo"),
  descricao: z.string().max(2000, "Descrição muito longa").optional().nullable(),
  ordem: z.number().int().min(0).optional(),
});

export type MarcoInput = z.infer<typeof marcoSchema>;

export const marcoPatchSchema = marcoSchema.partial();
export type MarcoPatchInput = z.infer<typeof marcoPatchSchema>;

export const diarioSchema = z.object({
  conteudo: z.string().min(1, "Conteúdo é obrigatório").max(5000, "Conteúdo muito longo"),
  humor: z.string().max(100, "Humor muito longo").optional().nullable(),
});

export type DiarioInput = z.infer<typeof diarioSchema>;

export const diarioPatchSchema = diarioSchema.partial();
export type DiarioPatchInput = z.infer<typeof diarioPatchSchema>;
