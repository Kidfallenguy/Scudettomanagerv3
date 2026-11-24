import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CLUBS, SERIE_B_IDS, SERIE_C_IDS, SERIE_D_IDS } from "./clubs.ts";
import { NAT_LABEL, SQUAD_LIMIT } from "./format.ts";
import { ITALIAN_SQUAD_SEEDS } from "./italian-squads.ts";
import { Rng } from "./rng.ts";
import { buildSquad } from "./squads.ts";
import { createCareer } from "./world.ts";

const DIVISIONS = [
  {
    league: "serieB",
    clubIds: SERIE_B_IDS,
    expectedClubs: 20,
    expectedPlayers: 544,
    minOverall: 50,
    maxOverall: 75,
    maxPotential: 89,
  },
  {
    league: "serieC",
    clubIds: SERIE_C_IDS,
    expectedClubs: 20,
    expectedPlayers: 519,
    minOverall: 43,
    maxOverall: 69,
    maxPotential: 84,
  },
  {
    league: "serieD",
    clubIds: SERIE_D_IDS,
    expectedClubs: 18,
    expectedPlayers: 526,
    minOverall: 38,
    maxOverall: 64,
    maxPotential: 79,
  },
] as const;

const ALL_SEEDS = Object.entries(ITALIAN_SQUAD_SEEDS).flatMap(([clubId, seeds]) =>
  seeds.map((seed) => ({ clubId, seed })),
);
const MAX_POTENTIAL_BY_CLUB = new Map(
  DIVISIONS.flatMap((division) => division.clubIds.map((clubId) => [clubId, division.maxPotential] as const)),
);
const OVERALL_BOUNDS_BY_CLUB = new Map(
  DIVISIONS.flatMap((division) =>
    division.clubIds.map((clubId) => [clubId, [division.minOverall, division.maxOverall]] as const),
  ),
);

