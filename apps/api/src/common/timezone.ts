import { APP_TIMEZONE, type DayOfWeek } from "./shared";

const WEEKDAYS: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export function zonedParts(date: Date, timeZone = APP_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "0";
  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour: Number(read("hour")),
    minute: Number(read("minute")),
  };
}

export function saoPauloDateTime(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour + 3, minute, 0);
  const asZone = zonedParts(new Date(utcGuess));
  const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
  const actual = Date.UTC(asZone.year, asZone.month - 1, asZone.day, asZone.hour, asZone.minute, 0);
  return new Date(utcGuess + (desired - actual));
}

export function parseDateInput(value?: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return { year: year!, month: month!, day: day! };
  }
  const now = zonedParts(new Date());
  return { year: now.year, month: now.month, day: now.day };
}

export function dayBounds(date?: string) {
  const { year, month, day } = parseDateInput(date);
  const start = saoPauloDateTime(year, month, day, 0, 0);
  const endDate = new Date(Date.UTC(year, month - 1, day + 1));
  const end = saoPauloDateTime(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth() + 1,
    endDate.getUTCDate(),
    0,
    0,
  );
  return { start, end, year, month, day };
}

export function weekdayFromDate(date?: string): DayOfWeek {
  const { year, month, day } = parseDateInput(date);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return WEEKDAYS[utc.getUTCDay()] ?? "SUNDAY";
}

export function nextPresetDate(preset: "today" | "friday" | "saturday" | "sunday") {
  const today = parseDateInput();
  if (preset === "today") {
    return formatYmd(today.year, today.month, today.day);
  }
  const target = preset === "friday" ? 5 : preset === "saturday" ? 6 : 0;
  const current = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay();
  const delta = (target - current + 7) % 7;
  const next = new Date(Date.UTC(today.year, today.month - 1, today.day + delta));
  return formatYmd(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
}

export function formatYmd(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function addDaysYmd(base: { year: number; month: number; day: number }, amount: number) {
  const utc = new Date(Date.UTC(base.year, base.month - 1, base.day + amount));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

export function ymdOf(date: Date, timeZone = APP_TIMEZONE) {
  const parts = zonedParts(date, timeZone);
  return formatYmd(parts.year, parts.month, parts.day);
}

export function tomorrowYmd(from?: string) {
  const next = addDaysYmd(parseDateInput(from), 1);
  return { ...next, ymd: formatYmd(next.year, next.month, next.day) };
}

export function nextWeekdayInclusive(target: DayOfWeek, from?: string) {
  const today = parseDateInput(from);
  const current = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay();
  const targetIndex = WEEKDAYS.indexOf(target);
  const delta = (targetIndex - current + 7) % 7;
  const next = addDaysYmd(today, delta);
  return { ...next, ymd: formatYmd(next.year, next.month, next.day) };
}

export function toSaoPauloIso(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return `${read("year")}-${read("month")}-${read("day")}T${read("hour")}:${read("minute")}:${read("second")}-03:00`;
}

export function publicAssetUrl(path: string | null | undefined) {
  if (!path) {
    return null;
  }
  const normalized = path.replace(/^\//, "");
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }
  if (normalized.startsWith("demo/")) {
    return `/${normalized}`;
  }
  const base = process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.API_PORT ?? 3001}`;
  return `${base.replace(/\/$/, "")}/uploads/${normalized}`;
}
