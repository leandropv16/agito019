import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, Music } from "lucide-react";
import { Breadcrumbs } from "@/components/agito/breadcrumbs";
import { CoverImage } from "@/components/agito/cover";
import { AgendaStatusBadge, FeaturedBadge, GenreBadge, PromotionBadge } from "@/components/agito/badges";
import { EventCoverBrandBadge } from "@/components/agito/event-cover-brand-badge";
import { EventFormatBadge } from "@/components/agito/event-format-badge";
import { EventReportForm } from "@/components/agito/event-report-form";
import { JsonLd } from "@/components/agito/json-ld";
import { MapLoader } from "@/components/agito/map-loader";
import { TrackedLink } from "@/components/agito/tracked-link";
import { Intro, Reveal } from "@/components/agito/motion";
import { ApiError, publicGet } from "@/lib/api";
import { breadcrumbJsonLd, eventJsonLd, pageGraph } from "@/lib/seo/jsonld";
import { siteUrl } from "@/lib/seo/site";
import { formatEntryPrice, formatWhen, googleMapsUrl, ticketParts, waLink } from "@/lib/utils";
import type { EventCardData } from "@/lib/types";

type EventDetail = EventCardData & {
  description?: string | null;
  endAt?: string | null;
  establishment: EventCardData["establishment"] & {
    id: string;
    latitude: number;
    longitude: number;
  };
};

async function load(slug: string) {
  try {
    return await publicGet<EventDetail>(`/public/events/${slug}`, {
      next: { revalidate: 60, tags: ["public", "seo", `seo:event:${slug}`] },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const event = await load((await params).slug);
  const title = `${event.title} em ${event.establishment.city.name}`;
  const description =
    event.description ??
    `${event.title} em ${event.establishment.name} · ${event.establishment.city.name}. Horário e como chegar no AGITO019.`;
  const url = siteUrl(`/eventos/${event.slug}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      locale: "pt_BR",
      type: "website",
      siteName: "AGITO019",
      images: event.cover?.url ? [{ url: event.cover.url, alt: event.title }] : undefined,
    },
    twitter: {
      card: event.cover?.url ? "summary_large_image" : "summary",
      title,
      description,
    },
  };
}

export default async function EventoPage({ params }: { params: Promise<{ slug: string }> }) {
  const event = await load((await params).slug);
  const maps = googleMapsUrl(event.establishment.latitude, event.establishment.longitude, event.establishment.googleMapsUrl);
  const date = ticketParts(event.startAt);
  const price = formatEntryPrice(event.entryPriceType, event.entryPriceCents);
  const promotionTitle = event.establishment.promotions?.find((promo) => promo.title)?.title;
  const whatsapp = waLink(event.establishment.whatsapp);
  const crumbs = [
    { href: "/", label: "Início" },
    { href: `/${event.establishment.city.slug}`, label: event.establishment.city.name },
    { href: `/${event.establishment.city.slug}/programacao`, label: "Programação" },
    { href: `/eventos/${event.slug}`, label: event.title },
  ];

  return (
    <article>
      <JsonLd data={pageGraph([breadcrumbJsonLd(crumbs), eventJsonLd(event)])} />
      <Intro className="relative min-h-[440px] sm:min-h-[480px]">
        <CoverImage cover={event.cover} alt={event.title} />
        <EventCoverBrandBadge size="md" className="top-4 right-4" />
        <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a] via-[#0a0a0a]/55 to-black/20" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8">
          <Breadcrumbs items={crumbs} className="text-white/70" />
          <div className="mt-4 flex flex-wrap gap-2">
            <EventFormatBadge event={event} size="md" />
            <FeaturedBadge badge={event.establishment.badge} />
            <AgendaStatusBadge status={event.agendaStatus} />
            {promotionTitle ? <PromotionBadge title={promotionTitle} /> : null}
            {price ? (
              <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1 text-sm font-semibold">{price}</span>
            ) : null}
          </div>
          <p data-intro className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Evento no 019</p>
          <h1 data-intro className="mt-2 max-w-3xl break-words font-display text-3xl leading-tight sm:text-4xl md:text-6xl">{event.title}</h1>
          <p data-intro className="mt-3 flex items-start gap-2 break-words text-white/80">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span className="min-w-0">
            {event.establishment.name} · {event.establishment.city.name}
            </span>
          </p>
        </div>
      </Intro>

      <Reveal>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-wrap gap-2">
            {event.genres.map((genre) => (
              <GenreBadge key={genre.id} name={genre.name} />
            ))}
          </div>
          {event.description ? <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{event.description}</p> : null}
          <section className="mt-10">
            <h2 className="font-display text-2xl">Line-up</h2>
            <div className="mt-4 grid gap-3">
              {event.artists.map((artist) => (
                <Link key={artist.id} href={`/musicos/${artist.slug}`} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                  <Music className="size-5 text-primary" />
                  <span className="font-semibold">{artist.name}</span>
                </Link>
              ))}
            </div>
          </section>
          <section className="mt-10">
            <h2 className="mb-3 font-display text-2xl">Local</h2>
            <MapLoader
              center={[event.establishment.latitude, event.establishment.longitude]}
              points={[
                {
                  id: event.id,
                  name: event.establishment.name,
                  slug: event.establishment.slug,
                  latitude: event.establishment.latitude,
                  longitude: event.establishment.longitude,
                  city: event.establishment.city.name,
                  event: event.title,
                },
              ]}
            />
          </section>
          <EventReportForm eventId={event.id} />
        </div>

        <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border border-border bg-card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ingresso / acesso</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="grid size-16 place-items-center rounded-xl bg-secondary">
              <span className="font-display text-2xl leading-none">{date.day}</span>
            </div>
            <div>
              <p className="font-semibold">
                {date.weekday} · {date.month}
              </p>
              <p className="text-sm text-muted-foreground">{date.time}</p>
            </div>
          </div>
          {price ? <p className="mt-4 text-lg font-semibold text-primary">{price}</p> : null}
          <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
            <Calendar className="mt-0.5 size-4" />
            {formatWhen(event.startAt)}
          </p>
          <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span>
              {event.establishment.name}
              <span className="block">{event.establishment.city.name}</span>
            </span>
          </p>
          <TrackedLink
            href={maps}
            target="ROUTE"
            entityType="EVENT"
            entityId={event.id}
            className="mt-5 flex h-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          >
            Como chegar
          </TrackedLink>
          {whatsapp ? (
            <TrackedLink
              href={whatsapp}
              target="WHATSAPP"
              entityType="EVENT"
              entityId={event.id}
              className="mt-2 flex h-12 items-center justify-center rounded-full border border-border text-sm font-semibold"
            >
              WhatsApp do local
            </TrackedLink>
          ) : null}
          {event.establishment.instagramUrl ? (
            <TrackedLink
              href={event.establishment.instagramUrl}
              target="INSTAGRAM"
              entityType="EVENT"
              entityId={event.id}
              className="mt-2 flex h-12 items-center justify-center rounded-full border border-border text-sm font-semibold"
            >
              Instagram
            </TrackedLink>
          ) : null}
          <Link href={`/lugares/${event.establishment.slug}`} className="mt-2 flex h-12 items-center justify-center rounded-full border border-border text-sm font-semibold">
            Ver local
          </Link>
        </aside>
      </div>
      </Reveal>
    </article>
  );
}
