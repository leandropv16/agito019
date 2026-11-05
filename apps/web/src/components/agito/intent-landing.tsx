import Link from "next/link";
import { Breadcrumbs } from "./breadcrumbs";
import { EmptyState } from "./empty-state";
import { EstablishmentCard } from "./establishment-card";
import { EventCard } from "./event-card";
import { JsonLd } from "./json-ld";
import { Intro, Reveal, Stagger } from "./motion";
import { SectionHeader } from "./section-header";
import { landingGraph } from "@/lib/seo/jsonld";
import type { SeoLanding } from "@/lib/types";

export function IntentLanding({ landing }: { landing: SeoLanding }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={landingGraph(landing)} />
      <Breadcrumbs items={landing.breadcrumbs} />
      <Intro>
      <p data-intro className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
        {landing.city?.name ?? "Região 019"}
      </p>
      <h1 data-intro className="mt-2 break-words font-display text-3xl sm:text-4xl md:text-5xl">{landing.h1}</h1>
      <p data-intro className="mt-3 max-w-2xl text-muted-foreground">{landing.intro}</p>
      </Intro>
      {landing.related.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {landing.related.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}

      {landing.events.length ? (
        <section className="mt-10">
          <SectionHeader title="Agenda" />
          <Stagger className="grid gap-4 xl:grid-cols-2">
            {landing.events.map((item) => (
              <div key={item.id} data-stagger>
                <EventCard item={item} />
              </div>
            ))}
          </Stagger>
        </section>
      ) : (
        <div className="mt-10">
          <EmptyState
            title="Sem pauta publicada"
            description={landing.description}
            href={landing.city ? `/${landing.city.slug}` : "/explorar"}
            actionLabel="Ver outras agendas"
          />
        </div>
      )}

      {landing.establishments.length ? (
        <section className="mt-12">
          <SectionHeader title="Onde ir" />
          <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {landing.establishments.map((item) => (
              <div key={item.id} data-stagger>
                <EstablishmentCard item={item} />
              </div>
            ))}
          </Stagger>
        </section>
      ) : null}

      {landing.faqs.length >= 2 ? (
        <Reveal>
        <section className="mt-12">
          <h2 className="font-display text-2xl">Perguntas frequentes</h2>
          <div className="mt-4 grid gap-4">
            {landing.faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
        </Reveal>
      ) : null}
    </div>
  );
}
