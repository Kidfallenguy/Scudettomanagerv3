import assert from "node:assert/strict";
import test from "node:test";
import { careerClubName } from "./career.ts";
import { applyDivisions, clubById, currentDivisions, domesticIds, emptyStanding } from "./clubs.ts";
import { applyPromotionRelegation } from "./divisions.ts";
import { honourKinds, honourLabel, trophyLabel } from "./honours.ts";
import { seasonGrowth } from "./potential.ts";
import { trophyName, trophyPrize } from "./prizes.ts";
import { Rng } from "./rng.ts";
import { buildSquad } from "./squads.ts";
import { evolveSeason } from "./season.ts";
import { endSeason } from "./tick.ts";
import { awardTrophy, createCareer, prizeForPlace } from "./world.ts";
import { seasonBudgetGrant } from "./finance.ts";

test("los títulos de Serie C y D se registran y pagan según su categoría", () => {
  for (const [league, expectedPrize] of [["serieC", 1_500_000], ["serieD", 300_000]] as const) {
    const clubId = domesticIds(league)[0]!;
    const save = createCareer(clubId, 20261014);
    const previousCount = save.honours.scudetto;
    const leagueName = league === "serieC" ? "Serie C" : "Serie D";

    awardTrophy(save, "scudetto", clubId);

    assert.equal(save.honours.scudetto, previousCount + 1);
    assert.equal(save.careerTrophies.at(-1)?.prize, expectedPrize);
    assert.equal(save.careerTrophies.at(-1)?.clubId, clubId);
    assert.equal(save.careerTrophies.at(-1)?.label, `${leagueName} 2026/27`);
    assert.equal(trophyPrize("scudetto", league), expectedPrize);
    assert.equal(trophyName("scudetto", league), `la ${leagueName}`);
    assert.equal(honourLabel("scudetto", league), leagueName);
    assert.equal(trophyLabel("scudetto", 2026, league), `${leagueName} 2026/27`);
    assert.ok(honourKinds(league).includes("coppa"));
  }
  assert.equal(trophyPrize("coppa", "serieC"), 1_500_000);
  assert.equal(trophyPrize("coppa", "serieD"), 500_000);
});

test("la Serie D y la Serie C ascienden progresivamente hasta la Serie A", () => {
  const originalDivisions = currentDivisions();
  const serieDChampion = domesticIds("serieD")[0]!;
  const serieCChampion = domesticIds("serieC")[0]!;
  const serieBChampion = domesticIds("serieB")[0]!;
  const save = createCareer(serieDChampion, 20261015);
  const finished = structuredClone(save);

  try {
    assert.equal(save.divisions?.[serieDChampion], "serieD");
    for (const league of ["serieA", "serieB", "serieC", "serieD"] as const) {
      finished.leagueTables[league] = domesticIds(league).map((clubId, index, ids) => ({
        ...emptyStanding(clubId),
        played: 1,
        won: 1,
        pts: ids.length - index,
        form: ["W"],
      }));
    }

    const moves = applyPromotionRelegation(save, finished, new Rng(20261015));

    assert.ok(moves?.promoted.includes(serieDChampion));
    assert.equal(save.divisions?.[serieDChampion], "serieC");
    assert.equal(clubById(serieDChampion).league, "serieC");
    assert.equal(save.divisions?.[serieCChampion], "serieB");
    assert.equal(clubById(serieCChampion).league, "serieB");
    assert.equal(save.divisions?.[serieBChampion], "serieA");
    assert.equal(clubById(serieBChampion).league, "serieA");
  } finally {
    applyDivisions(originalDivisions);
  }
});

test("la progresión anual mejora también a jóvenes con pocos minutos simulados", () => {
  const template = buildSquad(domesticIds("serieD")[0]!, new Rng(41), new Set())[0]!;
  const player = {
    ...template,
    age: 18,
    ovr: 60,
    pot: 90,
    seasonStartOvr: 60,
    apps: 0,
    goals: 0,
    assists: 0,
    form: 0,
    loanFrom: undefined,
  };
  const gains = Array.from({ length: 200 }, (_, i) => seasonGrowth(player, new Rng(i + 1)).ovr - player.ovr);
  const averageGain = gains.reduce((total, gain) => total + gain, 0) / gains.length;

  assert.ok(averageGain >= 1.4 && averageGain <= 1.6, `ganancia media inesperada: ${averageGain}`);
});

test("el historial de carrera muestra la identidad personalizada y no el club sustituido", () => {
  const clubId = domesticIds("serieD")[0]!;
  const save = createCareer(clubId, 20261016);
  save.clubIdentity = {
    id: "custom-club",
    targetClubId: clubId,
    name: "Atlético de Prueba",
    short: "ATP",
    city: "Prueba",
    stadium: "Estadio Nuevo",
    capacity: 5000,
    color: "#123456",
    color2: "#ffffff",
    crest: "",
    prestige: 50,
  };

  assert.equal(careerClubName(save, clubId), "Atlético de Prueba");
  const otherClub = domesticIds("serieD")[1]!;
  assert.equal(careerClubName(save, otherClub), clubById(otherClub).name);
});

test("pasar de temporada no vuelve a pagar el premio de liga ya abonado al cierre", () => {
  const clubId = domesticIds("serieD")[0]!;
  const save = createCareer(clubId, 20261017);
  const table = domesticIds("serieD").map((id, index, ids) => ({
    ...emptyStanding(id),
    played: 1,
    won: 1,
    pts: ids.length - index,
    form: ["W"],
  }));
  save.leagueTables.serieD = table;
  save.standings = table;

  const beforeClose = save.budget;
  endSeason(save);
  const afterClose = save.budget;
  const expectedLeaguePrize = prizeForPlace(0, "serieD");
  assert.ok(afterClose >= beforeClose + expectedLeaguePrize);

  const next = evolveSeason(save);

  assert.equal(next.budget, afterClose + seasonBudgetGrant("serieD"));
});
