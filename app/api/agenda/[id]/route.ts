import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { compromissoPatchSchema } from "@/lib/validations/agenda";

type RouteParams = { params: { id: string } };

async function getOwned(id: string, userId: string) {
  return prisma.compromisso.findFirst({ where: { id, userId } });
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const compromisso = await getOwned(params.id, userId);
  if (!compromisso) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: compromisso });
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
  const parsed = compromissoPatchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { dataInicio, dataFim, recorrenciaFim, ...rest } = parsed.data;

  const updated = await prisma.compromisso.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(dataInicio ? { dataInicio: new Date(dataInicio) } : {}),
      ...(dataFim !== undefined ? { dataFim: dataFim ? new Date(dataFim) : null } : {}),
      ...(recorrenciaFim !== undefined
        ? { recorrenciaFim: recorrenciaFim ? new Date(recorrenciaFim) : null }
        : {}),
    },
  });

  return NextResponse.json({ success: true, data: updated });
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

  await prisma.compromisso.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
