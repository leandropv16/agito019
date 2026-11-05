import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/agito/breadcrumbs";
import { EstablishmentCard } from "@/components/agito/establishment-card";
import { EventCard } from "@/components/agito/event-card";
import { JsonLd } from "@/components/agito/json-ld";
import { SectionHeader } from "@/components/agito/section-header";
import { publicGet, ApiError } from "@/lib/api";
import { breadcrumbJsonLd, itemListJsonLd, pageGraph } from "@/lib/seo/jsonld";
import { isReservedCitySlug } from "@/lib/seo/intents";
import { siteUrl } from "@/lib/seo/site";
import type { HomePayload } from "@/lib/types";

export const revalidate = 60;

async function loadCity(citySlug: string) {
  if (isReservedCitySlug(citySlug)) {
    return null;
  }
  try {
    const home = await publicGet<HomePayload>(`/public/home?city=${citySlug}`, {
      next: { revalidate: 60, tags: ["public", "seo", `seo:city:${citySlug}`] },
    });
    const city = home.cities.find((item) => item.slug === citySlug);
    if (!city) {
      return null;
    }
    return { home, city };
  } catch (error) {
    if (error instanceof ApiError) {
      return null;
    }
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ citySlug: string }> }): Promise<Metadata> {
  const { citySlug } = await params;
  const data = await loadCity(citySlug);
  if (!data) {
    return { title: "Cidade", robots: { index: false, follow: true } };
  }
  const indexable = data.home.events.length + data.home.establishments.length + data.home.liveMusic.length > 0;
  const title = `Eventos e música ao vivo em ${data.city.name}`;
  const description = `Programação, barzinhos e música ao vivo em ${data.city.name} e na região 019. Veja o que está publicado para hoje e o fim de semana.`;
  return {
    title,
    description,
    alternates: { canonical: siteUrl(`/${data.city.slug}`) },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: siteUrl(`/${data.city.slug}`),
      locale: "pt_BR",
      type: "website",
      siteName: "AGITO019",
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function CityPage({ params }: { params: Promise<{ citySlug: string }> }) {
  const { citySlug } = await params;
  const data = await loadCity(citySlug);
  if (!data) {
    notFound();
  }
  const { home, city } = data;
  const intents = [
    { href: `/${city.slug}/hoje`, label: "Hoje" },
    { href: `/${city.slug}/amanha`, label: "Amanhã" },
    { href: `/${city.slug}/sabado`, label: "Sábado" },
    { href: `/${city.slug}/musica-ao-vivo`, label: "Música ao vivo" },
    { href: `/${city.slug}/barzinho-com-show`, label: "Barzinho com show" },
    { href: `/${city.slug}/boteco`, label: "Boteco" },
    { href: `/${city.slug}/casa-noturna`, label: "Casa noturna" },
    { href: `/${city.slug}/programacao`, label: "Programação" },
  ];
  const crumbs = [
    { href: "/", label: "Início" },
    { href: `/${city.slug}`, label: city.name },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd
        data={pageGraph([
          breadcrumbJsonLd(crumbs),
          itemListJsonLd(
            `Eventos em ${city.name}`,
            home.events.map((item) => ({ url: siteUrl(`/eventos/${item.slug}`), name: item.title })),
          ),
        ])}
      />
      <Breadcrumbs items={crumbs} />
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Cidade</p>
      <h1 className="mt-2 font-display text-4xl md:text-5xl">O que fazer em {city.name}</h1>
      <p className="mt-2 text-muted-foreground">
        A programação publicada em {city.name} · região 019. Música ao vivo, barzinhos e casas para sair.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {intents.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary">
            {item.label}
          </Link>
        ))}
      </div>
      {(home.recommendations?.length ?? 0) > 0 ? (
        <section className="mt-10">
          <SectionHeader title="Recomendações" href={`/${city.slug}/programacao`} />
          <div className="grid gap-4 xl:grid-cols-3">
            {home.recommendations.slice(0, 3).map((item) => (
              <EventCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}
      {home.liveMusic.length ? (
        <section className="mt-10">
          <SectionHeader title="Música ao vivo" href={`/${city.slug}/musica-ao-vivo`} />
          <div className="grid gap-4 xl:grid-cols-2">
            {home.liveMusic.map((item) => (
              <EventCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}
      {home.events.length ? (
        <section className="mt-10">
          <SectionHeader title="Agenda" href={`/${city.slug}/programacao`} />
          <div className="grid gap-4 xl:grid-cols-2">
            {home.events.map((item) => (
              <EventCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}
      <section className="mt-10">
        <SectionHeader title="Lugares" href="/explorar" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {home.establishments.map((item) => (
            <EstablishmentCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
