import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const conta = await prisma.conta.findFirst({ where: { id: params.id, userId } });
  if (!conta) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const dataPagamento: Date = body.dataPagamento
    ? new Date(body.dataPagamento)
    : new Date();

  const updated = await prisma.conta.update({
    where: { id: params.id },
    data: { status: "PAGA", dataPagamento },
  });

  return NextResponse.json({
    success: true,
    data: { ...updated, valor: updated.valor.toString() },
  });
}
