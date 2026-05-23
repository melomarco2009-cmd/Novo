import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { marcoSchema } from "@/lib/validations/metas";

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

  const marcos = await prisma.marco.findMany({
    where: { metaId: params.id, userId },
    orderBy: { ordem: "asc" },
  });

  return NextResponse.json({ success: true, data: marcos });
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
  const parsed = marcoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Determine next order
  const lastMarco = await prisma.marco.findFirst({
    where: { metaId: params.id, userId },
    orderBy: { ordem: "desc" },
    select: { ordem: true },
  });
  const ordem = parsed.data.ordem ?? (lastMarco ? lastMarco.ordem + 1 : 0);

  const marco = await prisma.marco.create({
    data: {
      userId,
      metaId: params.id,
      titulo: parsed.data.titulo,
      descricao: parsed.data.descricao ?? null,
      ordem,
    },
  });

  return NextResponse.json({ success: true, data: marco }, { status: 201 });
}
