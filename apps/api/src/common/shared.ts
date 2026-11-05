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

export const APP_TIMEZONE = "America/Sao_Paulo";
export const COOKIE_ACCESS = "access_token";
export const COOKIE_REFRESH = "refresh_token";
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export type PaginatedMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  data: T[];
  meta: PaginatedMeta;
};

export type CommercialBadge = "DESTAQUE" | "PATROCINADO" | null;

export const EVENT_UNIVERSES = [
  "motores",
  "shows",
  "gastronomia",
  "esporte",
  "cultura",
] as const;

export type EventUniverseSlug = (typeof EVENT_UNIVERSES)[number];

export interface EventUniverseDef {
  slug: EventUniverseSlug;
  name: string;
  shortName: string;
  tagline: string;
  iconName: string;
  accentColor: string;
  gradient: string;
  borderHover: string;
}

export const EVENT_UNIVERSE_DEFS: Record<EventUniverseSlug, EventUniverseDef> = {
  motores: {
    slug: "motores",
    name: "Motores & Rodas",
    shortName: "Motores",
    tagline: "Encontros de carros, motos, som automotivo e velocidade",
    iconName: "Car",
    accentColor: "#ff4d1a",
    gradient: "from-orange-500/20 via-red-500/10 to-transparent",
    borderHover: "hover:border-orange-500/60",
  },
  shows: {
    slug: "shows",
    name: "Shows & Festivais",
    shortName: "Shows",
    tagline: "Apresentações ao vivo, palcos abertos e inaugurações",
    iconName: "Music",
    accentColor: "#a855f7",
    gradient: "from-purple-500/20 via-violet-500/10 to-transparent",
    borderHover: "hover:border-purple-500/60",
  },
  gastronomia: {
    slug: "gastronomia",
    name: "Feiras & Sabores",
    shortName: "Gastronomia",
    tagline: "Feiras gastronômicas, artesanato e festas de rua",
    iconName: "UtensilsCrossed",
    accentColor: "#f59e0b",
    gradient: "from-amber-500/20 via-yellow-500/10 to-transparent",
    borderHover: "hover:border-amber-500/60",
  },
  esporte: {
    slug: "esporte",
    name: "Esporte & Ao Ar Livre",
    shortName: "Esporte",
    tagline: "Corridas de rua, pedal, treinos funcionais e esportes",
    iconName: "Activity",
    accentColor: "#10b981",
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    borderHover: "hover:border-emerald-500/60",
  },
  cultura: {
    slug: "cultura",
    name: "Cultura, Família & Pets",
    shortName: "Cultura & Pets",
    tagline: "Teatro, eventos pet, feiras temáticas e sazonais",
    iconName: "Sparkles",
    accentColor: "#06b6d4",
    gradient: "from-cyan-500/20 via-sky-500/10 to-transparent",
    borderHover: "hover:border-cyan-500/60",
  },
};

export const EVENT_FORMAT_SLUGS = [
  "corridas",
  "encontros-de-carros",
  "encontro-de-som",
  "motos",
  "ciclismo-pedal",
  "automobilismo",
  "inauguracoes",
  "shows-em-pracas",
  "eventos-pet",
  "feiras-de-artesanato",
  "feiras-gastronomicas",
  "festas-de-rua",
  "eventos-esportivos",
  "teatro",
  "yoga-funcional",
  "apresentacoes-de-bandas",
  "eventos-tematicos",
  "festas-municipais",
] as const;

export type EventFormatSlug = (typeof EVENT_FORMAT_SLUGS)[number];

export interface EventFormatDef {
  slug: EventFormatSlug;
  name: string;
  shortName: string;
  universe: EventUniverseSlug;
  badgeTag: string;
  iconName: string;
  accentColor: string;
  badgeStyle: {
    bg: string;
    text: string;
    border: string;
  };
  defaultEventType: EventType;
  keywords: string[];
}

