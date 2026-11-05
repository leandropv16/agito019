"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Activity,
  Bike,
  Car,
  Dog,
  Drama,
  Flame,
  MapPin,
  Music,
  Palette,
  PartyPopper,
  Sparkles,
  Timer,
  UtensilsCrossed,
  Volume2,
} from "lucide-react";

const REGIONAL_CITIES = [
  { slug: "campinas", name: "Campinas" },
  { slug: "americana", name: "Americana" },
  { slug: "indaiatuba", name: "Indaiatuba" },
  { slug: "limeira", name: "Limeira" },
  { slug: "piracicaba", name: "Piracicaba" },
  { slug: "valinhos", name: "Valinhos" },
  { slug: "vinhedo", name: "Vinhedo" },
  { slug: "paulinia", name: "Paulínia" },
  { slug: "sumare", name: "Sumaré" },
  { slug: "hortolandia", name: "Hortolândia" },
];

const QUICK_FORMAT_CHIPS = [
  {
    slug: "todos",
    label: "Todos os Eventos",
    icon: Flame,
    href: "/explorar",
  },
  {
    slug: "shows-bandas",
    label: "Shows & Palcos",
    icon: Music,
    href: "/explorar?type=apresentacoes-de-bandas",
  },
  {
    slug: "encontros-de-carros",
    label: "Encontros de Carros",
    icon: Car,
    href: "/explorar?type=encontros-de-carros",
  },
  {
    slug: "corridas",
    label: "Corridas de Rua",
    icon: Timer,
    href: "/explorar?type=corridas",
  },
  {
    slug: "feiras-gastronomicas",
    label: "Feiras Gastronômicas",
    icon: UtensilsCrossed,
    href: "/explorar?type=feiras-gastronomicas",
  },
  {
    slug: "motos",
    label: "Motos & Motocycle",
    icon: Bike,
    href: "/explorar?type=motos",
  },
  {
    slug: "encontro-de-som",
    label: "Som Automotivo",
    icon: Volume2,
    href: "/explorar?type=encontro-de-som",
  },
  {
    slug: "ciclismo-pedal",
    label: "Ciclismo & Pedal",
    icon: Activity,
    href: "/explorar?type=ciclismo-pedal",
  },
  {
    slug: "feiras-de-artesanato",
    label: "Feiras de Artesanato",
    icon: Palette,
    href: "/explorar?type=feiras-de-artesanato",
  },
  {
    slug: "eventos-pet",
    label: "Eventos Pet",
    icon: Dog,
    href: "/explorar?type=eventos-pet",
  },
  {
    slug: "festas-de-rua",
    label: "Festas de Rua",
    icon: PartyPopper,
    href: "/explorar?type=festas-de-rua",
  },
  {
    slug: "teatro",
    label: "Teatro & Comédia",
    icon: Drama,
    href: "/explorar?type=teatro",
  },
  {
    slug: "yoga-funcional",
    label: "Yoga & Treino no Parque",
    icon: Sparkles,
    href: "/explorar?type=yoga-funcional",
  },
];

export function EventFormatFilterBar({
  selectedCity,
}: {
  selectedCity?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type");

  return (
    <div className="w-full space-y-3">
      {/* City quick regional selector */}
      <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-semibold text-[#f3e03a]">
          <MapPin className="size-3 text-[#f3e03a]" />
          <span>Região 019:</span>
        </div>

        {REGIONAL_CITIES.map((c) => {
          const isSelected = selectedCity === c.slug;
          return (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-3.5 text-xs font-medium transition-colors ${
                isSelected
                  ? "bg-[#f3e03a] text-[#16140a]"
                  : "border border-white/10 bg-white/5 text-white/80 hover:border-[#f3e03a]/50 hover:bg-white/10 hover:text-white"
              }`}
            >
              {c.name}
            </Link>
          );
        })}
      </div>

      {/* Dynamic event format pills */}
      <div className="flex max-w-full items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {QUICK_FORMAT_CHIPS.map((chip) => {
          const Icon = chip.icon;
          const isActive =
            (chip.slug === "todos" && !currentType && pathname === "/explorar") ||
            (currentType && chip.href.includes(`type=${currentType}`));

          return (
            <Link
              key={chip.slug}
              href={chip.href}
              className={`group inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-xs font-semibold backdrop-blur-md transition-colors ${
                isActive
                  ? "border border-[#f3e03a] bg-[#f3e03a] text-[#16140a]"
                  : "border border-white/10 bg-[#141414] text-white/80 hover:border-[#f3e03a]/50 hover:bg-[#1c1c1c] hover:text-white"
              }`}
            >
              <Icon
                className={`size-3.5 transition-transform group-hover:scale-110 ${
                  isActive ? "text-[#16140a]" : "text-[#f3e03a]"
                }`}
              />
              <span>{chip.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
