# Arquitetura: AGITO019

Monólito modular em monorepo. A aplicação roda localmente: PostgreSQL no Docker, Next.js e NestJS no host.

## Visão

O AGITO019 responde “O que tem para fazer hoje no 019?”. O frontend público consome a API REST. O painel em `/painel` gerencia o conteúdo que aparece no site.

```
Browser (Next.js)
    → NestJS REST (cookies HTTP-only)
        → PrismaService (Prisma Client 7 + adapter pg)
            → PostgreSQL 16

NestJS
    → LocalStorageService
        → storage/uploads

Frontend
    → OpenStreetMap (Leaflet)
```

## Monorepo

| Caminho | Responsabilidade |
| --- | --- |
| `apps/web` | Next.js App Router, site público e painel |
| `apps/api` | NestJS, REST, auth, uploads, Swagger |
| `packages/shared` | Enums, tipos públicos, constantes, schemas Zod de query |
| `packages/config` | ESLint, Prettier, TypeScript base |
| `prisma/` | `schema.prisma`, migrations, seed |
| `storage/uploads` | Arquivos físicos (gitignored) |
| `docs/` | Este arquivo e `DATABASE.md` |

Gerenciador: **pnpm workspaces**.

## Decisões

- **Prisma 7** com `@prisma/adapter-pg`. Um único `PrismaService` no NestJS.
- **Um arquivo** `prisma/schema.prisma` (sem pasta multi-schema).
- Evolução do banco só com **Prisma Migrate**. Não usar `db push` no fluxo normal.
- Catálogos (cidade, categoria, público, comodidade, gênero, plano) **não são apagados**: só `active` e ordenação.
- Soft delete em Establishment, Artist, Event, Promotion. APIs públicas filtram `deletedAt: null`.
- Campanha comercial: establishment **ou** artist (XOR no service).
- Dinheiro em **centavos** (`Int`). Coordenadas em `Decimal(10,7)`.
- Timezone de apresentação: `America/Sao_Paulo`. Locale: `pt-BR`.
- Conteúdo orgânico permanece nas listagens. Selos DESTAQUE/PATROCINADO só com campanha `PAID` vigente. Flags do plano valem para cards/home; a página do local mostra a ficha completa.
- PARTNER edita só vínculos em `UserEstablishment` / `UserArtist`. Pode criar eventos e promoções dos locais vinculados. Não cria estabelecimento, usuário, plano, campanha nem catálogo.

## Backend (NestJS)

Módulos por domínio em `apps/api/src`:

- `prisma`: PrismaModule / PrismaService
- `auth`: JWT access + refresh, cookies, guards
- `users`
- `cities`, `categories`, `audiences`, `amenities`
- `establishments`: create/update em `$transaction`
- `artists`, `genres`
- `events`, `promotions`
- `media`, `storage`: interface + `LocalStorageService`
- `commercial`: planos e campanhas
- `discovery`: `GET /public/*`
- `common`: paginação, slug, timezone, exception filter

Fluxo: **Controller → Service → PrismaService**. Queries complexas em `*.queries.ts`. Controllers nunca importam Prisma.

Rotas:

- Públicas: `/public/home`, `/public/establishments`, `/public/events`, `/public/artists`, `/public/promotions`, catálogos
- Auth: `POST /auth/login|refresh|logout`, `GET /auth/me`
- Admin: `/admin/*` (JwtAuthGuard + RolesGuard)
- Uploads estáticos: `/uploads/*`
- Swagger: `/docs`

Erro padronizado:

```json
{ "statusCode": 404, "code": "ESTABLISHMENT_NOT_FOUND", "message": "Estabelecimento não encontrado" }
```

Lista: `{ data, meta: { page, limit, total, totalPages } }`.

## Autenticação

- Access token curto e refresh token longo.
- Refresh persistido com **hash** em `AuthSession`.
- Cookies `access_token` e `refresh_token`, HTTP-only, `SameSite=Lax`.
- `COOKIE_SECURE=false` em desenvolvimento local.
- Senha com **argon2**. Sem localStorage para tokens.
- Rate limit no login.
- CORS: apenas `FRONTEND_URL`, com credentials. Nunca `origin: '*'`.

## Storage

Uploads passam só pelo backend. MIME validado de verdade (não pelo filename). Sharp gera WEBP + thumbnail. UUID no nome. `StorageService` permite trocar local por S3/R2 depois, sem mudar o domínio.

## Frontend (Next.js)

Server Components por padrão. Client Components: mapa, filtros, forms, menu.

Rotas públicas: `/`, `/explorar`, `/lugares/[slug]`, `/musicos/[slug]`, `/eventos/[slug]`, `/[citySlug]`, `/entrar`.

Painel: `/painel/*`.

Mapa: Leaflet + OSM via dynamic import (`ssr: false`) no componente `AgitoMap` apenas. Link “Abrir no Google Maps” é URL externa, sem API Google.

SEO: metadata dinâmica, `robots.ts`, `sitemap.ts`, Open Graph, JSON-LD `LocalBusiness` / `Event` quando couber.

## Ordenação comercial

1. Campanha `PAID` vigente com maior `priority`
2. Destaque
3. Data / relevância
4. Demais registros

## Fora deste MVP

App nativo, PWA, pagamentos online, reviews, IA, Redis, PostGIS, S3, geocoding pago, login social, recuperação de senha.
