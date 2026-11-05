"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type GalleryImage = {
  id: string;
  url: string | null;
  altText?: string | null;
  isCover?: boolean;
};

export function ImageGallery({ images, alt }: { images: GalleryImage[]; alt: string }) {
  const usable = images.filter((item) => item.url);
  const [current, setCurrent] = useState(usable.find((item) => item.isCover)?.id ?? usable[0]?.id);
  const selected = usable.find((item) => item.id === current) ?? usable[0];
  if (!selected?.url) {
    return null;
  }

  return (
    <div>
      <div className="relative aspect-16/10 overflow-hidden rounded-3xl">
        <Image src={selected.url} alt={selected.altText ?? alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 960px" />
      </div>
      {usable.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {usable.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrent(item.id)}
              className={cn(
                "relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border",
                item.id === selected.id ? "border-primary" : "border-border",
              )}
            >
              {item.url ? <Image src={item.url} alt="" fill className="object-cover" sizes="80px" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
