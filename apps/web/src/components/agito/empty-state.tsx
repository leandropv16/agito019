"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useMarkMotion } from "./motion";

export function EmptyState({
  title,
  description,
  href = "/explorar",
  actionLabel = "Limpar filtros",
}: {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useMarkMotion(ref);
  return (
    <div ref={ref} className="rounded-2xl border border-dashed border-border bg-card px-4 py-12 text-center sm:px-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img data-empty-mark src="/brand/agito019-symbol.svg" alt="AGITO019" className="mx-auto mb-4 size-14 invert opacity-80" />
      <div data-empty-copy>
      <h2 className="break-words font-display text-2xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">{description}</p>
      <Button asChild className="mt-5">
        <Link href={href}>{actionLabel}</Link>
      </Button>
      </div>
    </div>
  );
}
