export const SEARCH_CITIES = [
  { slug: "campinas", name: "Campinas" },
  { slug: "valinhos", name: "Valinhos" },
  { slug: "vinhedo", name: "Vinhedo" },
  { slug: "louveira", name: "Louveira" },
  { slug: "jundiai", name: "Jundiaí" },
  { slug: "hortolandia", name: "Hortolândia" },
  { slug: "sumare", name: "Sumaré" },
  { slug: "indaiatuba", name: "Indaiatuba" },
  { slug: "paulinia", name: "Paulínia" },
  { slug: "cosmopolis", name: "Cosmópolis" },
] as const;

export const SEARCH_TIPOS = [
  { slug: "bares", label: "Bares", music: true },
  { slug: "restaurantes", label: "Restaurantes", music: true },
  { slug: "baladas", label: "Baladas", music: false },
  { slug: "eventos", label: "Eventos", music: false },
  { slug: "festival", label: "Festival", music: false },
  { slug: "shows", label: "Shows", music: false },
  { slug: "encontros", label: "Encontros", music: false },
] as const;

export type SearchTipo = (typeof SEARCH_TIPOS)[number]["slug"];
export type SearchMusic = "com-musica" | "sem-musica";
export type SearchQuando = "hoje" | "sabado";

export type SearchBranch = {
  slug: string;
  label: string;
  kind: "genre" | "category" | "artist";
};

export type SearchSelection = {
  city: string;
  tipo: SearchTipo;
  musica: SearchMusic | null;
  genero: string | null;
  clima: string | null;
  quando: SearchQuando | null;
};

const BAR_GENRES: SearchBranch[] = [
  { slug: "pop-rock-classicos-internacional", label: "Pop Rock Clássicos / Internacional", kind: "genre" },
  { slug: "rock", label: "Rock", kind: "genre" },
  { slug: "mpb", label: "MPB", kind: "genre" },
  { slug: "sertanejo", label: "Sertanejo", kind: "genre" },
  { slug: "pagode-samba", label: "Pagode/Samba", kind: "genre" },
];

const RESTAURANT_GENRES: SearchBranch[] = [
  { slug: "jazz", label: "Jazz", kind: "genre" },
  { slug: "bossa-nova", label: "Bossa nova", kind: "genre" },
  { slug: "classicas", label: "Clássicas", kind: "genre" },
  { slug: "lounge", label: "Lounge", kind: "genre" },
];

const CLIMATE_BY_GENRE: Record<string, { slug: string; label: string }> = {
  jazz: { slug: "elegante-sofisticado", label: "Elegante, Sofisticado" },
  "bossa-nova": { slug: "elegante-sofisticado", label: "Elegante, Sofisticado" },
  classicas: { slug: "casuais-e-familia", label: "Casuais e Família" },
  lounge: { slug: "casuais-e-familia", label: "Casuais e Família" },
};

export const MUSIC_OPTIONS = [
  { slug: "com-musica" as const, label: "Com Musica" },
  { slug: "sem-musica" as const, label: "Sem Musica" },
];

export const QUANDO_OPTIONS = [
  { slug: "hoje" as const, label: "Hoje" },
  { slug: "sabado" as const, label: "Sábado" },
  { slug: null, label: "Qualquer dia" },
];

export function searchTipo(slug: string) {
  return SEARCH_TIPOS.find((item) => item.slug === slug) ?? null;
}

export function branchOptions(tipo: SearchTipo): SearchBranch[] {
  switch (tipo) {
    case "bares":
      return BAR_GENRES;
    case "restaurantes":
      return RESTAURANT_GENRES;
    case "baladas":
      return [{ slug: "eletronicas", label: "Eletrônicas", kind: "genre" }];
    case "eventos":
      return [{ slug: "bandas-grupo", label: "Bandas/Grupo", kind: "genre" }];
    case "festival":
    case "shows":
      return [{ slug: "artista", label: "Artista", kind: "artist" }];
    case "encontros":
      return [
        { slug: "carros-antigos", label: "Carros antigos", kind: "category" },
        { slug: "rebaixados", label: "Rebaixados", kind: "category" },
        { slug: "som", label: "Som", kind: "category" },
        { slug: "motos", label: "Motos", kind: "category" },
      ];
    default:
      return [];
  }
}

export function climateFor(tipo: SearchTipo, genero: string | null) {
  if (tipo !== "restaurantes" || !genero) {
    return null;
  }
  return CLIMATE_BY_GENRE[genero] ?? null;
}

