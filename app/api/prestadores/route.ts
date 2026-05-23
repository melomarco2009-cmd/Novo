import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { prestadorSchema } from "@/lib/validations/prestadores";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const statusVinculo = searchParams.get("statusVinculo");
  const tipoVinculo = searchParams.get("tipoVinculo");
  const orderBy = searchParams.get("orderBy") ?? "nome";
  const order = (searchParams.get("order") ?? "asc") as "asc" | "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10))
  );

  const where: Record<string, unknown> = { userId };
  if (statusVinculo && statusVinculo !== "TODOS") where.statusVinculo = statusVinculo;
  if (tipoVinculo && tipoVinculo !== "TODOS") where.tipoVinculo = tipoVinculo;

  const validOrderFields = ["nome", "cargo", "diaPagamento", "createdAt"] as const;
  type OrderField = (typeof validOrderFields)[number];
  const sortField: OrderField = validOrderFields.includes(orderBy as OrderField)
    ? (orderBy as OrderField)
    : "nome";

  const [total, prestadores] = await Promise.all([
    prisma.prestador.count({ where }),
    prisma.prestador.findMany({
      where,
      orderBy: { [sortField]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        nome: true,
        cargo: true,
        tipoVinculo: true,
        statusVinculo: true,
        diaPagamento: true,
        salario: true,
        telefone: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const data = prestadores.map((p) => {
    let proximoPagamento: string | null = null;
    if (p.diaPagamento) {
      const dia = p.diaPagamento;
      let next = new Date(today.getFullYear(), today.getMonth(), dia);
      if (next <= today) {
        next = new Date(today.getFullYear(), today.getMonth() + 1, dia);
      }
      proximoPagamento = next.toISOString();
    }
    return {
      ...p,
      salario: p.salario?.toString() ?? null,
      proximoPagamento,
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
  const parsed = prestadorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const d = parsed.data;

  const prestador = await prisma.prestador.create({
    data: {
      userId,
      nome: d.nome,
      cpf: d.cpf ?? null,
      rg: d.rg ?? null,
      dataNascimento: d.dataNascimento ? new Date(d.dataNascimento) : null,
      naturalidade: d.naturalidade ?? null,
      email: d.email ?? null,
      telefone: d.telefone ?? null,
      cep: d.cep ?? null,
      logradouro: d.logradouro ?? null,
      numero: d.numero ?? null,
      complemento: d.complemento ?? null,
      bairro: d.bairro ?? null,
      cidade: d.cidade ?? null,
      estado: d.estado ?? null,
      cargo: d.cargo ?? null,
      tipoVinculo: d.tipoVinculo,
      statusVinculo: d.statusVinculo,
      dataInicio: d.dataInicio ? new Date(d.dataInicio) : null,
      dataFim: d.dataFim ? new Date(d.dataFim) : null,
      salario: d.salario ?? null,
      diaPagamento: d.diaPagamento ?? null,
      formaPagamento: d.formaPagamento ?? null,
      pixChave: d.pixChave ?? null,
      bancoNome: d.bancoNome ?? null,
      bancoAgencia: d.bancoAgencia ?? null,
      bancoConta: d.bancoConta ?? null,
      observacao: d.observacao ?? null,
    },
  });

  return NextResponse.json(
    {
      success: true,
      data: { ...prestador, salario: prestador.salario?.toString() ?? null },
    },
    { status: 201 }
  );
}
