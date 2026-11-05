import { RESERVED_CITY_SLUGS } from "@/lib/shared";

export const SEO_WHEN_SLUGS = [
  "hoje",
  "amanha",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
  "domingo",
] as const;

export const SEO_TOPIC_SLUGS = [
  "musica-ao-vivo",
  "show-ao-vivo",
  "show",
  "shows",
  "barzinho-com-show",
  "barzinho",
  "bares-com-show",
  "bar-com-show",
  "barzinho-com-show-ao-vivo",
  "boteco",
  "casa-noturna",
  "balada",
  "casa-de-shows",
  "programacao",
  "agenda",
] as const;

export function isReservedCitySlug(slug: string) {
  return (RESERVED_CITY_SLUGS as readonly string[]).includes(slug);
}

export function isSeoWhenSlug(slug: string) {
  return (SEO_WHEN_SLUGS as readonly string[]).includes(slug);
}

export function isSeoTopicSlug(slug: string) {
  return (SEO_TOPIC_SLUGS as readonly string[]).includes(slug);
}

export function searchHref(what: string, when: string, city: string) {
  const whenSlug =
    when === "today" ? "hoje" : when === "friday" ? "sexta" : when === "saturday" ? "sabado" : when === "sunday" ? "domingo" : null;
  const topic =
    what === "live-music" || what === "dj"
      ? "musica-ao-vivo"
      : what === "bar" || what === "pub"
        ? "barzinho-com-show"
        : what === "boteco"
          ? "boteco"
          : what === "balada"
            ? "casa-noturna"
            : null;
  if (city && topic && whenSlug) {
    return `/${city}/${topic}/${whenSlug}`;
  }
  if (city && !topic && whenSlug) {
    return `/${city}/${whenSlug}`;
  }
  if (!city && topic === "musica-ao-vivo" && whenSlug) {
    return `/musica-ao-vivo/${whenSlug}`;
  }
  if (!city && !topic && whenSlug === "hoje") {
    return "/hoje";
  }
  const params = new URLSearchParams();
  if (city) params.set("city", city);
  if (when === "today") params.set("date", new Date().toISOString().slice(0, 10));
  if (what === "live-music" || what === "dj") params.set("liveMusic", "true");
  if (what === "boteco" || what === "bar" || what === "pub" || what === "balada" || what === "restaurante") {
    params.set("category", what === "bar" ? "bar" : what);
  }
  return `/explorar?${params.toString()}`;
}
