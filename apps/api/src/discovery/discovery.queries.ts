import type { Prisma } from "../generated/prisma/client";
import { dayBounds } from "../common/timezone";
import { getEventFormatBySlug } from "../common/shared";

export type PublicListFilters = {
  search?: string;
  city?: string;
  date?: string;
  category?: string;
  audience?: string;
  genre?: string;
  liveMusic?: boolean;
  promotion?: boolean;
};

const campaignInclude = {
  where: { paymentStatus: "PAID" as const },
  include: { plan: true },
};

export const establishmentPublicInclude = {
  city: true,
  categories: { include: { category: true } },
  audiences: { include: { audience: true } },
  amenities: { include: { amenity: true } },
  businessHours: true,
  media: { include: { media: true }, orderBy: { sortOrder: "asc" as const } },
  campaigns: campaignInclude,
  promotions: {
    where: { deletedAt: null, active: true },
    include: { media: { include: { media: true } } },
  },
  events: {
    where: { deletedAt: null, status: "PUBLISHED" },
    include: {
      artists: { include: { artist: true }, orderBy: { sortOrder: "asc" as const } },
      genres: { include: { genre: true } },
    },
    orderBy: { startAt: "asc" as const },
    take: 8,
  },
} satisfies Prisma.EstablishmentInclude;

export const eventPublicInclude = {
  establishment: {
    include: {
      city: true,
      media: { include: { media: true }, orderBy: { sortOrder: "asc" as const } },
      campaigns: campaignInclude,
      promotions: { where: { deletedAt: null, active: true } },
    },
  },
  artists: { include: { artist: { include: { media: { include: { media: true } } } } }, orderBy: { sortOrder: "asc" as const } },
  genres: { include: { genre: true } },
  media: { include: { media: true }, orderBy: { sortOrder: "asc" as const } },
} satisfies Prisma.EventInclude;

export const artistPublicInclude = {
  city: true,
  genres: { include: { genre: true } },
  media: { include: { media: true }, orderBy: { sortOrder: "asc" as const } },
  campaigns: campaignInclude,
  events: {
    where: { event: { deletedAt: null, status: "PUBLISHED", startAt: { gte: new Date(Date.now() - 86_400_000) } } },
    include: {
      event: {
        include: {
          establishment: { include: { city: true } },
        },
      },
    },
    orderBy: { event: { startAt: "asc" } },
  },
} satisfies Prisma.ArtistInclude;

export function publishedEstablishmentWhere(filters: PublicListFilters): Prisma.EstablishmentWhereInput {
  const where: Prisma.EstablishmentWhereInput = {
    deletedAt: null,
    status: "PUBLISHED",
  };

  if (filters.city) {
    where.city = { slug: filters.city, active: true };
  }
  if (filters.category) {
    where.categories = { some: { category: { slug: filters.category, active: true } } };
  }
  if (filters.audience) {
    where.audiences = { some: { audience: { slug: filters.audience, active: true } } };
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { neighborhood: { contains: filters.search, mode: "insensitive" } },
      { shortDescription: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.genre || filters.liveMusic || filters.date) {
    const bounds = dayBounds(filters.date);
    where.events = {
      some: {
        deletedAt: null,
        status: "PUBLISHED",
        ...(filters.liveMusic ? { eventType: "LIVE_MUSIC" } : {}),
        ...(filters.date || filters.liveMusic ? { startAt: { gte: bounds.start, lt: bounds.end } } : {}),
        ...(filters.genre ? { genres: { some: { genre: { slug: filters.genre, active: true } } } } : {}),
      },
    };
  }
  if (filters.promotion) {
    const now = new Date();
    where.promotions = {
      some: { deletedAt: null, active: true, startsAt: { lte: now }, endsAt: { gte: now } },
    };
  }
  return where;
}

export function publishedEventWhere(filters: PublicListFilters & { type?: string; artist?: string; establishment?: string }): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = {
    deletedAt: null,
    status: "PUBLISHED",
    establishment: { deletedAt: null, status: "PUBLISHED" },
  };
  if (filters.city) {
    where.establishment = {
      is: { deletedAt: null, status: "PUBLISHED", city: { slug: filters.city } },
    };
  }
  if (filters.date) {
    const bounds = dayBounds(filters.date);
    where.startAt = { gte: bounds.start, lt: bounds.end };
  }
  if (filters.type) {
    const format = getEventFormatBySlug(filters.type);
    if (format) {
      where.OR = [
        { description: { contains: `[modalidade:${format.slug}]` } },
        ...format.keywords.slice(0, 4).map((kw) => ({
          title: { contains: kw, mode: "insensitive" as const },
        })),
        { eventType: format.defaultEventType },
      ];
    } else {
      where.eventType = filters.type as Prisma.EnumEventTypeFilter["equals"];
    }
  }
  if (filters.genre) {
    where.genres = { some: { genre: { slug: filters.genre } } };
  }
  if (filters.artist) {
    where.artists = { some: { artist: { slug: filters.artist } } };
  }
  if (filters.establishment) {
    where.establishment = {
      is: {
        deletedAt: null,
        status: "PUBLISHED",
        slug: filters.establishment,
        ...(filters.city ? { city: { slug: filters.city } } : {}),
      },
    };
  }
  if (filters.liveMusic) {
    where.eventType = "LIVE_MUSIC";
  }
  return where;
}

