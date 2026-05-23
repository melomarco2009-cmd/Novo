"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TIPO_LABEL,
  TIPO_COR,
  type FiltroTipo,
  type TipoCompromisso,
} from "./agenda-types";

const TIPOS: TipoCompromisso[] = [
  "PESSOAL",
  "PROFISSIONAL",
  "CONSULTA",
  "REUNIAO",
  "ENTREGA",
  "EVENTO",
  "OUTRO",
];

interface AgendaFiltersProps {
  tipoAtivo: FiltroTipo;
  onTipoChange: (tipo: FiltroTipo) => void;
}

export function AgendaFilters({ tipoAtivo, onTipoChange }: AgendaFiltersProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Filtrar por tipo
      </p>

      <button
        onClick={() => onTipoChange("TODOS")}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left",
          tipoAtivo === "TODOS"
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-muted text-muted-foreground"
        )}
      >
        <span className="h-2 w-2 rounded-full bg-foreground/30 shrink-0" />
        Todos
      </button>

      {TIPOS.map((tipo) => (
        <button
          key={tipo}
          onClick={() => onTipoChange(tipo)}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left",
            tipoAtivo === tipo
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-muted text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full shrink-0",
              TIPO_COR[tipo]
            )}
          />
          {TIPO_LABEL[tipo]}
        </button>
      ))}
    </div>
  );
}
