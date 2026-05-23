# Script de Deploy do MyFuckingLife para Vercel
# Execute este script na pasta raiz do projeto (C:/Users/Marco/projects/myfuckinglife)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY MyFuckingLife - Vercel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se esta na pasta correta
if (-not (Test-Path "./app")) {
    Write-Host "ERRO: Pasta 'app/' nao encontrada!" -ForegroundColor Red
    Write-Host "Execute este script na raiz do projeto (C:/Users/Marco/projects/myfuckinglife)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Pasta app/ encontrada" -ForegroundColor Green

# Verificar node_modules
if (-not (Test-Path "./node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Verificar se Vercel CLI esta instalado
$vercelPath = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelPath) {
    Write-Host "Instalando Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CONFIGURACAO DAS VARIAVEIS DE AMBIENTE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Antes de continuar, voce precisa configurar estas variaveis no Vercel Dashboard:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. DATABASE_URL          - URL do PostgreSQL (Neon/Railway)" -ForegroundColor White
Write-Host "2. NEXTAUTH_URL          - URL do deploy (ex: https://myfuckinglife.vercel.app)" -ForegroundColor White
Write-Host "3. NEXTAUTH_SECRET       - Segredo JWT (gerado com: openssl rand -base64 32)" -ForegroundColor White
Write-Host "4. ENCRYPTION_KEY        - Chave AES (gerado com: openssl rand -hex 32)" -ForegroundColor White
Write-Host "5. RESEND_API_KEY        - API key do Resend (para email de reset)" -ForegroundColor White
Write-Host ""
Write-Host "Instrucoes detalhadas em: DEPLOY.md" -ForegroundColor Cyan
Write-Host ""

# Perguntar se quer continuar
$continue = Read-Host "Deseja fazer o deploy agora? (s/n)"
if ($continue -ne "s") {
    Write-Host "Deploy cancelado." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Iniciando deploy..." -ForegroundColor Green
Write-Host ""

# Fazer o deploy
vercel --prod

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PROXIMOS PASSOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Acesse o Vercel Dashboard" -ForegroundColor White
Write-Host "2. Va em Settings > Environment Variables" -ForegroundColor White
Write-Host "3. Adicione todas as variaveis listadas acima" -ForegroundColor White
Write-Host "4. Va em Settings > General > Build Command" -ForegroundColor White
Write-Host "   Certifique-se de que eh: prisma generate && next build" -ForegroundColor White
Write-Host "5. Re-deploy (ou aguarde o proximo push)" -ForegroundColor White
Write-Host ""
Write-Host "Para rodar a migracao no banco:" -ForegroundColor Yellow
Write-Host "npx prisma db push" -ForegroundColor Cyan
Write-Host ""
