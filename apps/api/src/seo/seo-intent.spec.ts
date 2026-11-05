import { dayBounds } from "../common/timezone";
import {
  buildLandingCopy,
  buildSeoPath,
  eventSeoKeys,
  pathsForPublishedEvent,
  resolveSeoRange,
  resolveSeoSlots,
  resolveTopic,
} from "./seo-intent";

describe("taxonomia SEO", () => {
  it("agrupa aliases no slug canônico", () => {
    expect(resolveTopic("show-ao-vivo")).toEqual({
      id: "musica-ao-vivo",
      requested: "show-ao-vivo",
      alias: true,
    });
    expect(resolveTopic("barzinho")).toEqual({
      id: "barzinho-com-show",
      requested: "barzinho",
      alias: true,
    });
    expect(resolveTopic("balada")?.id).toBe("casa-noturna");
  });

  it("resolve slot de quando sem duplicar tópico", () => {
    const resolved = resolveSeoSlots({ city: "campinas", slot: "sabado" });
    expect(resolved).toMatchObject({ topic: null, when: "sabado", citySlug: "campinas", isAlias: false });
  });

  it("resolve tópico + quando e marca alias", () => {
    const resolved = resolveSeoSlots({ city: "piracicaba", slot: "show-ao-vivo", slot2: "hoje" });
    expect(resolved).toMatchObject({
      topic: "musica-ao-vivo",
      when: "hoje",
      isAlias: true,
    });
    expect(buildSeoPath({ city: "piracicaba", topic: "musica-ao-vivo", when: "hoje" })).toBe(
      "/piracicaba/musica-ao-vivo/hoje",
    );
  });

  it("rejeita combinação inválida", () => {
    expect(resolveSeoSlots({ city: "campinas", slot: "musica-ao-vivo", slot2: "foo" })).toBeNull();
    expect(resolveSeoSlots({ slot: "xyz" })).toBeNull();
  });

  it("sábado inclui o dia corrente quando já é sábado", () => {
    const range = resolveSeoRange("sabado", "2026-09-26");
    expect(range.ymd).toBe("2026-09-26");
    const next = resolveSeoRange("sabado", "2026-09-20");
    expect(next.ymd).toBe("2026-09-26");
  });

  it("hoje usa o fuso de São Paulo", () => {
    const range = resolveSeoRange("hoje", "2026-09-20");
    const bounds = dayBounds("2026-09-20");
    expect(range.start.getTime()).toBe(bounds.start.getTime());
    expect(range.end.getTime()).toBe(bounds.end.getTime());
  });

  it("monta H1 alinhado à query sem repetir cidade", () => {
    expect(
      buildLandingCopy({
        cityName: "Campinas",
        topic: "musica-ao-vivo",
        when: "hoje",
        eventCount: 1,
        eventTitles: ["Banda Sunset no Boteco 019"],
        establishmentCount: 1,
      }).h1,
    ).toBe("Música ao vivo em Campinas hoje");
    expect(
      buildLandingCopy({
        cityName: "Campinas",
        topic: "barzinho-com-show",
        when: "sabado",
        eventCount: 0,
        eventTitles: [],
        establishmentCount: 0,
      }).h1,
    ).toBe("Barzinho em Campinas com show ao vivo sábado");
  });

  it("gera paths da publicação sem aliases", () => {
    const startAt = dayBounds("2026-09-20").start;
    const keys = eventSeoKeys({
      eventType: "LIVE_MUSIC",
      startAt,
      categorySlugs: ["boteco", "bar"],
      from: "2026-09-20",
    });
    expect(keys).toEqual(
      expect.arrayContaining([
        { when: "hoje" },
        { when: "domingo" },
        { topic: "musica-ao-vivo", when: "hoje" },
        { topic: "barzinho-com-show" },
        { topic: "boteco", when: "hoje" },
      ]),
    );
    const paths = pathsForPublishedEvent({
      citySlug: "campinas",
      eventSlug: "sunset-no-boteco-hoje",
      placeSlug: "boteco-019",
      eventType: "LIVE_MUSIC",
      startAt,
      categorySlugs: ["boteco"],
      from: "2026-09-20",
    });
    expect(paths).toEqual(
      expect.arrayContaining([
        "/campinas/musica-ao-vivo/hoje",
        "/musica-ao-vivo/hoje",
        "/hoje",
        "/eventos/sunset-no-boteco-hoje",
        "/lugares/boteco-019",
      ]),
    );
    expect(paths.some((path) => path.includes("show-ao-vivo"))).toBe(false);
  });
});
