# AGITO019

Plataforma regional para descobrir o que fazer no DDD 019: bares, música ao vivo, eventos, músicos e promoções.

Monorepo local: **Next.js** + **NestJS** + **Prisma** + **PostgreSQL**.

## Requisitos

- Node.js 20+
- pnpm 10+
- Docker (somente para o PostgreSQL)

## Instalação

```bash
pnpm install
cp .env.example .env
cp .env.example apps/web/.env.local
docker compose up -d
pnpm db:migrate:dev
pnpm db:seed
pnpm dev
```

A primeira migration pede um nome se a pasta ainda estiver vazia. Use `init` se o CLI perguntar.

## Endereços locais

| Serviço | URL |
| --- | --- |
PostgreSQL do projeto: `localhost:55432` (evita conflito com outro Postgres na 5432).

| Site | http://localhost:3000 |
| API | http://localhost:3001 |
| Swagger | http://localhost:3001/docs |
| Painel | http://localhost:3000/painel |
| Login | http://localhost:3000/entrar |

Admin do seed (`.env`):

- e-mail: `xena.w@example.org`
- senha: `Agito019!admin`

Parceiro de teste:

- e-mail: `carol.w@example.org`
- senha: `Agito019!partner`

## Scripts

```bash
pnpm dev              # web + api
pnpm dev:web
pnpm dev:api
pnpm db:migrate       # prisma migrate deploy
pnpm db:migrate:dev
pnpm db:migrate:reset
pnpm db:seed
pnpm db:studio
pnpm lint
pnpm typecheck
pnpm test
```

## Fluxo de desenvolvimento

1. PostgreSQL no Docker (`docker compose up -d`)
2. Migrations versionadas (`pnpm db:migrate:dev`). **Não** usar `prisma db push`
3. Seed idempotente (`pnpm db:seed`)
4. Next e Nest no host (`pnpm dev`)

## Estrutura

```
apps/web          frontend Next.js
apps/api          backend NestJS
packages/shared   enums, tipos, constantes
packages/config   eslint / tsconfig
prisma/           schema, migrations, seed
storage/uploads   imagens enviadas
docs/             arquitetura e banco
```

Documentação: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) e [docs/DATABASE.md](docs/DATABASE.md).
