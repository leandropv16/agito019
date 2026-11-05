<#
.SYNOPSIS
  Script de deploy automatizado sem git para VPS da aplicacao AGITO019.
.DESCRIPTION
  Empacota o projeto local ignorando pastas compiladas e arquivos sensiveis,
  transfere o arquivo para a VPS via SCP, extrai sem sobrescrever o .env de
  producao, instala dependencias, roda migrations, compila o projeto e reinicia
  os servicos no systemd.
#>

[CmdletBinding()]
param(
  [string]$Server = "root@72.60.48.244",
  [string]$RemoteDir = "/srv/apps/agito019",
  [switch]$SkipBuild,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   AGITO019: Deploy Automatizado na VPS   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Servidor: $Server"
Write-Host "Pasta de destino: $RemoteDir"
Write-Host ""

# 1. Testar conexao SSH
Write-Host "[1/6] Testando conexao SSH com $Server..." -ForegroundColor Yellow
try {
  $testSsh = ssh -o BatchMode=yes -o ConnectTimeout=10 $Server "echo SSH_OK"
  if ($testSsh -notmatch "SSH_OK") {
    throw "Falha ao autenticar via SSH."
  }
  Write-Host "  -> Conexao SSH confirmada com sucesso." -ForegroundColor Green
} catch {
  Write-Error "Nao foi possivel conectar ao servidor $Server via SSH. Verifique sua chave e rede."
  exit 1
}

# 2. Definir arquivo temporario
$tempTar = Join-Path $env:TEMP ("agito019-deploy-" + [System.Guid]::NewGuid().ToString("N") + ".tar.gz")
$remoteTar = "/tmp/agito019-deploy.tar.gz"

# 3. Empacotar arquivos do projeto local
Write-Host "[2/6] Empacotando arquivos do projeto local..." -ForegroundColor Yellow
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $projectRoot

try {
  $excludes = @(
    "--exclude=node_modules",
    "--exclude=.next",
    "--exclude=dist",
    "--exclude=.git",
    "--exclude=.turbo",
    "--exclude=.cache",
    "--exclude=.env",
    "--exclude=.env.*",
    "--exclude=.vscode",
    "--exclude=.cursor",
    "--exclude=*.log",
    "--exclude=*.tar.gz",
    "--exclude=*.tsbuildinfo"
  )

  $itemsToInclude = @(
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    "docker-compose.yml",
    ".env.example",
    ".gitignore",
    ".prettierrc",
    ".prettierignore",
    "README.md",
    "prisma.config.ts",
    "tsconfig.json",
    ".npmrc",
    "apps",
    "packages",
    "prisma",
    "storage",
    "docs",
    "scripts"
  )

  $tarArgs = $excludes + @("-czf", $tempTar) + $itemsToInclude

  & tar.exe $tarArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Falha ao criar o arquivo compactado com tar."
  }

  $tarSizeMb = [math]::Round(((Get-Item $tempTar).Length / 1MB), 2)
  Write-Host "  -> Pacote criado: $tempTar ($tarSizeMb MB)" -ForegroundColor Green
} finally {
  Pop-Location
}

# 4. Enviar arquivo para a VPS
Write-Host "[3/6] Enviando pacote para ${Server}:${remoteTar}..." -ForegroundColor Yellow
try {
  & scp.exe $tempTar "${Server}:${remoteTar}"
  if ($LASTEXITCODE -ne 0) {
    throw "Falha na transferencia via scp."
  }
  Write-Host "  -> Arquivo transferido com sucesso." -ForegroundColor Green
} finally {
  if (Test-Path $tempTar) {
    Remove-Item -Path $tempTar -Force -ErrorAction SilentlyContinue
  }
}

# 5. Executar deploy na VPS
Write-Host "[4/6] Extraindo e configurando na VPS..." -ForegroundColor Yellow

$remoteCommands = @(
  "set -e",
  "echo '-> Extraindo arquivos em $RemoteDir...'",
  "tar -xzf $remoteTar -C $RemoteDir",
  "rm -f $remoteTar",
  "cd $RemoteDir",
  "if [ ! -f .env ]; then echo 'ALERTA: Arquivo .env nao encontrado em $RemoteDir!'; exit 1; fi",
  "set -a",
  ". ./.env",
  "set +a"
)

if (-not $SkipInstall) {
  $remoteCommands += @(
    "echo '-> Instalando dependencias (pnpm install)...'",
    "pnpm install",
    "echo '-> Gerando Prisma Client e executando migrations...'",
    "pnpm db:generate",
    "pnpm db:migrate"
  )
}

if (-not $SkipBuild) {
  $remoteCommands += @(
    "echo '-> Compilando shared e api...'",
    "rm -f apps/api/tsconfig.tsbuildinfo",
    "rm -rf apps/api/dist",
    "pnpm --filter @agito019/shared build",
    "pnpm --filter @agito019/api build",
    "test -f apps/api/dist/main.js",
    "echo '-> Reiniciando agito019-api para disponibilizar endpoints no build do web...'",
    "systemctl restart agito019-api",
    "echo '-> Compilando web (Next.js)...'",
    "pnpm --filter @agito019/web build"
  )
}

$remoteCommands += @(
  "echo '-> Reiniciando servicos agito019-api e agito019-web...'",
  "systemctl restart agito019-api agito019-web",
  "sleep 2",
  "echo '-> Verificando status dos servicos...'",
  "ok=0",
  "for i in 1 2 3 4 5 6 7 8 9 10; do api_state=`$(systemctl is-active agito019-api || true); web_state=`$(systemctl is-active agito019-web || true); echo `"tentativa `$i api=`$api_state web=`$web_state`"; if [ `"`$api_state`" = active ] && [ `"`$web_state`" = active ]; then ok=1; break; fi; sleep 2; done",
  "test `"`$ok`" = 1"
)

$bashScript = ($remoteCommands -join "`n") + "`n"
$encodedScript = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($bashScript))

ssh $Server "echo $encodedScript | base64 -d | bash"

if ($LASTEXITCODE -ne 0) {
  Write-Error "Ocorreu um erro durante a execucao na VPS."
  exit 1
}

# 6. Testes de integridade
Write-Host "[5/6] Testando saude da aplicacao..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

$checkCommands = @(
  "echo -n 'Web local (3010): ' && curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3010/ || true",
  "echo -n 'API local (3011): ' && curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3011/public/cities || true",
  "echo -n 'Nginx Web (80):   ' && curl -s -o /dev/null -w '%{http_code}\n' http://72.60.48.244/ || true",
  "echo -n 'Nginx API (80):   ' && curl -s -o /dev/null -w '%{http_code}\n' http://72.60.48.244/public/cities || true"
)
$checkScript = ($checkCommands -join "`n") + "`n"
$encodedCheck = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($checkScript))

ssh $Server "echo $encodedCheck | base64 -d | bash"

Write-Host ""
Write-Host "[6/6] Deploy finalizado com sucesso!" -ForegroundColor Green
Write-Host "URL da aplicacao: http://72.60.48.244/" -ForegroundColor Cyan
