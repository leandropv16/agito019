"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

const icon = L.divIcon({
  className: "agito-pin",
  html: `<span style="display:block;width:18px;height:18px;border-radius:999px;background:#ff6a1a;border:3px solid #fff"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export type MapPoint = {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  neighborhood?: string | null;
  city?: string;
  promo?: string;
  event?: string;
  photo?: string | null;
};

export function AgitoMap({ points, center }: { points: MapPoint[]; center?: [number, number] }) {
  const fallback: [number, number] = center ?? [-22.9058, -47.0608];
  return (
    <MapContainer center={fallback} zoom={12} className="h-[420px] w-full rounded-3xl" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((point) => (
        <Marker key={point.id} position={[point.latitude, point.longitude]} icon={icon}>
          <Popup>
            <div className="min-w-48 space-y-1 text-sm">
              {point.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={point.photo} alt="" className="mb-2 h-24 w-full rounded-lg object-cover" />
              ) : null}
              <p className="font-semibold">{point.name}</p>
              <p className="text-xs">
                {point.neighborhood ? `${point.neighborhood} · ` : ""}
                {point.city}
              </p>
              {point.event ? <p className="text-xs">{point.event}</p> : null}
              {point.promo ? <p className="text-xs">{point.promo}</p> : null}
              <div className="flex flex-col gap-1 pt-1">
                <Link href={`/lugares/${point.slug}`} className="text-xs font-semibold text-[#ff6a1a]">
                  Ver local
                </Link>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold uppercase text-[#ff6a1a]"
                >
                  Abrir no Google Maps
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
