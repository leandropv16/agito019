import { HttpStatus, Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AppException } from "../common/errors/app.exception";
import { DiscoveryService } from "../discovery/discovery.service";
import { establishmentPublicInclude, eventPublicInclude } from "../discovery/discovery.queries";
import { toSaoPauloIso } from "../common/timezone";
import {
  BARZINHO_CATEGORIES,
  NIGHT_CATEGORIES,
  SEO_TOPIC_META,
  SEO_WHEN_LABELS,
  buildLandingCopy,
  buildSeoPath,
  relatedSeoLinks,
  requestedSeoPath,
  resolveSeoRange,
  resolveSeoSlots,
  type SeoTopicId,
} from "./seo-intent";

export type SeoSitemapEntry = {
  path: string;
  lastModified: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly";
  priority: number;
};

@Injectable()
export class SeoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discovery: DiscoveryService,
  ) {}

  async landing(query: { city?: string; topic?: string; when?: string; slot?: string; slot2?: string }) {
    const resolved = resolveSeoSlots(query);
    if (!resolved) {
      throw new AppException("SEO_INTENT_NOT_FOUND", "Página de intenção não encontrada", HttpStatus.NOT_FOUND);
    }

    const city = resolved.citySlug
      ? await this.prisma.city.findFirst({ where: { slug: resolved.citySlug, active: true } })
      : null;
    if (resolved.citySlug && !city) {
      throw new AppException("CITY_NOT_FOUND", "Cidade não encontrada", HttpStatus.NOT_FOUND);
    }

    if (!resolved.citySlug && resolved.topic && resolved.topic !== "musica-ao-vivo") {
      throw new AppException("SEO_INTENT_NOT_FOUND", "Página de intenção não encontrada", HttpStatus.NOT_FOUND);
    }
    if (!resolved.citySlug && !resolved.topic && resolved.when !== "hoje" && resolved.when !== "amanha") {
      throw new AppException("SEO_INTENT_NOT_FOUND", "Página de intenção não encontrada", HttpStatus.NOT_FOUND);
    }

    const range = resolveSeoRange(resolved.when);
    const topicMeta = resolved.topic ? SEO_TOPIC_META[resolved.topic] : null;
    const eventRows = await this.prisma.event.findMany({
      where: this.eventWhere(resolved.citySlug, resolved.topic, range.start, range.end),
      include: eventPublicInclude,
      orderBy: { startAt: "asc" },
      take: 40,
    });
    const events = eventRows.map((row) => this.discovery.serializeEvent(row));

    const establishmentRows = await this.loadEstablishments({
      citySlug: resolved.citySlug,
      topic: resolved.topic,
      rangeStart: range.start,
      rangeEnd: range.end,
      eventRows,
    });
    const establishments = establishmentRows.map((row) => this.discovery.serializeEstablishment(row, false));

    const indexable = topicMeta?.venueOnly ? establishments.length > 0 : events.length > 0;
    const canonicalPath = buildSeoPath({
      city: resolved.citySlug,
      topic: resolved.topic,
      when: resolved.when,
    });
    const requestedPath = requestedSeoPath({
      city: resolved.citySlug,
      topic: resolved.requestedTopic,
      when: resolved.requestedWhen,
    });
    const copy = buildLandingCopy({
      cityName: city?.name,
      topic: resolved.topic,
      when: resolved.when,
      eventCount: events.length,
      eventTitles: events.map((item) => item.title),
      establishmentCount: establishments.length,
    });
    const lastSource = [...eventRows.map((row) => row.updatedAt), ...establishmentRows.map((row) => row.updatedAt)];
    const lastmod = lastSource.length
      ? lastSource.reduce((max, item) => (item > max ? item : max), lastSource[0]!)
      : new Date();

    return {
      city: city ? { id: city.id, name: city.name, slug: city.slug } : null,
      topic: topicMeta ? { id: topicMeta.id, slug: topicMeta.id, label: topicMeta.label } : null,
      when: resolved.when
        ? {
            id: resolved.when,
            slug: resolved.when,
            label: SEO_WHEN_LABELS[resolved.when],
            date: range.ymd,
          }
        : null,
      requestedPath,
      canonicalPath,
      isAlias: resolved.isAlias,
      indexable,
      ...copy,
      ogImage: events[0]?.cover?.url ?? establishments[0]?.cover?.url ?? null,
      lastmod: lastmod.toISOString(),
      events,
      establishments,
      related: relatedSeoLinks(resolved.citySlug, canonicalPath),
      faqs: this.faqs({
        cityName: city?.name,
        topic: resolved.topic,
        when: resolved.when,
        events,
      }),
      breadcrumbs: this.breadcrumbs({
        city: city ? { name: city.name, slug: city.slug } : null,
        topic: resolved.topic,
        when: resolved.when,
        h1: copy.h1,
      }),
    };
  }

  async sitemap(): Promise<{ generatedAt: string; entries: SeoSitemapEntry[] }> {
    const now = new Date();
    const upcomingStart = resolveSeoRange(null).start;
    const upcomingEnd = resolveSeoRange(null).end;
    const today = resolveSeoRange("hoje");
    const tomorrow = resolveSeoRange("amanha");

    const [cities, events, establishments, artists] = await Promise.all([
      this.prisma.city.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
      this.prisma.event.findMany({
        where: {
          deletedAt: null,
          status: "PUBLISHED",
          startAt: { gte: new Date(upcomingStart.getTime() - 86_400_000) },
          establishment: { deletedAt: null, status: "PUBLISHED" },
        },
        include: {
          establishment: { include: { city: true, categories: { include: { category: true } } } },
        },
        orderBy: { startAt: "asc" },
      }),
      this.prisma.establishment.findMany({
        where: { deletedAt: null, status: "PUBLISHED" },
        include: { city: true, categories: { include: { category: true } } },
      }),
      this.prisma.artist.findMany({
        where: { deletedAt: null, status: "PUBLISHED" },
        select: { slug: true, updatedAt: true, city: { select: { slug: true } } },
      }),
    ]);

    const entries = new Map<string, SeoSitemapEntry>();
    const put = (entry: SeoSitemapEntry) => {
      const current = entries.get(entry.path);
      if (!current || current.lastModified < entry.lastModified) {
        entries.set(entry.path, entry);
      }
    };

    put({ path: "/", lastModified: now.toISOString(), changeFrequency: "daily", priority: 1 });
    put({ path: "/musicos", lastModified: now.toISOString(), changeFrequency: "weekly", priority: 0.4 });

    const todayEvents = events.filter((item) => item.startAt >= today.start && item.startAt < today.end);
    const tomorrowEvents = events.filter((item) => item.startAt >= tomorrow.start && item.startAt < tomorrow.end);
    const liveUpcoming = events.filter(
      (item) => item.eventType === "LIVE_MUSIC" && item.startAt >= upcomingStart && item.startAt < upcomingEnd,
    );
    if (todayEvents.length) {
      put({
        path: "/hoje",
        lastModified: this.maxUpdated(todayEvents),
        changeFrequency: "hourly",
        priority: 0.9,
      });
    }
    if (tomorrowEvents.length) {
      put({
        path: "/amanha",
        lastModified: this.maxUpdated(tomorrowEvents),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
    if (liveUpcoming.length) {
      put({
        path: "/musica-ao-vivo",
        lastModified: this.maxUpdated(liveUpcoming),
        changeFrequency: "daily",
        priority: 0.8,
      });
      if (todayEvents.some((item) => item.eventType === "LIVE_MUSIC")) {
        put({
          path: "/musica-ao-vivo/hoje",
          lastModified: this.maxUpdated(todayEvents.filter((item) => item.eventType === "LIVE_MUSIC")),
          changeFrequency: "hourly",
          priority: 0.85,
        });
      }
    }

    for (const city of cities) {
      const cityEvents = events.filter((item) => item.establishment.city.slug === city.slug);
      const cityPlaces = establishments.filter((item) => item.city.slug === city.slug);
      if (!cityEvents.length && !cityPlaces.length) {
        continue;
      }
      put({
        path: `/${city.slug}`,
        lastModified: this.maxUpdated([...cityEvents, ...cityPlaces]),
        changeFrequency: "daily",
        priority: 0.8,
      });

      const landings = this.cityLandingIndex(city.slug, cityEvents, cityPlaces, upcomingStart, upcomingEnd);
      for (const landing of landings) {
        put(landing);
      }
    }

    for (const event of events) {
      put({
        path: `/eventos/${event.slug}`,
        lastModified: event.updatedAt.toISOString(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    for (const place of establishments) {
      put({
        path: `/lugares/${place.slug}`,
        lastModified: place.updatedAt.toISOString(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
    for (const artist of artists) {
      put({
        path: `/musicos/${artist.slug}`,
        lastModified: artist.updatedAt.toISOString(),
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }

    return { generatedAt: now.toISOString(), entries: [...entries.values()] };
  }

  private cityLandingIndex(
    citySlug: string,
    events: Array<{
      eventType: string;
      startAt: Date;
      updatedAt: Date;
      establishment: { categories: Array<{ category: { slug: string } }> };
    }>,
    places: Array<{ updatedAt: Date; categories: Array<{ category: { slug: string } }> }>,
    upcomingStart: Date,
    upcomingEnd: Date,
  ) {
    const entries: SeoSitemapEntry[] = [];
    const topics: SeoTopicId[] = [
      "musica-ao-vivo",
      "barzinho-com-show",
      "boteco",
      "casa-noturna",
      "programacao",
    ];
    const whens = ["hoje", "amanha", "segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"] as const;

    for (const topic of topics) {
      const upcoming = events.filter(
        (item) => item.startAt >= upcomingStart && item.startAt < upcomingEnd && this.eventMatchesTopic(item, topic),
      );
      const venuePlaces = this.placesMatchingTopic(places, topic);
      const indexable = SEO_TOPIC_META[topic].venueOnly ? venuePlaces.length > 0 : upcoming.length > 0;
      if (indexable) {
        entries.push({
          path: buildSeoPath({ city: citySlug, topic }),
          lastModified: this.maxUpdated(SEO_TOPIC_META[topic].venueOnly ? venuePlaces : upcoming),
          changeFrequency: "daily",
          priority: 0.75,
        });
      }
      for (const when of whens) {
        const range = resolveSeoRange(when);
        const dayEvents = events.filter(
          (item) => item.startAt >= range.start && item.startAt < range.end && this.eventMatchesTopic(item, topic),
        );
        const dayIndexable = SEO_TOPIC_META[topic].venueOnly
          ? venuePlaces.length > 0 && dayEvents.length > 0
          : dayEvents.length > 0;
        if (!dayIndexable) {
          continue;
        }
        entries.push({
          path: buildSeoPath({ city: citySlug, topic, when }),
          lastModified: this.maxUpdated(dayEvents),
          changeFrequency: when === "hoje" ? "hourly" : "weekly",
          priority: when === "hoje" ? 0.8 : 0.65,
        });
      }
    }

    for (const when of whens) {
      const range = resolveSeoRange(when);
      const dayEvents = events.filter((item) => item.startAt >= range.start && item.startAt < range.end);
      if (!dayEvents.length) {
        continue;
      }
      entries.push({
        path: buildSeoPath({ city: citySlug, when }),
        lastModified: this.maxUpdated(dayEvents),
        changeFrequency: when === "hoje" ? "hourly" : "weekly",
        priority: when === "hoje" ? 0.85 : 0.7,
      });
    }

    return entries;
  }

  private eventMatchesTopic(
    event: { eventType: string; establishment: { categories: Array<{ category: { slug: string } }> } },
    topic: SeoTopicId,
  ) {
    const slugs = event.establishment.categories.map((item) => item.category.slug);
    if (topic === "programacao") {
      return true;
    }
    if (topic === "musica-ao-vivo") {
      return event.eventType === "LIVE_MUSIC";
    }
    if (topic === "barzinho-com-show") {
      return event.eventType === "LIVE_MUSIC" && slugs.some((slug) => BARZINHO_CATEGORIES.includes(slug as (typeof BARZINHO_CATEGORIES)[number]));
    }
    if (topic === "boteco") {
      return slugs.includes("boteco");
    }
    if (topic === "casa-noturna") {
      return slugs.some((slug) => NIGHT_CATEGORIES.includes(slug as (typeof NIGHT_CATEGORIES)[number]));
    }
    return false;
  }

  private placesMatchingTopic<T extends { categories: Array<{ category: { slug: string } }> }>(
    places: T[],
    topic: SeoTopicId,
  ) {
    const meta = SEO_TOPIC_META[topic];
    if (!meta.categories.length) {
      return topic === "programacao" ? places : [];
    }
    return places.filter((place) =>
      place.categories.some((item) => meta.categories.includes(item.category.slug)),
    );
  }

  private eventWhere(
    citySlug: string | undefined,
    topic: SeoTopicId | null,
    start: Date,
    end: Date,
  ): Prisma.EventWhereInput {
    const categoryFilter = this.topicCategoryFilter(topic);
    return {
      deletedAt: null,
      status: "PUBLISHED",
      startAt: { gte: start, lt: end },
      ...(topic && SEO_TOPIC_META[topic].liveMusic ? { eventType: "LIVE_MUSIC" } : {}),
      establishment: {
        deletedAt: null,
        status: "PUBLISHED",
        ...(citySlug ? { city: { slug: citySlug, active: true } } : {}),
        ...(categoryFilter ? { categories: categoryFilter } : {}),
      },
    };
  }

  private topicCategoryFilter(topic: SeoTopicId | null): Prisma.EstablishmentCategoryListRelationFilter | undefined {
    if (!topic) {
      return undefined;
    }
    const categories = SEO_TOPIC_META[topic].categories;
    if (!categories.length) {
      return undefined;
    }
    return { some: { category: { slug: { in: categories } } } };
  }

  private async loadEstablishments(input: {
    citySlug?: string;
    topic: SeoTopicId | null;
    rangeStart: Date;
    rangeEnd: Date;
    eventRows: Array<{ establishmentId: string }>;
  }) {
    const topic = input.topic;
    const venueOnly = topic ? SEO_TOPIC_META[topic].venueOnly : false;
    const idsFromEvents = [...new Set(input.eventRows.map((row) => row.establishmentId))];

    if (venueOnly) {
      return this.prisma.establishment.findMany({
        where: {
          deletedAt: null,
          status: "PUBLISHED",
          ...(input.citySlug ? { city: { slug: input.citySlug, active: true } } : {}),
          categories: this.topicCategoryFilter(topic),
        },
        include: establishmentPublicInclude,
        take: 24,
      });
    }

    if (idsFromEvents.length) {
      return this.prisma.establishment.findMany({
        where: { id: { in: idsFromEvents }, deletedAt: null, status: "PUBLISHED" },
        include: establishmentPublicInclude,
      });
    }

    if (!topic && input.citySlug) {
      return this.prisma.establishment.findMany({
        where: {
          deletedAt: null,
          status: "PUBLISHED",
          city: { slug: input.citySlug, active: true },
          events: {
            some: {
              deletedAt: null,
              status: "PUBLISHED",
              startAt: { gte: input.rangeStart, lt: input.rangeEnd },
            },
          },
        },
        include: establishmentPublicInclude,
        take: 24,
      });
    }

    return [];
  }

  private faqs(input: {
    cityName?: string;
    topic: SeoTopicId | null;
    when: Parameters<typeof buildLandingCopy>[0]["when"];
    events: Array<{
      title: string;
      startAt: Date;
      establishment: { name: string };
    }>;
  }) {
    if (input.events.length < 1) {
      return [];
    }
    const place = input.cityName ?? "o 019";
    const label = input.topic ? SEO_TOPIC_META[input.topic].label.toLowerCase() : "programação";
    const whenLabel = input.when ? SEO_WHEN_LABELS[input.when] : "nos próximos dias";
    const venues = [...new Set(input.events.map((item) => item.establishment.name))];
    const first = input.events[0]!;
    const items = [
      {
        question: `Onde tem ${label} em ${place} ${whenLabel}?`,
        answer: `A pauta publicada aponta para ${venues.slice(0, 4).join(", ")}.`,
      },
    ];
    if (input.events.length >= 2) {
      items.push({
        question: `Que horas começa em ${place}?`,
        answer: `O primeiro horário publicado é ${toSaoPauloIso(first.startAt).slice(11, 16)} em ${first.establishment.name}.`,
      });
    }
    return items;
  }

  private breadcrumbs(input: {
    city: { name: string; slug: string } | null;
    topic: SeoTopicId | null;
    when: Parameters<typeof buildLandingCopy>[0]["when"];
    h1: string;
  }) {
    const items = [{ href: "/", label: "Início" }];
    if (input.city) {
      items.push({ href: `/${input.city.slug}`, label: input.city.name });
    }
    if (input.topic) {
      items.push({
        href: buildSeoPath({ city: input.city?.slug, topic: input.topic }),
        label: SEO_TOPIC_META[input.topic].label,
      });
    }
    if (input.when) {
      items.push({
        href: buildSeoPath({ city: input.city?.slug, topic: input.topic, when: input.when }),
        label: SEO_WHEN_LABELS[input.when].replace(/^./, (char) => char.toUpperCase()),
      });
    }
    if (items[items.length - 1]?.label !== input.h1 && items.length === 1) {
      items.push({ href: buildSeoPath({ city: input.city?.slug, topic: input.topic, when: input.when }), label: input.h1 });
    }
    return items;
  }

  private maxUpdated(rows: Array<{ updatedAt: Date }>) {
    if (!rows.length) {
      return new Date().toISOString();
    }
    return rows.reduce((max, row) => (row.updatedAt > max ? row.updatedAt : max), rows[0]!.updatedAt).toISOString();
  }
}
