import { Injectable, Logger } from "@nestjs/common";
import { pathsForPublishedEvent } from "./seo-intent";

type EventLike = {
  slug: string;
  status?: string;
  eventType: string;
  startAt: Date | string;
  establishment: {
    slug: string;
    city: { slug: string };
    categories?: Array<{ slug: string }>;
  };
};

type PlaceLike = {
  slug: string;
  status?: string;
  city: { slug: string };
  categories?: Array<{ slug: string }>;
};

type ArtistLike = {
  slug: string;
  status?: string;
  city?: { slug: string } | null;
};

type PromotionLike = {
  establishment: { slug: string; city: { slug: string } };
};

@Injectable()
export class SeoRevalidateService {
  private readonly logger = new Logger(SeoRevalidateService.name);

  async notifyEvent(event: EventLike) {
    const startAt = event.startAt instanceof Date ? event.startAt : new Date(event.startAt);
    const paths = pathsForPublishedEvent({
      citySlug: event.establishment.city.slug,
      eventSlug: event.slug,
      placeSlug: event.establishment.slug,
      eventType: event.eventType,
      startAt,
      categorySlugs: event.establishment.categories?.map((item) => item.slug) ?? [],
    });
    await this.ping(paths, ["public", "seo", "sitemap", `seo:city:${event.establishment.city.slug}`]);
  }

  async notifyPlace(place: PlaceLike) {
    const city = place.city.slug;
    const paths = [
      "/",
      "/explorar",
      "/sitemap.xml",
      `/${city}`,
      `/${city}/boteco`,
      `/${city}/casa-noturna`,
      `/${city}/barzinho-com-show`,
      `/${city}/programacao`,
      `/lugares/${place.slug}`,
    ];
    await this.ping(paths, ["public", "seo", "sitemap", `seo:city:${city}`]);
  }

  async notifyArtist(artist: ArtistLike) {
    const paths = ["/", "/musicos", "/sitemap.xml", `/musicos/${artist.slug}`];
    if (artist.city?.slug) {
      paths.push(`/${artist.city.slug}`);
    }
    await this.ping(paths, ["public", "seo", "sitemap"]);
  }

  async notifyPromotion(promo: PromotionLike) {
    const city = promo.establishment.city.slug;
    await this.ping(
      ["/", `/${city}`, `/lugares/${promo.establishment.slug}`, "/sitemap.xml"],
      ["public", "seo", "sitemap", `seo:city:${city}`],
    );
  }

  async notifyCatalog() {
    await this.ping(["/", "/sitemap.xml"], ["public", "seo", "sitemap"]);
  }

  private async ping(paths: string[], tags: string[]) {
    const frontend = (process.env.FRONTEND_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const secret = process.env.REVALIDATE_SECRET;
    if (!secret) {
      this.logger.debug("REVALIDATE_SECRET ausente. Publicação segue sem revalidar o web.");
      return;
    }
    try {
      const response = await fetch(`${frontend}/api/revalidate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-revalidate-secret": secret,
        },
        body: JSON.stringify({ paths: [...new Set(paths)], tags: [...new Set(tags)] }),
      });
      if (!response.ok) {
        this.logger.warn(`Revalidação SEO retornou ${response.status}`);
      }
    } catch (error) {
      this.logger.warn(`Falha ao revalidar SEO no web: ${error instanceof Error ? error.message : "erro"}`);
    }
  }
}
