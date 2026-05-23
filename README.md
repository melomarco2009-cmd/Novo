# MyFuckingLife

Base bootstrap do sistema de gestão de vida pessoal e profissional com:

- Next.js 14 App Router
- React + TypeScript
- TailwindCSS
- shadcn/ui
- Prisma ORM
- PostgreSQL
- NextAuth.js
- Zod
- Uploads locais

## Primeiros passos

1. Copie `.env.example` para `.env`
2. Suba o banco com `docker compose up -d`
3. Instale dependências
4. Rode `prisma generate`
5. Rode `prisma migrate dev`
6. Inicie o app com `npm run dev`

## Estrutura inicial

- `app/`: rotas App Router
- `components/`: componentes compartilhados
- `lib/`: utilitários, validações e infraestrutura
- `prisma/`: schema e seed
- `uploads/`: armazenamento local autenticado
- `docs/PLAN.md`: fonte de verdade da arquitetura
