import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { diarioSchema } from "@/lib/validations/metas";

type RouteParams = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const meta = await prisma.meta.findFirst({ where: { id: params.id, userId } });
  if (!meta) {
    return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
  }

  const entradas = await prisma.entradaDiario.findMany({
    where: { metaId: params.id, userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: entradas });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const meta = await prisma.meta.findFirst({ where: { id: params.id, userId } });
  if (!meta) {
    return NextResponse.json({ error: "Meta não encontrada" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = diarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const entrada = await prisma.entradaDiario.create({
    data: {
      userId,
      metaId: params.id,
      conteudo: parsed.data.conteudo,
      humor: parsed.data.humor ?? null,
    },
  });

  return NextResponse.json({ success: true, data: entrada }, { status: 201 });
}
