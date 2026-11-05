# Banco de dados: AGITO019

PostgreSQL 16 local (Docker). ORM exclusivo: Prisma. Timezone de apresentação: `America/Sao_Paulo`.

## Princípios

- UUIDs nas entidades principais.
- `DateTime` com `@db.Timestamptz(3)` para instantes.
- Horário comercial com `@db.Time(0)`.
- Valores monetários em **centavos** (`Int`). Nunca `float`.
- Coordenadas: `Decimal(10,7)`.
- Slugs únicos em City, Establishment, Artist, Event, Category, Audience, Amenity, MusicGenre, CommercialPlan.
- Soft delete (`deletedAt`) em Establishment, Artist, Event, Promotion.
- Catálogos não são removidos no MVP: `active` + `sortOrder`.

## Enums

| Enum | Valores |
| --- | --- |
| `UserRole` | ADMIN, PARTNER |
| `EstablishmentStatus` | DRAFT, PUBLISHED, ARCHIVED |
| `ArtistType` | SOLO, DUO, BAND, DJ, OTHER |
| `ArtistStatus` | DRAFT, PUBLISHED, ARCHIVED |
| `EventType` | LIVE_MUSIC, PARTY, FESTIVAL, CAR_MEET, SPECIAL_EVENT, OTHER |
| `EventStatus` | DRAFT, PUBLISHED, CANCELLED, ARCHIVED |
| `PaymentStatus` | PENDING, PAID, CANCELLED |
| `DayOfWeek` | SUNDAY … SATURDAY |

Categoria, público, gênero musical e comodidade são **models distintos**. Não misturar.

## Models e responsabilidade

### Identidade

- **User**: operadores internos (ADMIN / PARTNER). Senha em `passwordHash` (argon2).
- **AuthSession**: refresh token com hash, expiração e `revokedAt`.
- **UserEstablishment** / **UserArtist**: vínculos N:N. Um parceiro pode gerir vários locais/artistas.

### Catálogo geográfico e de classificação

- **City**: Campinas e demais cidades do 019. `state` padrão `SP`.
- **Category**: Bar, Boteco, Pub, etc.
- **Audience**: Casal, Família, Amigos.
- **Amenity**: estacionamento, pet friendly, etc.
- **MusicGenre**: Sertanejo, Rock, etc.

### Conteúdo

- **Establishment**: único model de local (não há tables `bars` / `restaurants`).
- **EstablishmentCategory**, **EstablishmentAudience**, **EstablishmentAmenity**: N:N explícitos com unique composto.
- **BusinessHour**: um registro por dia da semana; `closed` quando não abre. `opensAt`/`closesAt` nulos se fechado.
- **Artist**: músico, banda, DJ. `cityId` opcional.
- **ArtistGenre**: N:N artista ↔ gênero.
- **Event**: programação ligada a um establishment.
- **EventArtist**: lineup (1..N) com `sortOrder`.
- **EventGenre**: gênero do evento, independente do artista.
- **Promotion**: oferta com janela `startsAt`/`endsAt` e flag `active`.

### Mídia

- **Media**: arquivo (path, MIME, dimensões, tamanho, alt). Sem polimorfismo no banco.
- **EstablishmentMedia**, **ArtistMedia**, **EventMedia**, **PromotionMedia**: vínculos com `isCover` e `sortOrder`.

### Comercial

- **CommercialPlan**: NORMAL BASIC / PLUS / DESTAQUE / PATROCINADO. Preço diário em centavos (nullable no patrocinado). Flags de exibição no card + `highlighted` + `priority`.
- **CommercialCampaign**: vigência, valores, `paymentStatus` manual. Deve ter `establishmentId` **ou** `artistId`, nunca os dois nem nenhum.

## Relacionamentos

```
City 1:N Establishment
City 1:N Artist (opcional, SetNull)
Establishment N:N Category | Audience | Amenity
Establishment 1:N BusinessHour | Event | Promotion | Media
Artist N:N MusicGenre
Event N:N Artist | MusicGenre
User N:N Establishment | Artist
CommercialPlan 1:N CommercialCampaign
CommercialCampaign 0..1 Establishment
CommercialCampaign 0..1 Artist
```

## Deletes

| Relação | onDelete | Motivo |
| --- | --- | --- |
| AuthSession → User | Cascade | sessão morre com o usuário |
| BusinessHour → Establishment | Cascade | filho de posse |
| Junctions do lado do dono (categorias do local, lineup do evento, mídia junction) | Cascade | limpa vínculo |
| Junctions do lado do catálogo | Restrict | não apagar Bar se ainda estiver em uso |
| Event / Promotion / Campaign → Establishment | Restrict | histórico; usa-se soft delete |
| Artist.cityId | SetNull | cidade some do artista, artista permanece |
| Media nas junctions | Restrict | arquivo só some pelo StorageService após desvincular |
| UserEstablishment → User | Cascade | vínculo some se o usuário some |
| UserEstablishment → Establishment | Restrict | não apagar local por causa do vínculo |

Consultas públicas: `deletedAt IS NULL` e status publicado (evento também aceita filtro explícito; cancelados não entram no discovery).

## Índices

Além dos uniques de slug:

- Establishment: `status`, `cityId`, `deletedAt`
- Event: `slug`, `status`, `startAt`, `establishmentId`, `eventType`, `deletedAt`
- Promotion: `establishmentId`, `startsAt`, `endsAt`, `active`, `deletedAt`
- CommercialCampaign: `startsAt`, `endsAt`, `paymentStatus`, `establishmentId`, `artistId`
- AuthSession: `userId`, `expiresAt`
- City: `active`

## Slug

Gerado no backend a partir do nome (`Boteco do Zé` → `boteco-do-ze`). Em conflito: `boteco-do-ze-2`, `boteco-do-ze-3`.

## Seed

Idempotente via `upsert` nos catálogos. Conteúdo fictício (Boteco 019, Estação Campinas, Sunset Pub, Arena 019) com eventos relativos à data do seed em `America/Sao_Paulo`. Admin criado por `SEED_ADMIN_*`. Um PARTNER de teste vinculado a um local.