describe("Italian starting squads 2026/27", () => {
  it("covers every Italian club configured in the game with unique, valid player records", () => {
    const sourceIds = new Set<string>();
    const expectedClubIds = new Set(DIVISIONS.flatMap((division) => division.clubIds));

    for (const division of DIVISIONS) {
      assert.equal(division.clubIds.length, division.expectedClubs);
      const divisionSeeds = division.clubIds.flatMap((clubId) => {
        const seeds = ITALIAN_SQUAD_SEEDS[clubId] ?? [];
        assert.ok(seeds.length >= 15, `${clubId} has no usable researched squad`);
        return seeds;
      });
      assert.equal(divisionSeeds.length, division.expectedPlayers);

      for (const clubId of division.clubIds) {
        assert.ok(ITALIAN_SQUAD_SEEDS[clubId], `${clubId} is missing from the imported squads`);
      }
    }

    assert.equal(Object.keys(ITALIAN_SQUAD_SEEDS).length, expectedClubIds.size);
    for (const clubId of Object.keys(ITALIAN_SQUAD_SEEDS)) {
      assert.ok(expectedClubIds.has(clubId), `unexpected Italian seed group ${clubId}`);
    }

    let playersMissingMarketValue = 0;
    let playersMissingContract = 0;
    for (const { clubId, seed } of ALL_SEEDS) {
      assert.match(seed.sourceId ?? "", /^\d+$/, `${seed.name} has no stable Transfermarkt profile ID`);
      assert.ok(!sourceIds.has(seed.sourceId!), `duplicate Transfermarkt profile ID ${seed.sourceId}`);
      sourceIds.add(seed.sourceId!);
      assert.ok(seed.age >= 15 && seed.age <= 50, `${seed.name} has invalid age ${seed.age}`);
      assert.ok(seed.ovr >= 1 && seed.ovr <= 100, `${seed.name} has invalid GRL ${seed.ovr}`);
      const [minOverall, maxOverall] = OVERALL_BOUNDS_BY_CLUB.get(clubId)!;
      assert.ok(seed.ovr >= minOverall && seed.ovr <= maxOverall, `${seed.name} is outside ${clubId}'s GRL range`);
      assert.ok(seed.pot !== undefined && seed.pot >= seed.ovr, `${seed.name} has invalid potential`);
      const maxPotential = MAX_POTENTIAL_BY_CLUB.get(clubId) ?? 100;
      assert.ok(seed.pot <= maxPotential, `${seed.name} exceeds ${clubId}'s potential range`);
      assert.ok(NAT_LABEL[seed.nat], `${seed.name} has unknown nationality code ${seed.nat}`);
      assert.ok(seed.marketValueEur === null || (seed.marketValueEur !== undefined && seed.marketValueEur >= 0));
      assert.ok(seed.contract === undefined || (seed.contract >= 1 && seed.contract <= 5));
      if (seed.marketValueEur == null) playersMissingMarketValue += 1;
      if (seed.contract === undefined) playersMissingContract += 1;
      assert.ok(seed.loanFrom === undefined || CLUBS.some((club) => club.id === seed.loanFrom));
    }

    assert.equal(ALL_SEEDS.length, 1589);
    assert.equal(ALL_SEEDS.filter(({ seed }) => seed.loanFrom).length, 208);
    assert.equal(playersMissingMarketValue, 306);
    assert.equal(playersMissingContract, 229);
    assert.equal(ALL_SEEDS.filter(({ seed }) => seed.nat === "UNK").length, 3);
  });

  it("builds bounded rosters with every researched player assigned to the correct club", () => {
    const usedNames = new Set<string>();
    const playerIds = new Set<string>();
    let index = 0;
    let importedCount = 0;

    for (const division of DIVISIONS) {
      for (const clubId of division.clubIds) {
        const seeds = ITALIAN_SQUAD_SEEDS[clubId] ?? [];
        const squad = buildSquad(clubId, new Rng(20261011 + index++), usedNames);
        assert.ok(squad.length >= 18, `${clubId} has an undersized starting squad`);
        assert.ok(squad.length <= SQUAD_LIMIT, `${clubId} exceeds the ${SQUAD_LIMIT}-player limit`);

        for (const seed of seeds) {
          const player = squad.find((candidate) => candidate.id === `tm-${seed.sourceId}`);
          assert.ok(player, `${seed.name} is missing from ${clubId}`);
          assert.equal(player.clubId, clubId);
          assert.equal(player.ovr, seed.ovr);
          assert.equal(player.pot, seed.pot);
          assert.ok(player.value > 0);
          assert.ok(player.contract >= 1);
          assert.ok(!playerIds.has(player.id), `duplicate player ID ${player.id}`);
          playerIds.add(player.id);
          importedCount += 1;
        }
      }
    }

    assert.equal(importedCount, ALL_SEEDS.length);
  });

  it("loads the verified squads and mapped loans when creating a new career", () => {
    const save = createCareer("sb_pal", 20261011);
    const players = new Map(save.players.map((player) => [player.id, player]));
    const expectedLoans = new Map(
      ALL_SEEDS.filter(({ seed }) => seed.loanFrom).map(({ clubId, seed }) => [`tm-${seed.sourceId}`, { clubId, seed }]),
    );

    for (const { clubId, seed } of ALL_SEEDS) {
      const player = players.get(`tm-${seed.sourceId}`);
      assert.ok(player, `new career is missing ${seed.name}`);
      assert.equal(player.clubId, clubId);
      assert.equal(player.pot, seed.pot);
    }

    const importedLoans = save.loans.filter((loan) => expectedLoans.has(loan.playerId));
    assert.equal(importedLoans.length, expectedLoans.size);
    for (const loan of importedLoans) {
      const player = players.get(loan.playerId);
      const expected = expectedLoans.get(loan.playerId);
      assert.ok(player && expected);
      assert.equal(player.loanFrom, expected.seed.loanFrom);
      assert.equal(player.clubId, expected.clubId);
      assert.equal(loan.fromClubId, expected.seed.loanFrom);
      assert.equal(loan.toClubId, expected.clubId);
      assert.ok(CLUBS.some((club) => club.id === loan.fromClubId));
    }
  });
});
