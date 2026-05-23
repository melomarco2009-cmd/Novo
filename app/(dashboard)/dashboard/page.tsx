import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarDays,
  CreditCard,
  RefreshCw,
  Target,
  ShoppingCart,
  TrendingDown,
  MapPin,
  Clock,
  AlertCircle,
  Wallet,
} from "lucide-react";

import { getSession } from "@/lib/auth/session";
import { getDashboardSummary } from "@/lib/dashboard/get-summary";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { cn } from "@/lib/utils";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(iso: string) {
  return format(parseISO(iso), "dd/MM HH:mm", { locale: ptBR });
}

function formatDateShort(iso: string) {
  return format(parseISO(iso), "dd/MM", { locale: ptBR });
}

function formatDayMonth(iso: string) {
  return format(parseISO(iso), "d 'de' MMM", { locale: ptBR });
}

const tipoLabels: Record<string, string> = {
  REUNIAO: "Reunião",
  CONSULTA: "Consulta",
  ENTREGA: "Entrega",
  EVENTO: "Evento",
  PESSOAL: "Pessoal",
  PROFISSIONAL: "Profissional",
  OUTRO: "Outro",
};

const categoriaServicoLabels: Record<string, string> = {
  STREAMING: "Streaming",
  SOFTWARE: "Software",
  HOSPEDAGEM: "Hospedagem",
  DOMINIO: "Domínio",
  EDUCACAO: "Educação",
  BANCO: "Banco",
  REDES_SOCIAIS: "Redes Sociais",
  UTILITARIO: "Utilitário",
  OUTRO: "Outro",
};

const categoriaMetaLabels: Record<string, string> = {
  PESSOAL: "Pessoal",
  PROFISSIONAL: "Profissional",
  FINANCEIRA: "Financeira",
  SAUDE: "Saúde",
  ESTUDO: "Estudo",
  RELACIONAMENTO: "Relacionamento",
  OUTRO: "Outro",
};

