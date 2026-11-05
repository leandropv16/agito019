# AGITO019: Guia de Deploy sem Git na VPS

Este documento descreve o fluxo oficial de atualizacao e deploy da aplicacao AGITO019 diretamente do ambiente de desenvolvimento local (Windows) para o servidor VPS de producao, sem utilizar repositorio Git.

---

## 1. Visao Geral da Arquitetura na VPS

A aplicacao esta hospedada no servidor IP `72.60.48.244` dentro do diretorio `/srv/apps/agito019`.

### Componentes e Portas

| Componente | Tipo / Gerenciador | Porta Local / Exposta | Descricao |
| --- | --- | --- | --- |
| **Nginx** | Servico nativo | `80` (HTTP publico) | Roteador e proxy reverso principal |
| **Web Frontend** | `systemd` (`agito019-web.service`) | `127.0.0.1:3010` | Next.js 15 compilado para producao |
| **API Backend** | `systemd` (`agito019-api.service`) | `127.0.0.1:3011` | NestJS 11 compilado para producao |
| **PostgreSQL** | Docker (`agito019-postgres`) | `127.0.0.1:55432` | Banco relacional oficial da aplicacao |

### Regras de Roteamento no Nginx

O arquivo de configuracao em `/etc/nginx/sites-enabled/agito019` gerencia as rotas:
- `/public/*`, `/auth/*`, `/admin/*`, `/uploads/*`, `/docs*`: Encaminhados para a API na porta `3011`.
- `/*` (todas as demais rotas): Encaminhadas para o Frontend Web na porta `3010`.

---

## 2. Deploy Automatizado (Metodo Recomendado)

Criamos um script PowerShell pronto para uso que cuida de todo o processo com um unico comando: empacotamento, envio via SCP, extracao segura, instalacao de pacotes, migrations, compilacao e reinicio dos servicos.

### Como Executar

No terminal do Windows (PowerShell), na raiz do projeto:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-vps.ps1
```

### Parametros Opcionais do Script

- **Deploy rapido sem reinstalar dependencias** (quando nao houver mudancas no `package.json`):
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\deploy-vps.ps1 -SkipInstall
  ```

- **Deploy de configuracao sem recompilar** (apenas assets ou templates sem mudanca de codigo):
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\deploy-vps.ps1 -SkipBuild -SkipInstall
  ```

- **Servidor customizado**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\deploy-vps.ps1 -Server "root@72.60.48.244"
  ```

---

## 3. Passo a Passo Manual (Caso queira fazer etapa por etapa)

Se preferir realizar o deploy manualmente ou inspecionar cada fase, execute os comandos a seguir.

### Etapa 1: Empacotar os arquivos locais (Windows)

No PowerShell local, crie o arquivo comprimido excluindo dependencias e arquivos compilados:

```powershell
tar --exclude="node_modules" `
    --exclude=".next" `
    --exclude="dist" `
    --exclude=".git" `
    --exclude=".turbo" `
    --exclude=".cache" `
    --exclude=".env" `
    --exclude=".env.*" `
    --exclude=".vscode" `
    --exclude=".cursor" `
    --exclude="*.log" `
    --exclude="*.tar.gz" `
    -czf "$env:TEMP\agito019-deploy.tar.gz" `
    package.json pnpm-lock.yaml pnpm-workspace.yaml docker-compose.yml `
    prisma.config.ts tsconfig.json .npmrc .gitignore .prettierrc .prettierignore `
    README.md apps packages prisma storage docs scripts
