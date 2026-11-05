export const DAYS_OF_WEEK = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const ARTIST_TYPE_LABELS = {
  SOLO: "Solo",
  DUO: "Dupla",
  BAND: "Banda",
  DJ: "DJ",
  OTHER: "Outro",
} as const;

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  SUNDAY: "Domingo",
  MONDAY: "Segunda",
  TUESDAY: "Terça",
  WEDNESDAY: "Quarta",
  THURSDAY: "Quinta",
  FRIDAY: "Sexta",
  SATURDAY: "Sábado",
};

export const RESERVED_CITY_SLUGS = [
  "explorar",
  "lugares",
  "musicos",
  "eventos",
  "entrar",
  "painel",
  "procurar",
  "hoje",
  "amanha",
  "api",
  "docs",
  "musica-ao-vivo",
  "show-ao-vivo",
  "barzinho-com-show",
  "boteco",
  "casa-noturna",
  "programacao",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo",
  "promocao",
  "promocoes",
  "sitemap",
  "robots",
  "privacidade",
  "termos",
] as const;

export const WHAT_OPTIONS = [
  { id: "live-music", label: "Música ao vivo", kind: "liveMusic" },
  { id: "bar", label: "Bar", kind: "category", slug: "bar" },
  { id: "boteco", label: "Boteco", kind: "category", slug: "boteco" },
  { id: "pub", label: "Pub", kind: "category", slug: "pub" },
  { id: "restaurante", label: "Restaurante", kind: "category", slug: "restaurante" },
  { id: "balada", label: "Balada", kind: "category", slug: "balada" },
  { id: "dj", label: "DJ", kind: "artistType" },
  { id: "casal", label: "Casal", kind: "audience", slug: "casal" },
  { id: "familia", label: "Família", kind: "audience", slug: "familia" },
  { id: "amigos", label: "Amigos", kind: "audience", slug: "amigos" },
] as const;

export const WHEN_PRESETS = [
  { id: "today", label: "Hoje" },
  { id: "friday", label: "Sexta" },
  { id: "saturday", label: "Sábado" },
  { id: "sunday", label: "Domingo" },
] as const;

export type ArtistType = "SOLO" | "DUO" | "BAND" | "DJ" | "OTHER";
export type EventType = "LIVE_MUSIC" | "PARTY" | "FESTIVAL" | "CAR_MEET" | "SPECIAL_EVENT" | "OTHER";
export type AgendaStatus = "CONFIRMED" | "PENDING" | "OUTDATED";
export type EntryPriceType = "FREE" | "COUVERT" | "TICKET" | "UP_TO" | "FROM";
export type ReportProblemType =
  | "WRONG_TIME"
  | "CANCELLED"
  | "WRONG_VENUE"
  | "WRONG_ARTIST"
  | "OTHER";
export type ClickTarget = "ROUTE" | "WHATSAPP" | "PHONE" | "INSTAGRAM";
export type ClickEntityType = "EVENT" | "ESTABLISHMENT" | "ARTIST";
export type CommercialBadge = "DESTAQUE" | "PATROCINADO" | null;
export type NamedSlug = { id: string; name: string; slug: string };
export type PaginatedMeta = { page: number; limit: number; total: number; totalPages: number };
export type Paginated<T> = { data: T[]; meta: PaginatedMeta };

export const AGENDA_STATUS_LABELS: Record<AgendaStatus, string> = {
  CONFIRMED: "Confirmado",
  PENDING: "Pendente",
  OUTDATED: "Desatualizado",
};

export const ENTRY_PRICE_LABELS: Record<EntryPriceType, string> = {
  FREE: "Grátis",
  COUVERT: "Couvert",
  TICKET: "Ingresso",
  UP_TO: "Até",
  FROM: "A partir de",
};

export const REPORT_PROBLEM_LABELS: Record<ReportProblemType, string> = {
  WRONG_TIME: "Horário errado",
  CANCELLED: "Evento cancelado",
  WRONG_VENUE: "Local errado",
  WRONG_ARTIST: "Artista errado",
  OTHER: "Outro problema",
};

export {
  EVENT_UNIVERSES,
  EVENT_UNIVERSE_DEFS,
  EVENT_FORMAT_SLUGS,
  EVENT_FORMAT_DEFS,
  ALL_EVENT_FORMATS,
  getEventFormatBySlug,
  getFormatsByUniverse,
  extractFormatFromDescription,
  injectFormatIntoDescription,
  resolveEventFormat,
  type EventUniverseSlug,
  type EventUniverseDef,
  type EventFormatSlug,
  type EventFormatDef,
} from "@agito019/shared";
