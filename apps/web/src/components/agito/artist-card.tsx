import Link from "next/link";
import { ARTIST_TYPE_LABELS } from "@/lib/shared";
import { CoverImage } from "./cover";
import { GenreBadge } from "./badges";
import { formatWhen } from "@/lib/utils";
import type { ArtistCardData } from "@/lib/types";

export function ArtistCard({ item }: { item: ArtistCardData }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5">
      <Link href={`/musicos/${item.slug}`} className="relative block aspect-square">
        <CoverImage cover={item.cover} alt={item.name} />
      </Link>
      <div className="space-y-2 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{ARTIST_TYPE_LABELS[item.type]}</p>
        <h3 className="font-display text-xl">
          <Link href={`/musicos/${item.slug}`}>{item.name}</Link>
        </h3>
        <p className="text-sm text-muted-foreground">{item.city?.name ?? "Região 019"}</p>
        <div className="flex flex-wrap gap-1">
          {item.genres.map((genre) => (
            <GenreBadge key={genre.id} name={genre.name} />
          ))}
        </div>
        {item.nextEvent ? (
          <p className="text-sm text-primary">
            {item.nextEvent.establishment} · {formatWhen(item.nextEvent.startAt)}
          </p>
        ) : null}
        <Link href={`/musicos/${item.slug}`} className="inline-flex h-10 items-center text-sm font-semibold text-primary">
          Ver artista
        </Link>
      </div>
    </article>
  );
}
