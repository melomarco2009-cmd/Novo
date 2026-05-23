import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { itemCompraPatchSchema } from "@/lib/validations/compras";

type RouteParams = { params: { id: string } };

async function getOwned(id: string, userId: string) {
  return prisma.itemCompra.findFirst({ where: { id, userId } });
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const item = await getOwned(params.id, userId);
  if (!item) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const notaFiscal = await prisma.upload.findFirst({
    where: { entityType: "ITEM_COMPRA", entityId: item.id },
    select: { id: true, originalName: true, mimeType: true, sizeBytes: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: {
      ...item,
      quantidade: item.quantidade?.toString() ?? null,
      valorEstimado: item.valorEstimado?.toString() ?? null,
      valorReal: item.valorReal?.toString() ?? null,
      notaFiscal: notaFiscal ?? null,
    },
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
  const parsed = itemCompraPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const updateData: Record<string, unknown> = {};

  if (d.nome !== undefined) updateData.nome = d.nome;
  if (d.quantidade !== undefined) updateData.quantidade = d.quantidade ?? null;
  if (d.unidade !== undefined) updateData.unidade = d.unidade ?? null;
  if (d.localCompra !== undefined) updateData.localCompra = d.localCompra ?? null;
  if (d.urgencia !== undefined) updateData.urgencia = d.urgencia;
  if (d.categoria !== undefined) updateData.categoria = d.categoria;
  if (d.observacao !== undefined) updateData.observacao = d.observacao ?? null;
  if (d.comprado !== undefined) updateData.comprado = d.comprado;
  if (d.dataCompra !== undefined)
    updateData.dataCompra = d.dataCompra ? new Date(d.dataCompra) : null;
  if (d.valorEstimado !== undefined) updateData.valorEstimado = d.valorEstimado ?? null;
  if (d.valorReal !== undefined) updateData.valorReal = d.valorReal ?? null;

  const updated = await prisma.itemCompra.update({
    where: { id: params.id },
    data: updateData,
  });

  if (d.notaFiscalUploadId) {
    await prisma.upload.updateMany({
      where: { id: d.notaFiscalUploadId, userId },
      data: { entityId: params.id },
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      ...updated,
      quantidade: updated.quantidade?.toString() ?? null,
      valorEstimado: updated.valorEstimado?.toString() ?? null,
      valorReal: updated.valorReal?.toString() ?? null,
    },
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

  await prisma.itemCompra.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
