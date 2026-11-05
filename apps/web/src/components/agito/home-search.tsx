"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import {
  HOME_FILTER_GROUPS,
  buildHomeFilterPath,
  emptyHomeFilter,
  homeFilterChipLabel,
  homeFilterResultLine,
  type HomeFilterGroupId,
  type HomeFilterSelection,
} from "@agito019/shared";
import { MountFade } from "@/components/agito/motion";

export function HomeSearch({
  initial,
  basePath = "/",
}: {
  initial?: HomeFilterSelection;
  basePath?: string;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [open, setOpen] = useState<HomeFilterGroupId | null>(null);
  const [selection, setSelection] = useState<HomeFilterSelection>(initial ?? emptyHomeFilter());
  const signature = HOME_FILTER_GROUPS.map((group) => initial?.[group.id] ?? "").join("|");
  const initialRef = useRef(initial);
  initialRef.current = initial;

  useEffect(() => {
    setSelection(initialRef.current ?? emptyHomeFilter());
  }, [signature]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(null);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(null);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function toggleGroup(id: HomeFilterGroupId) {
    setOpen((current) => (current === id ? null : id));
  }

  function choose(id: HomeFilterGroupId, slug: string) {
    const next: HomeFilterSelection = {
      ...selection,
      [id]: selection[id] === slug ? null : slug,
    };
    setSelection(next);
    setOpen(null);
    router.replace(buildHomeFilterPath(next, basePath), { scroll: false });
  }

  const result = homeFilterResultLine(selection);

  function placePanel(node: HTMLDivElement | null) {
    if (!node) return;
    node.style.transform = "";
    const rect = node.getBoundingClientRect();
    const pad = 12;
    const overflowRight = rect.right - (window.innerWidth - pad);
    const overflowLeft = pad - rect.left;
    if (overflowRight > 0) node.style.transform = `translateX(${-overflowRight}px)`;
    else if (overflowLeft > 0) node.style.transform = `translateX(${overflowLeft}px)`;
  }

  return (
    <div ref={rootRef} className="space-y-3">
      <div className="flex max-w-full flex-wrap items-start gap-2">
        <span className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-white">
          <MapPin className="size-3.5 text-[#f3e03a]" aria-hidden="true" />
          Região 019:
        </span>
        {HOME_FILTER_GROUPS.map((group, index) => {
          const isOpen = open === group.id;
          const chosen = Boolean(selection[group.id]);
          const alignRight = index >= HOME_FILTER_GROUPS.length - 2;
          return (
            <div key={group.id} className="relative">
              <button
                type="button"
                data-testid={`home-filter-chip-${group.id}`}
                aria-expanded={isOpen}
                aria-controls={isOpen ? panelId : undefined}
                onClick={() => toggleGroup(group.id)}
                className={`inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border bg-[#161616] px-3.5 text-left text-sm font-medium text-white transition hover:border-white/25 ${
                  isOpen || chosen ? "border-[#f3e03a]/70" : "border-white/10"
                }`}
              >
                <Search className="size-3.5 shrink-0 text-white/70" aria-hidden="true" />
                <span className="break-words">{homeFilterChipLabel(group.id, selection)}</span>
              </button>
              {isOpen ? (
                <div
                  id={panelId}
                  data-testid="home-filter-panel"
                  role="listbox"
                  aria-label={group.label}
                  ref={placePanel}
                  className={`absolute top-[calc(100%+8px)] z-30 w-max max-w-[calc(100vw-1.5rem)] overflow-visible rounded-2xl border border-white/10 bg-[#161616] p-2 shadow-[0_16px_40px_rgba(0,0,0,0.45)] ${
                    alignRight ? "right-0" : "left-0"
                  }`}
                >
                  <MountFade>
                  {group.options.map((option) => {
                    const selected = selection[group.id] === option.slug;
                    return (
                      <button
                        key={option.slug}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => choose(group.id, option.slug)}
                        className="flex min-h-11 w-full items-center justify-between gap-4 rounded-lg px-3 text-left text-sm transition hover:bg-white/5"
                      >
                        <span className={selected ? "text-[#f3e03a]" : "text-white/90"}>{option.label}</span>
                        <span
                          aria-hidden="true"
                          className={`grid size-4 shrink-0 place-items-center rounded-[4px] border ${
                            selected ? "border-[#f3e03a] bg-[#f3e03a]" : "border-white/35 bg-transparent"
                          }`}
                        >
                          {selected ? (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                              <path d="M2 6.2L4.6 8.8L10 3.2" stroke="#16140a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : null}
                        </span>
                      </button>
                    );
                  })}
                  </MountFade>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {result ? (
        <p data-testid="home-filter-result" className="text-sm">
          <span className="font-semibold text-[#f3e03a]">Resultado da pesquisa:</span>
          <span className="text-white">{result.slice("Resultado da pesquisa:".length)}</span>
        </p>
      ) : null}
    </div>
  );
}
