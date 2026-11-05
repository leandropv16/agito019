"use client";

import { useState } from "react";
import { Calendar, MapPin, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapLoader } from "@/components/agito/map-loader";
import { EstablishmentCard } from "@/components/agito/establishment-card";
import { EventCard } from "@/components/agito/event-card";
import { EmptyState } from "@/components/agito/empty-state";
import { Stagger } from "@/components/agito/motion";
import { getEventFormatBySlug } from "@/lib/shared";
import type { EstablishmentCardData, EventCardData } from "@/lib/types";

export function ExploreView({
  items,
  events = [],
  activeType,
}: {
  items: EstablishmentCardData[];
  events?: EventCardData[];
  activeType?: string;
}) {
  // Se o usuario filtrou por um formato especifico de evento, prioriza a aba de eventos
  const initialMode =
    activeType || (events.length > 0 && items.length === 0)
      ? "eventos"
      : "lugares";

  const [mode, setMode] = useState<"eventos" | "lugares" | "mapa">(initialMode);

  const activeFormatDef = activeType ? getEventFormatBySlug(activeType) : null;

  return (
    <div>
      {/* Active format banner if filtered */}
      {activeFormatDef ? (
        <div className="mb-4 flex flex-col gap-2 rounded-[20px] border border-white/10 bg-[#141414] p-4 text-sm text-white sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-medium text-[#f3e03a]">Filtrando por modalidade:</span>{" "}
            <span>{activeFormatDef.name}</span>
          </p>
          <span className="text-white/55">
            {events.length} {events.length === 1 ? "evento encontrado" : "eventos encontrados"}
          </span>
        </div>
      ) : null}

      {/* Mode selectors */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={mode === "eventos" ? "default" : "outline"}
          onClick={() => setMode("eventos")}
          className="flex min-h-11 items-center gap-1.5"
        >
          <Calendar className="size-3.5" />
          <span>Eventos ({events.length})</span>
        </Button>

        <Button
          size="sm"
          variant={mode === "lugares" ? "default" : "outline"}
          onClick={() => setMode("lugares")}
          className="flex min-h-11 items-center gap-1.5"
        >
          <Store className="size-3.5" />
          <span>Lugares ({items.length})</span>
        </Button>

        <Button
          size="sm"
          variant={mode === "mapa" ? "default" : "outline"}
          onClick={() => setMode("mapa")}
          className="flex min-h-11 items-center gap-1.5"
        >
          <MapPin className="size-3.5" />
          <span>Mapa</span>
        </Button>
      </div>

      {/* Content depending on active mode */}
      {mode === "mapa" ? (
        <div className="mt-4">
          <MapLoader
            points={items.map((item) => ({
              id: item.id,
              name: item.name,
              slug: item.slug,
              latitude: item.latitude,
              longitude: item.longitude,
              neighborhood: item.neighborhood,
              city: item.city.name,
              promo: item.promotions[0]?.title,
              event: item.nextEvent?.title,
              photo: item.cover?.thumbnailUrl ?? item.cover?.url,
            }))}
          />
        </div>
      ) : mode === "eventos" ? (
        events.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title={
                activeFormatDef
                  ? `Nenhum evento de "${activeFormatDef.name}" encontrado.`
                  : "Nenhum evento encontrado com esses filtros."
              }
              description="Tente selecionar outra cidade, data ou limpe os filtros de modalidade."
            />
          </div>
        ) : (
          <Stagger className="mt-4 grid gap-4 md:grid-cols-2">
            {events.map((event) => (
              <div key={event.id} data-stagger>
                <EventCard item={event} />
              </div>
            ))}
          </Stagger>
        )
      ) : items.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="Nenhum local encontrado com esses filtros."
            description="Tente outra cidade, data ou categoria."
          />
        </div>
      ) : (
        <Stagger className="mt-4 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} data-stagger>
              <EstablishmentCard item={item} />
            </div>
          ))}
        </Stagger>
      )}
    </div>
  );
}