export type SearchFlowQuery = {
  city: string;
  tipo: string;
  hasMusic?: boolean;
  genre?: string;
  audience?: string;
  subtype?: string;
  requireArtist?: boolean;
  date?: string;
};

export function searchEstablishmentWhere(query: SearchFlowQuery): Prisma.EstablishmentWhereInput {
  const and: Prisma.EstablishmentWhereInput[] = [
    { deletedAt: null, status: "PUBLISHED" },
    { city: { slug: query.city, active: true } },
    { categories: { some: { category: { slug: query.tipo, active: true } } } },
  ];
  if (query.subtype) {
    and.push({ categories: { some: { category: { slug: query.subtype, active: true } } } });
  }
  if (query.hasMusic !== undefined) {
    and.push({
      OR: [
        { hasMusic: query.hasMusic },
        {
          events: {
            some: { deletedAt: null, status: "PUBLISHED", hasMusic: query.hasMusic },
          },
        },
      ],
    });
  }
  if (query.audience) {
    and.push({
      OR: [
        { audiences: { some: { audience: { slug: query.audience, active: true } } } },
        {
          events: {
            some: {
              deletedAt: null,
              status: "PUBLISHED",
              audiences: { some: { audience: { slug: query.audience, active: true } } },
            },
          },
        },
      ],
    });
  }
  if (query.genre) {
    and.push({
      OR: [
        { genres: { some: { genre: { slug: query.genre, active: true } } } },
        {
          events: {
            some: {
              deletedAt: null,
              status: "PUBLISHED",
              genres: { some: { genre: { slug: query.genre, active: true } } },
            },
          },
        },
      ],
    });
  }
  if (query.requireArtist) {
    and.push({
      events: {
        some: {
          deletedAt: null,
          status: "PUBLISHED",
          artists: { some: {} },
          ...(query.date ? { startAt: { gte: dayBounds(query.date).start, lt: dayBounds(query.date).end } } : {}),
        },
      },
    });
  } else if (query.date) {
    const bounds = dayBounds(query.date);
    and.push({
      events: {
        some: {
          deletedAt: null,
          status: "PUBLISHED",
          startAt: { gte: bounds.start, lt: bounds.end },
        },
      },
    });
  }
  return { AND: and };
}

