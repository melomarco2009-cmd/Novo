import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { itemCompraSchema } from "@/lib/validations/compras";
import type { Urgencia, CategoriaProduto } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const urgencia = searchParams.get("urgencia");
  const categoria = searchParams.get("categoria");
  const localCompra = searchParams.get("local");
  const comprado = searchParams.get("comprado");
  const orderBy = searchParams.get("orderBy") ?? "createdAt";
  const order = (searchParams.get("order") ?? "desc") as "asc" | "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "50", 10))
  );

  const where: Record<string, unknown> = { userId };
  if (urgencia && urgencia !== "TODOS") where.urgencia = urgencia as Urgencia;
  if (categoria && categoria !== "TODOS") where.categoria = categoria as CategoriaProduto;
  if (localCompra) where.localCompra = { contains: localCompra, mode: "insensitive" };
  if (comprado === "true") where.comprado = true;
  if (comprado === "false") where.comprado = false;

  const validOrderFields = ["nome", "urgencia", "categoria", "createdAt", "localCompra"] as const;
  type OrderField = (typeof validOrderFields)[number];
  const sortField: OrderField = validOrderFields.includes(orderBy as OrderField)
    ? (orderBy as OrderField)
    : "createdAt";

  const [total, itens] = await Promise.all([
    prisma.itemCompra.count({ where }),
    prisma.itemCompra.findMany({
      where,
      orderBy: { [sortField]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  // Summary counts
  const [totalItens, totalUrgentes, totalComprados] = await Promise.all([
    prisma.itemCompra.count({ where: { userId } }),
    prisma.itemCompra.count({ where: { userId, urgencia: "ALTA", comprado: false } }),
    prisma.itemCompra.count({ where: { userId, comprado: true } }),
  ]);

  const data = itens.map((i) => ({
    ...i,
    quantidade: i.quantidade?.toString() ?? null,
    valorEstimado: i.valorEstimado?.toString() ?? null,
    valorReal: i.valorReal?.toString() ?? null,
  }));

  return NextResponse.json({
    success: true,
    data,
    summary: {
      totalItens,
      totalUrgentes,
      totalComprados,
    },
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
  const parsed = itemCompraSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { notaFiscalUploadId, dataCompra, quantidade, valorEstimado, valorReal, ...rest } =
    parsed.data;

  const item = await prisma.itemCompra.create({
    data: {
      ...rest,
      userId,
      quantidade: quantidade != null ? quantidade : null,
      valorEstimado: valorEstimado != null ? valorEstimado : null,
      valorReal: valorReal != null ? valorReal : null,
      dataCompra: dataCompra ? new Date(dataCompra) : null,
    },
  });

  if (notaFiscalUploadId) {
    await prisma.upload.updateMany({
      where: { id: notaFiscalUploadId, userId },
      data: { entityId: item.id },
    });
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        ...item,
        quantidade: item.quantidade?.toString() ?? null,
        valorEstimado: item.valorEstimado?.toString() ?? null,
        valorReal: item.valorReal?.toString() ?? null,
      },
    },
    { status: 201 }
  );
}
