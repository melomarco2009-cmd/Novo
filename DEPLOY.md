# Deploy — MyFuckingLife

Guia completo para colocar o projeto em produção na **Vercel** com banco **PostgreSQL na nuvem**.

---

## Índice

1. [Pré-requisitos](#1-pré-requisitos)
2. [Banco de dados na nuvem](#2-banco-de-dados-na-nuvem)
3. [Gerar segredos de produção](#3-gerar-segredos-de-produção)
4. [Configurar email (Resend)](#4-configurar-email-resend)
5. [Criar repositório no GitHub](#5-criar-repositório-no-github)
6. [Deploy na Vercel](#6-deploy-na-vercel)
7. [Rodar migrações no banco de produção](#7-rodar-migrações-no-banco-de-produção)
8. [Variáveis de ambiente — referência completa](#8-variáveis-de-ambiente--referência-completa)
9. [Troubleshooting](#9-troubleshooting)
10. [Limitações conhecidas](#10-limitações-conhecidas)

---

## 1. Pré-requisitos

| Ferramenta | Versão mínima | Verificar |
|---|---|---|
| Node.js | 20.x | `node -v` |
| npm | 10.x | `npm -v` |
| Vercel CLI (opcional) | latest | `vercel --version` |

**Contas necessárias** (todas têm plano gratuito):

- [Vercel](https://vercel.com) — hospedagem do app
- [Neon](https://neon.tech) **ou** [Railway](https://railway.app) — PostgreSQL
- [Resend](https://resend.com) — envio de email *(opcional, mas necessário para reset de senha)*

---

## 2. Banco de dados na nuvem

Escolha **uma** das opções abaixo.

### Opção A — Neon (recomendado para MVP gratuito)

1. Acesse [neon.tech](https://neon.tech) e crie uma conta
2. Clique em **New Project**
3. Escolha região mais próxima (ex: `us-east-1` ou `eu-central-1`)
4. Após criar, vá em **Connection Details**
5. Copie a **Connection string** no formato:
   ```
   postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
   ```
6. Guarde essa string como `DATABASE_URL`

### Opção B — Railway

1. Acesse [railway.app](https://railway.app) e crie uma conta
2. Clique em **New Project → Add a service → Database → PostgreSQL**
3. Após provisionar, clique no serviço PostgreSQL
4. Na aba **Variables**, copie `DATABASE_URL`
5. Adicione `?sslmode=require` ao final se não estiver presente

---

## 3. Gerar segredos de produção

Execute os comandos abaixo no terminal para gerar valores seguros:

```bash
# NEXTAUTH_SECRET (string base64 de 32 bytes)
openssl rand -base64 32

# ENCRYPTION_KEY (string hex de 32 bytes = 64 caracteres)
openssl rand -hex 32
```

> **Windows sem openssl:** use o PowerShell:
> ```powershell
> # NEXTAUTH_SECRET
> [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
>
> # ENCRYPTION_KEY
> -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
> ```

Guarde os valores gerados — você vai precisar deles na Vercel.

---

## 4. Configurar email (Resend)

1. Acesse [resend.com](https://resend.com) e crie uma conta gratuita
2. Vá em **API Keys → Create API Key**
3. Copie a chave (começa com `re_`)
4. Guarde como `RESEND_API_KEY`

> **Domínio personalizado:** o plano gratuito do Resend permite enviar apenas para o
> email da sua conta (teste). Para enviar para qualquer destinatário, adicione um
> domínio verificado em **Resend → Domains**.
>
> **Se não configurar Resend:** o app funciona normalmente, mas emails de reset de senha
> não são enviados em produção.

---

## 5. Criar repositório no GitHub

```bash
# Na raiz do projeto
git init
git add .
git commit -m "feat: initial commit"

# Crie um repositório no github.com e conecte:
git remote add origin https://github.com/SEU-USUARIO/myfuckinglife.git
git branch -M main
git push -u origin main
```

> Certifique-se de que `.env`, `.env.local` e `.env.production.local` estão no
> `.gitignore` (já estão por padrão). **Nunca comite valores reais de secrets.**

---

## 6. Deploy na Vercel

### Via Dashboard (recomendado)

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em **Import Git Repository** e selecione seu repositório
3. Na tela de configuração:
   - **Framework Preset**: Next.js (detectado automaticamente)
   - **Root Directory**: deixe em branco (raiz do projeto)
   - **Build Command**: `prisma generate && next build` *(já está no `vercel.json`)*
4. Clique em **Environment Variables** e adicione **todas** as variáveis listadas
   na seção [Variáveis de ambiente](#8-variáveis-de-ambiente--referência-completa)
5. Clique em **Deploy**

### Via Vercel CLI (alternativa)

```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## 7. Inicializar o banco de produção

O projeto ainda não tem arquivos de migration gerados. Use `db push` para criar
o schema diretamente no banco de produção (recomendado para o primeiro deploy).

### Opção A — `db push` direto (mais simples)

```powershell
# PowerShell — configure a DATABASE_URL de produção temporariamente
$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

# Sincroniza o schema Prisma com o banco (cria tabelas/índices)
npx prisma db push

# (Opcional) Popula com dados iniciais
npx prisma db seed
```

### Opção B — criar migration e commitar (recomendado para longo prazo)

```bash
# 1. Crie a migration localmente (banco local deve estar rodando)
npm run prisma:migrate   # cria pasta prisma/migrations/

# 2. Comite a pasta migrations
git add prisma/migrations
git commit -m "feat: add initial migration"
git push

# 3. Em produção, aplique a migration
$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
npx prisma migrate deploy
```

> **Recomendação:** use a Opção A para o primeiro deploy. Depois de estabilizar
> o schema em produção, adote a Opção B para ter histórico de alterações.

---

## 8. Variáveis de ambiente — referência completa

Configure todas no dashboard da Vercel em **Settings → Environment Variables**,
marcando o ambiente como **Production** (e opcionalmente Preview/Development).

| Variável | Obrigatória | Descrição | Como obter |
|---|---|---|---|
| `DATABASE_URL` | **Sim** | Connection string PostgreSQL | Neon ou Railway |
| `NEXTAUTH_URL` | **Sim** | URL pública do app (ex: `https://mfl.vercel.app`) | URL gerada pela Vercel |
| `NEXTAUTH_SECRET` | **Sim** | Secret do NextAuth (base64 32 bytes) | `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | **Sim** | Chave AES-256 para senhas (hex 64 chars) | `openssl rand -hex 32` |
| `UPLOAD_DIR` | Recomendado | Diretório de uploads temporários | `/tmp/uploads` |
| `MAX_UPLOAD_SIZE_MB` | Não | Tamanho máximo de upload em MB | `10` (padrão) |
| `RESEND_API_KEY` | Não* | API Key do Resend para emails | resend.com |
| `EMAIL_FROM` | Não | Endereço de remetente | `MyFuckingLife <no-reply@SEU-DOMINIO.com>` |

*Sem `RESEND_API_KEY`, o reset de senha não funciona em produção.

---

## 9. Troubleshooting

### Build falha com erro do Prisma

```
Error: @prisma/client did not initialize yet
```

**Causa:** `prisma generate` não rodou antes do build.

**Solução:** O `vercel.json` já configura `buildCommand: "prisma generate && next build"`.
Se o problema persistir, verifique se o `DATABASE_URL` está configurado na Vercel.

---

### Erro `argon2` em produção

```
Error: The module 'argon2' was not found
```

**Causa:** Módulo nativo não compilado para a plataforma Linux da Vercel.

**Solução:** O `next.config.js` já inclui `serverComponentsExternalPackages: ["argon2"]`.
Certifique-se de que a configuração está presente.

---

### `NEXTAUTH_URL` errado causando redirect loop

**Sintoma:** Login redireciona infinitamente.

**Solução:** Defina `NEXTAUTH_URL` com a URL exata do seu deploy, sem barra final.
Exemplo: `https://myfuckinglife.vercel.app`

---

### Erro de SSL no banco (`SSL connection required`)

**Solução:** Adicione `?sslmode=require` ao final da `DATABASE_URL`.

```
postgresql://USER:PASS@HOST/DB?sslmode=require
```

---

### Uploads retornam 404 em produção

**Causa esperada:** Comportamento normal em serverless. Veja a seção abaixo.

---

## 10. Limitações conhecidas

### Uploads de arquivos em ambiente serverless

A Vercel usa funções serverless (AWS Lambda). O sistema de arquivos local **não é
persistente** entre invocações. Isso significa:

- Uploads salvos em `/tmp/uploads` durante uma request **não estarão disponíveis**
  em requests subsequentes de outras instâncias
- O módulo de uploads **funciona perfeitamente em desenvolvimento local**

#### Opções para produção

| Opção | Custo | Complexidade | Recomendação |
|---|---|---|---|
| **Vercel Blob** | Gratuito até 500MB | Baixa | Melhor para MVP |
| **Cloudinary** | Gratuito até 25GB | Média | Bom para imagens |
| **AWS S3** | ~$0.023/GB | Alta | Para escala |

#### Como migrar para Vercel Blob (quando necessário)

1. Instale: `npm install @vercel/blob`
2. No dashboard Vercel, adicione o storage Blob ao projeto
3. Substitua a função `saveUpload` em `lib/uploads/index.ts` para usar
   `put()` do `@vercel/blob` ao invés de `writeFile`
4. Substitua a rota `app/api/uploads/[id]/route.ts` para redirecionar
   para a URL pública do Blob

**Para o MVP atual:** uploads funcionam em dev; em produção, a feature de upload
de documentos e logos ficará indisponível até a configuração de storage externo.
O restante do app (agenda, contas, metas, compras, prestadores, servicos) funciona
normalmente pois não depende de upload.

---

## Checklist final

- [ ] `DATABASE_URL` configurado e migrações rodadas
- [ ] `NEXTAUTH_URL` aponta para a URL real do deploy
- [ ] `NEXTAUTH_SECRET` gerado e configurado
- [ ] `ENCRYPTION_KEY` gerado e configurado (64 chars hex)
- [ ] `RESEND_API_KEY` configurado (opcional, para reset de senha)
- [ ] `UPLOAD_DIR=/tmp/uploads` configurado na Vercel
- [ ] Primeiro deploy bem-sucedido
- [ ] Login e cadastro funcionando
- [ ] Dashboard carregando corretamente
