import Link from "next/link";
import { CoverImage } from "./cover";
import { formatTime } from "@/lib/utils";
import type { EstablishmentCardData } from "@/lib/types";

export function EstablishmentCard({ item }: { item: EstablishmentCardData }) {
  const showPhoto = item.visibility?.showPhoto ?? Boolean(item.cover);
  const showMap = item.visibility?.showMap ?? true;
  const categories = item.categories.map((category) => category.name).join(" · ");
  const mark =
    item.badge === "PATROCINADO" ? "Patrocinado" : item.badge === "DESTAQUE" ? "Destaque" : null;
  const place = item.neighborhood ? `${item.neighborhood} · ${item.city.name}` : item.city.name;
  const promo = item.promotions[0]?.title;

  return (
    <article className="group flex min-w-0 flex-col">
      <Link
        href={`/lugares/${item.slug}`}
        className="relative block aspect-16/10 overflow-hidden rounded-[20px] border border-white/10 bg-[#141414]"
      >
        <CoverImage
          cover={showPhoto ? item.cover : null}
          alt={item.name}
          className="transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </Link>
      <div className="flex flex-1 flex-col px-0.5 pt-3">
        <p className="line-clamp-1 text-[13px] text-white/55">
          {mark ? <span className="font-medium text-[#f3e03a]">{mark}</span> : null}
          {mark && categories ? <span className="text-white/30"> · </span> : null}
          {categories || "Local"}
        </p>
        <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug tracking-tight text-white">
          <Link href={`/lugares/${item.slug}`} className="transition-colors group-hover:text-[#f3e03a]">
            {item.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-white/62">{place}</p>
        {item.nextEvent ? (
          <p className="mt-1 line-clamp-1 text-sm text-white/48">
            {item.nextEvent.artists[0]?.name ?? item.nextEvent.title}
            <span className="text-white/30"> · </span>
            {formatTime(item.nextEvent.startAt)}
          </p>
        ) : null}
        {promo ? <p className="mt-1 line-clamp-1 text-sm text-white/48">{promo}</p> : null}
        <div className="mt-3 flex items-center gap-4">
          <Link
            className="inline-flex h-10 items-center rounded-full bg-[#f3e03a] px-4 text-sm font-semibold text-[#16140a]"
            href={`/lugares/${item.slug}`}
          >
            Ver local
          </Link>
          {showMap && item.googleMapsUrl ? (
            <a
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
              href={item.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Como chegar
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
