import assert from "node:assert/strict";
import test from "node:test";
import {
  HOME_FILTER_GROUPS,
  SEARCH_CITIES,
  brazilianHolidayYmds,
  buildHomeFilterPath,
  emptyHomeFilter,
  homeFilterResultLine,
  parseHomeFilterQuery,
  upcomingHolidayYmds,
} from "./search-flow.ts";

const sextalouveira = {
  ...emptyHomeFilter(),
  semana: "sexta",
  cidade: "louveira",
  bares: "com-musica",
};

test("cidades e listas do mockup", () => {
  assert.deepEqual(
    SEARCH_CITIES.map((item) => item.name),
    ["Campinas", "Valinhos", "Vinhedo", "Louveira", "Jundiaí", "Hortolândia", "Sumaré", "Indaiatuba", "Paulínia", "Cosmópolis"],
  );
  const labels = Object.fromEntries(HOME_FILTER_GROUPS.map((group) => [group.id, group.options.map((option) => option.label)]));
  assert.deepEqual(labels.semana, ["Quarta", "Quinta", "Sexta", "Sábado", "Domingo", "Feriados"]);
  assert.deepEqual(labels.bares, ["Com Musica", "Sem Musica"]);
  assert.deepEqual(labels.restaurantes, ["Elegante", "Sofisticado", "Casual", "Familiar", "Com Musica", "Sem Musica"]);
  assert.deepEqual(labels.baladas, ["Eletrônica", "Rock", "Pop Rock", "Sertanejo", "Samba", "Pagode", "Anos 80"]);
  assert.deepEqual(labels.musicos, ["Pop Rock", "Rock", "Sertanejo", "Samba", "Pagode", "Acústico", "MPB", "Misto", "Jazz", "Bossa Nova", "Classicas", "Lounge"]);
  assert.deepEqual(labels.eventos, ["Corridas", "Carro Antigo", "MotorCycle", "BikeCycle", "Shows", "Gastronomia", "Teatro", "Aulas Livre"]);
});

test("linha de resultado usa hifen ASCII", () => {
  const line = homeFilterResultLine(sextalouveira);
  assert.equal(line, "Resultado da pesquisa: Sexta - Louveira - Bares - Com Musica -");
  assert.equal(/\u2013|\u2014/.test(line), false);
  assert.equal(buildHomeFilterPath(sextalouveira), "/?semana=sexta&cidade=louveira&bares=com-musica");
  assert.equal(parseHomeFilterQuery({ bares: "jazz" }), null);
});

test("feriados a partir de 14 de outubro de 2026", () => {
  assert.equal(brazilianHolidayYmds(2026).includes("2026-04-03"), true);
  assert.equal(brazilianHolidayYmds(2026).includes("2026-11-02"), true);
  const upcoming = upcomingHolidayYmds("2026-10-14");
  assert.equal(upcoming.includes("2026-11-02"), true);
  assert.equal(upcoming.includes("2026-10-12"), false);
});
