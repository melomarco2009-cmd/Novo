"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isSameDay } from "./agenda-types";

interface MiniCalendarProps {
  selected: Date;
  onSelect: (date: Date) => void;
}

export function MiniCalendar({ selected, onSelect }: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = useState(new Date(selected));
  const today = new Date();

  const firstDay = startOfMonth(viewMonth);
  const lastDay = endOfMonth(viewMonth);
  const gridStart = startOfWeek(firstDay, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(lastDay, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="w-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs font-semibold capitalize">
          {format(viewMonth, "MMMM yyyy", { locale: ptBR })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Week headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-medium text-muted-foreground py-0.5"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day) => {
          const isSelected = isSameDay(day, selected);
          const isTodayDate = isSameDay(day, today);
          const inMonth = isSameMonth(day, viewMonth);

          return (
            <button
              key={day.toISOString()}
              onClick={() => {
                onSelect(day);
                setViewMonth(day);
              }}
              className={cn(
                "h-6 w-full rounded text-[11px] transition-colors",
                inMonth ? "text-foreground" : "text-muted-foreground/40",
                isSelected &&
                  "bg-primary text-primary-foreground font-semibold",
                !isSelected && isTodayDate && "font-bold text-primary",
                !isSelected && "hover:bg-muted"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      {/* Jump to today */}
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 w-full h-6 text-[11px]"
        onClick={() => {
          onSelect(today);
          setViewMonth(today);
        }}
      >
        Hoje
      </Button>
    </div>
  );
}
