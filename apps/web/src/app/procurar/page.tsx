import type { Metadata } from "next";
import {
  hasHomeFilter,
  homeFilterApiQuery,
  sanitizeHomeFilterQuery,
} from "@agito019/shared";
import { EmptyState } from "@/components/agito/empty-state";
import { EstablishmentCard } from "@/components/agito/establishment-card";
import { EventAgendaRow } from "@/components/agito/event-card";
import { HomeSearch } from "@/components/agito/home-search";
import { Intro, Stagger } from "@/components/agito/motion";
import { SectionHeader } from "@/components/agito/section-header";
import { publicGet } from "@/lib/api";
import type { EstablishmentCardData, EventCardData } from "@/lib/types";

export const metadata: Metadata = {
  title: "Procura",
  robots: { index: false, follow: true },
};

type Payload = {
  establishments: EstablishmentCardData[];
  events: EventCardData[];
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProcurarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const selection = sanitizeHomeFilterQuery({
    semana: one(params.semana),
    cidade: one(params.cidade),
    bares: one(params.bares),
    restaurantes: one(params.restaurantes),
    baladas: one(params.baladas),
    musicos: one(params.musicos),
    eventos: one(params.eventos),
  });
  const active = hasHomeFilter(selection);
  let data: Payload = { establishments: [], events: [] };
  let failed = false;
  if (active) {
    try {
      data = await publicGet<Payload>(homeFilterApiQuery(selection), {
        next: { revalidate: 30, tags: ["public"] },
      });
    } catch {
      failed = true;
    }
  }
  const empty = !failed && !data.events.length && !data.establishments.length;

  return (
    <div className="mx-auto min-w-0 max-w-6xl overflow-x-clip px-4 py-14 sm:py-16">
      <Intro>
      <h1 data-intro className="max-w-3xl break-words font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
        Descubra o melhor da região
      </h1>
      <p data-intro className="mt-3 max-w-2xl text-sm text-white/65 sm:text-base">
        Quer sair, e não sabe onde ir? Encontre bares, restaurantes, baladas, eventos.
      </p>
      </Intro>
      <div className="mt-8">
        <HomeSearch initial={selection} basePath="/procurar" />
      </div>
      {!active ? (
        <p className="mt-10 text-sm text-white/60">Escolha um filtro para ver a programação.</p>
      ) : failed ? (
        <p className="mt-10 text-sm text-white/60">A busca não carregou agora.</p>
      ) : empty ? (
        <div className="mt-10">
          <EmptyState
            title="Nada publicado nesse recorte"
            description="Ainda não há locais ou eventos com essa combinação."
            href="/"
            actionLabel="Nova procura"
          />
        </div>
      ) : (
        <div className="mt-14 flex flex-col gap-16">
          {data.events.length ? (
            <section className="min-w-0">
              <SectionHeader eyebrow="Busca" title="Eventos em destaque" />
              <Stagger className="overflow-hidden rounded-[20px] border border-white/10 bg-[#141414] px-4 sm:px-5">
                {data.events.map((item) => (
                  <div key={item.id} data-stagger>
                    <EventAgendaRow item={item} />
                  </div>
                ))}
              </Stagger>
            </section>
          ) : null}
          {data.establishments.length ? (
            <section className="min-w-0">
              <SectionHeader eyebrow="Onde ir" title="Locais" />
              <Stagger className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {data.establishments.map((item) => (
                  <div key={item.id} data-stagger>
                    <EstablishmentCard item={item} />
                  </div>
                ))}
              </Stagger>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