export function searchEventWhere(query: SearchFlowQuery): Prisma.EventWhereInput {
  const establishmentAnd: Prisma.EstablishmentWhereInput[] = [
    { deletedAt: null, status: "PUBLISHED" },
    { city: { slug: query.city, active: true } },
    { categories: { some: { category: { slug: query.tipo, active: true } } } },
  ];
  if (query.subtype) {
    establishmentAnd.push({ categories: { some: { category: { slug: query.subtype, active: true } } } });
  }
  const and: Prisma.EventWhereInput[] = [
    { deletedAt: null, status: "PUBLISHED" },
    { establishment: { is: { AND: establishmentAnd } } },
  ];
  if (query.hasMusic !== undefined) {
    and.push({
      OR: [{ hasMusic: query.hasMusic }, { establishment: { is: { hasMusic: query.hasMusic } } }],
    });
  }
  if (query.audience) {
    and.push({
      OR: [
        { audiences: { some: { audience: { slug: query.audience, active: true } } } },
        { establishment: { is: { audiences: { some: { audience: { slug: query.audience, active: true } } } } } },
      ],
    });
  }
  if (query.genre) {
    and.push({ genres: { some: { genre: { slug: query.genre, active: true } } } });
  }
  if (query.requireArtist) {
    and.push({ artists: { some: {} } });
  }
  if (query.date) {
    const bounds = dayBounds(query.date);
    and.push({ startAt: { gte: bounds.start, lt: bounds.end } });
  }
  return { AND: and };
}

const publishedRow = { deletedAt: null, status: "PUBLISHED" as const };

