import assert from "node:assert/strict";
import { test } from "node:test";
import { createAward } from "./awards";
import {
  EMPTY_GLOBAL_CAREER_HISTORY,
  globalWinPercentage,
  normalizeGlobalCareerHistory,
  recordGlobalCareerSeasons,
  recordGlobalMatches,
  recordGlobalSeasonAwards,
} from "./global-history";
import { createCareer } from "./world";

test("el historial global cuenta cada partido una sola vez y conserva su porcentaje", () => {
  const save = createCareer("int", 2010);
  const fixture = {
    id: "fixture-global-1",
    competition: "serieA" as const,
    round: 1,
    homeId: save.clubId,
    awayId: "mil",
    played: true,
    homeGoals: 2,
    awayGoals: 1,
  };
  const once = recordGlobalMatches(EMPTY_GLOBAL_CAREER_HISTORY, save, [
    fixture,
  ]);
  const twice = recordGlobalMatches(once, save, [fixture]);

  assert.equal(twice.played, 1);
  assert.equal(twice.won, 1);
  assert.equal(twice.drawn, 0);
  assert.equal(twice.lost, 0);
  assert.equal(globalWinPercentage(twice), 100);
});

test("el historial global guarda solo los premios ganados por el club de la carrera", () => {
  const save = createCareer("int", 2011);
  save.seasonOver = true;
  const award = createAward(save.season, "dt_anio");
  award.winner = { id: save.clubId, name: "DT", clubId: save.clubId };
  save.awards = [award];

  const history = recordGlobalSeasonAwards(EMPTY_GLOBAL_CAREER_HISTORY, save);
  const normalized = normalizeGlobalCareerHistory(history);
  const again = recordGlobalSeasonAwards(normalized, save);

  assert.equal(normalized.awards.length, 1);
  assert.equal(normalized.awards[0]?.clubId, save.clubId);
  assert.equal(normalized.awards[0]?.winnerName, "DT");
  assert.equal(again.awards.length, 1);
});

test("el porcentaje también incorpora temporadas archivadas una sola vez", () => {
  const save = createCareer("int", 2012);
  save.careerHistory = [
    {
      season: 2025,
      clubId: save.clubId,
      place: 1,
      teams: 20,
      played: 4,
      won: 3,
      drawn: 0,
      lost: 1,
      gf: 8,
      ga: 3,
      titles: [],
      highlights: [],
    },
  ];

  const first = recordGlobalCareerSeasons(EMPTY_GLOBAL_CAREER_HISTORY, save);
  const second = recordGlobalCareerSeasons(first, save);

  assert.equal(second.played, 4);
  assert.equal(second.won, 3);
  assert.equal(globalWinPercentage(second), 75);
});
