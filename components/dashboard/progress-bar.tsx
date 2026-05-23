import { cn } from "@/lib/utils";

type ProgressVariant = "ok" | "warning" | "danger" | "neutral";

interface ProgressBarProps {
  value: number;
  variant?: ProgressVariant;
  showLabel?: boolean;
  className?: string;
}

const trackStyles: Record<ProgressVariant, string> = {
  ok: "bg-[hsl(var(--success)/0.2)]",
  warning: "bg-[hsl(var(--warning)/0.2)]",
  danger: "bg-destructive/20",
  neutral: "bg-muted",
};

const fillStyles: Record<ProgressVariant, string> = {
  ok: "bg-[hsl(var(--success))]",
  warning: "bg-[hsl(var(--warning))]",
  danger: "bg-destructive",
  neutral: "bg-muted-foreground",
};

function resolveVariant(value: number): ProgressVariant {
  if (value >= 75) return "ok";
  if (value >= 40) return "warning";
  if (value > 0) return "danger";
  return "neutral";
}

export function ProgressBar({
  value,
  variant,
  showLabel = true,
  className,
}: ProgressBarProps) {
  const v = variant ?? resolveVariant(value);
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn("flex-1 h-1.5 rounded-full overflow-hidden", trackStyles[v])}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-300", fillStyles[v])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
          {clamped}%
        </span>
      )}
    </div>
  );
}
