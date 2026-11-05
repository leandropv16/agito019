import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AppException } from "../common/errors/app.exception";
import { paginated, parsePagination } from "../common/pagination";
import { dayBounds, formatYmd, nextPresetDate, nextWeekdayInclusive, parseDateInput } from "../common/timezone";
import type { DayOfWeek } from "../common/shared";
import { parseHomeFilterQuery, searchWeekday, selectedHomeFilters, upcomingHolidayYmds } from "@agito019/shared";
import { activeCampaigns, cardVisibility, commercialBadge, coverOf, listingPriority, mapMedia } from "../common/presenters";
import {
  artistPublicInclude,
  establishmentPublicInclude,
  eventPublicInclude,
  publishedEstablishmentWhere,
  publishedEventWhere,
  homeSearchEstablishmentWhere,
  homeSearchEventWhere,
  searchEstablishmentWhere,
  searchEventWhere,
  type HomeSearchQuery,
  type PublicListFilters,
  type SearchFlowQuery,
} from "./discovery.queries";

@Injectable()
export class DiscoveryService {
  constructor(private readonly prisma: PrismaService) {}

  catalogs() {
    return Promise.all([
      this.prisma.city.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      this.prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      this.prisma.audience.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      this.prisma.musicGenre.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    ]);
  }

  async home(date?: string, city?: string) {
    const bounds = dayBounds(date);
    const now = new Date();
    const cityFilter = city ? { city: { slug: city } } : {};

    const [cities, featured, liveMusic, promotions, events, establishments] = await Promise.all([
      this.prisma.city.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      this.prisma.establishment.findMany({
        where: { deletedAt: null, status: "PUBLISHED", ...cityFilter },
        include: establishmentPublicInclude,
        take: 24,
      }),
      this.prisma.event.findMany({
        where: {
          deletedAt: null,
          status: "PUBLISHED",
          eventType: "LIVE_MUSIC",
          startAt: { gte: bounds.start, lt: bounds.end },
          establishment: { deletedAt: null, status: "PUBLISHED", ...cityFilter },
        },
        include: eventPublicInclude,
        orderBy: { startAt: "asc" },
        take: 12,
      }),
      this.prisma.promotion.findMany({
        where: {
          deletedAt: null,
          active: true,
          startsAt: { lte: now },
          endsAt: { gte: now },
          establishment: { deletedAt: null, status: "PUBLISHED", ...cityFilter },
        },
        include: {
          establishment: { include: { city: true, media: { include: { media: true } }, campaigns: { include: { plan: true } } } },
          media: { include: { media: true } },
        },
        take: 10,
      }),
      this.prisma.event.findMany({
        where: {
          deletedAt: null,
          status: "PUBLISHED",
          startAt: { gte: bounds.start },
          establishment: { deletedAt: null, status: "PUBLISHED", ...cityFilter },
        },
        include: eventPublicInclude,
        orderBy: { startAt: "asc" },
        take: 24,
      }),
      this.prisma.establishment.findMany({
        where: { deletedAt: null, status: "PUBLISHED", ...cityFilter },
        include: establishmentPublicInclude,
        take: 24,
      }),
    ]);

    const serializedEvents = events.map((item) => this.serializeEvent(item));
    const recommendations = this.rankRecommendations(serializedEvents).slice(0, 3);

    return {
      date: date ?? `${bounds.year}-${String(bounds.month).padStart(2, "0")}-${String(bounds.day).padStart(2, "0")}`,
      cities,
      recommendations,
      featured: this.sortEstablishments(featured).filter((item) => item.badge).slice(0, 8),
      liveMusic: liveMusic.map((item) => this.serializeEvent(item)),
      promotions: promotions.map((item) => this.serializePromotion(item)),
      events: serializedEvents.slice(0, 12),
      establishments: this.sortEstablishments(establishments).slice(0, 12),
    };
  }