const urgenciaLabels: Record<string, string> = {
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
};

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const summary = await getDashboardSummary(userId);

  const firstName = session.user.name?.split(" ")[0] ?? "Você";
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  const { compromissos, contas, servicos, metas, compras, gastos } = summary;

  return (
    <DashboardShell>
      {/* Header greeting */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Olá, {firstName}!
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{todayCapitalized}</p>
      </div>

      {/* Stats row */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Compromissos hoje"
          value={compromissos.totalHoje}
          description={
            compromissos.totalAmanha > 0
              ? `+${compromissos.totalAmanha} amanhã`
              : "Nenhum amanhã"
          }
          href="/agenda"
          status={compromissos.totalHoje > 0 ? "info" : "neutral"}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatCard
          title="Contas atrasadas"
          value={contas.totalAtrasadas}
          description={
            contas.totalProximas > 0
              ? `${contas.totalProximas} vencem em 7 dias`
              : "Nenhuma nos próximos 7 dias"
          }
          href="/contas"
          status={
            contas.totalAtrasadas > 0
              ? "danger"
              : contas.totalProximas > 0
              ? "warning"
              : "ok"
          }
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <StatCard
          title="Metas ativas"
          value={metas.totalAtivas}
          description="Em andamento ou não iniciadas"
          href="/metas"
          status={metas.totalAtivas > 0 ? "info" : "neutral"}
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          title="Compras urgentes"
          value={compras.totalUrgentes}
          description={
            compras.totalPendentes > 0
              ? `${compras.totalPendentes} itens pendentes no total`
              : "Lista em dia"
          }
          href="/compras"
          status={
            compras.totalUrgentes > 0
              ? "warning"
              : compras.totalPendentes > 0
              ? "neutral"
              : "ok"
          }
          icon={<ShoppingCart className="h-4 w-4" />}
        />
      </section>

      {/* Section cards grid */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Compromissos hoje e amanhã */}
        <SectionCard
          title="Agenda — hoje e amanhã"
          href="/agenda"
          icon={<CalendarDays />}
          isEmpty={
            compromissos.hoje.length === 0 && compromissos.amanha.length === 0
          }
          emptyMessage="Nenhum compromisso para hoje ou amanhã."
        >
          {compromissos.hoje.length > 0 && (
            <div className="mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Hoje
              </span>
              {compromissos.hoje.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-sm truncate">{c.titulo}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(c.dataInicio)}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {tipoLabels[c.tipo] ?? c.tipo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {compromissos.amanha.length > 0 && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Amanhã
              </span>
              {compromissos.amanha.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm truncate">{c.titulo}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {c.local && (
                      <span className="hidden sm:flex items-center gap-0.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {c.local}
                      </span>
                    )}
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {tipoLabels[c.tipo] ?? c.tipo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Contas */}
        <SectionCard
          title="Contas a pagar"
          href="/contas"
          icon={<CreditCard />}
          isEmpty={
            contas.atrasadas.length === 0 && contas.proximas7dias.length === 0
          }
          emptyMessage="Nenhuma conta atrasada ou vencendo em 7 dias."
        >
          {contas.atrasadas.length > 0 && (
            <div className="mb-2">
              <span className="text-xs font-medium text-destructive uppercase tracking-wider">
                Atrasadas
              </span>
              {contas.atrasadas.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm truncate mr-2">{c.nome}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {formatDateShort(c.vencimento)}
                    </span>
                    <span className="text-sm font-medium text-destructive">
                      {formatCurrency(c.valor)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {contas.proximas7dias.length > 0 && (
            <div>
              <span className="text-xs font-medium text-[hsl(var(--warning))] uppercase tracking-wider">
                Próximas 7 dias
              </span>
              {contas.proximas7dias.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm truncate mr-2">{c.nome}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {formatDateShort(c.vencimento)}
                    </span>
                    <span className="text-sm font-medium text-[hsl(var(--warning))]">
                      {formatCurrency(c.valor)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Serviços com renovação próxima */}
        <SectionCard
          title="Serviços — renovação próxima"
          href="/servicos"
          icon={<RefreshCw />}
          isEmpty={servicos.renovacaoProxima.length === 0}
          emptyMessage={
            servicos.totalAtivos > 0
              ? `${servicos.totalAtivos} serviço(s) ativo(s). Nenhum vence nos próximos 7 dias.`
              : "Nenhum serviço ativo cadastrado."
          }
        >
          {servicos.renovacaoProxima.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="min-w-0 mr-2">
                <span className="text-sm truncate block">{s.nome}</span>
                <span className="text-xs text-muted-foreground">
                  {categoriaServicoLabels[s.categoria] ?? s.categoria}
                </span>
              </div>
              <div className="flex flex-col items-end shrink-0 gap-0.5">
                <span
                  className={cn(
                    "text-xs font-medium px-1.5 py-0.5 rounded",
                    s.diasParaRenovar === 0
                      ? "bg-destructive/10 text-destructive"
                      : s.diasParaRenovar <= 3
                      ? "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {s.diasParaRenovar === 0
                    ? "hoje"
                    : `em ${s.diasParaRenovar}d`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(s.valorMensal)}/mês
                </span>
              </div>
            </div>
          ))}
        </SectionCard>

        {/* Metas com progresso */}
        <SectionCard
          title="Metas ativas"
          href="/metas"
          icon={<Target />}
          isEmpty={metas.ativas.length === 0}
          emptyMessage="Nenhuma meta ativa. Que tal criar uma?"
        >
          {metas.ativas.map((m) => (
            <div
              key={m.id}
              className="py-2 border-b border-border last:border-0 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm truncate mr-2">{m.titulo}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {m.prazo && (
                    <span className="text-xs text-muted-foreground">
                      {formatDayMonth(m.prazo)}
                    </span>
                  )}
                  <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {categoriaMetaLabels[m.categoria] ?? m.categoria}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ProgressBar
                  value={m.progresso}
                  showLabel={true}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {m.marcosConcluidos}/{m.totalMarcos} marcos
              </span>
            </div>
          ))}
        </SectionCard>

        {/* Compras urgentes */}
        <SectionCard
          title="Lista de compras — urgentes"
          href="/compras"
          icon={<ShoppingCart />}
          isEmpty={compras.urgentes.length === 0}
          emptyMessage={
            compras.totalPendentes > 0
              ? `${compras.totalPendentes} item(ns) pendente(s), nenhum urgente.`
              : "Lista de compras em dia!"
          }
        >
          {compras.urgentes.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="min-w-0 mr-2">
                <span className="text-sm truncate block">{c.nome}</span>
                {c.quantidade && (
                  <span className="text-xs text-muted-foreground">
                    {c.quantidade} {c.unidade ?? "un."}
                  </span>
                )}
              </div>
              <span className="text-xs px-1.5 py-0.5 rounded bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))] shrink-0">
                {urgenciaLabels[c.urgencia] ?? c.urgencia}
              </span>
            </div>
          ))}
        </SectionCard>

        {/* Resumo financeiro mensal */}
        <SectionCard
          title="Resumo financeiro — mês atual"
          href="/contas"
          icon={<Wallet />}
          isEmpty={gastos.totalMensal === 0}
          emptyMessage="Nenhum gasto registrado este mês."
        >
          <div className="py-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Contas pagas</span>
              </div>
              <span className="text-sm font-medium">
                {formatCurrency(gastos.totalContasMes)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Assinaturas ativas
                </span>
              </div>
              <span className="text-sm font-medium">
                {formatCurrency(gastos.totalServicosMes)}
              </span>
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-sm font-semibold">Total estimado</span>
              </div>
              <span className="text-base font-bold text-destructive">
                {formatCurrency(gastos.totalMensal)}
              </span>
            </div>
          </div>
        </SectionCard>
      </section>
    </DashboardShell>
  );
}
