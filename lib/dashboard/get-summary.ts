import { prisma } from "@/lib/prisma";
import {
  startOfDay,
  addDays,
  startOfMonth,
  endOfMonth,
  setDate,
  addMonths,
  getDaysInMonth,
} from "date-fns";

export interface CompromissoSummary {
  id: string;
  titulo: string;
  dataInicio: string;
  tipo: string;
  local: string | null;
}

export interface ContaSummary {
  id: string;
  nome: string;
  valor: number;
  vencimento: string;
  status: string;
}

export interface ServicoSummary {
  id: string;
  nome: string;
  categoria: string;
  valorMensal: number;
  diaVencimento: number;
  status: string;
  diasParaRenovar: number;
}

export interface MetaSummary {
  id: string;
  titulo: string;
  categoria: string;
  prazo: string | null;
  status: string;
  progresso: number;
  totalMarcos: number;
  marcosConcluidos: number;
}

export interface CompraSummary {
  id: string;
  nome: string;
  urgencia: string;
  categoria: string;
  quantidade: number | null;
  unidade: string | null;
}

export interface DashboardSummary {
  compromissos: {
    hoje: CompromissoSummary[];
    amanha: CompromissoSummary[];
    totalHoje: number;
    totalAmanha: number;
  };
  contas: {
    proximas7dias: ContaSummary[];
    atrasadas: ContaSummary[];
    totalAtrasadas: number;
    totalProximas: number;
  };
  servicos: {
    renovacaoProxima: ServicoSummary[];
    totalAtivos: number;
    totalMensalAtivos: number;
  };
  metas: {
    ativas: MetaSummary[];
    totalAtivas: number;
  };
  compras: {
    urgentes: CompraSummary[];
    totalUrgentes: number;
    totalPendentes: number;
  };
  gastos: {
    totalContasMes: number;
    totalServicosMes: number;
    totalMensal: number;
  };
}

function getProximaRenovacao(diaVencimento: number): Date {
  const hoje = new Date();
  const diaHoje = hoje.getDate();
  const diasNoMes = getDaysInMonth(hoje);
  const diaReal = Math.min(diaVencimento, diasNoMes);

  if (diaReal >= diaHoje) {
    return setDate(hoje, diaReal);
  } else {
    const proximoMes = addMonths(hoje, 1);
    const diasNoProximo = getDaysInMonth(proximoMes);
    return setDate(proximoMes, Math.min(diaVencimento, diasNoProximo));
  }
}