export function parseSearchRoute(
  city: string,
  tipo: string,
  resto: string[] = [],
  quandoRaw?: string,
): SearchSelection | null {
  if (!SEARCH_CITIES.some((item) => item.slug === city)) {
    return null;
  }
  const type = searchTipo(tipo);
  if (!type) {
    return null;
  }
  let quando: SearchQuando | null = null;
  if (quandoRaw) {
    if (quandoRaw !== "hoje" && quandoRaw !== "sabado") {
      return null;
    }
    quando = quandoRaw;
  }
  const segments = resto.filter(Boolean);
  if (type.music) {
    const musica = segments[0];
    if (musica !== "com-musica" && musica !== "sem-musica") {
      return null;
    }
    if (musica === "sem-musica") {
      if (segments.length !== 1) {
        return null;
      }
      return { city, tipo: type.slug, musica, genero: null, clima: null, quando };
    }
    const option = branchOptions(type.slug).find((item) => item.slug === segments[1]);
    if (!option) {
      return null;
    }
    const climate = climateFor(type.slug, option.slug);
    if (climate) {
      if (segments.length !== 3 || segments[2] !== climate.slug) {
        return null;
      }
      return { city, tipo: type.slug, musica, genero: option.slug, clima: climate.slug, quando };
    }
    if (segments.length !== 2) {
      return null;
    }
    return { city, tipo: type.slug, musica, genero: option.slug, clima: null, quando };
  }
  const option = branchOptions(type.slug).find((item) => item.slug === segments[0]);
  if (!option || segments.length !== 1) {
    return null;
  }
  return { city, tipo: type.slug, musica: null, genero: option.slug, clima: null, quando };
}

export function buildSearchPath(selection: SearchSelection) {
  const parts = ["", "procurar", selection.city, selection.tipo];
  if (selection.musica) {
    parts.push(selection.musica);
  }
  if (selection.genero) {
    parts.push(selection.genero);
  }
  if (selection.clima) {
    parts.push(selection.clima);
  }
  const path = parts.join("/");
  if (selection.quando) {
    return `${path}?quando=${selection.quando}`;
  }
  return path;
}

export function searchCopy(selection: SearchSelection) {
  const cityName = SEARCH_CITIES.find((item) => item.slug === selection.city)?.name ?? selection.city;
  const tipo = searchTipo(selection.tipo);
  const branch = selection.genero ? branchOptions(selection.tipo).find((item) => item.slug === selection.genero) : null;
  const climate = climateFor(selection.tipo, selection.genero);
  const tipoLabel = tipo?.label ?? "Programação";
  let h1 = `${tipoLabel} em ${cityName}`;

  if (selection.musica === "sem-musica") {
    h1 = `${tipoLabel} sem musica em ${cityName}`;
  } else if ((selection.tipo === "bares" || selection.tipo === "restaurantes") && branch) {
    const style = branch.label.toLocaleLowerCase("pt-BR");
    h1 =
      selection.tipo === "restaurantes" && climate && selection.clima
        ? `${tipoLabel} com ${style} e clima ${climate.label.toLocaleLowerCase("pt-BR")} em ${cityName}`
        : `${tipoLabel} com ${style} em ${cityName}`;
  } else if (selection.tipo === "baladas") {
    h1 = `Baladas eletrônicas em ${cityName}`;
  } else if (selection.tipo === "eventos") {
    h1 = `Eventos com bandas e grupo em ${cityName}`;
  } else if (selection.tipo === "festival") {
    h1 = `Festival com artista em ${cityName}`;
  } else if (selection.tipo === "shows") {
    h1 = `Shows com artista em ${cityName}`;
  } else if (selection.tipo === "encontros" && branch) {
    h1 = `Encontros de ${branch.label.toLocaleLowerCase("pt-BR")} em ${cityName}`;
  }

  if (selection.quando === "hoje") {
    h1 = `${h1} hoje`;
  }
  if (selection.quando === "sabado") {
    h1 = `${h1} no sábado`;
  }

  return {
    h1,
    title: h1,
    description: `Locais e eventos: ${h1}. Programação na região 019.`,
  };
}