export const EVENT_FORMAT_DEFS: Record<EventFormatSlug, EventFormatDef> = {
  corridas: {
    slug: "corridas",
    name: "Corridas",
    shortName: "Corrida",
    universe: "esporte",
    badgeTag: "CORRIDA",
    iconName: "Timer",
    accentColor: "#10b981",
    badgeStyle: {
      bg: "bg-emerald-500/15",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
    },
    defaultEventType: "SPECIAL_EVENT",
    keywords: ["corrida", "corridas", "maratona", "trail", "5k", "10k", "21k", "caminhada", "running", "atletismo"],
  },
  "encontros-de-carros": {
    slug: "encontros-de-carros",
    name: "Encontros de Carros",
    shortName: "Carros",
    universe: "motores",
    badgeTag: "ENCONTRO DE CARROS",
    iconName: "Car",
    accentColor: "#ff4d1a",
    badgeStyle: {
      bg: "bg-orange-500/15",
      text: "text-orange-400",
      border: "border-orange-500/30",
    },
    defaultEventType: "CAR_MEET",
    keywords: ["encontro de carros", "carros antigos", "rebaixados", "opala", "fusca", "custom", "hot rod", "autos", "carros"],
  },
  "encontro-de-som": {
    slug: "encontro-de-som",
    name: "Encontro de Som",
    shortName: "Som Automotivo",
    universe: "motores",
    badgeTag: "SOM AUTOMOTIVO",
    iconName: "Volume2",
    accentColor: "#f59e0b",
    badgeStyle: {
      bg: "bg-amber-500/15",
      text: "text-amber-400",
      border: "border-amber-500/30",
    },
    defaultEventType: "CAR_MEET",
    keywords: ["encontro de som", "som automotivo", "paredao", "rachasom", "sound", "grave", "alto-falante"],
  },
  motos: {
    slug: "motos",
    name: "Motocycle (Motos)",
    shortName: "Motos",
    universe: "motores",
    badgeTag: "MOTOCYCLE",
    iconName: "Bike",
    accentColor: "#ef4444",
    badgeStyle: {
      bg: "bg-red-500/15",
      text: "text-red-400",
      border: "border-red-500/30",
    },
    defaultEventType: "CAR_MEET",
    keywords: ["moto", "motocycle", "motociclista", "motoclube", "harley", "duas rodas", "motociclismo", "mototurismo"],
  },
  "ciclismo-pedal": {
    slug: "ciclismo-pedal",
    name: "Bikecycle (Ciclismo / Pedal)",
    shortName: "Ciclismo & Pedal",
    universe: "motores",
    badgeTag: "BIKECYCLE",
    iconName: "Bike",
    accentColor: "#14b8a6",
    badgeStyle: {
      bg: "bg-teal-500/15",
      text: "text-teal-400",
      border: "border-teal-500/30",
    },
    defaultEventType: "SPECIAL_EVENT",
    keywords: ["bike", "bikecycle", "ciclismo", "pedal", "pedalada", "passeio ciclistico", "mountain bike", "mtb", "gravel"],
  },
  automobilismo: {
    slug: "automobilismo",
    name: "Automobilismo",
    shortName: "Automobilismo",
    universe: "motores",
    badgeTag: "AUTOMOBILISMO",
    iconName: "Gauge",
    accentColor: "#f43f5e",
    badgeStyle: {
      bg: "bg-rose-500/15",
      text: "text-rose-400",
      border: "border-rose-500/30",
    },
    defaultEventType: "SPECIAL_EVENT",
    keywords: ["automobilismo", "track day", "arrancada", "kart", "kartodromo", "drift", "velocidade", "autodromo", "corrida de carros"],
  },
  inauguracoes: {
    slug: "inauguracoes",
    name: "Inaugurações",
    shortName: "Inauguração",
    universe: "shows",
    badgeTag: "INAUGURAÇÃO",
    iconName: "Sparkles",
    accentColor: "#eab308",
    badgeStyle: {
      bg: "bg-yellow-500/15",
      text: "text-yellow-300",
      border: "border-yellow-500/30",
    },
    defaultEventType: "SPECIAL_EVENT",
    keywords: ["inauguracao", "inauguracoes", "abertura oficial", "grand opening", "estreia", "novo bar", "novo espaco", "lancamento"],
  },
  "shows-em-pracas": {
    slug: "shows-em-pracas",
    name: "Shows em praças",
    shortName: "Show na Praça",
    universe: "shows",
    badgeTag: "SHOW NA PRAÇA",
    iconName: "MapPin",
    accentColor: "#38bdf8",
    badgeStyle: {
      bg: "bg-sky-500/15",
      text: "text-sky-400",
      border: "border-sky-500/30",
    },
    defaultEventType: "LIVE_MUSIC",
    keywords: ["show na praca", "shows em pracas", "palco aberto", "praca", "coreto", "concerto aberto", "parque"],
  },
  "eventos-pet": {
    slug: "eventos-pet",
    name: "Eventos pet",
    shortName: "Eventos Pet",
    universe: "cultura",
    badgeTag: "EVENTO PET",
    iconName: "Dog",
    accentColor: "#34d399",
    badgeStyle: {
      bg: "bg-emerald-400/15",
      text: "text-emerald-300",
      border: "border-emerald-400/30",
    },
    defaultEventType: "SPECIAL_EVENT",
    keywords: ["pet", "eventos pet", "caominhada", "adocao", "cachorro", "gato", "pet friendly", "encontro pet", "animais"],
  },
  "feiras-de-artesanato": {
    slug: "feiras-de-artesanato",
    name: "Feiras de artesanato",
    shortName: "Artesanato",
    universe: "gastronomia",
    badgeTag: "FEIRA DE ARTESANATO",
    iconName: "Palette",
    accentColor: "#d946ef",
    badgeStyle: {
      bg: "bg-fuchsia-500/15",
      text: "text-fuchsia-400",
      border: "border-fuchsia-500/30",
    },
    defaultEventType: "FESTIVAL",
    keywords: ["artesanato", "feiras de artesanato", "feira criativa", "artesao", "feito a mao", "bazar", "artesanais"],
  },
  "feiras-gastronomicas": {
    slug: "feiras-gastronomicas",
    name: "Feiras gastronômicas",
    shortName: "Gastronomia",
    universe: "gastronomia",
    badgeTag: "FEIRA GASTRONÔMICA",
    iconName: "UtensilsCrossed",
    accentColor: "#ea580c",
    badgeStyle: {
      bg: "bg-orange-600/15",
      text: "text-orange-300",
      border: "border-orange-600/30",
    },
    defaultEventType: "FESTIVAL",
    keywords: ["gastronomica", "feiras gastronomicas", "food truck", "festival gastronomico", "cerveja artesanal", "sabores", "comida de rua", "gourmet", "bbq"],
  },
  "festas-de-rua": {
    slug: "festas-de-rua",
    name: "Festas de rua",
    shortName: "Festa de Rua",
    universe: "gastronomia",
    badgeTag: "FESTA DE RUA",
    iconName: "PartyPopper",
    accentColor: "#8b5cf6",
    badgeStyle: {
      bg: "bg-purple-500/15",
      text: "text-purple-400",
      border: "border-purple-500/30",
    },
    defaultEventType: "PARTY",
    keywords: ["festa de rua", "festas de rua", "quermesse", "bloco", "carnaval de rua", "rua de lazer", "festa popular"],
  },
  "eventos-esportivos": {
    slug: "eventos-esportivos",
    name: "Eventos esportivos",
    shortName: "Esportes",
    universe: "esporte",
    badgeTag: "EVENTO ESPORTIVO",
    iconName: "Trophy",
    accentColor: "#3b82f6",
    badgeStyle: {
      bg: "bg-blue-500/15",
      text: "text-blue-400",
      border: "border-blue-500/30",
    },
    defaultEventType: "SPECIAL_EVENT",
    keywords: ["esportivo", "eventos esportivos", "torneio", "campeonato", "futebol", "beach tennis", "futevolei", "volei", "basquete", "copa"],
  },
  teatro: {
    slug: "teatro",
    name: "Teatro",
    shortName: "Teatro",
    universe: "cultura",
    badgeTag: "TEATRO",
    iconName: "Drama",
    accentColor: "#6366f1",
    badgeStyle: {
      bg: "bg-indigo-500/15",
      text: "text-indigo-400",
      border: "border-indigo-500/30",
    },
    defaultEventType: "SPECIAL_EVENT",
    keywords: ["teatro", "stand-up", "comedia", "espetaculo", "peca", "dramaturgia", "artes cenicas"],
  },
  "yoga-funcional": {
    slug: "yoga-funcional",
    name: "Aulas de yoga/funcional ao ar livre",
    shortName: "Yoga & Funcional",
    universe: "esporte",
    badgeTag: "YOGA & FUNCIONAL",
    iconName: "HeartPulse",
    accentColor: "#06b6d4",
    badgeStyle: {
      bg: "bg-cyan-500/15",
      text: "text-cyan-400",
      border: "border-cyan-500/30",
    },
    defaultEventType: "SPECIAL_EVENT",
    keywords: ["yoga", "funcional", "aulas de yoga", "ar livre", "alongamento", "meditacao", "treino coletivo", "pilates", "bem-estar"],
  },
  "apresentacoes-de-bandas": {
    slug: "apresentacoes-de-bandas",
    name: "Apresentações de bandas",
    shortName: "Show ao Vivo",
    universe: "shows",
    badgeTag: "SHOW AO VIVO",
    iconName: "Music",
    accentColor: "#ff4d1a",
    badgeStyle: {
      bg: "bg-primary/20",
      text: "text-primary",
      border: "border-primary/40",
    },
    defaultEventType: "LIVE_MUSIC",
    keywords: ["banda", "apresentacoes de bandas", "show ao vivo", "musica ao vivo", "cover", "rock", "sertanejo", "pagode", "samba", "pop", "tributo", "acustico"],
  },
  "eventos-tematicos": {
    slug: "eventos-tematicos",
    name: "Eventos temáticos e sazonais",
    shortName: "Eventos Temáticos",
    universe: "cultura",
    badgeTag: "EVENTO TEMÁTICO",
    iconName: "CalendarDays",
    accentColor: "#f59e0b",
    badgeStyle: {
      bg: "bg-amber-400/15",
      text: "text-amber-300",
      border: "border-amber-400/30",
    },
    defaultEventType: "SPECIAL_EVENT",
    keywords: ["tematico", "eventos tematicos", "sazonal", "halloween", "festa junina", "arraial", "natal", "pascoa", "st patrick", "oktoberfest", "fantasia", "cosplay"],
  },
  "festas-municipais": {
    slug: "festas-municipais",
    name: "Festas e comemorações municipais",
    shortName: "Festas Municipais",
    universe: "gastronomia",
    badgeTag: "FESTA MUNICIPAL",
    iconName: "Landmark",
    accentColor: "#ca8a04",
    badgeStyle: {
      bg: "bg-yellow-600/15",
      text: "text-yellow-400",
      border: "border-yellow-600/30",
    },
    defaultEventType: "FESTIVAL",
    keywords: ["festas municipais", "comemoracoes municipais", "municipio", "aniversario da cidade", "civico", "feira municipal", "desfile", "rodeio", "festa do peao"],
  },
};

