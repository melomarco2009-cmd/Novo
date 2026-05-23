import Link from "next/link";

type ModuleCardProps = {
  title: string;
  description: string;
  href: string;
};

export function ModuleCard({ title, description, href }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-border bg-card p-6 transition hover:border-primary hover:bg-accent"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
