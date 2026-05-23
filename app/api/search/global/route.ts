import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

const LIMIT = 5;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q || q.length < 2) {
    return NextResponse.json({ success: true, data: {} });
  }

  const contains = { contains: q, mode: "insensitive" as const };

  const [compromissos, contas, servicos, prestadores, compras, metas] =
    await Promise.all([
      prisma.compromisso.findMany({
        where: {
          userId,
          OR: [
            { titulo: contains },
            { descricao: contains },
            { local: contains },
            { observacao: contains },
          ],
        },
        take: LIMIT,
        orderBy: { dataInicio: "desc" },
        select: { id: true, titulo: true, tipo: true, dataInicio: true },
      }),
      prisma.conta.findMany({
        where: {
          userId,
          OR: [{ nome: contains }, { observacao: contains }],
        },
        take: LIMIT,
        orderBy: { vencimento: "asc" },
        select: { id: true, nome: true, status: true, vencimento: true },
      }),
      prisma.servico.findMany({
        where: {
          userId,
          OR: [{ nome: contains }, { url: contains }, { observacao: contains }],
        },
        take: LIMIT,
        orderBy: { nome: "asc" },
        select: { id: true, nome: true, categoria: true, status: true },
      }),
      prisma.prestador.findMany({
        where: {
          userId,
          OR: [
            { nome: contains },
            { cargo: contains },
            { email: contains },
            { telefone: contains },
            { observacao: contains },
          ],
        },
        take: LIMIT,
        orderBy: { nome: "asc" },
        select: { id: true, nome: true, cargo: true, statusVinculo: true },
      }),
      prisma.itemCompra.findMany({
        where: {
          userId,
          OR: [
            { nome: contains },
            { localCompra: contains },
            { observacao: contains },
          ],
        },
        take: LIMIT,
        orderBy: { createdAt: "desc" },
        select: { id: true, nome: true, urgencia: true, comprado: true },
      }),
      prisma.meta.findMany({
        where: {
          userId,
          OR: [
            { titulo: contains },
            { descricao: contains },
            { motivacao: contains },
          ],
        },
        take: LIMIT,
        orderBy: { createdAt: "desc" },
        select: { id: true, titulo: true, categoria: true, status: true },
      }),
    ]);

  return NextResponse.json({
    success: true,
    data: {
      agenda: compromissos.map((c) => ({
        id: c.id,
        label: c.titulo,
        description: c.tipo,
        href: "/agenda",
      })),
      contas: contas.map((c) => ({
        id: c.id,
        label: c.nome,
        description: c.status,
        href: "/contas",
      })),
      servicos: servicos.map((s) => ({
        id: s.id,
        label: s.nome,
        description: s.categoria,
        href: "/servicos",
      })),
      prestadores: prestadores.map((p) => ({
        id: p.id,
        label: p.nome,
        description: p.cargo ?? p.statusVinculo,
        href: "/prestadores",
      })),
      compras: compras.map((c) => ({
        id: c.id,
        label: c.nome,
        description: c.comprado ? "Comprado" : c.urgencia,
        href: "/compras",
      })),
      metas: metas.map((m) => ({
        id: m.id,
        label: m.titulo,
        description: m.status,
        href: "/metas",
      })),
    },
  });
}
