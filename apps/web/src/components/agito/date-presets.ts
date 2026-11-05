export function nextPresetDate(preset: string) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  if (preset === "today") {
    return parts;
  }
  const [year, month, day] = parts.split("-").map(Number);
  const current = new Date(Date.UTC(year!, month! - 1, day!)).getUTCDay();
  const target = preset === "friday" ? 5 : preset === "saturday" ? 6 : 0;
  const delta = (target - current + 7) % 7;
  const next = new Date(Date.UTC(year!, month! - 1, day! + delta));
  return next.toISOString().slice(0, 10);
}
