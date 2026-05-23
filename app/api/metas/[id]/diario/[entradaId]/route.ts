import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { diarioPatchSchema } from "@/lib/validations/metas";

type RouteParams = { params: { id: string; entradaId: string } };

async function getOwned(entradaId: string, metaId: string, userId: string) {
  return prisma.entradaDiario.findFirst({ where: { id: entradaId, metaId, userId } });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const existing = await getOwned(params.entradaId, params.id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Entrada não encontrada" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = diarioPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (d.conteudo !== undefined) updateData.conteudo = d.conteudo;
  if (d.humor !== undefined) updateData.humor = d.humor ?? null;

  const updated = await prisma.entradaDiario.update({
    where: { id: params.entradaId },
    data: updateData,
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const existing = await getOwned(params.entradaId, params.id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Entrada não encontrada" }, { status: 404 });
  }

  await prisma.entradaDiario.delete({ where: { id: params.entradaId } });
  return NextResponse.json({ success: true });
}