export const ALL_EVENT_FORMATS = EVENT_FORMAT_SLUGS.map((slug) => EVENT_FORMAT_DEFS[slug]);

export function getEventFormatBySlug(slug?: string | null): EventFormatDef | null {
  if (!slug) return null;
  return EVENT_FORMAT_DEFS[slug as EventFormatSlug] ?? null;
}

export function getFormatsByUniverse(universe: EventUniverseSlug): EventFormatDef[] {
  return ALL_EVENT_FORMATS.filter((item) => item.universe === universe);
}

const MODALITY_TAG_REGEX = /\[modalidade:([a-z0-9-]+)\]/i;

export function extractFormatFromDescription(description?: string | null): {
  formatSlug: EventFormatSlug | null;
  cleanDescription: string;
} {
  if (!description) {
    return { formatSlug: null, cleanDescription: "" };
  }
  const match = description.match(MODALITY_TAG_REGEX);
  if (match && match[1]) {
    const slug = match[1].toLowerCase();
    const cleanDescription = description.replace(MODALITY_TAG_REGEX, "").trim();
    if (slug in EVENT_FORMAT_DEFS) {
      return { formatSlug: slug as EventFormatSlug, cleanDescription };
    }
    return { formatSlug: null, cleanDescription };
  }
  return { formatSlug: null, cleanDescription: description };
}

