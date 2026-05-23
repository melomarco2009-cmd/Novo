import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { saveUpload } from "@/lib/uploads";
import { z } from "zod";

type RouteParams = { params: { id: string } };

const documentoSchema = z.object({
  tipo: z.enum([
    "RG",
    "CPF",
    "CNH",
    "COMPROVANTE_RESIDENCIA",
    "CONTRATO",
    "CERTIFICADO",
    "OUTRO",
  ]),
  nome: z.string().min(1, "Nome é obrigatório").max(200),
  descricao: z.string().max(500).optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const documentos = await prisma.documentoPrestador.findMany({
    where: { prestadorId: params.id, userId },
    include: {
      upload: {
        select: {
          id: true,
          originalName: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: documentos });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const prestador = await prisma.prestador.findFirst({
    where: { id: params.id, userId },
  });
  if (!prestador) {
    return NextResponse.json({ error: "Prestador não encontrado" }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const tipo = formData.get("tipo") as string | null;
  const nome = formData.get("nome") as string | null;
  const descricao = formData.get("descricao") as string | null;

  if (!file) {
    return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
  }

  const parsed = documentoSchema.safeParse({
    tipo,
    nome,
    descricao: descricao || null,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const upload = await saveUpload({
      file,
      userId,
      entityType: "DOCUMENTO_PRESTADOR",
      entityId: params.id,
      modulo: "prestadores",
      categoria: parsed.data.tipo,
    });

    const documento = await prisma.documentoPrestador.create({
      data: {
        userId,
        prestadorId: params.id,
        tipo: parsed.data.tipo,
        nome: parsed.data.nome,
        descricao: parsed.data.descricao ?? null,
        uploadId: upload.id,
      },
      include: {
        upload: {
          select: {
            id: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: documento }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao salvar documento" },
      { status: 500 }
    );
  }
}
