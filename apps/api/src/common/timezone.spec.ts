import { formatYmd, nextWeekdayInclusive, toSaoPauloIso, tomorrowYmd } from "./timezone";

describe("fuso America/Sao_Paulo", () => {
  it("amanhã e próximo sábado incluem o dia corrente", () => {
    expect(tomorrowYmd("2026-09-20").ymd).toBe("2026-09-21");
    expect(nextWeekdayInclusive("SATURDAY", "2026-09-20").ymd).toBe("2026-09-26");
    expect(nextWeekdayInclusive("SUNDAY", "2026-09-20").ymd).toBe("2026-09-20");
    expect(formatYmd(2026, 9, 4)).toBe("2026-09-04");
  });

  it("serializa ISO com offset de São Paulo", () => {
    const iso = toSaoPauloIso(new Date("2026-09-20T23:00:00.000Z"));
    expect(iso.endsWith("-03:00")).toBe(true);
    expect(iso.startsWith("2026-09-20T20:00:00")).toBe(true);
  });
});