  async establishments(filters: PublicListFilters, page?: number, limit?: number) {
    const pagination = parsePagination(page, limit);
    const where = publishedEstablishmentWhere(filters);
    const rows = await this.prisma.establishment.findMany({
      where,
      include: establishmentPublicInclude,
    });
    const sorted = this.sortEstablishments(rows);
    const slice = sorted.slice(pagination.skip, pagination.skip + pagination.take);
    return paginated(slice, sorted.length, pagination.page, pagination.limit);
  }

  async establishmentBySlug(slug: string) {
    const row = await this.prisma.establishment.findFirst({
      where: { slug, deletedAt: null, status: "PUBLISHED" },
      include: establishmentPublicInclude,
    });
    if (!row) {
      throw new AppException("ESTABLISHMENT_NOT_FOUND", "Estabelecimento não encontrado", HttpStatus.NOT_FOUND);
    }
    return this.serializeEstablishment(row, true);
  }

  async events(filters: PublicListFilters & { type?: string; artist?: string; establishment?: string }, page?: number, limit?: number) {
    const pagination = parsePagination(page, limit);
    const where = publishedEventWhere(filters);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        include: eventPublicInclude,
        orderBy: { startAt: "asc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.event.count({ where }),
    ]);
    return paginated(rows.map((row) => this.serializeEvent(row)), total, pagination.page, pagination.limit);
  }

  async eventBySlug(slug: string) {
    const row = await this.prisma.event.findFirst({
      where: { slug, deletedAt: null, status: "PUBLISHED" },
      include: eventPublicInclude,
    });
    if (!row) {
      throw new AppException("EVENT_NOT_FOUND", "Evento não encontrado", HttpStatus.NOT_FOUND);
    }
    return this.serializeEvent(row);
  }

  async artists(page?: number, limit?: number, city?: string) {
    const pagination = parsePagination(page, limit);
    const where: Prisma.ArtistWhereInput = {
      deletedAt: null,
      status: "PUBLISHED",
      ...(city ? { city: { slug: city } } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.artist.findMany({
        where,
        include: artistPublicInclude,
        orderBy: { name: "asc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.artist.count({ where }),
    ]);
    return paginated(rows.map((row) => this.serializeArtist(row)), total, pagination.page, pagination.limit);
  }

  async artistBySlug(slug: string) {
    const row = await this.prisma.artist.findFirst({
      where: { slug, deletedAt: null, status: "PUBLISHED" },
      include: artistPublicInclude,
    });
    if (!row) {
      throw new AppException("ARTIST_NOT_FOUND", "Músico não encontrado", HttpStatus.NOT_FOUND);
    }
    return this.serializeArtist(row);
  }

  private datesForSemana(semana: string | null) {
    if (!semana) {
      return undefined;
    }
    const option = searchWeekday(semana);
    if (!option) {
      return undefined;
    }
    if (!option.weekday) {
      const today = parseDateInput();
      const ymds = upcomingHolidayYmds(formatYmd(today.year, today.month, today.day));
      if (!ymds.length) {
        return [{ start: new Date(0), end: new Date(0) }];
      }
      return ymds.map((value) => {
        const bounds = dayBounds(value);
        return { start: bounds.start, end: bounds.end };
      });
    }
    const next = nextWeekdayInclusive(option.weekday as DayOfWeek);
    const bounds = dayBounds(next.ymd);
    return [{ start: bounds.start, end: bounds.end }];
  }

  private async procurarHome(input: {
    city?: string;
    semana?: string;
    cidade?: string;
    bares?: string;
    restaurantes?: string;
    baladas?: string;
    musicos?: string;
    eventos?: string;
  }) {
    const selection = parseHomeFilterQuery({
      semana: input.semana,
      cidade: input.cidade || input.city,
      bares: input.bares,
      restaurantes: input.restaurantes,
      baladas: input.baladas,
      musicos: input.musicos,
      eventos: input.eventos,
    });
    if (!selection) {
      throw new AppException("SEARCH_INVALID", "Procura inválida", HttpStatus.NOT_FOUND);
    }
    const query: HomeSearchQuery = {
      city: selection.cidade ?? undefined,
      dates: this.datesForSemana(selection.semana),
      clauses: selectedHomeFilters(selection),
    };
    const [establishments, events] = await Promise.all([
      this.prisma.establishment.findMany({
        where: homeSearchEstablishmentWhere(query),
        include: establishmentPublicInclude,
        orderBy: { name: "asc" },
        take: 24,
      }),
      this.prisma.event.findMany({
        where: homeSearchEventWhere(query),
        include: eventPublicInclude,
        orderBy: { startAt: "asc" },
        take: 24,
      }),
    ]);
    return {
      establishments: this.sortEstablishments(establishments),
      events: events.map((row) => this.serializeEvent(row)),
    };
  }

  async procurar(input: {
    city?: string;
    tipo?: string;
    musica?: string;
    genero?: string;
    clima?: string;
    quando?: string;
    semana?: string;
    cidade?: string;
    bares?: string;
    restaurantes?: string;
    baladas?: string;
    musicos?: string;
    eventos?: string;
  }) {
    if (!input.tipo && (input.semana || input.cidade || input.bares || input.restaurantes || input.baladas || input.musicos || input.eventos || input.city)) {
      return this.procurarHome(input);
    }
    const tipos = ["bares", "restaurantes", "baladas", "eventos", "festival", "shows", "encontros"];
    if (!input.city || !input.tipo || !tipos.includes(input.tipo)) {
      throw new AppException("SEARCH_INVALID", "Procura inválida", HttpStatus.NOT_FOUND);
    }
    if (input.musica && input.musica !== "com-musica" && input.musica !== "sem-musica") {
      throw new AppException("SEARCH_INVALID", "Procura inválida", HttpStatus.NOT_FOUND);
    }
    if (input.quando && input.quando !== "hoje" && input.quando !== "sabado") {
      throw new AppException("SEARCH_INVALID", "Procura inválida", HttpStatus.NOT_FOUND);
    }
    const isArtist = input.genero === "artista";
    const isEncounter = input.tipo === "encontros";
    const query: SearchFlowQuery = {
      city: input.city,
      tipo: input.tipo,
      hasMusic: input.musica === "com-musica" ? true : input.musica === "sem-musica" ? false : undefined,
      genre: input.genero && !isArtist && !isEncounter && input.musica !== "sem-musica" ? input.genero : undefined,
      audience: input.clima || undefined,
      subtype: isEncounter && input.genero ? input.genero : undefined,
      requireArtist: isArtist,
      date:
        input.quando === "hoje"
          ? nextPresetDate("today")
          : input.quando === "sabado"
            ? nextPresetDate("saturday")
            : undefined,
    };
    const [establishments, events] = await Promise.all([
      this.prisma.establishment.findMany({
        where: searchEstablishmentWhere(query),
        include: establishmentPublicInclude,
        orderBy: { name: "asc" },
        take: 24,
      }),
      this.prisma.event.findMany({
        where: searchEventWhere(query),
        include: eventPublicInclude,
        orderBy: { startAt: "asc" },
        take: 24,
      }),
    ]);
    return {
      establishments: this.sortEstablishments(establishments),
      events: events.map((row) => this.serializeEvent(row)),
    };
  }

  async promotions(city?: string) {
    const now = new Date();
    const rows = await this.prisma.promotion.findMany({
      where: {
        deletedAt: null,
        active: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
        establishment: { deletedAt: null, status: "PUBLISHED", ...(city ? { city: { slug: city } } : {}) },
      },
      include: {
        establishment: { include: { city: true, media: { include: { media: true } }, campaigns: { include: { plan: true } } } },
        media: { include: { media: true } },
      },
      orderBy: { startsAt: "desc" },
    });
    return rows.map((row) => this.serializePromotion(row));
  }

  private sortEstablishments(rows: Prisma.EstablishmentGetPayload<{ include: typeof establishmentPublicInclude }>[]) {
    return [...rows]
      .map((row) => this.serializeEstablishment(row, false))
      .sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name, "pt-BR"));
  }

  private rankRecommendations(
    events: Array<{
      agendaStatus: string;
      updatedAt: Date | string;
      startAt: Date | string;
      commercialPriority: number;
    }>,
  ) {
    const agendaScore: Record<string, number> = { CONFIRMED: 30, PENDING: 10, OUTDATED: -20 };
    const now = Date.now();
    return [...events]
      .map((event) => {
        const updatedAt = new Date(event.updatedAt).getTime();
        const freshnessHours = Math.max(0, (now - updatedAt) / 3_600_000);
        const freshnessScore = Math.max(0, 20 - freshnessHours);
        const score =
          (agendaScore[event.agendaStatus] ?? 0) + freshnessScore + (event.commercialPriority ?? 0);
        return { event, score };
      })
      .sort((a, b) => b.score - a.score || new Date(a.event.startAt).getTime() - new Date(b.event.startAt).getTime())
      .map((item) => item.event);
  }

  serializeEstablishment(
    row: Prisma.EstablishmentGetPayload<{ include: typeof establishmentPublicInclude }>,
    detail: boolean,
  ) {
    const now = new Date();
    const badge = commercialBadge(row.campaigns, now);
    const visibility = cardVisibility(row.campaigns, now);
    const activePromos = row.promotions.filter((item) => item.startsAt <= now && item.endsAt >= now);
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      shortDescription: row.shortDescription,
      description: detail ? row.description : undefined,
      phone: detail ? row.phone : undefined,
      whatsapp: row.whatsapp,
      instagramUrl: visibility.showInstagram || detail ? row.instagramUrl : null,
      websiteUrl: visibility.showWebsite || detail ? row.websiteUrl : null,
      addressStreet: row.addressStreet,
      addressNumber: row.addressNumber,
      addressComplement: detail ? row.addressComplement : undefined,
      neighborhood: row.neighborhood,
      postalCode: detail ? row.postalCode : undefined,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      googleMapsUrl:
        row.googleMapsUrl ??
        `https://www.google.com/maps/search/?api=1&query=${Number(row.latitude)},${Number(row.longitude)}`,
      city: row.city,
      categories: row.categories.map((item) => item.category),
      audiences: row.audiences.map((item) => item.audience),
      amenities: detail ? row.amenities.map((item) => item.amenity) : undefined,
      businessHours: detail
        ? row.businessHours.map((hour) => ({
            dayOfWeek: hour.dayOfWeek,
            opensAt: hour.opensAt ? hour.opensAt.toISOString().slice(11, 16) : null,
            closesAt: hour.closesAt ? hour.closesAt.toISOString().slice(11, 16) : null,
            closed: hour.closed,
          }))
        : undefined,
      media: detail ? mapMedia(row.media) : undefined,
      cover: visibility.showPhoto || detail ? coverOf(row.media) : null,
      badge,
      priority: listingPriority(row.campaigns, now),
      visibility,
      promotions: activePromos.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
      })),
      nextEvent: row.events[0]
        ? {
            id: row.events[0].id,
            title: row.events[0].title,
            slug: row.events[0].slug,
            startAt: row.events[0].startAt,
            eventType: row.events[0].eventType,
            artists: row.events[0].artists.map((item) => item.artist),
            genres: row.events[0].genres.map((item) => item.genre),
          }
        : null,
      events: detail
        ? row.events.map((event) => ({
            id: event.id,
            title: event.title,
            slug: event.slug,
            startAt: event.startAt,
            eventType: event.eventType,
            artists: event.artists.map((item) => item.artist),
            genres: event.genres.map((item) => item.genre),
          }))
        : undefined,
    };
  }

  serializeEvent(row: Prisma.EventGetPayload<{ include: typeof eventPublicInclude }>) {
    const now = new Date();
    const commercialPriority = listingPriority(row.establishment.campaigns, now);
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      eventType: row.eventType,
      startAt: row.startAt,
      endAt: row.endAt,
      agendaStatus: row.agendaStatus,
      entryPriceType: row.entryPriceType,
      entryPriceCents: row.entryPriceCents,
      updatedAt: row.updatedAt,
      commercialPriority,
      cover: coverOf(row.media) ?? coverOf(row.establishment.media),
      media: mapMedia(row.media),
      genres: row.genres.map((item) => item.genre),
      artists: row.artists.map((item) => ({
        id: item.artist.id,
        name: item.artist.name,
        slug: item.artist.slug,
        type: item.artist.type,
        instagramUrl: item.artist.instagramUrl,
        cover: coverOf(item.artist.media ?? []),
      })),
      establishment: {
        id: row.establishment.id,
        name: row.establishment.name,
        slug: row.establishment.slug,
        neighborhood: row.establishment.neighborhood,
        latitude: Number(row.establishment.latitude),
        longitude: Number(row.establishment.longitude),
        instagramUrl: row.establishment.instagramUrl,
        whatsapp: row.establishment.whatsapp,
        phone: row.establishment.phone,
        googleMapsUrl:
          row.establishment.googleMapsUrl ??
          `https://www.google.com/maps/search/?api=1&query=${Number(row.establishment.latitude)},${Number(row.establishment.longitude)}`,
        city: row.establishment.city,
        badge: commercialBadge(row.establishment.campaigns, now),
        promotions: activeCampaigns(
          row.establishment.promotions.map((item) => ({
            ...item,
            paymentStatus: "PAID",
            plan: { slug: "", highlighted: false, priority: 0 },
          })),
          now,
        ).length
          ? row.establishment.promotions
          : row.establishment.promotions.filter((item) => item.startsAt <= now && item.endsAt >= now),
      },
    };
  }

  private serializeArtist(row: Prisma.ArtistGetPayload<{ include: typeof artistPublicInclude }>) {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      type: row.type,
      bio: row.bio,
      instagramUrl: row.instagramUrl,
      whatsapp: row.whatsapp,
      videoUrl: row.videoUrl,
      hireUrl: row.hireUrl,
      city: row.city,
      genres: row.genres.map((item) => item.genre),
      cover: coverOf(row.media),
      media: mapMedia(row.media),
      badge: commercialBadge(row.campaigns),
      agenda: row.events.map((item) => ({
        id: item.event.id,
        title: item.event.title,
        slug: item.event.slug,
        startAt: item.event.startAt,
        establishment: {
          id: item.event.establishment.id,
          name: item.event.establishment.name,
          slug: item.event.establishment.slug,
          city: item.event.establishment.city,
        },
      })),
      nextEvent: row.events[0]
        ? {
            title: row.events[0].event.title,
            startAt: row.events[0].event.startAt,
            establishment: row.events[0].event.establishment.name,
            city: row.events[0].event.establishment.city.name,
          }
        : null,
    };
  }

  private serializePromotion(row: {
    id: string;
    title: string;
    description: string | null;
    startsAt: Date;
    endsAt: Date;
    establishment: {
      id: string;
      name: string;
      slug: string;
      city: { name: string; slug: string };
      media: Array<{ isCover: boolean; sortOrder: number; media: { path: string; thumbnailPath: string | null; altText: string | null } }>;
    };
    media: Array<{ isCover: boolean; sortOrder: number; media: { path: string; thumbnailPath: string | null; altText: string | null } }>;
  }) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      cover: coverOf(row.media) ?? coverOf(row.establishment.media),
      establishment: {
        id: row.establishment.id,
        name: row.establishment.name,
        slug: row.establishment.slug,
        city: row.establishment.city,
      },
    };
  }
}
