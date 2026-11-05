import type { ComponentType, SVGProps } from "react";
import {
  Activity,
  Bike,
  CalendarDays,
  Car,
  Dog,
  Drama,
  Gauge,
  HeartPulse,
  Landmark,
  MapPin,
  Music,
  Palette,
  PartyPopper,
  Sparkles,
  Timer,
  Trophy,
  UtensilsCrossed,
  Volume2,
} from "lucide-react";
import {
  type EventFormatDef,
  type EventFormatSlug,
  getEventFormatBySlug,
  resolveEventFormat,
} from "@/lib/shared";

const ICON_MAP: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  Timer,
  Car,
  Volume2,
  Bike,
  Gauge,
  Sparkles,
  MapPin,
  Dog,
  Palette,
  UtensilsCrossed,
  PartyPopper,
  Trophy,
  Drama,
  HeartPulse,
  Music,
  CalendarDays,
  Landmark,
  Activity,
};

export function getFormatIcon(iconName: string): ComponentType<SVGProps<SVGSVGElement>> {
  return ICON_MAP[iconName] ?? Sparkles;
}

export function EventFormatBadge({
  format,
  event,
  size = "md",
  showIcon = true,
}: {
  format?: EventFormatDef | EventFormatSlug | null;
  event?: {
    title?: string;
    description?: string | null;
    eventType?: string;
    format?: string | null;
  } | null;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}) {
  let resolved: EventFormatDef | null = null;
  if (typeof format === "string") {
    resolved = getEventFormatBySlug(format);
  } else if (format) {
    resolved = format;
  } else if (event) {
    resolved = resolveEventFormat(event);
  }

  if (!resolved) {
    resolved = resolveEventFormat(null);
  }

  const Icon = getFormatIcon(resolved.iconName);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-[11px] gap-1.5",
    lg: "px-3 py-1.5 text-xs gap-2",
  }[size];

  const iconSizes = {
    sm: "size-3",
    md: "size-3.5",
    lg: "size-4",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider backdrop-blur-md border shadow-xs ${sizeClasses} ${resolved.badgeStyle.bg} ${resolved.badgeStyle.text} ${resolved.badgeStyle.border}`}
    >
      {showIcon ? <Icon className={`${iconSizes} shrink-0`} /> : null}
      <span>{resolved.badgeTag}</span>
    </span>
  );
}
