"use client";

import { useState, useCallback, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight, Bell } from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { MiniCalendar } from "@/components/agenda/mini-calendar";
import { AgendaFilters } from "@/components/agenda/agenda-filters";
import { CalendarMonthView } from "@/components/agenda/calendar-month-view";
import { CalendarWeekView } from "@/components/agenda/calendar-week-view";
import { CalendarListView } from "@/components/agenda/calendar-list-view";
import { CompromissoModal } from "@/components/agenda/compromisso-modal";

import {
  TIPO_COR,
  TIPO_LABEL,
  isToday,
  type Compromisso,
  type FiltroTipo,
} from "@/components/agenda/agenda-types";
import { cn } from "@/lib/utils";

type ViewMode = "mensal" | "semanal" | "lista";

export default function AgendaPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("mensal");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("TODOS");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompromisso, setEditingCompromisso] =
    useState<Compromisso | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | null>(null);

  // Compute fetch range based on view
  function getRange(): { from: string; to: string } {
    if (viewMode === "mensal") {
      return {
        from: startOfMonth(currentDate).toISOString(),
        to: endOfMonth(currentDate).toISOString(),
      };
    }
    if (viewMode === "semanal") {
      return {
        from: startOfWeek(currentDate, { weekStartsOn: 0 }).toISOString(),
        to: endOfWeek(currentDate, { weekStartsOn: 0 }).toISOString(),
      };
    }
    // Lista: 3 months around current
    return {
      from: subMonths(currentDate, 1).toISOString(),
      to: addMonths(currentDate, 2).toISOString(),
    };
  }

  const fetchCompromissos = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getRange();
      const params = new URLSearchParams({ from, to });
      if (filtroTipo !== "TODOS") params.set("tipo", filtroTipo);

      const res = await fetch(`/api/agenda?${params}`);
      if (!res.ok) throw new Error("Erro ao carregar");
      const json = await res.json();
      setCompromissos(json.data ?? []);
    } catch {
      setCompromissos([]);
    } finally {
      setLoading(false);
    }
  }, [viewMode, currentDate, filtroTipo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCompromissos();
  }, [fetchCompromissos]);

  // Today's alerts
  const todayCompromissos = compromissos.filter((c) =>
    isToday(c.dataInicio)
  );

  // Navigation
  function goNext() {
    if (viewMode === "mensal") setCurrentDate((d) => addMonths(d, 1));
    else if (viewMode === "semanal") setCurrentDate((d) => addWeeks(d, 1));
    else setCurrentDate((d) => addMonths(d, 1));
  }

  function goPrev() {
    if (viewMode === "mensal") setCurrentDate((d) => subMonths(d, 1));
    else if (viewMode === "semanal") setCurrentDate((d) => subWeeks(d, 1));
    else setCurrentDate((d) => subMonths(d, 1));
  }

  function getTitle() {
    if (viewMode === "mensal") {
      return format(currentDate, "MMMM yyyy", { locale: ptBR });
    }
    if (viewMode === "semanal") {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      if (start.getMonth() === end.getMonth()) {
        return format(start, "d") + " – " + format(end, "d") + " " + format(start, "MMMM yyyy", { locale: ptBR });
      }
      return (
        format(start, "d MMM", { locale: ptBR }) +
        " – " +
        format(end, "d MMM yyyy", { locale: ptBR })
      );
    }
    return format(currentDate, "MMMM yyyy", { locale: ptBR });
  }

  function openNew(date?: Date) {
    setEditingCompromisso(null);
    setDefaultDate(date ?? null);
    setModalOpen(true);
  }

  function openEdit(c: Compromisso) {
    setEditingCompromisso(c);
    setDefaultDate(null);
    setModalOpen(true);
  }

  return (
    <DashboardShell>
      <PageHeader title="Agenda" description="Gerencie seus compromissos.">
        <Button onClick={() => openNew()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Compromisso
        </Button>
      </PageHeader>

      {/* Today alerts banner */}
      {todayCompromissos.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3">
          <div className="flex items-start gap-2">
            <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
                {todayCompromissos.length} compromisso
                {todayCompromissos.length !== 1 ? "s" : ""} hoje
              </p>
              <div className="flex flex-wrap gap-1.5">
                {todayCompromissos.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openEdit(c)}
                    className={cn(
                      "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white dark:bg-amber-900/50 border border-amber-200 dark:border-amber-700 hover:shadow-sm transition-shadow"
                    )}
                  >
                    <span
                      className={cn("h-1.5 w-1.5 rounded-full", TIPO_COR[c.tipo])}
                    />
                    <span className="font-medium">{c.titulo}</span>
                    {!c.diaInteiro && (
                      <span className="text-muted-foreground">
                        {format(new Date(c.dataInicio), "HH:mm")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-4 w-56 shrink-0">
          <MiniCalendar
            selected={currentDate}
            onSelect={(date) => {
              setCurrentDate(date);
              if (viewMode === "lista") setViewMode("mensal");
            }}
          />
          <Separator />
          <AgendaFilters tipoAtivo={filtroTipo} onTipoChange={setFiltroTipo} />
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as ViewMode)}
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 gap-2">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={goPrev}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3"
                >
                  Hoje
                </Button>
                <Button variant="outline" size="icon" onClick={goNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="ml-2 text-sm font-semibold capitalize">
                  {getTitle()}
                </span>
              </div>

              <TabsList>
                <TabsTrigger value="mensal">Mensal</TabsTrigger>
                <TabsTrigger value="semanal">Semanal</TabsTrigger>
                <TabsTrigger value="lista">Lista</TabsTrigger>
              </TabsList>
            </div>

            {/* Mobile filters */}
            <div className="flex lg:hidden flex-wrap gap-1.5 mb-3">
              {(["TODOS", "PESSOAL", "PROFISSIONAL", "CONSULTA", "REUNIAO", "ENTREGA", "EVENTO", "OUTRO"] as FiltroTipo[]).map(
                (t) => (
                  <button
                    key={t}
                    onClick={() => setFiltroTipo(t)}
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full border transition-colors",
                      filtroTipo === t
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-muted-foreground/30 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {t === "TODOS" ? "Todos" : TIPO_LABEL[t as keyof typeof TIPO_LABEL]}
                  </button>
                )
              )}
            </div>

            {loading ? (
              <div className="space-y-2 mt-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <>
                <TabsContent value="mensal" className="mt-0">
                  <div className="border rounded-lg overflow-hidden">
                    <CalendarMonthView
                      currentDate={currentDate}
                      compromissos={compromissos}
                      onDayClick={(date) => openNew(date)}
                      onCompromissoClick={openEdit}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="semanal" className="mt-0">
                  <div className="border rounded-lg overflow-hidden">
                    <CalendarWeekView
                      currentDate={currentDate}
                      compromissos={compromissos}
                      onDayClick={(date) => openNew(date)}
                      onCompromissoClick={openEdit}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="lista" className="mt-0">
                  <CalendarListView
                    compromissos={compromissos}
                    onCompromissoClick={openEdit}
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>

      <CompromissoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        compromisso={editingCompromisso}
        defaultDate={defaultDate}
        onSuccess={fetchCompromissos}
      />
    </DashboardShell>
  );
}
