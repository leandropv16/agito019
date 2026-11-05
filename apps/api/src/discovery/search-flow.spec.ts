import { homeSearchEstablishmentWhere, homeSearchEventWhere, searchEstablishmentWhere, searchEventWhere } from "./discovery.queries";

describe("início da procura", () => {
  it("filtra local por música e gênero", () => {
    const where = searchEstablishmentWhere({
      city: "campinas",
      tipo: "bares",
      hasMusic: true,
      genre: "sertanejo",
    });
    expect(where.AND).toEqual(expect.any(Array));
  });

  it("filtra evento de encontro pela categoria do subtipo", () => {
    const where = searchEventWhere({
      city: "campinas",
      tipo: "encontros",
      subtype: "carros-antigos",
      hasMusic: false,
    });
    expect(where.AND).toEqual(expect.any(Array));
  });

  it("filtra cidade, dia e bar com musica juntos", () => {
    const where = homeSearchEstablishmentWhere({
      city: "louveira",
      dates: [{ start: new Date("2026-10-16T03:00:00.000Z"), end: new Date("2026-10-17T03:00:00.000Z") }],
      clauses: [{ group: "bares", venue: true, match: { category: "bares", hasMusic: true } }],
    });
    const json = JSON.stringify(where);
    expect(json).toContain("louveira");
    expect(json).toContain("bares");
    expect(json).toContain('"hasMusic":true');
    const events = homeSearchEventWhere({
      city: "louveira",
      clauses: [
        {
          group: "eventos",
          venue: true,
          match: { combine: "or", titles: ["corrida", "corridas"], modality: "corridas" },
        },
      ],
    });
    expect(JSON.stringify(events)).toContain("corrida");
  });
});
