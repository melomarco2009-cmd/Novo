import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

interface SectionCardProps {
  title: string;
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function SectionCard({
  title,
  href,
  icon,
  children,
  isEmpty = false,
  emptyMessage = "Nenhum item encontrado.",
  className,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card flex flex-col",
        className
      )}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-primary opacity-80 [&>svg]:h-4 [&>svg]:w-4">
              {icon}
            </span>
          )}
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <Link
          href={href}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          Ver todos
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex-1 px-5 py-3">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <span className="text-3xl mb-2">&#10003;</span>
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-1">{children}</div>
        )}
      </div>
    </div>
  );
}