```

> **IMPORTANTE**: O arquivo `.env` local NUNCA deve ser enviado para nao sobrescrever as senhas de banco e chaves de producao da VPS.

### Etapa 2: Transferir o arquivo para o servidor via SCP

```powershell
scp "$env:TEMP\agito019-deploy.tar.gz" root@72.60.48.244:/tmp/agito019-deploy.tar.gz
```

Apos a transferencia, pode excluir o arquivo temporario local:
```powershell
Remove-Item "$env:TEMP\agito019-deploy.tar.gz"
```

### Etapa 3: Conectar e extrair na VPS

Acesse a VPS via SSH:
```bash
ssh root@72.60.48.244
```

Extraia os arquivos no diretorio da aplicacao e remova o pacote temporario:
```bash
tar -xzf /tmp/agito019-deploy.tar.gz -C /srv/apps/agito019
rm -f /tmp/agito019-deploy.tar.gz
cd /srv/apps/agito019
```

### Etapa 4: Instalar dependencias e rodar migrations

```bash
cd /srv/apps/agito019
pnpm install
pnpm db:generate
pnpm db:migrate
```

### Etapa 5: Compilar a aplicacao

Carregue as variaveis do `.env` para que o Next.js utilize as URLs corretas de producao em vez do fallback local (porta 3001), compile o pacote compartilhado (`shared`) e a API primeiro, reinicie a API para servir os endpoints necessarios durante o prerender, e depois compile o Web:
```bash
cd /srv/apps/agito019

# 1. Carregar variaveis de producao na sessao
set -a
. ./.env
set +a

# 2. Compilar shared e api
pnpm --filter @agito019/shared build
pnpm --filter @agito019/api build

# 3. Reiniciar a API para disponibilizar rotas para o build do frontend
systemctl restart agito019-api

# 4. Compilar web (Next.js)
pnpm --filter @agito019/web build
```

### Etapa 6: Reiniciar e validar os servicos

```bash
systemctl restart agito019-api agito019-web
systemctl status agito019-api agito019-web --no-pager
```

Verifique se as rotas respondem HTTP 200:
```bash
curl -I http://127.0.0.1:3010/
curl -I http://127.0.0.1:3011/public/cities
curl -I http://72.60.48.244/
curl -I http://72.60.48.244/public/cities
```

---

## 4. Monitoramento e Diagnostico na VPS

Abaixo estao os comandos essenciais para acompanhar a execucao e saude dos servicos:

### Logs em tempo real dos servicos da aplicacao

- **Logs do Web Frontend (Next.js)**:
  ```bash
  journalctl -u agito019-web -f
  ```

- **Logs da API Backend (NestJS)**:
  ```bash
  journalctl -u agito019-api -f
  ```

- **Ultimas 100 linhas com carimbo de tempo**:
  ```bash
  journalctl -u agito019-api -n 100 --no-pager
  journalctl -u agito019-web -n 100 --no-pager
  ```

### Banco de dados PostgreSQL (Docker)

- **Verificar se o container esta em execucao**:
  ```bash
  docker ps | grep agito019-postgres
  ```

- **Logs do PostgreSQL**:
  ```bash
  docker logs --tail 50 agito019-postgres
  ```

- **Reiniciar o banco caso necessario**:
  ```bash
  docker restart agito019-postgres
  ```

### Nginx e Rede

- **Testar configuracao de sintaxe do Nginx**:
  ```bash
  nginx -t
  ```

- **Recarregar Nginx sem parar conexoes**:
  ```bash
  nginx -s reload
  ```

- **Logs de erro do Nginx**:
  ```bash
  tail -f /var/log/nginx/error.log
  ```

---

## 5. Como Atualizar Variaveis de Ambiente (.env) com Seguranca

O arquivo de configuracao real da producao fica localizado exclusivamente em `/srv/apps/agito019/.env` com permissoes restritas (`chmod 600`).

Quando novas variaveis forem adicionadas ao projeto:

1. Atualize o `.env.example` no ambiente local para manter o modelo registrado no codigo.
2. Acesse a VPS via SSH:
   ```bash
   ssh root@72.60.48.244
   ```
3. Edite o `.env` de producao diretamente:
   ```bash
   nano /srv/apps/agito019/.env
   ```
4. Apos salvar as alteracoes, reinicie os servicos para carregar as novas variaveis:
   ```bash
   systemctl restart agito019-api agito019-web
   ```
