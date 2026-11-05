"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EventCard } from "./event-card";
import { useRailMotion } from "./motion";
import type { EventCardData } from "@/lib/types";

export function EventRail({
  title,
  eyebrow,
  href,
  items,
  badgeText,
}: {
  title: string;
  eyebrow?: string;
  href?: string;
  items: EventCardData[];
  badgeText?: string;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  useRailMotion(sectionRef);

  function scroll(direction: "left" | "right") {
    if (!scrollContainerRef.current) return;
    const width = scrollContainerRef.current.clientWidth || 320;
    const offset = direction === "left" ? -Math.round(width * 0.8) : Math.round(width * 0.8);
    scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
  }

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className="relative w-full min-w-0">
      {/* Header with Title and Navigation buttons */}
      <div data-rail-head className="mb-6 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#f3e03a]">
              {eyebrow}
              {badgeText ? (
                <span className="ml-2 font-normal normal-case tracking-normal text-white/45">{badgeText}</span>
              ) : null}
            </p>
          ) : null}
          <h2 className="mt-1 break-words font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {title}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {href ? (
            <Link
              href={href}
              className="mr-2 hidden text-sm font-medium text-white/60 transition-colors hover:text-[#f3e03a] sm:inline-block"
            >
              Ver todos
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Rolar para a esquerda"
            className="flex size-10 items-center justify-center rounded-full border border-white/12 text-white/75 transition-colors hover:border-[#f3e03a] hover:text-[#f3e03a]"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Rolar para a direita"
            className="flex size-10 items-center justify-center rounded-full border border-white/12 text-white/75 transition-colors hover:border-[#f3e03a] hover:text-[#f3e03a]"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Rail Container */}
      <div
        ref={scrollContainerRef}
        className="flex max-w-full gap-5 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div
            key={item.id}
            data-rail-card
            className="w-[min(100%,280px)] shrink-0 snap-start sm:w-[320px] md:w-[360px]"
          >
            <EventCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
