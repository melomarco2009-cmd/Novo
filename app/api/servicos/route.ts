import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { servicoSchema } from "@/lib/validations/servicos";
import { encrypt } from "@/lib/crypto/encryption";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get("categoria");
  const status = searchParams.get("status");
  const orderBy = searchParams.get("orderBy") ?? "nome";
  const order = (searchParams.get("order") ?? "asc") as "asc" | "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "12", 10))
  );

  const where: Record<string, unknown> = { userId };
  if (categoria && categoria !== "TODOS") where.categoria = categoria;
  if (status && status !== "TODOS") where.status = status;

  const validOrderFields = ["nome", "valorMensal", "diaVencimento", "createdAt"] as const;
  type OrderField = (typeof validOrderFields)[number];
  const sortField: OrderField = validOrderFields.includes(orderBy as OrderField)
    ? (orderBy as OrderField)
    : "nome";

  const [total, servicos] = await Promise.all([
    prisma.servico.count({ where }),
    prisma.servico.findMany({
      where,
      orderBy: { [sortField]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        nome: true,
        login: true,
        url: true,
        categoria: true,
        valorMensal: true,
        diaVencimento: true,
        status: true,
        observacao: true,
        logoUploadId: true,
        logoUpload: {
          select: {
            id: true,
            storagePath: true,
            originalName: true,
            mimeType: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        // Exclude senhaEncrypted/Iv/AuthTag from list response
      },
    }),
  ]);

  // Compute total mensal for ATIVO services
  const totalMensalResult = await prisma.servico.aggregate({
    where: { userId, status: "ATIVO" },
    _sum: { valorMensal: true },
  });

  return NextResponse.json({
    success: true,
    data: servicos,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      totalMensal: totalMensalResult._sum.valorMensal?.toString() ?? "0",
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
  const parsed = servicoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { senha, logoUploadId, ...rest } = parsed.data;
  const { encrypted, iv, authTag } = encrypt(senha);

  const servico = await prisma.servico.create({
    data: {
      ...rest,
      userId,
      url: rest.url ?? null,
      observacao: rest.observacao ?? null,
      logoUploadId: logoUploadId ?? null,
      senhaEncrypted: encrypted,
      senhaIv: iv,
      senhaAuthTag: authTag,
    },
    include: {
      logoUpload: {
        select: {
          id: true,
          storagePath: true,
          originalName: true,
          mimeType: true,
        },
      },
    },
  });

  // Omit crypto fields from response
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { senhaEncrypted, senhaIv, senhaAuthTag, ...safeServico } = servico;

  return NextResponse.json({ success: true, data: safeServico }, { status: 201 });
}