export function searchApiQuery(selection: SearchSelection) {
  const parts = [`city=${encodeURIComponent(selection.city)}`, `tipo=${encodeURIComponent(selection.tipo)}`];
  if (selection.musica) {
    parts.push(`musica=${encodeURIComponent(selection.musica)}`);
  }
  if (selection.genero) {
    parts.push(`genero=${encodeURIComponent(selection.genero)}`);
  }
  if (selection.clima) {
    parts.push(`clima=${encodeURIComponent(selection.clima)}`);
  }
  if (selection.quando) {
    parts.push(`quando=${encodeURIComponent(selection.quando)}`);
  }
  return `/public/procurar?${parts.join("&")}`;
}

export const SEARCH_WEEKDAYS = [
  { slug: "quarta", label: "Quarta", weekday: "WEDNESDAY" },
  { slug: "quinta", label: "Quinta", weekday: "THURSDAY" },
  { slug: "sexta", label: "Sexta", weekday: "FRIDAY" },
  { slug: "sabado", label: "Sábado", weekday: "SATURDAY" },
  { slug: "domingo", label: "Domingo", weekday: "SUNDAY" },
  { slug: "feriados", label: "Feriados", weekday: null },
] as const;

export type SearchWeekday = (typeof SEARCH_WEEKDAYS)[number]["slug"];

export const HOME_FILTER_GROUP_IDS = [
  "semana",
  "cidade",
  "bares",
  "restaurantes",
  "baladas",
  "musicos",
  "eventos",
] as const;

export type HomeFilterGroupId = (typeof HOME_FILTER_GROUP_IDS)[number];

export type HomeFilterMatch = {
  combine?: "and" | "or";
  category?: string;
  hasMusic?: boolean;
  audiences?: string[];
  genres?: string[];
  categories?: string[];
  titles?: string[];
  modality?: string;
  eventTypes?: string[];
};

export type HomeFilterOption = {
  slug: string;
  label: string;
  weekday?: "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY" | null;
  match?: HomeFilterMatch;
};

export type HomeFilterSelection = Record<HomeFilterGroupId, string | null>;

function withGenre(slug: string, extra: string[] = []) {
  return [slug, ...extra];
}

const BAR_OPTIONS: HomeFilterOption[] = [
  { slug: "com-musica", label: "Com Musica", match: { category: "bares", hasMusic: true } },
  { slug: "sem-musica", label: "Sem Musica", match: { category: "bares", hasMusic: false } },
];

const RESTAURANT_OPTIONS: HomeFilterOption[] = [
  { slug: "elegante", label: "Elegante", match: { category: "restaurantes", audiences: ["elegante", "elegante-sofisticado"] } },
  { slug: "sofisticado", label: "Sofisticado", match: { category: "restaurantes", audiences: ["sofisticado", "elegante-sofisticado"] } },
  { slug: "casual", label: "Casual", match: { category: "restaurantes", audiences: ["casual", "casuais-e-familia"] } },
  { slug: "familiar", label: "Familiar", match: { category: "restaurantes", audiences: ["familiar", "familia", "casuais-e-familia"] } },
  { slug: "com-musica", label: "Com Musica", match: { category: "restaurantes", hasMusic: true } },
  { slug: "sem-musica", label: "Sem Musica", match: { category: "restaurantes", hasMusic: false } },
];

const CLUB_OPTIONS: HomeFilterOption[] = [
  { slug: "eletronica", label: "Eletrônica", match: { category: "baladas", genres: withGenre("eletronica", ["eletronicas"]) } },
  { slug: "rock", label: "Rock", match: { category: "baladas", genres: ["rock"] } },
  { slug: "pop-rock", label: "Pop Rock", match: { category: "baladas", genres: withGenre("pop-rock", ["pop-rock-classicos-internacional"]) } },
  { slug: "sertanejo", label: "Sertanejo", match: { category: "baladas", genres: ["sertanejo"] } },
  { slug: "samba", label: "Samba", match: { category: "baladas", genres: withGenre("samba", ["pagode-samba"]) } },
  { slug: "pagode", label: "Pagode", match: { category: "baladas", genres: withGenre("pagode", ["pagode-samba"]) } },
  { slug: "anos-80", label: "Anos 80", match: { category: "baladas", genres: ["anos-80"] } },
];

