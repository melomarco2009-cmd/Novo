import Link from "next/link";
import { cn } from "@/lib/utils";

type StatusVariant = "ok" | "warning" | "danger" | "neutral" | "info";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  href?: string;
  status?: StatusVariant;
  icon?: React.ReactNode;
}

const statusStyles: Record<StatusVariant, string> = {
  ok: "text-[hsl(var(--success))]",
  warning: "text-[hsl(var(--warning))]",
  danger: "text-destructive",
  neutral: "text-muted-foreground",
  info: "text-primary",
};

const borderStyles: Record<StatusVariant, string> = {
  ok: "border-[hsl(var(--success)/0.3)]",
  warning: "border-[hsl(var(--warning)/0.3)]",
  danger: "border-destructive/30",
  neutral: "border-border",
  info: "border-primary/30",
};

export function StatCard({
  title,
  value,
  description,
  href,
  status = "neutral",
  icon,
}: StatCardProps) {
  const content = (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5 flex flex-col gap-2 transition-colors",
        borderStyles[status],
        href && "hover:bg-accent cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon && (
          <span className={cn("opacity-70", statusStyles[status])}>{icon}</span>
        )}
      </div>
      <span className={cn("text-3xl font-bold tracking-tight", statusStyles[status])}>
        {value}
      </span>
      {description && (
        <span className="text-xs text-muted-foreground">{description}</span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
