import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { marcoPatchSchema } from "@/lib/validations/metas";

type RouteParams = { params: { id: string; marcoId: string } };

async function getOwned(marcoId: string, metaId: string, userId: string) {
  return prisma.marco.findFirst({ where: { id: marcoId, metaId, userId } });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const existing = await getOwned(params.marcoId, params.id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Marco não encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = marcoPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (d.titulo !== undefined) updateData.titulo = d.titulo;
  if (d.descricao !== undefined) updateData.descricao = d.descricao ?? null;
  if (d.ordem !== undefined) updateData.ordem = d.ordem;

  const updated = await prisma.marco.update({
    where: { id: params.marcoId },
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

  const existing = await getOwned(params.marcoId, params.id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Marco não encontrado" }, { status: 404 });
  }

  await prisma.marco.delete({ where: { id: params.marcoId } });
  return NextResponse.json({ success: true });
}
