import type { DayOfWeek } from "../common/shared";
import {
  addDaysYmd,
  dayBounds,
  formatYmd,
  nextWeekdayInclusive,
  parseDateInput,
  tomorrowYmd,
  weekdayFromDate,
  ymdOf,
} from "../common/timezone";

export const SEO_TOPIC_IDS = [
  "musica-ao-vivo",
  "barzinho-com-show",
  "boteco",
  "casa-noturna",
  "programacao",
] as const;
export type SeoTopicId = (typeof SEO_TOPIC_IDS)[number];

export const SEO_WHEN_IDS = [
  "hoje",
  "amanha",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo",
] as const;
export type SeoWhenId = (typeof SEO_WHEN_IDS)[number];

export const SEO_TOPIC_ALIASES: Record<string, SeoTopicId> = {
  "musica-ao-vivo": "musica-ao-vivo",
  "show-ao-vivo": "musica-ao-vivo",
  show: "musica-ao-vivo",
  shows: "musica-ao-vivo",
  "barzinho-com-show": "barzinho-com-show",
  barzinho: "barzinho-com-show",
  "bares-com-show": "barzinho-com-show",
  "bar-com-show": "barzinho-com-show",
  "barzinho-com-show-ao-vivo": "barzinho-com-show",
  boteco: "boteco",
  "casa-noturna": "casa-noturna",
  balada: "casa-noturna",
  "casa-de-shows": "casa-noturna",
  programacao: "programacao",
  agenda: "programacao",
};

export const SEO_WHEN_ALIASES: Record<string, SeoWhenId> = Object.fromEntries(
  SEO_WHEN_IDS.map((id) => [id, id]),
) as Record<string, SeoWhenId>;

export const SEO_WHEN_LABELS: Record<SeoWhenId, string> = {
  hoje: "hoje",
  amanha: "amanhã",
  segunda: "segunda",
  terca: "terça",
  quarta: "quarta",
  quinta: "quinta",
  sexta: "sexta",
  sabado: "sábado",
  domingo: "domingo",
};

export const SEO_WHEN_TO_DAY: Record<Exclude<SeoWhenId, "hoje" | "amanha">, DayOfWeek> = {
  domingo: "SUNDAY",
  segunda: "MONDAY",
  terca: "TUESDAY",
  quarta: "WEDNESDAY",
  quinta: "THURSDAY",
  sexta: "FRIDAY",
  sabado: "SATURDAY",
};

export const SEO_DAY_TO_WHEN: Record<DayOfWeek, Exclude<SeoWhenId, "hoje" | "amanha">> = {
  SUNDAY: "domingo",
  MONDAY: "segunda",
  TUESDAY: "terca",
  WEDNESDAY: "quarta",
  THURSDAY: "quinta",
  FRIDAY: "sexta",
  SATURDAY: "sabado",
};

export const BARZINHO_CATEGORIES = ["bar", "boteco", "pub"] as const;
export const NIGHT_CATEGORIES = ["balada", "casa-de-shows"] as const;
export const SEO_UPCOMING_DAYS = 14;

export type SeoTopicMeta = {
  id: SeoTopicId;
  label: string;
  liveMusic: boolean;
  venueOnly: boolean;
  categories: string[];
};

export const SEO_TOPIC_META: Record<SeoTopicId, SeoTopicMeta> = {
  "musica-ao-vivo": {
    id: "musica-ao-vivo",
    label: "Música ao vivo",
    liveMusic: true,
    venueOnly: false,
    categories: [],
  },
  "barzinho-com-show": {
    id: "barzinho-com-show",
    label: "Barzinho com show ao vivo",
    liveMusic: true,
    venueOnly: false,
    categories: [...BARZINHO_CATEGORIES],
  },
  boteco: {
    id: "boteco",
    label: "Boteco",
    liveMusic: false,
    venueOnly: true,
    categories: ["boteco"],
  },
  "casa-noturna": {
    id: "casa-noturna",
    label: "Casa noturna",
    liveMusic: false,
    venueOnly: true,
    categories: [...NIGHT_CATEGORIES],
  },
  programacao: {
    id: "programacao",
    label: "Programação",
    liveMusic: false,
    venueOnly: false,
    categories: [],
  },
};

