import Link from "next/link";
import { AGENDA_STATUS_LABELS, resolveEventFormat } from "@/lib/shared";
import { CoverImage } from "./cover";
import { EventCoverBrandBadge } from "./event-cover-brand-badge";
import {
  formatEventEntryDisplay,
  formatEventTimeShift,
  ticketParts,
} from "@/lib/utils";
import type { EventCardData } from "@/lib/types";

function eventMeta(item: EventCardData) {
  const date = ticketParts(item.startAt);
  const timeShift = formatEventTimeShift(item.startAt);
  const entryText = formatEventEntryDisplay(
    item.entryPriceType,
    item.entryPriceCents,
    item.description,
  );
  const locationText = item.establishment.neighborhood
    ? `${item.establishment.neighborhood} · ${item.establishment.city.name}`
    : item.establishment.city.name;
  const formatName = resolveEventFormat(item).shortName;
  const genres = item.genres.slice(0, 2).map((genre) => genre.name);
  const artists = item.artists.slice(0, 2).map((artist) => artist.name);
  const promotionTitle = item.establishment.promotions?.find((promo) => promo.title)?.title;
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
  const detail = [mark, formatName, ...genres, ...artists, promotionTitle, status]
    .filter(Boolean)
    .join(" · ");

  return { date, timeShift, entryText, locationText, detail };
}

export function EventCard({
  item,
  className = "",
}: {
  item: EventCardData;
  className?: string;
}) {
  const { date, timeShift, entryText, locationText, detail } = eventMeta(item);

  return (
    <article className={`group flex min-w-0 flex-col ${className}`}>
      <Link
        href={`/eventos/${item.slug}`}
        className="relative block aspect-16/10 w-full overflow-hidden rounded-[20px] border border-white/10 bg-[#141414]"
      >
        <CoverImage
          cover={item.cover}
          alt={item.title}
          className="z-0 transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        <EventCoverBrandBadge />
      </Link>

      <div className="flex flex-1 flex-col px-0.5 pt-3">
        <p className="text-[13px] leading-5 text-white/55">
          <span className="font-medium text-[#f3e03a]">{date.weekday}</span>
          <span> {date.day} {date.month}</span>
          <span className="text-white/30"> · </span>
          <span>{timeShift.label}</span>
        </p>
        <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug tracking-tight text-white">
          <Link href={`/eventos/${item.slug}`} className="transition-colors group-hover:text-[#f3e03a]">
            {item.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-white/62">
          <span className="text-white/88">{item.establishment.name}</span>
          <span className="text-white/30"> · </span>
          {locationText}
        </p>
        {detail ? <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/48">{detail}</p> : null}
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-white/85">{entryText}</p>
          <Link href={`/eventos/${item.slug}`} className="shrink-0 text-sm font-medium text-[#f3e03a]">
            Ver evento
          </Link>
        </div>
      </div>
    </article>
  );
}

export function EventAgendaRow({ item }: { item: EventCardData }) {
  const { date, timeShift, entryText, locationText, detail } = eventMeta(item);

  return (
    <article className="border-b border-white/10 last:border-b-0">
      <Link
        href={`/eventos/${item.slug}`}
        className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-x-3 gap-y-1 py-4 transition-colors hover:bg-white/[0.03] sm:grid-cols-[4.75rem_6.5rem_minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-x-4 sm:px-1"
      >
        <div className="row-span-2 sm:row-span-1">
          <p className="font-display text-xl font-semibold tracking-tight text-white">{date.day}</p>
          <p className="text-xs uppercase tracking-wide text-white/45">{date.weekday}</p>
        </div>
        <p className="text-sm font-medium text-[#f3e03a] sm:self-center">{timeShift.time}</p>
        <div className="col-start-2 min-w-0 sm:col-start-auto">
          <p className="truncate font-display text-base font-semibold tracking-tight text-white">{item.title}</p>
          {detail ? <p className="truncate text-sm text-white/48">{detail}</p> : null}
        </div>
        <p className="col-start-2 min-w-0 truncate text-sm text-white/62 sm:col-start-auto">
          {item.establishment.name}
          <span className="text-white/30"> · </span>
          {locationText}
        </p>
        <p className="col-start-2 text-sm font-medium text-white/85 sm:col-start-auto sm:text-right">{entryText}</p>
      </Link>
    </article>
  );
}
