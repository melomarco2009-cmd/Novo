import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: { id: string } };

export async function PATCH(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const item = await prisma.itemCompra.findFirst({ where: { id: params.id, userId } });
  if (!item) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const novoComprado = !item.comprado;

  const updated = await prisma.itemCompra.update({
    where: { id: params.id },
    data: {
      comprado: novoComprado,
      dataCompra: novoComprado ? new Date() : null,
    },
  });

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
