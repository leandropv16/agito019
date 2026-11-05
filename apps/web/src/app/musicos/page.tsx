import type { Metadata } from "next";
import { ArtistCard } from "@/components/agito/artist-card";
import { Intro, Stagger } from "@/components/agito/motion";
import { publicGet } from "@/lib/api";
import { siteUrl } from "@/lib/seo/site";
import type { ArtistList } from "@/lib/types";

export const metadata: Metadata = {
  title: "Músicos e bandas no 019",
  description: "Quem sobe no palco em Campinas e na região 019. Agenda publicada de bandas, DJs e artistas.",
  alternates: { canonical: siteUrl("/musicos") },
  robots: { index: true, follow: true },
};

export default async function MusicosPage() {
  const list = await publicGet<ArtistList>("/public/artists", {
    next: { revalidate: 60, tags: ["public", "seo"] },
  });
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Intro>
      <p data-intro className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Artistas</p>
      <h1 data-intro className="mt-2 break-words font-display text-3xl sm:text-4xl md:text-5xl">Quem sobe no palco</h1>
      </Intro>
      <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.data.map((item) => (
          <div key={item.id} data-stagger>
            <ArtistCard item={item} />
          </div>
        ))}
      </Stagger>
    </div>
  );
}
