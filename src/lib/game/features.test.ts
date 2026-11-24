import assert from "node:assert/strict";
import { test } from "node:test";
import { selectSeasonAwards } from "./award-selection";
import { clubById, domesticIds } from "./clubs";
import { normalizePotential } from "./potential";
import { competitionTopAssists } from "./selectors";
import { useGame } from "./store";
import type { Fixture } from "./types";
import { createCareer } from "./world";

test("el potencial nunca supera 100 y repara el dato incorrecto de Mauro Schönfeld", () => {
  const save = createCareer("arg_3_abr", 20261014);
  const mauro = [...save.players, ...save.freeAgents].find((player) => player.name === "Mauro Schönfeld");
  assert.ok(mauro);
  assert.equal(mauro.pot, 73);
  assert.ok([...save.players, ...save.freeAgents].every((player) => player.pot <= 100));
  assert.equal(normalizePotential(66, 8573), 100);
  assert.equal(normalizePotential(75, 60), 75);
});

test("el calendario avanza una jornada por llamada y registra asistentes por competición", () => {
  const save = createCareer("tpa_glew", 20261012);
  const template = save.calendar[0]!;
  save.calendar = [
    { ...template, id: "test-slot-1", date: "2026-07-01", fixtures: [] },
    { ...template, id: "test-slot-2", date: "2026-07-08", fixtures: [] },
    { ...template, id: "test-slot-3", date: "2026-07-15", fixtures: [] },
  ];
  save.cursor = 0;
  useGame.setState(save as never);

  const first = useGame.getState().simulateNextCalendarSlot("2026-07-08");
  assert.equal(first?.simulatedSlots, 1);
  assert.equal(first?.done, false);
  assert.equal(useGame.getState().cursor, 1);

  const second = useGame.getState().simulateNextCalendarSlot("2026-07-08");
  assert.equal(second?.simulatedSlots, 1);
  assert.equal(second?.done, true);
  assert.equal(useGame.getState().cursor, 2);

  const [assister] = save.players;
  assert.ok(assister);
  const fixtures: Fixture[] = [
    {
      id: "assist-one",
      competition: "promocionalAmateur",
      round: 1,
      homeId: "tpa_glew",
      awayId: "tpa_el_chasqui",
      played: true,
      assistIds: [assister.id, assister.id],
    },
    {
      id: "assist-unplayed",
      competition: "promocionalAmateur",
      round: 2,
      homeId: "tpa_glew",
      awayId: "tpa_el_chasqui",
      played: false,
      assistIds: [assister.id],
    },
  ];
  assert.deepEqual(competitionTopAssists(fixtures, save.players, "promocionalAmateur"), [
    { player: assister, assists: 2 },
  ]);
});

test("los premios mundiales priorizan media y división sobre estadísticas infladas", () => {
  const save = createCareer("tpa_glew", 20261013);
  const leagues = ["serieA", "promocionalAmateur"] as const;
  for (const player of save.players) player.apps = 0;
  for (const league of leagues) {
    const rows = save.leagueTables[league];
    rows.forEach((row) => {
      row.played = 20;
      const player = save.players.find((candidate) => candidate.clubId === row.clubId && candidate.pos !== "GK");
      if (!player) return;
      const index = rows.indexOf(row);
      player.age = 19;
      player.apps = 20;
      player.ovr = 80;
      player.seasonStartOvr = 80;
      player.goals = league === "serieA" ? 75 - index * 5 : 100 - index * 10;
      player.assists = 5;
    });
  }

  selectSeasonAwards(save);

  for (const kind of ["bota_oro", "kopa"] as const) {
    const award = save.awards.find((candidate) => candidate.season === save.season && candidate.kind === kind);
    assert.ok(award);
    assert.ok(domesticIds("serieA").includes(award.nominees[0]!.clubId), `${kind} debe priorizar Serie A`);
    const clubCounts = new Map<string, number>();
    for (const nominee of award.nominees) {
      clubCounts.set(nominee.clubId, (clubCounts.get(nominee.clubId) ?? 0) + 1);
    }
    assert.ok([...clubCounts.values()].every((count) => count <= 2), `${kind} no debe concentrarse en un club`);
  }
});

test("el Balón de Oro incluye la base global de primeras divisiones aunque no haya partidos simulados", () => {
  const save = createCareer("tpa_glew", 20261014);
  for (const player of save.players) {
    player.apps = 0;
    player.goals = 0;
    player.assists = 0;
    player.ovr = 60;
    player.seasonStartOvr = 60;
    player.form = 0;
  }

  const premierPlayer = save.players.find((player) =>
    domesticIds("premier").includes(player.clubId),
  );
  const secondDivisionPlayer = save.players.find((player) =>
    domesticIds("championship").includes(player.clubId),
  );
  const userPlayer = save.players.find((player) => player.clubId === save.clubId);
  assert.ok(premierPlayer);
  assert.ok(secondDivisionPlayer);
  assert.ok(userPlayer);
  premierPlayer.ovr = 95;
  premierPlayer.seasonStartOvr = 95;
  secondDivisionPlayer.ovr = 100;
  secondDivisionPlayer.seasonStartOvr = 100;
  userPlayer.ovr = 99;
  userPlayer.seasonStartOvr = 99;

  const savedAward = save.awards.find(
    (candidate) => candidate.season === save.season && candidate.kind === "balon_oro",
  );
  assert.ok(savedAward);
  savedAward.winner = {
    id: secondDivisionPlayer.id,
    name: secondDivisionPlayer.name,
    clubId: secondDivisionPlayer.clubId,
  };

  selectSeasonAwards(save);

  const award = save.awards.find(
    (candidate) => candidate.season === save.season && candidate.kind === "balon_oro",
  );
  assert.ok(award);
  assert.equal(award.nominees[0]?.id, premierPlayer.id);
  assert.ok(award.nominees.some((nominee) => nominee.id === premierPlayer.id));
  assert.ok(
    award.nominees.every((nominee) => {
      const league = save.divisions?.[nominee.clubId] ?? clubById(nominee.clubId).league;
      return [
        "premier",
        "serieA",
        "laliga",
        "bundesliga",
        "ligue1",
        "argentina",
        "brasileirao",
        "primeira",
        "eredivisie",
        "mls",
        "saudiProLeague",
      ].includes(league);
    }),
  );
  assert.ok(!award.nominees.some((nominee) => nominee.clubId === save.clubId));
});
