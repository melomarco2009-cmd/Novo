import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, addDays, getDaysInMonth, setDate, addMonths } from "date-fns";

type NotificationInput = {
  userId: string;
  tipo: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  titulo: string;
  mensagem: string;
  link?: string;
  referenciaModulo?: string;
  referenciaId?: string;
};

function getProximaRenovacao(diaVencimento: number, now: Date): Date {
  const hoje = startOfDay(now);
  const diaHoje = hoje.getDate();
  const diasNoMes = getDaysInMonth(hoje);
  const diaReal = Math.min(diaVencimento, diasNoMes);

  if (diaReal >= diaHoje) {
    return setDate(hoje, diaReal);
  }
  const proximoMes = addMonths(hoje, 1);
  const diasNoProximo = getDaysInMonth(proximoMes);
  return setDate(proximoMes, Math.min(diaVencimento, diasNoProximo));
}

function diffDaysFrom(date: Date, now: Date): number {
  const hoje = startOfDay(now);
  const alvo = startOfDay(date);
  return Math.round((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function getProximoPagamento(diaPagamento: number, now: Date): Date {
  const hoje = startOfDay(now);
  const diaHoje = hoje.getDate();
  if (diaPagamento >= diaHoje) {
    return new Date(hoje.getFullYear(), hoje.getMonth(), diaPagamento);
  }
  return new Date(hoje.getFullYear(), hoje.getMonth() + 1, diaPagamento);
}

export async function checkNotifications(userId: string): Promise<void> {
  const now = new Date();
  const hoje = startOfDay(now);
  const todayEnd = endOfDay(now);
  const em3dias = addDays(hoje, 3);
  const em7dias = addDays(hoje, 7);

  // Get existing notifications created today to avoid duplicates
  const existingToday = await prisma.notification.findMany({
    where: {
      userId,
      createdAt: { gte: hoje, lte: todayEnd },
    },
    select: { referenciaId: true, referenciaModulo: true, tipo: true },
  });

  const existingSet = new Set(
    existingToday.map((n) => `${n.referenciaModulo}-${n.referenciaId}-${n.tipo}`)
  );

  const toCreate: NotificationInput[] = [];

  // 1. Compromissos do dia → INFO
  const compromissosHoje = await prisma.compromisso.findMany({
    where: { userId, dataInicio: { gte: hoje, lte: todayEnd } },
    select: { id: true, titulo: true },
  });

  for (const c of compromissosHoje) {
    const key = `AGENDA-${c.id}-INFO`;
    if (!existingSet.has(key)) {
      toCreate.push({
        userId,
        tipo: "INFO",
        titulo: "Compromisso hoje",
        mensagem: `Você tem "${c.titulo}" agendado para hoje.`,
        link: "/agenda",
        referenciaModulo: "AGENDA",
        referenciaId: c.id,
      });
    }
  }

  // 2. Contas vencendo em 7 dias → WARNING
  const contasProximas = await prisma.conta.findMany({
    where: {
      userId,
      status: "A_PAGAR",
      vencimento: { gte: hoje, lte: em7dias },
    },
    select: { id: true, nome: true, vencimento: true },
  });

  for (const c of contasProximas) {
    const key = `CONTA-${c.id}-WARNING`;
    if (!existingSet.has(key)) {
      const dias = diffDaysFrom(c.vencimento, now);
      toCreate.push({
        userId,
        tipo: "WARNING",
        titulo: "Conta vencendo em breve",
        mensagem:
          dias === 0
            ? `A conta "${c.nome}" vence hoje.`
            : `A conta "${c.nome}" vence em ${dias} dia(s).`,
        link: "/contas",
        referenciaModulo: "CONTA",
        referenciaId: c.id,
      });
    }
  }

  // 3. Contas atrasadas → ERROR
  const contasAtrasadas = await prisma.conta.findMany({
    where: {
      userId,
      OR: [
        { status: "ATRASADA" },
        { status: "A_PAGAR", vencimento: { lt: hoje } },
      ],
    },
    select: { id: true, nome: true },
  });

  for (const c of contasAtrasadas) {
    const key = `CONTA-${c.id}-ERROR`;
    if (!existingSet.has(key)) {
      toCreate.push({
        userId,
        tipo: "ERROR",
        titulo: "Conta atrasada",
        mensagem: `A conta "${c.nome}" está atrasada.`,
        link: "/contas",
        referenciaModulo: "CONTA",
        referenciaId: c.id,
      });
    }
  }

  // 4. Serviços com renovação em 7 dias → WARNING
  const servicosAtivos = await prisma.servico.findMany({
    where: { userId, status: "ATIVO" },
    select: { id: true, nome: true, diaVencimento: true },
  });

  for (const s of servicosAtivos) {
    const renovacao = getProximaRenovacao(s.diaVencimento, now);
    const dias = diffDaysFrom(renovacao, now);
    if (dias >= 0 && dias <= 7) {
      const key = `SERVICO-${s.id}-WARNING`;
      if (!existingSet.has(key)) {
        toCreate.push({
          userId,
          tipo: "WARNING",
          titulo: "Serviço renovando em breve",
          mensagem:
            dias === 0
              ? `O serviço "${s.nome}" renova hoje.`
              : `O serviço "${s.nome}" renova em ${dias} dia(s).`,
          link: "/servicos",
          referenciaModulo: "SERVICO",
          referenciaId: s.id,
        });
      }
    }
  }

  // 5. Prestadores com pagamento em 3 dias → WARNING
  const prestadores = await prisma.prestador.findMany({
    where: { userId, statusVinculo: "ATIVO", diaPagamento: { not: null } },
    select: { id: true, nome: true, diaPagamento: true },
  });

  for (const p of prestadores) {
    if (p.diaPagamento == null) continue;
    const pagamento = getProximoPagamento(p.diaPagamento, now);
    const dias = diffDaysFrom(pagamento, now);
    if (dias >= 0 && dias <= 3) {
      const key = `PRESTADOR-${p.id}-WARNING`;
      if (!existingSet.has(key)) {
        toCreate.push({
          userId,
          tipo: "WARNING",
          titulo: "Pagamento de prestador próximo",
          mensagem:
            dias === 0
              ? `Pagamento de "${p.nome}" é hoje.`
              : `Pagamento de "${p.nome}" em ${dias} dia(s).`,
          link: "/prestadores",
          referenciaModulo: "PRESTADOR",
          referenciaId: p.id,
        });
      }
    }
  }

  // 6. Compras urgentes não compradas → WARNING
  const comprasUrgentes = await prisma.itemCompra.findMany({
    where: { userId, comprado: false, urgencia: "ALTA" },
    select: { id: true, nome: true },
  });

  for (const c of comprasUrgentes) {
    const key = `COMPRA-${c.id}-WARNING`;
    if (!existingSet.has(key)) {
      toCreate.push({
        userId,
        tipo: "WARNING",
        titulo: "Compra urgente pendente",
        mensagem: `"${c.nome}" é urgente e ainda não foi comprado.`,
        link: "/compras",
        referenciaModulo: "COMPRA",
        referenciaId: c.id,
      });
    }
  }

  // 7. Metas com prazo em 7 dias e não concluídas → WARNING
  const metasProximas = await prisma.meta.findMany({
    where: {
      userId,
      status: { in: ["EM_ANDAMENTO", "NAO_INICIADA"] },
      prazo: { gte: hoje, lte: em7dias },
    },
    select: { id: true, titulo: true, prazo: true },
  });

  for (const m of metasProximas) {
    const key = `META-${m.id}-WARNING`;
    if (!existingSet.has(key)) {
      const dias = m.prazo ? diffDaysFrom(m.prazo, now) : 0;
      toCreate.push({
        userId,
        tipo: "WARNING",
        titulo: "Meta com prazo próximo",
        mensagem:
          dias === 0
            ? `A meta "${m.titulo}" tem prazo hoje.`
            : `A meta "${m.titulo}" tem prazo em ${dias} dia(s).`,
        link: "/metas",
        referenciaModulo: "META",
        referenciaId: m.id,
      });
    }
  }

  if (toCreate.length > 0) {
    await prisma.notification.createMany({ data: toCreate });
  }
}