export function injectFormatIntoDescription(description: string, formatSlug: EventFormatSlug): string {
  const { cleanDescription } = extractFormatFromDescription(description);
  const tag = `[modalidade:${formatSlug}]`;
  return cleanDescription ? `${cleanDescription}\n\n${tag}` : tag;
}

function normalizeSearchText(text?: string | null): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function resolveEventFormat(event?: {
  title?: string;
  description?: string | null;
  eventType?: string;
  format?: string | null;
} | null): EventFormatDef {
  if (!event) {
    return EVENT_FORMAT_DEFS["apresentacoes-de-bandas"];
  }

  if (event.format && event.format in EVENT_FORMAT_DEFS) {
    return EVENT_FORMAT_DEFS[event.format as EventFormatSlug];
  }

  const fromDesc = extractFormatFromDescription(event.description);
  if (fromDesc.formatSlug) {
    return EVENT_FORMAT_DEFS[fromDesc.formatSlug];
  }

  const combinedText = normalizeSearchText(`${event.title ?? ""} ${event.description ?? ""}`);
  for (const format of ALL_EVENT_FORMATS) {
    for (const keyword of format.keywords) {
      const normalizedKeyword = normalizeSearchText(keyword);
      if (combinedText.includes(normalizedKeyword)) {
        return format;
      }
    }
  }

  switch (event.eventType) {
    case "CAR_MEET":
      return EVENT_FORMAT_DEFS["encontros-de-carros"];
    case "FESTIVAL":
      return EVENT_FORMAT_DEFS["feiras-gastronomicas"];
    case "PARTY":
      return EVENT_FORMAT_DEFS["festas-de-rua"];
    case "SPECIAL_EVENT":
      return EVENT_FORMAT_DEFS["eventos-tematicos"];
    case "LIVE_MUSIC":
    case "OTHER":
    default:
      return EVENT_FORMAT_DEFS["apresentacoes-de-bandas"];
  }
}
