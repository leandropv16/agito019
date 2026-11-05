import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTIST_TYPE_LABELS } from "@/lib/shared";
import { Breadcrumbs } from "@/components/agito/breadcrumbs";
import { CoverImage } from "@/components/agito/cover";
import { GenreBadge } from "@/components/agito/badges";
import { JsonLd } from "@/components/agito/json-ld";
import { TrackedLink } from "@/components/agito/tracked-link";
import { Intro, Stagger } from "@/components/agito/motion";
import { ApiError, publicGet } from "@/lib/api";
import { artistJsonLd, breadcrumbJsonLd, pageGraph } from "@/lib/seo/jsonld";
import { siteUrl } from "@/lib/seo/site";
import { formatDay, formatTime, waLink, youtubeEmbedUrl } from "@/lib/utils";
import type { ArtistCardData } from "@/lib/types";

type ArtistDetail = ArtistCardData & {
  bio?: string | null;
  agenda: Array<{
    id: string;
    title: string;
    slug: string;
    startAt: string;
    establishment: { name: string; slug: string; city: { name: string } };
  }>;
};

async function load(slug: string) {
  try {
    return await publicGet<ArtistDetail>(`/public/artists/${slug}`, {
      next: { revalidate: 60, tags: ["public", "seo", `seo:artist:${slug}`] },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const artist = await load((await params).slug);
  const title = `${artist.name} no 019`;
  const description = artist.bio ?? `Agenda de ${artist.name} em ${artist.city?.name ?? "a região 019"}.`;
  const url = siteUrl(`/musicos/${artist.slug}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { title, description, url, locale: "pt_BR", type: "website", siteName: "AGITO019" },
    twitter: { card: "summary", title, description },
  };
}

export default async function MusicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const artist = await load((await params).slug);
  const embed = youtubeEmbedUrl(artist.videoUrl);
  const hire = artist.hireUrl || waLink(artist.whatsapp);
  const crumbs = [
    { href: "/", label: "Início" },
    { href: "/musicos", label: "Músicos" },
    { href: `/musicos/${artist.slug}`, label: artist.name },
  ];
  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <JsonLd data={pageGraph([breadcrumbJsonLd(crumbs), artistJsonLd(artist)])} />
      <Breadcrumbs items={crumbs} />
      <Intro>
      <div data-intro className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-full border border-border">
        <CoverImage cover={artist.cover} alt={artist.name} />
      </div>
      <p data-intro className="mt-6 text-center text-xs uppercase tracking-wide text-primary">{ARTIST_TYPE_LABELS[artist.type]}</p>
      <h1 data-intro className="break-words px-2 text-center font-display text-3xl sm:text-4xl">{artist.name}</h1>
      <p data-intro className="mt-2 text-center text-muted-foreground">{artist.city?.name ?? "Região 019"}</p>
      </Intro>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {artist.genres.map((genre) => (
          <GenreBadge key={genre.id} name={genre.name} />
        ))}
      </div>
      {artist.bio ? <p className="mt-6 text-center text-muted-foreground">{artist.bio}</p> : null}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {hire ? (
          <TrackedLink
            href={hire}
            target="WHATSAPP"
            entityType="ARTIST"
            entityId={artist.id}
            className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground"
          >
            Contratar
          </TrackedLink>
        ) : null}
        {artist.instagramUrl ? (
          <TrackedLink
            href={artist.instagramUrl}
            target="INSTAGRAM"
            entityType="ARTIST"
            entityId={artist.id}
            className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-semibold"
          >
            Instagram
          </TrackedLink>
        ) : null}
      </div>
      {embed ? (
        <section className="mt-10">
          <h2 className="font-display text-2xl">Vídeo</h2>
          <div className="mt-4 aspect-video overflow-hidden rounded-2xl border border-border bg-black">
            <iframe
              title={`Vídeo de ${artist.name}`}
              src={embed}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      ) : null}
      <section className="mt-10">
        <h2 className="font-display text-2xl">Agenda</h2>
        <Stagger className="mt-4 space-y-3">
          {artist.agenda.map((item) => (
            <Link key={item.id} href={`/eventos/${item.slug}`} data-stagger className="block rounded-2xl border border-border p-4">
              <p className="text-xs uppercase text-primary">{formatDay(item.startAt)}</p>
              <p className="font-semibold">
                {formatTime(item.startAt)} · {item.establishment.name}
              </p>
              <p className="text-sm text-muted-foreground">{item.establishment.city.name}</p>
            </Link>
          ))}
          {artist.agenda.length === 0 ? <p className="text-muted-foreground">Sem datas publicadas no momento.</p> : null}
        </Stagger>
      </section>
    </article>
  );
}
