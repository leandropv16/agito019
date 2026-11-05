import type { Metadata } from "next";
import Link from "next/link";
import { HeroTypewriter } from "@/components/agito/hero-typewriter";
import { HomeSearch } from "@/components/agito/home-search";
import { siteUrl } from "@/lib/seo/site";
import { SectionHeader } from "@/components/agito/section-header";
import { EstablishmentCard } from "@/components/agito/establishment-card";
import { HeroBillboard } from "@/components/agito/hero-billboard";
import { EventRail } from "@/components/agito/event-rail";
import { HoverZone, Intro, Reveal, Stagger } from "@/components/agito/motion";
import { publicGet } from "@/lib/api";
import { buildHomeFilterPath, hasHomeFilter, homeFilterApiQuery, sanitizeHomeFilterQuery } from "@agito019/shared";
import { resolveEventFormat } from "@/lib/shared";
import type { EventCardData, HomePayload } from "@/lib/types";

export const metadata: Metadata = {
  title: { absolute: "AGITO019: o que tem para fazer hoje no 019?" },
  description:
    "Corridas, encontros de carros, motos, shows ao vivo, feiras gastronomicas e muito mais em Campinas, Americana, Limeira, Piracicaba e regiao 019.",
  alternates: { canonical: siteUrl("/") },
};

const homeBanners = [
  {
    src: "/demo/banner-palco-vermelho.png",
    alt: "Palco iluminado em casa noturna",
    href: "/musica-ao-vivo/hoje",
    label: "Shows e Palcos ao Vivo",
  },
  {
    src: "/demo/banner-rock-noite.png",
    alt: "Noite de rock ao vivo",
    href: "/campinas/barzinho-com-show",
    label: "Barzinhos e Botecos",
  },
  {
    src: "/demo/banner-dj-rooftop.png",
    alt: "DJ em rooftop",
    href: "/campinas/casa-noturna",
    label: "Baladas e Noite",
  },
];

