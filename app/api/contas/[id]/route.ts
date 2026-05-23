import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { contaPatchSchema } from "@/lib/validations/contas";

type RouteParams = { params: { id: string } };

async function getOwned(id: string, userId: string) {
  return prisma.conta.findFirst({ where: { id, userId } });
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const conta = await prisma.conta.findFirst({ where: { id: params.id, userId } });
  if (!conta) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const comprovante = await prisma.upload.findFirst({
    where: { entityType: "CONTA", entityId: conta.id },
    select: { id: true, originalName: true, mimeType: true, sizeBytes: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    success: true,
    data: { ...conta, valor: conta.valor.toString(), comprovante: comprovante ?? null },
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
  const parsed = contaPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const updateData: Record<string, unknown> = {};

  if (d.nome !== undefined) updateData.nome = d.nome;
  if (d.valor !== undefined) updateData.valor = d.valor;
  if (d.vencimento !== undefined) updateData.vencimento = new Date(d.vencimento);
  if (d.dataPagamento !== undefined)
    updateData.dataPagamento = d.dataPagamento ? new Date(d.dataPagamento) : null;
  if (d.status !== undefined) updateData.status = d.status;
  if (d.mesReferencia !== undefined) {
    const [y, m] = d.mesReferencia.split("-").map(Number);
    updateData.mesReferencia = new Date(Date.UTC(y, m - 1, 1));
  }
  if (d.recorrencia !== undefined) updateData.recorrencia = d.recorrencia;
  if (d.observacao !== undefined) updateData.observacao = d.observacao ?? null;

  const updated = await prisma.conta.update({
    where: { id: params.id },
    data: updateData,
  });

  // Link new comprovante upload if provided
  if (d.comprovanteUploadId) {
    await prisma.upload.updateMany({
      where: { id: d.comprovanteUploadId, userId },
      data: { entityId: params.id },
    });
  }

  return NextResponse.json({
    success: true,
    data: { ...updated, valor: updated.valor.toString() },
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

  await prisma.conta.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
