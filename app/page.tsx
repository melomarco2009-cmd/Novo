import Link from "next/link";

const modules = [
  { href: "/login", label: "Entrar" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agenda", label: "Agenda" },
  { href: "/servicos", label: "Acessos e Assinaturas" },
  { href: "/contas", label: "Contas a Pagar" },
  { href: "/prestadores", label: "Prestadores" },
  { href: "/compras", label: "Lista de Compras" },
  { href: "/metas", label: "Metas" }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-6 py-16">
        <div className="space-y-4">
          <span className="inline-flex rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted-foreground">
            Bootstrap inicial concluído
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            MyFuckingLife
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground sm:text-lg">
            Base arquitetural para um sistema completo de gestão pessoal e
            profissional com autenticação, módulos de produtividade, finanças,
            metas e uploads locais.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="rounded-2xl border border-border bg-card p-5 transition hover:border-primary hover:bg-accent"
            >
              <div className="text-sm text-muted-foreground">Módulo</div>
              <div className="mt-2 text-lg font-medium">{module.label}</div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
