import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { metaPatchSchema } from "@/lib/validations/metas";

type RouteParams = { params: { id: string } };

async function getOwned(id: string, userId: string) {
  return prisma.meta.findFirst({ where: { id, userId } });
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const meta = await prisma.meta.findFirst({
    where: { id: params.id, userId },
    include: {
      marcos: { orderBy: { ordem: "asc" } },
      diario: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!meta) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const totalMarcos = meta.marcos.length;
  const marcosFeitos = meta.marcos.filter((m) => m.concluido).length;
  const progresso = totalMarcos > 0 ? Math.round((marcosFeitos / totalMarcos) * 100) : 0;

  const anexos = await prisma.upload.findMany({
    where: { entityType: "META", entityId: params.id },
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      sizeBytes: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: { ...meta, totalMarcos, marcosFeitos, progresso, anexos },
  });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const existing = await getOwned(params.id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = metaPatchSchema.safeParse(body);
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
  if (d.categoria !== undefined) updateData.categoria = d.categoria;
  if (d.prazo !== undefined) updateData.prazo = d.prazo ? new Date(d.prazo) : null;
  if (d.status !== undefined) {
    updateData.status = d.status;
    if (d.status === "CONCLUIDA" && existing.status !== "CONCLUIDA") {
      updateData.concluidaEm = new Date();
    } else if (d.status !== "CONCLUIDA") {
      updateData.concluidaEm = null;
    }
  }
  if (d.prioridade !== undefined) updateData.prioridade = d.prioridade;
  if (d.motivacao !== undefined) updateData.motivacao = d.motivacao ?? null;

  const updated = await prisma.meta.update({
    where: { id: params.id },
    data: updateData,
    include: {
      marcos: { orderBy: { ordem: "asc" } },
    },
  });

  const totalMarcos = updated.marcos.length;
  const marcosFeitos = updated.marcos.filter((m) => m.concluido).length;
  const progresso = totalMarcos > 0 ? Math.round((marcosFeitos / totalMarcos) * 100) : 0;

  return NextResponse.json({
    success: true,
    data: { ...updated, totalMarcos, marcosFeitos, progresso },
  });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const existing = await getOwned(params.id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  await prisma.meta.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
