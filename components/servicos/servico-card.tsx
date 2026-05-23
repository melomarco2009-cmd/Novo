"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  Copy,
  Edit,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  CATEGORIA_LABEL,
  CATEGORIA_COR,
  STATUS_LABEL,
  STATUS_COR,
  daysUntilVencimento,
  formatCurrency,
  type Servico,
} from "./servico-types";
import { cn } from "@/lib/utils";

interface ServicoCardProps {
  servico: Servico;
  onEdit: (servico: Servico) => void;
}

export function ServicoCard({ servico, onEdit }: ServicoCardProps) {
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [copiedLogin, setCopiedLogin] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const days = daysUntilVencimento(servico.diaVencimento);
  const isRenewalAlert = days <= 7 && servico.status === "ATIVO";
  const isDue = days === 0;

  async function handleRevealPassword() {
    if (revealedPassword !== null) {
      setRevealedPassword(null);
      return;
    }
    setRevealing(true);
    try {
      const res = await fetch(`/api/servicos/${servico.id}/reveal-password`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erro ao revelar senha");
      const json = await res.json();
      setRevealedPassword(json.data.senha);
    } catch {
      toast.error("Não foi possível revelar a senha");
    } finally {
      setRevealing(false);
    }
  }

  async function copyToClipboard(text: string, type: "login" | "password") {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "login") {
        setCopiedLogin(true);
        setTimeout(() => setCopiedLogin(false), 2000);
      } else {
        setCopiedPassword(true);
        setTimeout(() => setCopiedPassword(false), 2000);
      }
      toast.success(type === "login" ? "Login copiado!" : "Senha copiada!");
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  const logoUrl = servico.logoUpload
    ? `/api/uploads/${servico.logoUpload.id}`
    : null;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-card transition-shadow hover:shadow-md",
        isRenewalAlert && "border-red-400 dark:border-red-600"
      )}
    >
      {/* Renewal alert banner */}
      {isRenewalAlert && (
        <div className="flex items-center gap-1.5 rounded-t-xl bg-red-50 dark:bg-red-950/40 px-3 py-1.5 border-b border-red-200 dark:border-red-800">
          <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0" />
          <span className="text-xs font-semibold text-red-700 dark:text-red-300">
            {isDue
              ? "Vence hoje!"
              : `Vence em ${days} dia${days !== 1 ? "s" : ""}!`}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="h-10 w-10 rounded-lg border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={servico.nome}
                width={40}
                height={40}
                className="object-contain p-0.5"
                unoptimized
              />
            ) : (
              <span className="text-sm font-bold text-muted-foreground uppercase">
                {servico.nome.slice(0, 2)}
              </span>
            )}
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <h3 className="font-semibold text-sm truncate">{servico.nome}</h3>
              <button
                onClick={() => onEdit(servico)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                title="Editar"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  CATEGORIA_COR[servico.categoria]
                )}
              >
                {CATEGORIA_LABEL[servico.categoria]}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  STATUS_COR[servico.status]
                )}
              >
                {STATUS_LABEL[servico.status]}
              </span>
            </div>
          </div>
        </div>

        {/* Valor + Vencimento */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-base">
            {formatCurrency(servico.valorMensal)}
            <span className="text-xs font-normal text-muted-foreground">/mês</span>
          </span>
          <span className="text-xs text-muted-foreground">
            Vence dia{" "}
            <span
              className={cn(
                "font-semibold",
                isRenewalAlert && "text-red-600 dark:text-red-400"
              )}
            >
              {servico.diaVencimento}
            </span>
          </span>
        </div>

        {/* URL */}
        {servico.url && (
          <a
            href={servico.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground truncate"
          >
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{servico.url}</span>
          </a>
        )}

        {/* Login */}
        <div className="rounded-lg bg-muted/50 border px-3 py-2 space-y-2">
          {/* Login row */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12 shrink-0">Login</span>
            <span className="text-xs font-mono flex-1 truncate">{servico.login}</span>
            <button
              onClick={() => copyToClipboard(servico.login, "login")}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              title="Copiar login"
            >
              {copiedLogin ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Password row */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12 shrink-0">Senha</span>
            <span className="text-xs font-mono flex-1 truncate">
              {revealedPassword !== null ? revealedPassword : "••••••••"}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {revealedPassword !== null && (
                <button
                  onClick={() => copyToClipboard(revealedPassword, "password")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Copiar senha"
                >
                  {copiedPassword ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
              <button
                onClick={handleRevealPassword}
                disabled={revealing}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={revealedPassword !== null ? "Ocultar senha" : "Revelar senha"}
              >
                {revealing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : revealedPassword !== null ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Observação */}
        {servico.observacao && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {servico.observacao}
          </p>
        )}
      </div>
    </div>
  );
}
