"use client";

import { format, isAfter, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Clock, Bell, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TIPO_COR,
  TIPO_COR_BG_SOFT,
  TIPO_COR_TEXT,
  TIPO_LABEL,
  RECORRENCIA_LABEL,
  isToday,
  type Compromisso,
} from "./agenda-types";

interface CalendarListViewProps {
  compromissos: Compromisso[];
  onCompromissoClick: (c: Compromisso) => void;
}

function groupByDate(compromissos: Compromisso[]) {
  const map = new Map<string, Compromisso[]>();
  for (const c of compromissos) {
    const key = c.dataInicio.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(c);
  }
  return map;
}

export function CalendarListView({
  compromissos,
  onCompromissoClick,
}: CalendarListViewProps) {
  const sorted = [...compromissos].sort(
    (a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime()
  );
  const grouped = groupByDate(sorted);
  const entries = Array.from(grouped.entries());

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Nenhum compromisso encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {entries.map(([dateKey, items]) => {
        const date = new Date(dateKey + "T12:00:00");
        const todayDate = isToday(new Date(dateKey + "T00:00:00").toISOString());
        const past = isAfter(startOfDay(new Date()), startOfDay(date)) && !todayDate;

        return (
          <div key={dateKey}>
            {/* Date header */}
            <div className="flex items-center gap-3 mb-2">
              <div
                className={cn(
                  "flex flex-col items-center justify-center h-11 w-11 rounded-lg border-2 shrink-0",
                  todayDate
                    ? "border-primary bg-primary text-primary-foreground"
                    : past
                      ? "border-muted-foreground/30 text-muted-foreground"
                      : "border-border"
                )}
              >
                <span className="text-xs font-bold leading-none">
                  {format(date, "dd")}
                </span>
                <span className="text-[10px] uppercase">
                  {format(date, "MMM", { locale: ptBR })}
                </span>
              </div>
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold capitalize",
                    past && "text-muted-foreground"
                  )}
                >
                  {todayDate ? "Hoje — " : ""}
                  {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {items.length} compromisso{items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Events */}
            <div className="ml-14 space-y-2">
              {items.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onCompromissoClick(c)}
                  className={cn(
                    "w-full text-left rounded-lg border p-3 transition-all hover:shadow-sm hover:opacity-90",
                    TIPO_COR_BG_SOFT[c.tipo]
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full shrink-0 mt-0.5",
                          TIPO_COR[c.tipo]
                        )}
                      />
                      <span className="font-medium text-sm truncate">
                        {c.titulo}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0",
                        TIPO_COR_TEXT[c.tipo],
                        TIPO_COR_BG_SOFT[c.tipo]
                      )}
                    >
                      {TIPO_LABEL[c.tipo]}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {c.diaInteiro
                        ? "Dia inteiro"
                        : `${format(new Date(c.dataInicio), "HH:mm")}${c.dataFim ? " – " + format(new Date(c.dataFim), "HH:mm") : ""}`}
                    </span>

                    {c.local && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {c.local}
                      </span>
                    )}

                    {c.alertaMinutos !== null && c.alertaMinutos !== undefined && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Bell className="h-3 w-3" />
                        {c.alertaMinutos === 0
                          ? "No início"
                          : `${c.alertaMinutos} min antes`}
                      </span>
                    )}

                    {c.recorrencia !== "NENHUMA" && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <RefreshCw className="h-3 w-3" />
                        {RECORRENCIA_LABEL[c.recorrencia]}
                      </span>
                    )}
                  </div>

                  {c.descricao && (
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                      {c.descricao}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
