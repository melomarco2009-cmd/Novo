# Deploy Manual do MyFuckingLife - ZIP Upload

## Como fazer deploy sem Git

Como o Git nao esta instalado nesta maquina, voce pode fazer deploy via upload de ZIP na Vercel.

### Passo 1: Criar o ZIP

No PowerShell, execute:
```powershell
cd C:/Users/Marco/projects/myfuckinglife
Compress-Archive -Path . -DestinationPath ../myfuckinglife-deploy.zip -Force
```

Isso criara o arquivo `C:/Users/Marco/projects/myfuckinglife-deploy.zip`.

**IMPORTANTE:** O ZIP deve conter a pasta `app/` na raiz. Verifique antes de fazer upload.

### Passo 2: Upload na Vercel

1. Acesse https://vercel.com/new
2. Clique em "Import Git Repository" e depois em "Upload" (ou arraste o ZIP)
3. Selecione o arquivo `myfuckinglife-deploy.zip`
4. Configure:
   - Framework Preset: Next.js
   - Build Command: `prisma generate && next build`
   - Output Directory: (deixe em branco)

### Passo 3: Configurar Variaveis de Ambiente

No dashboard do projeto Vercel, va em Settings > Environment Variables e adicione:

| Nome | Valor | Como obter |
|---|---|---|
| DATABASE_URL | `postgresql://...` | Crie banco em neon.tech ou railway.app |
| NEXTAUTH_URL | `https://seu-projeto.vercel.app` | URL do deploy |
| NEXTAUTH_SECRET | `...` | `openssl rand -base64 32` |
| ENCRYPTION_KEY | `...` | `openssl rand -hex 32` |
| RESEND_API_KEY | `re_...` | Crie conta em resend.com |
| EMAIL_FROM | `MyFuckingLife <no-reply@seu-dominio.com>` | Seu email verificado no Resend |

### Passo 4: Re-deploy

Apos configurar as variaveis, faca um re-deploy:
- Vercel Dashboard > seu projeto > Deployments > Redeploy

### Passo 5: Migracao do Banco

No terminal local (com o banco ja criado):
```bash
npx prisma db push
```

Ou use o Prisma Studio para verificar:
```bash
npx prisma studio
```

### Troubleshooting

**Erro: "Couldn't find any pages or app directory"**
- Causa: O ZIP nao contem a pasta `app/` na raiz
- Solucao: Verifique o ZIP antes de fazer upload. A estrutura deve ser:
  ```
  myfuckinglife/
    app/
      (auth)/
      (dashboard)/
      api/
    components/
    lib/
    prisma/
    ...
  ```

**Erro: "prisma generate" falha**
- Causa: DATABASE_URL nao configurada
- Solucao: Configure a DATABASE_URL nas env vars e re-deploy

**Erro: "Module not found"**
- Causa: node_modules nao incluido no ZIP (correto, nao deve incluir)
- Solucao: A Vercel roda `npm install` automaticamente. Verifique se o `package.json` esta no ZIP.

### Limitacoes

- Uploads de arquivos funcionam em desenvolvimento
- Em producao (Vercel), uploads sao salvos em `/tmp` e podem ser perdidos entre deploys
- Para producao robusta, migre para Vercel Blob, Cloudinary ou AWS S3
