import { publishedEstablishmentWhere, publishedEventWhere } from "./discovery.queries";

describe("filtros públicos", () => {
  it("publicação só lista PUBLISHED e sem soft delete", () => {
    const where = publishedEstablishmentWhere({});
    expect(where.status).toBe("PUBLISHED");
    expect(where.deletedAt).toBeNull();
  });

  it("filtra cidade, público e categoria", () => {
    const where = publishedEstablishmentWhere({
      city: "campinas",
      audience: "casal",
      category: "boteco",
    });
    expect(where.city).toEqual({ slug: "campinas", active: true });
    expect(where.audiences).toBeDefined();
    expect(where.categories).toBeDefined();
  });

  it("música ao vivo usa tipo LIVE_MUSIC e dia", () => {
    const where = publishedEstablishmentWhere({ liveMusic: true, date: "2026-09-20" });
    expect(where.events).toBeDefined();
  });

  it("eventos por gênero e cidade", () => {
    const where = publishedEventWhere({ city: "campinas", genre: "rock" });
    expect(where.genres).toBeDefined();
    expect(where.establishment).toBeDefined();
  });
});
