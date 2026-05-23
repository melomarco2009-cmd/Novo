import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { metaSchema } from "@/lib/validations/metas";
import type { CategoriaMeta, StatusMeta, Prioridade } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get("categoria");
  const status = searchParams.get("status");
  const prioridade = searchParams.get("prioridade");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = (searchParams.get("order") ?? "desc") as "asc" | "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));

  const where: Record<string, unknown> = { userId };
  if (categoria && categoria !== "TODOS") where.categoria = categoria as CategoriaMeta;
  if (status && status !== "TODOS") where.status = status as StatusMeta;
  if (prioridade && prioridade !== "TODOS") where.prioridade = prioridade as Prioridade;

  const validOrderFields = ["titulo", "prazo", "prioridade", "createdAt", "status"] as const;
  type OrderField = (typeof validOrderFields)[number];
  const sortField: OrderField = validOrderFields.includes(orderBy as OrderField)
    ? (orderBy as OrderField)
    : "createdAt";

  const [total, metas] = await Promise.all([
    prisma.meta.count({ where }),
    prisma.meta.findMany({
      where,
      include: {
        marcos: { select: { id: true, concluido: true } },
      },
      orderBy: { [sortField]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const data = metas.map((m) => {
    const totalMarcos = m.marcos.length;
    const marcosFeitos = m.marcos.filter((mx) => mx.concluido).length;
    return {
      ...m,
      totalMarcos,
      marcosFeitos,
      progresso: totalMarcos > 0 ? Math.round((marcosFeitos / totalMarcos) * 100) : 0,
    };
  });

  return NextResponse.json({
    success: true,
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const body = await req.json();
  const parsed = metaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { prazo, ...rest } = parsed.data;

  const meta = await prisma.meta.create({
    data: {
      ...rest,
      userId,
      prazo: prazo ? new Date(prazo) : null,
    },
    include: {
      marcos: { select: { id: true, concluido: true } },
    },
  });

  return NextResponse.json({ success: true, data: meta }, { status: 201 });
}
