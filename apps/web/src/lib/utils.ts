import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWhen(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatTime(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDay(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(value));
}

export function googleMapsUrl(lat: number, lng: number, fallback?: string | null) {
  return fallback ?? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function formatHour(value?: string | null) {
  if (!value) {
    return "";
  }
  if (/^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function ticketParts(value: string | Date) {
  const date = new Date(value);
  const weekday = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
  })
    .format(date)
    .replace(".", "")
    .toUpperCase();
  return {
    weekday,
    day: new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", month: "short" })
      .format(date)
      .replace(".", "")
      .toUpperCase(),
    time: formatTime(date),
  };
}

export function waLink(phone?: string | null) {
  if (!phone) return null;
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

export function formatMoneyCents(cents?: number | null) {
  if (cents == null) return null;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function formatEntryPrice(
  type?: "FREE" | "COUVERT" | "TICKET" | "UP_TO" | "FROM" | null,
  cents?: number | null,
) {
  if (!type) return null;
  if (type === "FREE") return "Entrada grátis";
  const money = formatMoneyCents(cents);
  if (!money) return null;
  if (type === "COUVERT") return `Couvert ${money}`;
  if (type === "TICKET") return `Ingresso ${money}`;
  if (type === "UP_TO") return `Até ${money}`;
  return `A partir de ${money}`;
}

export function formatEventTimeShift(value: string | Date): { shift: string; time: string; label: string } {
  const date = new Date(value);
  const time = formatTime(date);
  const hour = Number.parseInt(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
    10,
  );

  let shift = "Noite";
  if (hour >= 5 && hour < 12) {
    shift = "Manhã";
  } else if (hour >= 12 && hour < 18) {
    shift = "Tarde";
  } else if (hour < 5) {
    shift = "Madrugada";
  }

  return {
    shift,
    time,
    label: `${shift} · ${time}`,
  };
}

export function formatEventEntryDisplay(
  type?: "FREE" | "COUVERT" | "TICKET" | "UP_TO" | "FROM" | null,
  cents?: number | null,
  description?: string | null,
): string {
  if (description) {
    const descLower = description.toLowerCase();
    if (descLower.includes("1kg") || descLower.includes("alimento") || descLower.includes("solidari")) {
      return "Solidário: 1kg de alimento";
    }
  }

  if (type === "FREE" || (!type && !cents)) {
    return "Entrada Franca";
  }

  const money = formatMoneyCents(cents);
  if (!money) {
    return "Entrada Franca";
  }

  if (type === "COUVERT") return `Couvert: ${money}`;
  if (type === "TICKET") return `Ingresso: ${money}`;
  if (type === "FROM") return `A partir de ${money}`;
  if (type === "UP_TO") return `Até ${money}`;
  return money;
}

export function youtubeEmbedUrl(url?: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.replace(/^\//, "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
      if (parts[0] === "shorts" && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}