function clusterEvents(
  allEvents: EventCardData[],
  recommendations: EventCardData[],
  liveMusic: EventCardData[],
) {
  const pool = [...allEvents];

  // 1. Em Alta no 019
  const emAlta =
    recommendations.length > 0 ? recommendations : pool.slice(0, 6);

  // 2. Motores & Rodas (Carros, Som, Motos, Ciclismo, Automobilismo)
  const motores = pool.filter((e) => {
    const fmt = resolveEventFormat(e);
    return fmt.universe === "motores";
  });

  // 3. Shows & Palcos (Apresentações de bandas, shows em praças, inaugurações)
  const showsPool = liveMusic.length > 0 ? liveMusic : pool;
  const shows = showsPool.filter((e) => {
    const fmt = resolveEventFormat(e);
    return fmt.universe === "shows" || e.eventType === "LIVE_MUSIC";
  });

  // 4. Ao Ar Livre, Corridas & Feiras (Esportes, gastronomia, artesanato, pets, yoga)
  const aoArLivre = pool.filter((e) => {
    const fmt = resolveEventFormat(e);
    return (
      fmt.universe === "esporte" ||
      fmt.universe === "gastronomia" ||
      fmt.universe === "cultura"
    );
  });

  return {
    emAlta,
    motores: motores.length > 0 ? motores : pool.slice(0, 6),
    shows: shows.length > 0 ? shows : pool.slice(0, 6),
    aoArLivre: aoArLivre.length > 0 ? aoArLivre : pool.slice(0, 6),
  };
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({
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
  const filtering = hasHomeFilter(selection);
  const home = await publicGet<HomePayload>("/public/home", {
    next: { revalidate: 60, tags: ["public", "seo"] },
  });
  let filtered: { establishments: HomePayload["establishments"]; events: EventCardData[] } | null = null;
  let filterFailed = false;
  if (filtering) {
    try {
      filtered = await publicGet<{ establishments: HomePayload["establishments"]; events: EventCardData[] }>(
        homeFilterApiQuery(selection),
        { next: { revalidate: 30, tags: ["public"] } },
      );
    } catch {
      filterFailed = true;
    }
  }

  const recommendations = home.recommendations ?? [];
  const showCatalog = !filtering;
  const allEvents = filtering && filtered ? filtered.events : (home.events ?? []);
  const liveMusic = showCatalog ? (home.liveMusic ?? []) : [];

  // Hero billboard principal do 019
  const heroEvent = filtering && filtered
    ? (filtered.events[0] ?? null)
    : (recommendations[0] ?? liveMusic[0] ?? allEvents[0]);

  // Trilhos clusterizados pelos 18 tipos / 5 universos
  const { emAlta, motores, shows, aoArLivre } = clusterEvents(
    allEvents,
    recommendations,
    liveMusic,
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <section className="relative z-20 overflow-visible border-b border-white/8 pt-12 pb-14 md:pt-16 md:pb-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(243,224,58,0.12),_transparent_58%)]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/agito019-symbol.svg"
            alt=""
            className="absolute right-0 top-0 hidden h-52 w-52 invert opacity-[0.07] md:block"
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 space-y-6">
          <Intro className="flex w-full min-w-0 flex-col items-start gap-2">
            <div data-intro className="w-full min-w-0">
              <HeroTypewriter />
            </div>
            <p data-intro className="max-w-2xl text-sm sm:text-base text-white/70">
              Quer sair, e não sabe onde ir? Encontre bares, restaurantes, baladas, eventos.
            </p>
          </Intro>

          <div className="relative z-30">
            <HomeSearch initial={selection} />
          </div>
        </div>
      </section>

      {/* Hero Billboard Imersivo ("Palco Principal do 019") */}
      {heroEvent ? (
        <section className="pt-8 sm:pt-12">
          <HeroBillboard item={heroEvent} />
        </section>
      ) : null}

      {/* Trilhos Horizontais de Conteúdo (Rails Deslizantes) */}
      <div className="mx-auto flex max-w-6xl min-w-0 flex-col gap-16 px-4 py-16 sm:gap-24 sm:py-20">
        {filterFailed ? (
          <p className="text-sm text-white/60">A busca não carregou agora.</p>
        ) : null}
        {filtering && filtered ? (
          <section className="space-y-8">
            {filtered.events.length ? (
              <EventRail
                eyebrow="Busca"
                title="Eventos em destaque"
                href={buildHomeFilterPath(selection, "/procurar")}
                items={filtered.events}
              />
            ) : !filtered.establishments.length ? (
              <div>
                <h2 className="font-display text-2xl font-bold text-white md:text-3xl">Eventos em destaque</h2>
                <p className="mt-3 text-sm text-white/60">Nada publicado nesse recorte.</p>
              </div>
            ) : null}
            {filtered.establishments.length ? (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {filtered.establishments.map((item) => (
                  <EstablishmentCard key={item.id} item={item} />
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
        {/* Rail 1: Em Alta no 019 */}
        {showCatalog && emAlta.length > 0 ? (
          <EventRail
            eyebrow="Destaques da Semana"
            title="Em Alta no 019"
            badgeText="Curadoria"
            href="/explorar"
            items={emAlta}
          />
        ) : null}

        {/* Rail 2: Motores & Rodas */}
        {showCatalog && motores.length > 0 ? (
          <EventRail
            eyebrow="Velocidade & Paixão"
            title="Motores & Rodas"
            badgeText="Carros, Motos & Som"
            href="/explorar?type=encontros-de-carros"
            items={motores}
          />
        ) : null}

        {/* Banners Visuais da Cena Noturna */}
        {showCatalog ? (
        <Reveal>
        <section className="space-y-6">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#f3e03a]">
                Cena & Palcos
              </p>
              <h2 className="mt-1 break-words font-display text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Banners da Noite
              </h2>
            </div>
            <Link
              href="/explorar"
              className="inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-white/60 transition-colors hover:text-[#f3e03a]"
            >
              Ver guia completo
            </Link>
          </div>

          <HoverZone>
          <Stagger className="grid gap-6 md:grid-cols-3">
            {homeBanners.map((banner) => (
              <Link
                key={banner.src}
                href={banner.href}
                data-stagger
                data-lift
                className="group flex min-w-0 flex-col"
              >
                <span className="relative block aspect-16/9 overflow-hidden rounded-[20px] border border-white/10 bg-[#141414]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.src}
                    alt={banner.alt}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                </span>
                <span className="mt-3 font-display text-lg font-semibold tracking-tight text-white transition-colors group-hover:text-[#f3e03a]">
                  {banner.label}
                </span>
              </Link>
            ))}
          </Stagger>
          </HoverZone>
        </section>
        </Reveal>
        ) : null}

        {/* Rail 3: Shows & Palcos */}
        {showCatalog && shows.length > 0 ? (
          <EventRail
            eyebrow="Música & Apresentações"
            title="Shows & Palcos"
            badgeText="Ao Vivo"
            href="/musica-ao-vivo/hoje"
            items={shows}
          />
        ) : null}

        {/* Rail 4: Ao Ar Livre, Corridas & Feiras */}
        {showCatalog && aoArLivre.length > 0 ? (
          <EventRail
            eyebrow="Saúde, Cultura & Rua"
            title="Ao Ar Livre, Corridas & Feiras"
            badgeText="Esporte & Sabores"
            href="/explorar?type=corridas"
            items={aoArLivre}
          />
        ) : null}

        {/* Promoções do Dia */}
        {showCatalog && home.promotions && home.promotions.length > 0 ? (
          <Reveal>
          <section className="space-y-4">
            <SectionHeader eyebrow="Benefícios" title="Promoções de Hoje" />
            <HoverZone>
            <Stagger className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {home.promotions.map((promo) => (
                <Link
                  key={promo.id}
                  href={`/lugares/${promo.establishment.slug}`}
                  data-stagger
                  data-lift
                  className="group flex min-w-0 flex-col rounded-[20px] border border-white/10 bg-[#141414] p-5 transition-colors hover:border-white/20 sm:p-6"
                >
                  <p className="text-sm text-[#f3e03a]">
                    {promo.establishment.city.name}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-semibold tracking-tight text-white transition-colors group-hover:text-[#f3e03a]">
                    {promo.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/55">
                    {promo.establishment.name}
                  </p>
                </Link>
              ))}
            </Stagger>
            </HoverZone>
          </section>
          </Reveal>
        ) : null}

        {/* Locais em Evidência */}
        {showCatalog && home.featured && home.featured.length > 0 ? (
          <Reveal>
          <section className="space-y-4">
            <SectionHeader
              eyebrow="Lugares Parceiros"
              title="Locais em Evidência"
              href="/explorar"
            />
            <Stagger className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {home.featured.map((item) => (
                <div key={item.id} data-stagger>
                  <EstablishmentCard item={item} />
                </div>
              ))}
            </Stagger>
          </section>
          </Reveal>
        ) : null}

        {/* Seletor de Cidades do 019 */}
        {showCatalog ? (
        <Reveal>
        <section className="rounded-[24px] border border-white/10 bg-[#141414] p-5 sm:p-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#f3e03a]">
              Navegação Local
            </p>
            <h2 className="mt-1 break-words font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Escolha a sua Cidade no 019
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Acesse a programação de bares, encontros e shows da sua
              comunidade local.
            </p>
          </div>

          <HoverZone>
          <Stagger className="grid grid-cols-2 gap-x-4 gap-y-2 pt-4 sm:grid-cols-3 md:grid-cols-4">
            {home.cities.map((city) => (
              <Link
                key={city.slug}
                href={`/${city.slug}`}
                data-stagger
                data-lift
                className="group flex min-h-14 min-w-0 flex-col justify-center rounded-2xl px-2 py-2"
              >
                <span className="font-display text-base font-semibold text-white transition-colors group-hover:text-[#f3e03a]">
                  {city.name}
                </span>
                <span className="text-sm text-white/45">
                  Ver eventos
                </span>
              </Link>
            ))}
          </Stagger>
          </HoverZone>
        </section>
        </Reveal>
        ) : null}

        <section className="rounded-[24px] bg-[#f3e03a] px-5 py-8 text-[#16140a] sm:px-8 sm:py-10">
          <h2 className="max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Tem um bar, casa ou palco?
          </h2>
          <p className="mt-2 max-w-xl text-sm sm:text-base">
            Cadastre a programação no painel.
          </p>
          <Link
            href="/entrar"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-[#16140a] px-5 text-sm font-semibold text-[#f3e03a]"
          >
            Acessar painel
          </Link>
        </section>
      </div>
    </div>
  );
}
