import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { prestadorPatchSchema } from "@/lib/validations/prestadores";

type RouteParams = { params: { id: string } };

async function getOwned(id: string, userId: string) {
  return prisma.prestador.findFirst({ where: { id, userId } });
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const prestador = await prisma.prestador.findFirst({
    where: { id: params.id, userId },
    include: {
      documentos: {
        include: {
          upload: {
            select: {
              id: true,
              originalName: true,
              mimeType: true,
              sizeBytes: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!prestador) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      ...prestador,
      salario: prestador.salario?.toString() ?? null,
    },
  });
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
  const parsed = prestadorPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const updateData: Record<string, unknown> = {};

  if (d.nome !== undefined) updateData.nome = d.nome;
  if (d.cpf !== undefined) updateData.cpf = d.cpf ?? null;
  if (d.rg !== undefined) updateData.rg = d.rg ?? null;
  if (d.dataNascimento !== undefined)
    updateData.dataNascimento = d.dataNascimento ? new Date(d.dataNascimento) : null;
  if (d.naturalidade !== undefined) updateData.naturalidade = d.naturalidade ?? null;
  if (d.email !== undefined) updateData.email = d.email ?? null;
  if (d.telefone !== undefined) updateData.telefone = d.telefone ?? null;
  if (d.cep !== undefined) updateData.cep = d.cep ?? null;
  if (d.logradouro !== undefined) updateData.logradouro = d.logradouro ?? null;
  if (d.numero !== undefined) updateData.numero = d.numero ?? null;
  if (d.complemento !== undefined) updateData.complemento = d.complemento ?? null;
  if (d.bairro !== undefined) updateData.bairro = d.bairro ?? null;
  if (d.cidade !== undefined) updateData.cidade = d.cidade ?? null;
  if (d.estado !== undefined) updateData.estado = d.estado ?? null;
  if (d.cargo !== undefined) updateData.cargo = d.cargo ?? null;
  if (d.tipoVinculo !== undefined) updateData.tipoVinculo = d.tipoVinculo;
  if (d.statusVinculo !== undefined) updateData.statusVinculo = d.statusVinculo;
  if (d.dataInicio !== undefined)
    updateData.dataInicio = d.dataInicio ? new Date(d.dataInicio) : null;
  if (d.dataFim !== undefined)
    updateData.dataFim = d.dataFim ? new Date(d.dataFim) : null;
  if (d.salario !== undefined) updateData.salario = d.salario ?? null;
  if (d.diaPagamento !== undefined) updateData.diaPagamento = d.diaPagamento ?? null;
  if (d.formaPagamento !== undefined) updateData.formaPagamento = d.formaPagamento ?? null;
  if (d.pixChave !== undefined) updateData.pixChave = d.pixChave ?? null;
  if (d.bancoNome !== undefined) updateData.bancoNome = d.bancoNome ?? null;
  if (d.bancoAgencia !== undefined) updateData.bancoAgencia = d.bancoAgencia ?? null;
  if (d.bancoConta !== undefined) updateData.bancoConta = d.bancoConta ?? null;
  if (d.observacao !== undefined) updateData.observacao = d.observacao ?? null;

  const updated = await prisma.prestador.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({
    success: true,
    data: { ...updated, salario: updated.salario?.toString() ?? null },
  });
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

  await prisma.prestador.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