const ARTIST_OPTIONS: HomeFilterOption[] = [
  { slug: "pop-rock", label: "Pop Rock", match: { genres: withGenre("pop-rock", ["pop-rock-classicos-internacional"]) } },
  { slug: "rock", label: "Rock", match: { genres: ["rock"] } },
  { slug: "sertanejo", label: "Sertanejo", match: { genres: ["sertanejo"] } },
  { slug: "samba", label: "Samba", match: { genres: withGenre("samba", ["pagode-samba"]) } },
  { slug: "pagode", label: "Pagode", match: { genres: withGenre("pagode", ["pagode-samba"]) } },
  { slug: "acustico", label: "Acústico", match: { genres: ["acustico"] } },
  { slug: "mpb", label: "MPB", match: { genres: ["mpb"] } },
  { slug: "misto", label: "Misto", match: { genres: ["misto"] } },
  { slug: "jazz", label: "Jazz", match: { genres: ["jazz"] } },
  { slug: "bossa-nova", label: "Bossa Nova", match: { genres: ["bossa-nova"] } },
  { slug: "classicas", label: "Classicas", match: { genres: ["classicas"] } },
  { slug: "lounge", label: "Lounge", match: { genres: ["lounge"] } },
];

const EVENT_OPTIONS: HomeFilterOption[] = [
  { slug: "corridas", label: "Corridas", match: { combine: "or", titles: ["corrida", "corridas"], modality: "corridas" } },
  { slug: "carro-antigo", label: "Carro Antigo", match: { combine: "or", titles: ["carro antigo", "carros antigos"], categories: ["carros-antigos"], modality: "encontros-de-carros" } },
  { slug: "motorcycle", label: "MotorCycle", match: { combine: "or", titles: ["motorcycle", "motocycle", "moto"], categories: ["motos"], modality: "motos" } },
  { slug: "bikecycle", label: "BikeCycle", match: { combine: "or", titles: ["bikecycle", "pedal", "ciclismo"], modality: "ciclismo-pedal" } },
  { slug: "shows", label: "Shows", match: { combine: "or", titles: ["show"], categories: ["shows", "casa-de-shows"], modality: "apresentacoes-de-bandas", eventTypes: ["LIVE_MUSIC"] } },
  { slug: "gastronomia", label: "Gastronomia", match: { combine: "or", titles: ["gastronom"], modality: "feiras-gastronomicas" } },
  { slug: "teatro", label: "Teatro", match: { combine: "or", titles: ["teatro"], modality: "teatro" } },
  { slug: "aulas-livre", label: "Aulas Livre", match: { combine: "or", titles: ["aula livre", "aulas livre", "aula"] } },
];

export const HOME_FILTER_GROUPS: {
  id: HomeFilterGroupId;
  label: string;
  options: HomeFilterOption[];
}[] = [
  { id: "semana", label: "Semana", options: SEARCH_WEEKDAYS.map((item) => ({ slug: item.slug, label: item.label, weekday: item.weekday })) },
  { id: "cidade", label: "Cidade", options: SEARCH_CITIES.map((item) => ({ slug: item.slug, label: item.name })) },
  { id: "bares", label: "Bares", options: BAR_OPTIONS },
  { id: "restaurantes", label: "Restaurantes", options: RESTAURANT_OPTIONS },
  { id: "baladas", label: "Baladas", options: CLUB_OPTIONS },
  { id: "musicos", label: "Músicos, Bandas", options: ARTIST_OPTIONS },
  { id: "eventos", label: "Eventos, Encontros, Shows", options: EVENT_OPTIONS },
];

const VENUE_GROUPS = new Set<HomeFilterGroupId>(["bares", "restaurantes", "baladas", "eventos"]);

export function emptyHomeFilter(): HomeFilterSelection {
  return {
    semana: null,
    cidade: null,
    bares: null,
    restaurantes: null,
    baladas: null,
    musicos: null,
    eventos: null,
  };
}

export function hasHomeFilter(selection: HomeFilterSelection) {
  return HOME_FILTER_GROUP_IDS.some((id) => Boolean(selection[id]));
}

export function homeFilterGroup(id: HomeFilterGroupId) {
  return HOME_FILTER_GROUPS.find((group) => group.id === id) ?? null;
}

export function homeFilterOption(id: HomeFilterGroupId, slug: string | null) {
  if (!slug) {
    return null;
  }
  return homeFilterGroup(id)?.options.find((option) => option.slug === slug) ?? null;
}

export function searchWeekday(slug: string) {
  return SEARCH_WEEKDAYS.find((item) => item.slug === slug) ?? null;
}

export function sanitizeHomeFilterQuery(raw: Partial<Record<HomeFilterGroupId, string | undefined>>): HomeFilterSelection {
  const selection = emptyHomeFilter();
  for (const group of HOME_FILTER_GROUPS) {
    const value = raw[group.id]?.trim();
    if (!value) {
      continue;
    }
    if (group.options.some((option) => option.slug === value)) {
      selection[group.id] = value;
    }
  }
  return selection;
}

