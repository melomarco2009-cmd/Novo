"use client";

import { AlertCircle, CalendarDays, Pencil, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  STATUS_VINCULO_COR,
  STATUS_VINCULO_LABEL,
  TIPO_VINCULO_LABEL,
  formatCurrency,
  getPaymentAlert,
  type PrestadorListItem,
} from "./prestador-types";

interface PrestadorCardProps {
  prestador: PrestadorListItem;
  onEdit: (prestador: PrestadorListItem) => void;
}

export function PrestadorCard({ prestador, onEdit }: PrestadorCardProps) {
  const alert = getPaymentAlert(
    prestador.proximoPagamento,
    prestador.diaPagamento
  );

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{prestador.nome}</p>
              <p className="text-xs text-muted-foreground truncate">
                {prestador.cargo ?? "Sem cargo"} &middot;{" "}
                {TIPO_VINCULO_LABEL[prestador.tipoVinculo]}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => onEdit(prestador)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_VINCULO_COR[prestador.statusVinculo]}`}
          >
            {STATUS_VINCULO_LABEL[prestador.statusVinculo]}
          </span>

          {prestador.salario && (
            <span className="text-xs text-muted-foreground">
              {formatCurrency(prestador.salario)}
            </span>
          )}
        </div>

        {alert && (
          <div className="mt-2 flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                alert.isUrgent
                  ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {alert.isUrgent && (
                <AlertCircle className="h-3 w-3" />
              )}
              {alert.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
