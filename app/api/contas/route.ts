import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { contaSchema } from "@/lib/validations/contas";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const mes = searchParams.get("mes"); // YYYY-MM
  const orderBy = searchParams.get("orderBy") ?? "vencimento";
  const order = (searchParams.get("order") ?? "asc") as "asc" | "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10))
  );

  const where: Record<string, unknown> = { userId };
  if (status && status !== "TODOS") where.status = status;
  if (mes) {
    const [year, month] = mes.split("-").map(Number);
    where.mesReferencia = {
      gte: new Date(Date.UTC(year, month - 1, 1)),
      lte: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
    };
  }

  const validOrderFields = ["nome", "valor", "vencimento", "createdAt"] as const;
  type OrderField = (typeof validOrderFields)[number];
  const sortField: OrderField = validOrderFields.includes(orderBy as OrderField)
    ? (orderBy as OrderField)
    : "vencimento";

  const [total, contas] = await Promise.all([
    prisma.conta.count({ where }),
    prisma.conta.findMany({
      where,
      orderBy: { [sortField]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  // Fetch comprovante uploads for these contas (newest first)
  const contaIds = contas.map((c) => c.id);
  const uploads =
    contaIds.length > 0
      ? await prisma.upload.findMany({
          where: { entityType: "CONTA", entityId: { in: contaIds } },
          select: {
            id: true,
            entityId: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : [];

  // Map: only keep most-recent upload per conta
  const uploadsByContaId: Record<string, (typeof uploads)[number]> = {};
  for (const u of uploads) {
    if (u.entityId && !uploadsByContaId[u.entityId]) {
      uploadsByContaId[u.entityId] = u;
    }
  }

  const data = contas.map((c) => ({
    ...c,
    valor: c.valor.toString(),
    comprovante: uploadsByContaId[c.id] ?? null,
  }));

  // Summary for selected or current month
  const now = new Date();
  let summaryStart: Date;
  let summaryEnd: Date;
  if (mes) {
    const [y, m] = mes.split("-").map(Number);
    summaryStart = new Date(Date.UTC(y, m - 1, 1));
    summaryEnd = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
  } else {
    summaryStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    summaryEnd = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    );
  }

  const summaryContas = await prisma.conta.findMany({
    where: {
      userId,
      mesReferencia: { gte: summaryStart, lte: summaryEnd },
    },
    select: { valor: true, status: true, vencimento: true },
  });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  let totalMes = 0,
    totalPago = 0,
    totalPendente = 0,
    totalAtrasado = 0;

  for (const c of summaryContas) {
    const val = Number(c.valor);
    totalMes += val;
    if (c.status === "PAGA") {
      totalPago += val;
    } else if (c.vencimento < today) {
      totalAtrasado += val;
    } else {
      totalPendente += val;
    }
  }

  return NextResponse.json({
    success: true,
    data,
    summary: {
      totalMes: totalMes.toFixed(2),
      totalPago: totalPago.toFixed(2),
      totalPendente: totalPendente.toFixed(2),
      totalAtrasado: totalAtrasado.toFixed(2),
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
  const parsed = contaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { comprovanteUploadId, vencimento, dataPagamento, mesReferencia, ...rest } =
    parsed.data;

  const [mesYear, mesMonth] = mesReferencia.split("-").map(Number);

  const conta = await prisma.conta.create({
    data: {
      ...rest,
      userId,
      vencimento: new Date(vencimento),
      dataPagamento: dataPagamento ? new Date(dataPagamento) : null,
      mesReferencia: new Date(Date.UTC(mesYear, mesMonth - 1, 1)),
      observacao: rest.observacao ?? null,
    },
  });

  // Link comprovante upload to this conta
  if (comprovanteUploadId) {
    await prisma.upload.updateMany({
      where: { id: comprovanteUploadId, userId },
      data: { entityId: conta.id },
    });
  }

  return NextResponse.json(
    { success: true, data: { ...conta, valor: conta.valor.toString() } },
    { status: 201 }
  );
}
