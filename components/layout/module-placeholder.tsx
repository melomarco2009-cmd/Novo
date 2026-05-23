type ModulePlaceholderProps = {
  title: string;
  description: string;
};

export function ModulePlaceholder({
  title,
  description
}: ModulePlaceholderProps) {
  return (
    <section className="rounded-3xl border border-border bg-card p-8 shadow-soft">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </section>
  );
}
