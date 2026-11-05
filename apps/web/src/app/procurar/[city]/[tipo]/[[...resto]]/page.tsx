import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildSearchPath, parseSearchRoute, searchApiQuery, searchCopy } from "@agito019/shared";
import { Breadcrumbs } from "@/components/agito/breadcrumbs";
import { EmptyState } from "@/components/agito/empty-state";
import { EstablishmentCard } from "@/components/agito/establishment-card";
import { EventCard } from "@/components/agito/event-card";
import { SectionHeader } from "@/components/agito/section-header";
import { publicGet } from "@/lib/api";
import { siteUrl } from "@/lib/seo/site";
import type { EstablishmentCardData, EventCardData } from "@/lib/types";

export const revalidate = 60;

type Payload = {
  establishments: EstablishmentCardData[];
  events: EventCardData[];
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function resolveSelection(
  params: Promise<{ city: string; tipo: string; resto?: string[] }>,
  searchParams: Promise<{ quando?: string | string[] }>,
) {
  const [{ city, tipo, resto }, query] = await Promise.all([params, searchParams]);
  return parseSearchRoute(city, tipo, resto ?? [], one(query.quando));
}

async function load(selection: NonNullable<ReturnType<typeof parseSearchRoute>>) {
  return publicGet<Payload>(searchApiQuery(selection), {
    next: { revalidate: 60, tags: ["public"] },
  });
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ city: string; tipo: string; resto?: string[] }>;
  searchParams: Promise<{ quando?: string | string[] }>;
}): Promise<Metadata> {
  const selection = await resolveSelection(params, searchParams);
  if (!selection) {
    return { title: "Procura", robots: { index: false, follow: false } };
  }
  const data = await load(selection);
  const copy = searchCopy(selection);
  const indexable = data.events.length + data.establishments.length > 0;
  return {
    title: copy.title,
    description: copy.description,
    alternates: { canonical: siteUrl(buildSearchPath(selection)) },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function SearchFlowPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string; tipo: string; resto?: string[] }>;
  searchParams: Promise<{ quando?: string | string[] }>;
}) {
  const selection = await resolveSelection(params, searchParams);
  if (!selection) {
    notFound();
  }
  const data = await load(selection);
  const copy = searchCopy(selection);
  const empty = data.events.length + data.establishments.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs
        items={[
          { href: "/", label: "Início" },
          { href: buildSearchPath({ ...selection, quando: null }), label: copy.h1 },
        ]}
      />
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight leading-tight sm:text-4xl md:text-5xl">{copy.h1}</h1>
      <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground">{copy.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {[
          { slug: null, label: "Qualquer dia" },
          { slug: "hoje" as const, label: "Hoje" },
          { slug: "sabado" as const, label: "Sábado" },
        ].map((option) => {
          const active = selection.quando === option.slug;
          return (
            <Link
              key={option.label}
              href={buildSearchPath({ ...selection, quando: option.slug })}
              className={`inline-flex min-h-11 items-center rounded-full border px-3.5 py-2 text-xs sm:px-4 sm:text-sm font-semibold transition hover:border-primary ${
                active ? "border-primary bg-primary/15 text-foreground" : "border-border bg-card text-foreground"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>

      {empty ? (
        <div className="mt-8">
          <EmptyState
            title="Nada publicado nesse recorte"
            description="Ainda não há locais ou eventos com essa combinação."
            href="/"
            actionLabel="Nova procura"
          />
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-12">
          {data.events.length ? (
            <section>
              <SectionHeader eyebrow="Agenda" title="Eventos" />
              <div className="grid gap-4 xl:grid-cols-2">
                {data.events.map((item) => (
                  <EventCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ) : null}
          {data.establishments.length ? (
            <section>
              <SectionHeader eyebrow="Onde ir" title="Locais" />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.establishments.map((item) => (
                  <EstablishmentCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
