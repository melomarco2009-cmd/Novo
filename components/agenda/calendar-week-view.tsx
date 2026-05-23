"use client";

import { format, startOfWeek, addDays } from "date-fns";
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

interface CalendarWeekViewProps {
  currentDate: Date;
  compromissos: Compromisso[];
  onDayClick: (date: Date) => void;
  onCompromissoClick: (c: Compromisso) => void;
}

export function CalendarWeekView({
  currentDate,
  compromissos,
  onDayClick,
  onCompromissoClick,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function getCompromissosForDay(day: Date) {
    return compromissos.filter((c) => isSameDay(new Date(c.dataInicio), day));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {days.map((day) => {
          const todayDate = isToday(day.toISOString());
          return (
            <div
              key={day.toISOString()}
              className="py-3 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onDayClick(day)}
            >
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {format(day, "EEE", { locale: ptBR })}
              </div>
              <div
                className={cn(
                  "text-sm font-semibold h-8 w-8 mx-auto flex items-center justify-center rounded-full",
                  todayDate && "bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Events columns */}
      <div className="grid grid-cols-7 flex-1 divide-x overflow-auto">
        {days.map((day) => {
          const dayCompromissos = getCompromissosForDay(day);
          const todayDate = isToday(day.toISOString());

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "p-1.5 space-y-1 min-h-[300px] cursor-pointer",
                todayDate && "bg-primary/5"
              )}
              onClick={() => onDayClick(day)}
            >
              {dayCompromissos.length === 0 && (
                <span className="text-[11px] text-muted-foreground/50 block text-center mt-4">
                  —
                </span>
              )}
              {dayCompromissos.map((c) => (
                <button
                  key={c.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCompromissoClick(c);
                  }}
                  className={cn(
                    "w-full text-left rounded p-1.5 text-xs transition-opacity hover:opacity-80",
                    TIPO_COR_BG_SOFT[c.tipo],
                    "border-l-2",
                    c.tipo === "PESSOAL"
                      ? "border-l-blue-500"
                      : c.tipo === "PROFISSIONAL"
                        ? "border-l-purple-500"
                        : c.tipo === "CONSULTA"
                          ? "border-l-red-500"
                          : c.tipo === "REUNIAO"
                            ? "border-l-indigo-500"
                            : c.tipo === "ENTREGA"
                              ? "border-l-orange-500"
                              : c.tipo === "EVENTO"
                                ? "border-l-green-500"
                                : "border-l-gray-500"
                  )}
                  title={TIPO_LABEL[c.tipo]}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        TIPO_COR[c.tipo]
                      )}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {c.diaInteiro
                        ? "Dia inteiro"
                        : format(new Date(c.dataInicio), "HH:mm")}
                    </span>
                  </div>
                  <div className="font-medium truncate leading-tight">
                    {c.titulo}
                  </div>
                  {c.local && (
                    <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {c.local}
                    </div>
                  )}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
