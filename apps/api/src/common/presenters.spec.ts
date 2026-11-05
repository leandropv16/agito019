import { cardVisibility, commercialBadge } from "./presenters";

const now = new Date("2026-09-20T15:00:00.000Z");

function campaign(overrides: Partial<{ paymentStatus: string; startsAt: Date; endsAt: Date; plan: Record<string, unknown> }> = {}) {
  return {
    paymentStatus: "PAID",
    startsAt: new Date("2026-09-01T00:00:00.000Z"),
    endsAt: new Date("2026-09-30T00:00:00.000Z"),
    plan: {
      slug: "destaque",
      highlighted: true,
      priority: 50,
      showPhoto: true,
      showInstagram: true,
      showWebsite: false,
      showMap: true,
      showArtist: true,
      showArtistInstagram: false,
    },
    ...overrides,
  };
}

describe("cardVisibility", () => {
  it("devolve só as flags do plano vigente", () => {
    const visibility = cardVisibility([campaign()], now);
    expect(visibility).toEqual({
      showPhoto: true,
      showInstagram: true,
      showWebsite: false,
      showMap: true,
      showArtist: true,
      showArtistInstagram: false,
    });
    expect(Object.keys(visibility)).not.toContain("slug");
    expect(Object.keys(visibility)).not.toContain("priority");
  });

  it("sem campanha paga usa o padrão orgânico", () => {
    expect(cardVisibility([], now)).toEqual({
      showPhoto: true,
      showInstagram: false,
      showWebsite: false,
      showMap: false,
      showArtist: true,
      showArtistInstagram: false,
    });
  });
});

describe("commercialBadge", () => {
  it("marca PATROCINADO e DESTAQUE só com campanha PAID vigente", () => {
    expect(commercialBadge([campaign({ plan: { slug: "patrocinado", highlighted: true, priority: 100 } })], now)).toBe(
      "PATROCINADO",
    );
    expect(commercialBadge([campaign()], now)).toBe("DESTAQUE");
    expect(commercialBadge([campaign({ paymentStatus: "PENDING" })], now)).toBeNull();
  });
});
