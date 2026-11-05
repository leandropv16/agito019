export const USER_ROLES = ["ADMIN", "PARTNER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ESTABLISHMENT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type EstablishmentStatus = (typeof ESTABLISHMENT_STATUSES)[number];

export const ARTIST_TYPES = ["SOLO", "DUO", "BAND", "DJ", "OTHER"] as const;
export type ArtistType = (typeof ARTIST_TYPES)[number];

export const ARTIST_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type ArtistStatus = (typeof ARTIST_STATUSES)[number];

export const EVENT_TYPES = [
  "LIVE_MUSIC",
  "PARTY",
  "FESTIVAL",
  "CAR_MEET",
  "SPECIAL_EVENT",
  "OTHER",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_STATUSES = ["DRAFT", "PUBLISHED", "CANCELLED", "ARCHIVED"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const AGENDA_STATUSES = ["CONFIRMED", "PENDING", "OUTDATED"] as const;
export type AgendaStatus = (typeof AGENDA_STATUSES)[number];

export const ENTRY_PRICE_TYPES = ["FREE", "COUVERT", "TICKET", "UP_TO", "FROM"] as const;
export type EntryPriceType = (typeof ENTRY_PRICE_TYPES)[number];

export const REPORT_PROBLEM_TYPES = [
  "WRONG_TIME",
  "CANCELLED",
  "WRONG_VENUE",
  "WRONG_ARTIST",
  "OTHER",
] as const;
export type ReportProblemType = (typeof REPORT_PROBLEM_TYPES)[number];

export const CLICK_TARGETS = ["ROUTE", "WHATSAPP", "PHONE", "INSTAGRAM"] as const;
export type ClickTarget = (typeof CLICK_TARGETS)[number];

export const CLICK_ENTITY_TYPES = ["EVENT", "ESTABLISHMENT", "ARTIST"] as const;
export type ClickEntityType = (typeof CLICK_ENTITY_TYPES)[number];

export const PAYMENT_STATUSES = ["PENDING", "PAID", "CANCELLED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

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

export const ARTIST_TYPE_LABELS: Record<ArtistType, string> = {
  SOLO: "Solo",
  DUO: "Dupla",
  BAND: "Banda",
  DJ: "DJ",
  OTHER: "Outro",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  LIVE_MUSIC: "Música ao vivo",
  PARTY: "Festa",
  FESTIVAL: "Festival",
  CAR_MEET: "Encontro de carros",
  SPECIAL_EVENT: "Evento especial",
  OTHER: "Outros",
};

export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  SUNDAY: "Domingo",
  MONDAY: "Segunda",
  TUESDAY: "Terça",
  WEDNESDAY: "Quarta",
  THURSDAY: "Quinta",
  FRIDAY: "Sexta",
  SATURDAY: "Sábado",
};

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
