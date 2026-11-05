"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./agito-map";

const Map = dynamic(() => import("./agito-map").then((mod) => mod.AgitoMap), {
  ssr: false,
  loading: () => <div className="h-[420px] animate-pulse rounded-3xl bg-secondary" />,
});

export function MapLoader({ points, center }: { points: MapPoint[]; center?: [number, number] }) {
  return <Map points={points} center={center} />;
}