export type ResolvedSeoQuery = {
  citySlug?: string;
  topic: SeoTopicId | null;
  when: SeoWhenId | null;
  requestedTopic?: string;
  requestedWhen?: string;
  isAlias: boolean;
};

export function resolveTopic(slug?: string | null): { id: SeoTopicId; requested: string; alias: boolean } | null {
  if (!slug) {
    return null;
  }
  const id = SEO_TOPIC_ALIASES[slug];
  if (!id) {
    return null;
  }
  return { id, requested: slug, alias: slug !== id };
}

export function resolveWhen(slug?: string | null): { id: SeoWhenId; requested: string; alias: boolean } | null {
  if (!slug) {
    return null;
  }
  const id = SEO_WHEN_ALIASES[slug];
  if (!id) {
    return null;
  }
  return { id, requested: slug, alias: slug !== id };
}

export function resolveSeoSlots(input: {
  city?: string;
  topic?: string;
  when?: string;
  slot?: string;
  slot2?: string;
}): ResolvedSeoQuery | null {
  let topicSlug = input.topic;
  let whenSlug = input.when;

  if (input.slot) {
    const slotWhen = resolveWhen(input.slot);
    const slotTopic = resolveTopic(input.slot);
    if (input.slot2) {
      if (!slotTopic || !resolveWhen(input.slot2)) {
        return null;
      }
      topicSlug = input.slot;
      whenSlug = input.slot2;
    } else if (slotWhen && !slotTopic) {
      whenSlug = input.slot;
    } else if (slotTopic) {
      topicSlug = input.slot;
    } else {
      return null;
    }
  }

  const topic = resolveTopic(topicSlug);
  const when = resolveWhen(whenSlug);
  if (topicSlug && !topic) {
    return null;
  }
  if (whenSlug && !when) {
    return null;
  }
  if (!input.city && !topic && !when) {
    return null;
  }

  return {
    citySlug: input.city || undefined,
    topic: topic?.id ?? null,
    when: when?.id ?? null,
    requestedTopic: topicSlug,
    requestedWhen: whenSlug,
    isAlias: Boolean(topic?.alias || when?.alias),
  };
}

export function buildSeoPath(input: { city?: string | null; topic?: SeoTopicId | null; when?: SeoWhenId | null }) {
  const parts: string[] = [];
  if (input.city) {
    parts.push(input.city);
  }
  if (input.topic) {
    parts.push(input.topic);
  }
  if (input.when) {
    parts.push(input.when);
  }
  if (!parts.length) {
    return "/";
  }
  return `/${parts.join("/")}`;
}

export function requestedSeoPath(input: {
  city?: string | null;
  topic?: string | null;
  when?: string | null;
}) {
  const parts: string[] = [];
  if (input.city) {
    parts.push(input.city);
  }
  if (input.topic) {
    parts.push(input.topic);
  }
  if (input.when) {
    parts.push(input.when);
  }
  if (!parts.length) {
    return "/";
  }
  return `/${parts.join("/")}`;
}

export type SeoDateRange = {
  start: Date;
  end: Date;
  ymd: string | null;
  when: SeoWhenId | null;
  label: string | null;
};