type HomeFilterMatch = {
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

export type HomeSearchClause = {
  group: string;
  match: HomeFilterMatch;
  venue: boolean;
};

export type HomeSearchQuery = {
  city?: string;
  dates?: { start: Date; end: Date }[];
  clauses: HomeSearchClause[];
};

const CATEGORY_ALIASES: Record<string, string[]> = {
  bares: ["bares", "bar", "boteco", "pub"],
  restaurantes: ["restaurantes", "restaurante"],
  baladas: ["baladas", "balada"],
  shows: ["shows", "casa-de-shows"],
};

const MUSIC_EVENT_TYPES = ["LIVE_MUSIC", "PARTY"] as const;

function categorySlugs(slugs: string[]) {
  const expanded = new Set<string>();
  for (const slug of slugs) {
    for (const item of CATEGORY_ALIASES[slug] ?? [slug]) {
      expanded.add(item);
    }
  }
  return [...expanded];
}

function categoryFilter(slugs: string[]): Prisma.EstablishmentWhereInput {
  return { categories: { some: { category: { slug: { in: categorySlugs(slugs) }, active: true } } } };
}

function eventHasMusic(): Prisma.EventWhereInput {
  return {
    OR: [
      { hasMusic: true },
      { eventType: { in: [...MUSIC_EVENT_TYPES] } },
      { genres: { some: { genre: { active: true } } } },
      { establishment: { is: { hasMusic: true } } },
    ],
  };
}

function eventWithoutMusic(): Prisma.EventWhereInput {
  return {
    AND: [
      { NOT: { hasMusic: true } },
      { eventType: { notIn: [...MUSIC_EVENT_TYPES] } },
      { genres: { none: {} } },
      { establishment: { is: { NOT: { hasMusic: true } } } },
    ],
  };
}

function establishmentMatch(match: HomeFilterMatch): Prisma.EstablishmentWhereInput {
  if (match.combine === "or") {
    return { events: { some: { ...publishedRow, ...eventMatch(match) } } };
  }
  const and: Prisma.EstablishmentWhereInput[] = [];
  if (match.category) {
    and.push(categoryFilter([match.category]));
  }
  if (match.hasMusic !== undefined) {
    and.push(
      match.hasMusic
        ? {
            OR: [{ hasMusic: true }, { events: { some: { ...publishedRow, ...eventHasMusic() } } }],
          }
        : {
            AND: [
              { NOT: { hasMusic: true } },
              { events: { none: { ...publishedRow, ...eventHasMusic() } } },
            ],
          },
    );
  }
  if (match.audiences?.length) {
    and.push({
      OR: [
        { audiences: { some: { audience: { slug: { in: match.audiences }, active: true } } } },
        {
          events: {
            some: {
              ...publishedRow,
              audiences: { some: { audience: { slug: { in: match.audiences }, active: true } } },
            },
          },
        },
      ],
    });
  }
  if (match.genres?.length) {
    and.push({
      OR: [
        { genres: { some: { genre: { slug: { in: match.genres }, active: true } } } },
        {
          events: {
            some: {
              ...publishedRow,
              OR: [
                { genres: { some: { genre: { slug: { in: match.genres }, active: true } } } },
                {
                  artists: {
                    some: {
                      artist: { genres: { some: { genre: { slug: { in: match.genres }, active: true } } } },
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    });
  }
  return and.length ? { AND: and } : publishedRow;
}

function eventMatch(match: HomeFilterMatch): Prisma.EventWhereInput {
  if (match.combine === "or") {
    const or: Prisma.EventWhereInput[] = [];
    if (match.modality) {
      or.push({ description: { contains: `[modalidade:${match.modality}]` } });
    }
    for (const title of match.titles ?? []) {
      or.push({ title: { contains: title, mode: "insensitive" } });
    }
    if (match.categories?.length) {
      or.push({
        establishment: {
          is: {
            ...publishedRow,
            ...categoryFilter(match.categories),
          },
        },
      });
    }
    if (match.eventTypes?.length) {
      or.push({
        eventType: {
          in: match.eventTypes as Array<"LIVE_MUSIC" | "PARTY" | "FESTIVAL" | "CAR_MEET" | "SPECIAL_EVENT" | "OTHER">,
        },
      });
    }
    return or.length ? { OR: or } : publishedRow;
  }
  const and: Prisma.EventWhereInput[] = [];
  if (match.category) {
    and.push({
      establishment: {
        is: {
          ...publishedRow,
          ...categoryFilter([match.category]),
        },
      },
    });
  }
  if (match.hasMusic !== undefined) {
    and.push(match.hasMusic ? eventHasMusic() : eventWithoutMusic());
  }
  if (match.audiences?.length) {
    and.push({
      OR: [
        { audiences: { some: { audience: { slug: { in: match.audiences }, active: true } } } },
        {
          establishment: {
            is: { audiences: { some: { audience: { slug: { in: match.audiences }, active: true } } } },
          },
        },
      ],
    });
  }
  if (match.genres?.length) {
    and.push({
      OR: [
        { genres: { some: { genre: { slug: { in: match.genres }, active: true } } } },
        {
          artists: {
            some: { artist: { genres: { some: { genre: { slug: { in: match.genres }, active: true } } } } },
          },
        },
      ],
    });
  }
  return and.length ? { AND: and } : publishedRow;
}

export function homeSearchEstablishmentWhere(query: HomeSearchQuery): Prisma.EstablishmentWhereInput {
  const and: Prisma.EstablishmentWhereInput[] = [publishedRow];
  if (query.city) {
    and.push({ city: { slug: query.city, active: true } });
  }
  if (query.dates?.length) {
    and.push({
      OR: query.dates.map((range) => ({
        events: {
          some: {
            ...publishedRow,
            startAt: { gte: range.start, lt: range.end },
          },
        },
      })),
    });
  }
  for (const clause of query.clauses) {
    and.push(establishmentMatch(clause.match));
  }
  return { AND: and };
}

export function homeSearchEventWhere(query: HomeSearchQuery): Prisma.EventWhereInput {
  const and: Prisma.EventWhereInput[] = [
    publishedRow,
    {
      establishment: {
        is: {
          ...publishedRow,
          ...(query.city ? { city: { slug: query.city, active: true } } : {}),
        },
      },
    },
  ];
  if (query.dates?.length) {
    and.push({
      OR: query.dates.map((range) => ({
        startAt: { gte: range.start, lt: range.end },
      })),
    });
  }
  for (const clause of query.clauses) {
    and.push(eventMatch(clause.match));
  }
  return { AND: and };
}
