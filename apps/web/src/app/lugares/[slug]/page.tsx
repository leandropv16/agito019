import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AudienceBadge, FeaturedBadge, GenreBadge, PromotionBadge } from "@/components/agito/badges";
import { CoverImage } from "@/components/agito/cover";
import { ImageGallery } from "@/components/agito/image-gallery";
import { MapLoader } from "@/components/agito/map-loader";
import { Breadcrumbs } from "@/components/agito/breadcrumbs";
import { JsonLd } from "@/components/agito/json-ld";
import { TrackedLink } from "@/components/agito/tracked-link";
import { publicGet, ApiError } from "@/lib/api";
import { breadcrumbJsonLd, pageGraph, placeJsonLd } from "@/lib/seo/jsonld";
import { siteUrl } from "@/lib/seo/site";
import { formatHour, formatWhen, googleMapsUrl, waLink } from "@/lib/utils";
import { DAY_OF_WEEK_LABELS, type DayOfWeek } from "@/lib/shared";

type Detail = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  neighborhood?: string | null;
  addressStreet?: string | null;
  addressNumber?: string | null;
  latitude: number;
  longitude: number;
  googleMapsUrl?: string | null;
  instagramUrl?: string | null;
  websiteUrl?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  city: { name: string; slug: string };
  categories: Array<{ name: string }>;
  audiences?: Array<{ name: string }>;
  amenities?: Array<{ name: string }>;
  businessHours?: Array<{ dayOfWeek: DayOfWeek; opensAt: string | null; closesAt: string | null; closed: boolean }>;
  media?: Array<{ id: string; url: string | null; altText: string | null; isCover: boolean }>;
  cover: { url: string | null; thumbnailUrl: string | null; altText: string | null } | null;
  badge: "DESTAQUE" | "PATROCINADO" | null;
  promotions: Array<{ id: string; title: string; description?: string | null }>;
  events?: Array<{
    id: string;
    title: string;
    slug: string;
    startAt: string;
    artists: Array<{ name: string; slug: string }>;
    genres: Array<{ name: string }>;
  }>;
};