function diffDays(date: Date): number {
  const hoje = startOfDay(new Date());
  const alvo = startOfDay(date);
  return Math.round((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

// Type helpers for Prisma select results
type CompromissoRow = {
  id: string;
  titulo: string;
  dataInicio: Date;
  tipo: string;
  local: string | null;
};

type ContaRow = {
  id: string;
  nome: string;
  valor: { toNumber: () => number };
  vencimento: Date;
  status: string;
};

type ServicoRow = {
  id: string;
  nome: string;
  categoria: string;
  valorMensal: { toNumber: () => number };
  diaVencimento: number;
  status: string;
};

type MetaRow = {
  id: string;
  titulo: string;
  categoria: string;
  prazo: Date | null;
  status: string;
  marcos: { concluido: boolean }[];
};

type CompraRow = {
  id: string;
  nome: string;
  urgencia: string;
  categoria: string;
  quantidade: { toNumber: () => number } | null;
  unidade: string | null;
};

export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  const now = new Date();
  const hoje = startOfDay(now);
  const amanhaDia = addDays(hoje, 1);
  const depoisDeAmanha = addDays(hoje, 2);
  const em7dias = addDays(hoje, 7);
  const inicioMes = startOfMonth(now);
  const fimMes = endOfMonth(now);

  // Group A: agenda + contas (5 queries)
  // Group B: servicos + metas + compras (5 queries)
  // Third: aggregate
  // All run concurrently inside the outer Promise.all
  const [groupA, groupB, contasPagasMes] = await Promise.all([
    Promise.all([
      prisma.compromisso.findMany({
        where: { userId, dataInicio: { gte: hoje, lt: amanhaDia } },
        orderBy: { dataInicio: "asc" },
        take: 5,
        select: { id: true, titulo: true, dataInicio: true, tipo: true, local: true },
      }),
      prisma.compromisso.findMany({
        where: { userId, dataInicio: { gte: amanhaDia, lt: depoisDeAmanha } },
        orderBy: { dataInicio: "asc" },
        take: 5,
        select: { id: true, titulo: true, dataInicio: true, tipo: true, local: true },
      }),
      prisma.conta.findMany({
        where: { userId, status: "A_PAGAR", vencimento: { gte: hoje, lte: em7dias } },
        orderBy: { vencimento: "asc" },
        take: 5,
        select: { id: true, nome: true, valor: true, vencimento: true, status: true },
      }),
      prisma.conta.findMany({
        where: {
          userId,
          OR: [
            { status: "ATRASADA" },
            { status: "A_PAGAR", vencimento: { lt: hoje } },
          ],
        },
        orderBy: { vencimento: "asc" },
        take: 5,
        select: { id: true, nome: true, valor: true, vencimento: true, status: true },
      }),
      prisma.conta.count({
        where: {
          userId,
          OR: [
            { status: "ATRASADA" },
            { status: "A_PAGAR", vencimento: { lt: hoje } },
          ],
        },
      }),
    ]),
    Promise.all([
      prisma.servico.findMany({
        where: { userId, status: "ATIVO" },
        select: {
          id: true,
          nome: true,
          categoria: true,
          valorMensal: true,
          diaVencimento: true,
          status: true,
        },
      }),
      prisma.meta.findMany({
        where: { userId, status: { in: ["EM_ANDAMENTO", "NAO_INICIADA"] } },
        orderBy: [{ prioridade: "desc" }, { createdAt: "desc" }],
        take: 5,
        select: {
          id: true,
          titulo: true,
          categoria: true,
          prazo: true,
          status: true,
          marcos: { select: { concluido: true } },
        },
      }),
      prisma.itemCompra.findMany({
        where: { userId, comprado: false, urgencia: "ALTA" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          nome: true,
          urgencia: true,
          categoria: true,
          quantidade: true,
          unidade: true,
        },
      }),
      prisma.itemCompra.count({ where: { userId, comprado: false, urgencia: "ALTA" } }),
      prisma.itemCompra.count({ where: { userId, comprado: false } }),
    ]),
    prisma.conta.aggregate({
      where: { userId, status: "PAGA", mesReferencia: { gte: inicioMes, lte: fimMes } },
      _sum: { valor: true },
    }),
  ]);

  const [compromissosHoje, compromissosAmanha, contasProximas, contasAtrasadasDB, totalContasAtrasadas] = groupA;
  const [servicosAtivos, metasAtivas, comprasUrgentes, totalComprasUrgentes, totalComprasPendentes] = groupB;

  // Cast Prisma results to simple typed rows
  const servicosRows = servicosAtivos as unknown as ServicoRow[];
  const metasRows = metasAtivas as unknown as MetaRow[];
  const comprasRows = comprasUrgentes as unknown as CompraRow[];
  const compromissosHojeRows = compromissosHoje as unknown as CompromissoRow[];
  const compromissosAmanhaRows = compromissosAmanha as unknown as CompromissoRow[];
  const contasProximasRows = contasProximas as unknown as ContaRow[];
  const contasAtrasadasRows = contasAtrasadasDB as unknown as ContaRow[];

  const servicosComRenovacao: ServicoSummary[] = servicosRows
    .map((s) => ({
      id: s.id,
      nome: s.nome,
      categoria: s.categoria,
      valorMensal: s.valorMensal.toNumber(),
      diaVencimento: s.diaVencimento,
      status: s.status,
      diasParaRenovar: diffDays(getProximaRenovacao(s.diaVencimento)),
    }))
    .filter((s) => s.diasParaRenovar >= 0 && s.diasParaRenovar <= 7)
    .sort((a, b) => a.diasParaRenovar - b.diasParaRenovar)
    .slice(0, 5);

  const totalMensalServicos = servicosRows.reduce(
    (sum: number, s) => sum + s.valorMensal.toNumber(),
    0
  );

  const totalContasMes = Number(contasPagasMes._sum.valor ?? 0);

  const metasComProgresso: MetaSummary[] = metasRows.map((m) => {
    const total = m.marcos.length;
    const concluidos = m.marcos.filter((mc) => mc.concluido).length;
    return {
      id: m.id,
      titulo: m.titulo,
      categoria: m.categoria,
      prazo: m.prazo ? m.prazo.toISOString() : null,
      status: m.status,
      progresso: total > 0 ? Math.round((concluidos / total) * 100) : 0,
      totalMarcos: total,
      marcosConcluidos: concluidos,
    };
  });

  return {
    compromissos: {
      hoje: compromissosHojeRows.map((c) => ({
        id: c.id,
        titulo: c.titulo,
        dataInicio: c.dataInicio.toISOString(),
        tipo: c.tipo,
        local: c.local,
      })),
      amanha: compromissosAmanhaRows.map((c) => ({
        id: c.id,
        titulo: c.titulo,
        dataInicio: c.dataInicio.toISOString(),
        tipo: c.tipo,
        local: c.local,
      })),
      totalHoje: compromissosHojeRows.length,
      totalAmanha: compromissosAmanhaRows.length,
    },
    contas: {
      proximas7dias: contasProximasRows.map((c) => ({
        id: c.id,
        nome: c.nome,
        valor: c.valor.toNumber(),
        vencimento: c.vencimento.toISOString(),
        status: c.status,
      })),
      atrasadas: contasAtrasadasRows.map((c) => ({
        id: c.id,
        nome: c.nome,
        valor: c.valor.toNumber(),
        vencimento: c.vencimento.toISOString(),
        status: c.status,
      })),
      totalAtrasadas: totalContasAtrasadas,
      totalProximas: contasProximasRows.length,
    },
    servicos: {
      renovacaoProxima: servicosComRenovacao,
      totalAtivos: servicosRows.length,
      totalMensalAtivos: totalMensalServicos,
    },
    metas: {
      ativas: metasComProgresso,
      totalAtivas: metasRows.length,
    },
    compras: {
      urgentes: comprasRows.map((c) => ({
        id: c.id,
        nome: c.nome,
        urgencia: c.urgencia,
        categoria: c.categoria,
        quantidade: c.quantidade ? c.quantidade.toNumber() : null,
        unidade: c.unidade,
      })),
      totalUrgentes: totalComprasUrgentes,
      totalPendentes: totalComprasPendentes,
    },
    gastos: {
      totalContasMes,
      totalServicosMes: totalMensalServicos,
      totalMensal: totalContasMes + totalMensalServicos,
    },
  };
}
