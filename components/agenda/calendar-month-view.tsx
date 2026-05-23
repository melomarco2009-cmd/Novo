"use client";

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  TIPO_COR,
  TIPO_COR_BG_SOFT,
  TIPO_LABEL,
  isSameDay,
  isToday,
  type Compromisso,
} from "./agenda-types";

interface CalendarMonthViewProps {
  currentDate: Date;
  compromissos: Compromisso[];
  onDayClick: (date: Date) => void;
  onCompromissoClick: (c: Compromisso) => void;
}

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CalendarMonthView({
  currentDate,
  compromissos,
  onDayClick,
  onCompromissoClick,
}: CalendarMonthViewProps) {
  const firstDay = startOfMonth(currentDate);
  const lastDay = endOfMonth(currentDate);
  const gridStart = startOfWeek(firstDay, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(lastDay, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  function getCompromissosForDay(day: Date) {
    return compromissos.filter((c) => isSameDay(new Date(c.dataInicio), day));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b">
        {WEEK_DAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1 divide-x divide-y border-b">
        {days.map((day) => {
          const dayCompromissos = getCompromissosForDay(day);
          const todayDate = isToday(day.toISOString());
          const inMonth = isSameMonth(day, currentDate);
          const MAX_VISIBLE = 3;
          const overflow = dayCompromissos.length - MAX_VISIBLE;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] p-1 cursor-pointer transition-colors",
                inMonth ? "bg-background" : "bg-muted/30",
                "hover:bg-muted/50"
              )}
              onClick={() => onDayClick(day)}
            >
              <div className="flex justify-end mb-1">
                <span
                  className={cn(
                    "text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full",
                    todayDate &&
                      "bg-primary text-primary-foreground font-bold",
                    !inMonth && "text-muted-foreground/50",
                    !todayDate && inMonth && "text-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              <div className="space-y-0.5">
                {dayCompromissos.slice(0, MAX_VISIBLE).map((c) => (
                  <button
                    key={c.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCompromissoClick(c);
                    }}
                    className={cn(
                      "w-full text-left text-[10px] px-1 py-0.5 rounded truncate transition-opacity hover:opacity-80",
                      TIPO_COR_BG_SOFT[c.tipo],
                      "border-l-2",
                      `border-l-${c.tipo === "PESSOAL"
                        ? "blue"
                        : c.tipo === "PROFISSIONAL"
                          ? "purple"
                          : c.tipo === "CONSULTA"
                            ? "red"
                            : c.tipo === "REUNIAO"
                              ? "indigo"
                              : c.tipo === "ENTREGA"
                                ? "orange"
                                : c.tipo === "EVENTO"
                                  ? "green"
                                  : "gray"}-500`
                    )}
                    title={`${c.titulo} — ${TIPO_LABEL[c.tipo]}`}
                  >
                    <span
                      className={cn(
                        "inline-block h-1.5 w-1.5 rounded-full mr-1 shrink-0 align-middle",
                        TIPO_COR[c.tipo]
                      )}
                    />
                    {c.diaInteiro ? "" : format(new Date(c.dataInicio), "HH:mm") + " "}
                    {c.titulo}
                  </button>
                ))}

                {overflow > 0 && (
                  <span className="text-[10px] text-muted-foreground pl-1">
                    +{overflow} mais
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