export function parseHomeFilterQuery(raw: Partial<Record<HomeFilterGroupId, string | undefined>>): HomeFilterSelection | null {
  for (const group of HOME_FILTER_GROUPS) {
    const value = raw[group.id]?.trim();
    if (!value) {
      continue;
    }
    if (!group.options.some((option) => option.slug === value)) {
      return null;
    }
  }
  const selection = sanitizeHomeFilterQuery(raw);
  return hasHomeFilter(selection) ? selection : null;
}

export function selectedHomeFilters(selection: HomeFilterSelection) {
  return HOME_FILTER_GROUPS.flatMap((group) => {
    const option = homeFilterOption(group.id, selection[group.id]);
    if (!option?.match) {
      return [];
    }
    return [{ group: group.id, slug: option.slug, match: option.match, venue: VENUE_GROUPS.has(group.id) }];
  });
}

export function homeFilterSearchParams(selection: HomeFilterSelection) {
  const parts: string[] = [];
  for (const id of HOME_FILTER_GROUP_IDS) {
    const value = selection[id];
    if (value) {
      parts.push(`${encodeURIComponent(id)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.join("&");
}

export function buildHomeFilterPath(selection: HomeFilterSelection, base = "/") {
  const query = homeFilterSearchParams(selection);
  return query ? `${base}?${query}` : base;
}

export function homeFilterApiQuery(selection: HomeFilterSelection) {
  const query = homeFilterSearchParams(selection);
  return query ? `/public/procurar?${query}` : "/public/procurar";
}

export function homeFilterChipLabel(id: HomeFilterGroupId, selection: HomeFilterSelection) {
  const group = homeFilterGroup(id);
  const option = homeFilterOption(id, selection[id]);
  if (option) {
    return option.label;
  }
  return group ? `${group.label}:` : "";
}

export function homeFilterResultLine(selection: HomeFilterSelection) {
  const parts: string[] = [];
  const semana = homeFilterOption("semana", selection.semana);
  if (semana) {
    parts.push(semana.label);
  }
  const cidade = homeFilterOption("cidade", selection.cidade);
  if (cidade) {
    parts.push(cidade.label);
  }
  for (const id of ["bares", "restaurantes", "baladas", "musicos", "eventos"] as const) {
    const option = homeFilterOption(id, selection[id]);
    const group = homeFilterGroup(id);
    if (!option || !group) {
      continue;
    }
    parts.push(group.label, option.label);
  }
  if (!parts.length) {
    return "";
  }
  return `Resultado da pesquisa: ${parts.join(" - ")} -`;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function ymd(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function shiftYmd(year: number, month: number, day: number, amount: number) {
  const utc = new Date(Date.UTC(year, month - 1, day + amount));
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

export function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { year, month, day };
}

export function brazilianHolidayYmds(year: number) {
  const easter = easterSunday(year);
  const carnivalMonday = shiftYmd(easter.year, easter.month, easter.day, -48);
  const carnivalTuesday = shiftYmd(easter.year, easter.month, easter.day, -47);
  const goodFriday = shiftYmd(easter.year, easter.month, easter.day, -2);
  const corpusChristi = shiftYmd(easter.year, easter.month, easter.day, 60);
  const dates = [
    { year, month: 1, day: 1 },
    carnivalMonday,
    carnivalTuesday,
    goodFriday,
    { year, month: 4, day: 21 },
    { year, month: 5, day: 1 },
    corpusChristi,
    { year, month: 9, day: 7 },
    { year, month: 10, day: 12 },
    { year, month: 11, day: 2 },
    { year, month: 11, day: 15 },
    { year, month: 11, day: 20 },
    { year, month: 12, day: 25 },
  ];
  return dates.map((item) => ymd(item.year, item.month, item.day)).sort();
}

export function upcomingHolidayYmds(todayYmd: string, horizonDays = 370) {
  const [year, month, day] = todayYmd.split("-").map(Number);
  if (!year || !month || !day) {
    return [];
  }
  const end = shiftYmd(year, month, day, horizonDays);
  const endYmd = ymd(end.year, end.month, end.day);
  const all = [...brazilianHolidayYmds(year), ...brazilianHolidayYmds(year + 1)];
  return all.filter((item) => item >= todayYmd && item <= endYmd);
}