async function load(slug: string) {
  try {
    return await publicGet<Detail>(`/public/establishments/${slug}`, {
      next: { revalidate: 60, tags: ["public", "seo", `seo:place:${slug}`] },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = await load(slug);
  const title = `${item.name} em ${item.city.name}`;
  const description =
    item.shortDescription ?? item.description ?? `Programação e endereço de ${item.name} em ${item.city.name}.`;
  const url = siteUrl(`/lugares/${item.slug}`);
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
      images: item.cover?.url ? [{ url: item.cover.url, alt: item.name }] : undefined,
    },
    twitter: { card: item.cover?.url ? "summary_large_image" : "summary", title, description },
  };
}

export default async function LugarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await load(slug);
  const maps = googleMapsUrl(item.latitude, item.longitude, item.googleMapsUrl);
  const crumbs = [
    { href: "/", label: "Início" },
    { href: `/${item.city.slug}`, label: item.city.name },
    { href: `/lugares/${item.slug}`, label: item.name },
  ];

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <JsonLd data={pageGraph([breadcrumbJsonLd(crumbs), placeJsonLd(item)])} />
      <Breadcrumbs items={crumbs} />
      <div className="grid gap-6 lg:grid-cols-[1.4fr_320px]">
        <div>
      {item.media?.length ? (
        <ImageGallery images={item.media} alt={item.name} />
      ) : (
        <div className="relative aspect-16/10 overflow-hidden rounded-2xl">
          <CoverImage cover={item.cover} alt={item.name} />
        </div>
      )}
        </div>
        <aside className="h-fit rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24">
          <div className="flex flex-wrap items-center gap-2">
            <FeaturedBadge badge={item.badge} />
            {item.categories.map((category) => (
              <span key={category.name} className="text-sm text-muted-foreground">
                {category.name}
              </span>
            ))}
          </div>
          <h1 className="mt-3 break-words font-display text-2xl sm:text-3xl">{item.name}</h1>
          <p className="mt-2 text-muted-foreground">
            {item.neighborhood ? `${item.neighborhood} · ` : ""}
            {item.city.name}
          </p>
          <TrackedLink
            href={maps}
            target="ROUTE"
            entityType="ESTABLISHMENT"
            entityId={item.id}
            className="mt-5 flex h-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
          >
            Como chegar
          </TrackedLink>
          {item.instagramUrl ? (
            <TrackedLink
              href={item.instagramUrl}
              target="INSTAGRAM"
              entityType="ESTABLISHMENT"
              entityId={item.id}
              className="mt-2 flex h-12 items-center justify-center rounded-full border border-border text-sm font-semibold"
            >
              Instagram
            </TrackedLink>
          ) : null}
          {waLink(item.whatsapp) ? (
            <TrackedLink
              href={waLink(item.whatsapp)!}
              target="WHATSAPP"
              entityType="ESTABLISHMENT"
              entityId={item.id}
              className="mt-2 flex h-12 items-center justify-center rounded-full border border-border text-sm font-semibold"
            >
              WhatsApp
            </TrackedLink>
          ) : null}
          {item.phone ? (
            <TrackedLink
              href={`tel:${item.phone}`}
              target="PHONE"
              entityType="ESTABLISHMENT"
              entityId={item.id}
              external={false}
              className="mt-2 flex h-12 items-center justify-center rounded-full border border-border text-sm font-semibold"
            >
              Ligar
            </TrackedLink>
          ) : null}
        </aside>
      </div>
      {item.description ? <p className="mt-6 max-w-3xl leading-relaxed text-muted-foreground">{item.description}</p> : null}
      <div className="mt-6 flex flex-wrap gap-2">
        {item.audiences?.map((audience) => (
          <AudienceBadge key={audience.name} name={audience.name} />
        ))}
      </div>
      {item.amenities?.length ? (
        <ul className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
          {item.amenities.map((amenity) => (
            <li key={amenity.name} className="rounded-full bg-secondary px-3 py-1">
              {amenity.name}
            </li>
          ))}
        </ul>
      ) : null}
      {item.promotions.length ? (
        <section className="mt-8">
          <h2 className="font-display text-2xl">Promoções</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.promotions.map((promo) => (
              <PromotionBadge key={promo.id} title={promo.title} />
            ))}
          </div>
        </section>
      ) : null}
      {item.events?.length ? (
        <section className="mt-8">
          <h2 className="font-display text-2xl">Programação</h2>
          <div className="mt-3 grid gap-3">
            {item.events.map((event) => (
              <Link key={event.id} href={`/eventos/${event.slug}`} className="rounded-2xl border border-border p-4">
                <p className="text-xs text-primary">{formatWhen(event.startAt)}</p>
                <p className="font-semibold">{event.title}</p>
                <p className="text-sm text-muted-foreground">{event.artists.map((artist) => artist.name).join(", ")}</p>
                <div className="mt-2 flex gap-1">
                  {event.genres.map((genre) => (
                    <GenreBadge key={genre.name} name={genre.name} />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
      {item.businessHours?.length ? (
        <section className="mt-8">
          <h2 className="font-display text-2xl">Horários</h2>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {item.businessHours.map((hour) => (
              <li key={hour.dayOfWeek}>
                {DAY_OF_WEEK_LABELS[hour.dayOfWeek]}: {hour.closed ? "Fechado" : `${formatHour(hour.opensAt)} a ${formatHour(hour.closesAt)}`}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-2xl">Mapa</h2>
        <MapLoader
          center={[item.latitude, item.longitude]}
          points={[
            {
              id: item.slug,
              name: item.name,
              slug: item.slug,
              latitude: item.latitude,
              longitude: item.longitude,
              neighborhood: item.neighborhood,
              city: item.city.name,
              photo: item.cover?.url,
            },
          ]}
        />
      </section>
    </article>
  );
}