export function resolveSeoRange(when: SeoWhenId | null, from?: string): SeoDateRange {
  if (when === "hoje") {
    const bounds = dayBounds(from);
    return {
      start: bounds.start,
      end: bounds.end,
      ymd: formatYmd(bounds.year, bounds.month, bounds.day),
      when,
      label: SEO_WHEN_LABELS.hoje,
    };
  }
  if (when === "amanha") {
    const tomorrow = tomorrowYmd(from);
    const bounds = dayBounds(tomorrow.ymd);
    return {
      start: bounds.start,
      end: bounds.end,
      ymd: tomorrow.ymd,
      when,
      label: SEO_WHEN_LABELS.amanha,
    };
  }
  if (when) {
    const next = nextWeekdayInclusive(SEO_WHEN_TO_DAY[when], from);
    const bounds = dayBounds(next.ymd);
    return {
      start: bounds.start,
      end: bounds.end,
      ymd: next.ymd,
      when,
      label: SEO_WHEN_LABELS[when],
    };
  }
  const bounds = dayBounds(from);
  const endParts = addDaysYmd({ year: bounds.year, month: bounds.month, day: bounds.day }, SEO_UPCOMING_DAYS);
  const end = dayBounds(formatYmd(endParts.year, endParts.month, endParts.day)).start;
  return {
    start: bounds.start,
    end,
    ymd: null,
    when: null,
    label: null,
  };
}

export function whenSlugFromDate(date: Date) {
  return SEO_DAY_TO_WHEN[weekdayFromDate(ymdOf(date))];
}

export function isYmdToday(date: Date, from?: string) {
  const today = parseDateInput(from);
  return ymdOf(date) === formatYmd(today.year, today.month, today.day);
}

export function isYmdTomorrow(date: Date, from?: string) {
  return ymdOf(date) === tomorrowYmd(from).ymd;
}

export function intersects(left: string[], right: readonly string[]) {
  return left.some((item) => right.includes(item));
}

export function placePhrase(cityName?: string | null) {
  return cityName ? `em ${cityName}` : "no 019";
}

export function whenSuffix(when?: SeoWhenId | null) {
  if (!when) {
    return "";
  }
  return ` ${SEO_WHEN_LABELS[when]}`;
}

export function buildLandingCopy(input: {
  cityName?: string | null;
  topic?: SeoTopicId | null;
  when?: SeoWhenId | null;
  eventCount: number;
  eventTitles: string[];
  establishmentCount: number;
}) {
  const place = placePhrase(input.cityName);
  const suffix = whenSuffix(input.when);
  const whenPart = input.when ? SEO_WHEN_LABELS[input.when] : "nos próximos dias";
  let h1: string;
  if (input.topic === "barzinho-com-show") {
    h1 = input.cityName
      ? `Barzinho em ${input.cityName} com show ao vivo${suffix}`
      : `Barzinho no 019 com show ao vivo${suffix}`;
  } else if (input.topic) {
    h1 = `${SEO_TOPIC_META[input.topic].label} ${place}${suffix}`;
  } else if (input.when === "hoje") {
    h1 = input.cityName ? `O que fazer em ${input.cityName} hoje` : "O que fazer hoje no 019";
  } else if (input.when) {
    h1 = `O que fazer ${place}${suffix}`;
  } else {
    h1 = `Agenda ${place}`;
  }

  const names = input.eventTitles.slice(0, 3).join(", ");
  let description: string;
  if (input.eventCount > 0) {
    const noun = input.eventCount === 1 ? "evento publicado" : "eventos publicados";
    description = `${input.eventCount} ${noun} ${whenPart} ${place}${names ? `: ${names}` : ""}. Horários, locais e como chegar.`;
  } else if (input.establishmentCount > 0) {
    const noun = input.establishmentCount === 1 ? "lugar publicado" : "lugares publicados";
    description = `${input.establishmentCount} ${noun} ${place} para sair ${whenPart}. Endereços e programação no AGITO019.`;
  } else {
    description = `Ainda não há programação publicada ${whenPart} ${place}. Veja outras cidades do 019 no AGITO019.`;
  }

  const intro =
    input.eventCount > 0
      ? `A programação publicada ${place} ${whenPart}: ${input.eventCount} ${
          input.eventCount === 1 ? "evento" : "eventos"
        } para conferir.`
      : input.establishmentCount > 0
        ? `Lugares publicados ${place} para o rolê ${whenPart}.`
        : `Ainda não há pauta publicada ${place} ${whenPart}.`;

  return { h1, title: h1, description, intro };
}

