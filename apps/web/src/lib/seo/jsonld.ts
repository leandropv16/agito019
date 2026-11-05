import type { ArtistCardData, EventCardData, SeoLanding } from "@/lib/types";
import { siteUrl, toSaoPauloIso } from "./site";

export function websiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": `${siteUrl("/")}#website`,
    name: "AGITO019",
    url: siteUrl("/"),
    inLanguage: "pt-BR",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl("/explorar")}?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@type": "Organization",
    "@id": `${siteUrl("/")}#organization`,
    name: "AGITO019",
    url: siteUrl("/"),
    logo: siteUrl("/brand/agito019-logo.png"),
    areaServed: "Região 019 · São Paulo",
    description: "Bares, música ao vivo, eventos e promoções em Campinas e na região 019.",
  };
}

export function breadcrumbJsonLd(items: Array<{ href: string; label: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: siteUrl(item.href),
    })),
  };
}

export function itemListJsonLd(name: string, items: Array<{ url: string; name: string }>) {
  return {
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: item.url,
      name: item.name,
    })),
  };
}

export function eventJsonLd(event: EventCardData & { description?: string | null; endAt?: string | null }) {
  const isMusic = event.eventType === "LIVE_MUSIC";
  return {
    "@type": isMusic ? "MusicEvent" : "Event",
    name: event.title,
    description: event.description ?? undefined,
    startDate: toSaoPauloIso(event.startAt),
    endDate: event.endAt ? toSaoPauloIso(event.endAt) : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: event.cover?.url ?? undefined,
    url: siteUrl(`/eventos/${event.slug}`),
    location: {
      "@type": "Place",
      name: event.establishment.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.establishment.city.name,
        addressRegion: "SP",
        addressCountry: "BR",
      },
      geo:
        event.establishment.latitude != null && event.establishment.longitude != null
          ? {
              "@type": "GeoCoordinates",
              latitude: event.establishment.latitude,
              longitude: event.establishment.longitude,
            }
          : undefined,
    },
    performer: event.artists.map((artist) => ({
      "@type": artist.type === "BAND" ? "MusicGroup" : "Person",
      name: artist.name,
      url: siteUrl(`/musicos/${artist.slug}`),
    })),
    organizer: {
      "@type": "Organization",
      name: "AGITO019",
      url: siteUrl("/"),
    },
  };
}

export function placeJsonLd(item: {
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  addressStreet?: string | null;
  addressNumber?: string | null;
  neighborhood?: string | null;
  postalCode?: string | null;
  latitude: number;
  longitude: number;
  city: { name: string };
  categories: Array<{ name?: string; slug?: string }>;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
  phone?: string | null;
}) {
  const slugs = item.categories.map((category) => category.slug ?? "").filter(Boolean);
  const type = slugs.some((slug) => slug === "restaurante")
    ? "Restaurant"
    : slugs.some((slug) => slug === "balada" || slug === "casa-de-shows")
      ? "NightClub"
      : slugs.some((slug) => slug === "bar" || slug === "boteco" || slug === "pub")
        ? "BarOrPub"
        : "LocalBusiness";
  return {
    "@type": type,
    name: item.name,
    description: item.shortDescription ?? item.description ?? undefined,
    url: siteUrl(`/lugares/${item.slug}`),
    telephone: item.phone ?? undefined,
    sameAs: [item.instagramUrl, item.websiteUrl].filter((value): value is string => Boolean(value)),
    address: {
      "@type": "PostalAddress",
      streetAddress: `${item.addressStreet ?? ""} ${item.addressNumber ?? ""}`.trim() || undefined,
      addressLocality: item.city.name,
      addressRegion: "SP",
      postalCode: item.postalCode ?? undefined,
      addressCountry: "BR",
    },
    geo: { "@type": "GeoCoordinates", latitude: item.latitude, longitude: item.longitude },
  };
}

export function artistJsonLd(artist: ArtistCardData & { bio?: string | null }) {
  return {
    "@type": artist.type === "BAND" ? "MusicGroup" : "Person",
    name: artist.name,
    description: artist.bio ?? undefined,
    url: siteUrl(`/musicos/${artist.slug}`),
    image: artist.cover?.url ?? undefined,
  };
}

export function landingGraph(landing: SeoLanding) {
  const graph: object[] = [breadcrumbJsonLd(landing.breadcrumbs)];
  if (landing.events.length) {
    graph.push(
      itemListJsonLd(
        landing.h1,
        landing.events.map((item) => ({ url: siteUrl(`/eventos/${item.slug}`), name: item.title })),
      ),
      ...landing.events.map((item) => eventJsonLd(item)),
    );
  }
  if (landing.establishments.length) {
    graph.push(
      ...landing.establishments.map((item) =>
        placeJsonLd({
          name: item.name,
          slug: item.slug,
          shortDescription: item.shortDescription,
          neighborhood: item.neighborhood,
          latitude: item.latitude,
          longitude: item.longitude,
          city: item.city,
          categories: item.categories,
        }),
      ),
    );
  }
  if (landing.faqs.length >= 2) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: landing.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

export function pageGraph(nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
