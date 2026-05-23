import { z } from "zod";

export const tipoVinculoValues = [
  "CLT",
  "PJ",
  "FREELANCER",
  "TEMPORARIO",
  "ESTAGIO",
  "OUTRO",
] as const;

export const statusVinculoValues = [
  "ATIVO",
  "INATIVO",
  "SUSPENSO",
  "ENCERRADO",
] as const;

export const tipoDocumentoPrestadorValues = [
  "RG",
  "CPF",
  "CNH",
  "COMPROVANTE_RESIDENCIA",
  "CONTRATO",
  "CERTIFICADO",
  "OUTRO",
] as const;

export const prestadorSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório").max(200, "Nome muito longo"),
  cpf: z.string().max(20).optional().nullable(),
  rg: z.string().max(30).optional().nullable(),
  dataNascimento: z.string().optional().nullable(),
  naturalidade: z.string().max(100).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  telefone: z.string().max(30).optional().nullable(),
  cep: z.string().max(10).optional().nullable(),
  logradouro: z.string().max(200).optional().nullable(),
  numero: z.string().max(20).optional().nullable(),
  complemento: z.string().max(100).optional().nullable(),
  bairro: z.string().max(100).optional().nullable(),
  cidade: z.string().max(100).optional().nullable(),
  estado: z.string().max(2).optional().nullable(),
  cargo: z.string().max(100).optional().nullable(),
  tipoVinculo: z.enum(tipoVinculoValues),
  statusVinculo: z.enum(statusVinculoValues).default("ATIVO"),
  dataInicio: z.string().optional().nullable(),
  dataFim: z.string().optional().nullable(),
  salario: z.preprocess(
    (v) =>
      v === "" || v === null || v === undefined
        ? null
        : isNaN(Number(v))
        ? null
        : Number(v),
    z.number().min(0).nullable().optional()
  ),
  diaPagamento: z.preprocess(
    (v) =>
      v === "" || v === null || v === undefined
        ? null
        : isNaN(Number(v))
        ? null
        : Math.round(Number(v)),
    z.number().int().min(1).max(31).nullable().optional()
  ),
  formaPagamento: z.string().max(50).optional().nullable(),
  pixChave: z.string().max(200).optional().nullable(),
  bancoNome: z.string().max(100).optional().nullable(),
  bancoAgencia: z.string().max(20).optional().nullable(),
  bancoConta: z.string().max(30).optional().nullable(),
  observacao: z.string().max(2000).optional().nullable(),
});

export type PrestadorInput = z.infer<typeof prestadorSchema>;

export const prestadorPatchSchema = prestadorSchema.partial();
export type PrestadorPatchInput = z.infer<typeof prestadorPatchSchema>;