export function relatedSeoLinks(citySlug?: string | null, currentPath?: string) {
  const items = citySlug
    ? [
        { href: `/${citySlug}/hoje`, label: "Hoje" },
        { href: `/${citySlug}/amanha`, label: "Amanhã" },
        { href: `/${citySlug}/sexta`, label: "Sexta" },
        { href: `/${citySlug}/sabado`, label: "Sábado" },
        { href: `/${citySlug}/musica-ao-vivo`, label: "Música ao vivo" },
        { href: `/${citySlug}/barzinho-com-show`, label: "Barzinho com show" },
        { href: `/${citySlug}/boteco`, label: "Boteco" },
        { href: `/${citySlug}/casa-noturna`, label: "Casa noturna" },
        { href: `/${citySlug}/programacao`, label: "Programação" },
        { href: `/${citySlug}`, label: "Cidade" },
      ]
    : [
        { href: "/hoje", label: "Hoje no 019" },
        { href: "/amanha", label: "Amanhã no 019" },
        { href: "/musica-ao-vivo", label: "Música ao vivo no 019" },
        { href: "/campinas", label: "Campinas" },
        { href: "/explorar", label: "Explorar" },
      ];
  return items.filter((item) => item.href !== currentPath);
}

export function eventSeoKeys(input: {
  eventType: string;
  startAt: Date;
  categorySlugs: string[];
  from?: string;
}) {
  const weekday = whenSlugFromDate(input.startAt);
  const today = isYmdToday(input.startAt, input.from);
  const tomorrow = isYmdTomorrow(input.startAt, input.from);
  const whens: SeoWhenId[] = [weekday];
  if (today) {
    whens.push("hoje");
  }
  if (tomorrow) {
    whens.push("amanha");
  }

  const topics: SeoTopicId[] = ["programacao"];
  if (input.eventType === "LIVE_MUSIC") {
    topics.push("musica-ao-vivo");
    if (intersects(input.categorySlugs, BARZINHO_CATEGORIES)) {
      topics.push("barzinho-com-show");
    }
  }
  if (intersects(input.categorySlugs, ["boteco"])) {
    topics.push("boteco");
  }
  if (intersects(input.categorySlugs, NIGHT_CATEGORIES)) {
    topics.push("casa-noturna");
  }

  const keys: Array<{ topic?: SeoTopicId; when?: SeoWhenId }> = [];
  for (const when of whens) {
    keys.push({ when });
  }
  for (const topic of topics) {
    keys.push({ topic });
    for (const when of whens) {
      keys.push({ topic, when });
    }
  }
  return keys;
}

export function pathsForPublishedEvent(input: {
  citySlug: string;
  eventSlug: string;
  placeSlug: string;
  eventType: string;
  startAt: Date;
  categorySlugs: string[];
  from?: string;
}) {
  const paths = new Set<string>([
    "/",
    "/explorar",
    "/sitemap.xml",
    `/${input.citySlug}`,
    `/eventos/${input.eventSlug}`,
    `/lugares/${input.placeSlug}`,
  ]);
  for (const key of eventSeoKeys(input)) {
    if (!key.topic && !input.citySlug) {
      continue;
    }
    paths.add(buildSeoPath({ city: input.citySlug, topic: key.topic, when: key.when }));
    if (key.topic === "musica-ao-vivo") {
      paths.add(buildSeoPath({ topic: "musica-ao-vivo", when: key.when }));
    }
    if (!key.topic && (key.when === "hoje" || key.when === "amanha")) {
      paths.add(buildSeoPath({ when: key.when }));
    }
  }
  return [...paths];
}
