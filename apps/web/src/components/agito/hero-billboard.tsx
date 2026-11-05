import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { AGENDA_STATUS_LABELS, resolveEventFormat } from "@/lib/shared";
import { CoverImage } from "./cover";
import { HeroCue } from "./motion";
import { EventCoverBrandBadge } from "./event-cover-brand-badge";
import {
  formatEventEntryDisplay,
  formatEventTimeShift,
  ticketParts,
} from "@/lib/utils";
import type { EventCardData } from "@/lib/types";

export function HeroBillboard({ item }: { item: EventCardData }) {
  const date = ticketParts(item.startAt);
  const timeShift = formatEventTimeShift(item.startAt);
  const entryPrice = formatEventEntryDisplay(
    item.entryPriceType,
    item.entryPriceCents,
    item.description,
  );

  const locationText = item.establishment.neighborhood
    ? `${item.establishment.name} · ${item.establishment.neighborhood}, ${item.establishment.city.name}`
    : `${item.establishment.name} · ${item.establishment.city.name}`;
  const promotionTitle = item.establishment.promotions?.find((promo) => promo.title)?.title;
  const formatName = resolveEventFormat(item).shortName;
  const genres = item.genres
    .slice(0, 2)
    .map((genre) => genre.name)
    .join(" · ");
  const status =
    item.agendaStatus && item.agendaStatus !== "CONFIRMED"
      ? AGENDA_STATUS_LABELS[item.agendaStatus]
      : null;
  const mark =
    item.establishment.badge === "PATROCINADO"
      ? "Patrocinado"
      : item.establishment.badge === "DESTAQUE"
        ? "Destaque"
        : null;
  const aside = [mark, formatName, genres, promotionTitle, status].filter(Boolean).join(" · ");

  return (
    <section className="relative mx-auto w-full max-w-6xl px-4">
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#141414]">
        <HeroCue />
        <div className="relative flex min-h-[520px] w-full flex-col overflow-hidden sm:min-h-[480px] md:aspect-21/9 md:min-h-[460px]">
          <div data-hero-media className="absolute inset-0">
            <CoverImage
              cover={item.cover}
              alt={item.title}
              className="object-cover opacity-60"
            />
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(243,224,58,0.14),transparent_52%)]" />

          <EventCoverBrandBadge size="md" className="top-4 right-4 md:top-6 md:right-6" />

          <div data-hero className="relative z-10 max-w-[calc(100%-4.5rem)] p-4 md:p-8 md:pr-24">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#f3e03a]">Palco Principal 019</p>
            {aside ? <p className="mt-2 max-w-xl text-sm text-white/70">{aside}</p> : null}
          </div>

          <div className="relative z-10 mt-auto p-4 sm:p-8 md:p-10">
            <div data-hero className="max-w-3xl space-y-3 sm:space-y-4">
              <p className="text-sm text-white/75">
                <span className="text-white">
                  {date.weekday}, {date.day} {date.month}
                </span>
                <span className="text-white/35"> · </span>
                <span>{timeShift.label}</span>
                <span className="text-white/35"> · </span>
                <span>{entryPrice}</span>
              </p>

              <h2 className="break-words font-display text-3xl font-semibold leading-[1.05] tracking-tight text-white sm:text-4xl md:text-5xl">
                <Link
                  href={`/eventos/${item.slug}`}
                  className="transition-colors hover:text-[#f3e03a]"
                >
                  {item.title}
                </Link>
              </h2>

              <p className="flex items-start gap-2 text-sm text-white/75 md:text-base">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#f3e03a]" />
                <span className="min-w-0 break-words">{locationText}</span>
              </p>

              {item.artists.length > 0 ? (
                <p className="text-sm text-white/65">
                  <span className="text-white/85">Atrações: </span>
                  {item.artists.map((artist) => artist.name).join(", ")}
                </p>
              ) : null}

              <div className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center sm:pt-3">
                <Link
                  href={`/eventos/${item.slug}`}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#f3e03a] px-6 text-sm font-semibold text-[#16140a] transition-colors hover:bg-[#ffe56a]"
                >
                  <span>Ver Detalhes do Evento</span>
                  <ArrowRight className="size-4" />
                </Link>

                <Link
                  href="/explorar"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-5 text-center text-sm font-medium text-white transition-colors hover:border-white/30 hover:bg-white/5"
                >
                  Ver toda a programação
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
