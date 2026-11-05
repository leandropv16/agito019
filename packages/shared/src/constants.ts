export const APP_TIMEZONE = "America/Sao_Paulo";
export const APP_LOCALE = "pt-BR";

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

export const COOKIE_ACCESS = "access_token";
export const COOKIE_REFRESH = "refresh_token";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

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
