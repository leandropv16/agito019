import { Suspense } from "react";
import type { Metadata } from "next";
import { ExploreFilters, type ExploreValues } from "@/components/agito/explore-filters";
import { ExploreView } from "./explore-view";
import { EventFormatFilterBar } from "@/components/agito/event-format-filter-bar";
import { publicGet } from "@/lib/api";
import { siteUrl } from "@/lib/seo/site";
import type { NamedSlug } from "@/lib/shared";
import type { EstablishmentList, EventList } from "@/lib/types";

export const metadata: Metadata = {
  title: "Explorar eventos e lugares no 019",
  description:
    "Filtre a programação de corridas, encontros de carros, shows, feiras e lugares na região 019.",
  alternates: { canonical: siteUrl("/explorar") },
  robots: { index: false, follow: true },
};

type Search = Promise<ExploreValues>;

export default async function ExplorarPage({ searchParams }: { searchParams: Search }) {
  const values = await searchParams;
  const establishmentQuery = new URLSearchParams(
    Object.entries(values).filter(
      (entry): entry is [string, string] => Boolean(entry[1]) && entry[0] !== "type",
    ),
  ).toString();

  const eventsQueryObj: Record<string, string> = {};
  if (values.city) eventsQueryObj.city = values.city;
  if (values.date) eventsQueryObj.date = values.date;
  if (values.type) eventsQueryObj.type = values.type;
  if (values.genre) eventsQueryObj.genre = values.genre;
  if (values.liveMusic) eventsQueryObj.liveMusic = values.liveMusic;
  const eventsQuery = new URLSearchParams(eventsQueryObj).toString();

  const [cities, categories, audiences, genres, establishmentsList, eventsList] =
    await Promise.all([
      publicGet<NamedSlug[]>("/public/cities"),
      publicGet<NamedSlug[]>("/public/categories"),
      publicGet<NamedSlug[]>("/public/audiences"),
      publicGet<NamedSlug[]>("/public/genres"),
      publicGet<EstablishmentList>(`/public/establishments?${establishmentQuery}`),
      publicGet<EventList>(`/public/events?${eventsQuery}`).catch(() => ({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
      })),
    ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#f3e03a]">
          Catálogo Regional
        </p>
        <h1 className="mt-2 break-words font-display text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
          Eventos e Lugares no 019
        </h1>
        <p className="mt-2 max-w-2xl text-sm md:text-base text-muted-foreground">
          Filtre por modalidade, cidade, data e atrações. Corridas, encontros de
          carros, shows, feiras e experiências para o seu fim de semana.
        </p>
      </div>

      {/* Quick format filter chips */}
      <EventFormatFilterBar selectedCity={values.city} />

      <div className="flex flex-col gap-6 md:flex-row pt-2">
        <ExploreFilters
          values={values}
          cities={cities}
          categories={categories}
          audiences={audiences}
          genres={genres}
        />
        <div className="min-w-0 flex-1">
          <Suspense>
            <ExploreView
              items={establishmentsList.data}
              events={eventsList.data}
              activeType={values.type}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
