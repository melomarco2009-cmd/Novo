import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { compromissoSchema } from "@/lib/validations/agenda";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const tipo = searchParams.get("tipo");

  const where: Record<string, unknown> = { userId };

  if (from || to) {
    where.dataInicio = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  if (tipo && tipo !== "TODOS") {
    where.tipo = tipo;
  }

  const compromissos = await prisma.compromisso.findMany({
    where,
    orderBy: { dataInicio: "asc" },
  });

  return NextResponse.json({ success: true, data: compromissos });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const parsed = compromissoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { dataInicio, dataFim, recorrenciaFim, ...rest } = parsed.data;

  const compromisso = await prisma.compromisso.create({
    data: {
      ...rest,
      userId,
      dataInicio: new Date(dataInicio),
      dataFim: dataFim ? new Date(dataFim) : null,
      recorrenciaFim: recorrenciaFim ? new Date(recorrenciaFim) : null,
      descricao: rest.descricao ?? null,
      local: rest.local ?? null,
      cor: rest.cor ?? null,
      alertaMinutos: rest.alertaMinutos ?? null,
      observacao: rest.observacao ?? null,
    },
  });

  return NextResponse.json({ success: true, data: compromisso }, { status: 201 });
}
