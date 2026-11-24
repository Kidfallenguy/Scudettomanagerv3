import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CLUBS, LEAGUE_ONE_IDS, LEAGUE_TWO_IDS } from "./clubs.ts";
import { ENGLISH_LOWER_LEAGUE_SQUADS } from "./english-lower-squads.ts";
import { NAT_LABEL, SQUAD_LIMIT } from "./format.ts";
import { Rng } from "./rng.ts";
import { buildSquad } from "./squads.ts";
import { createCareer } from "./world.ts";

const DIVISIONS = [
  {
    league: "leagueOne",
    clubIds: LEAGUE_ONE_IDS,
    expectedPlayers: 643,
    minOverall: 42,
    maxOverall: 72,
    maxPotential: 85,
  },
  {
    league: "leagueTwo",
    clubIds: LEAGUE_TWO_IDS,
    expectedPlayers: 646,
    minOverall: 38,
    maxOverall: 66,
    maxPotential: 82,
  },
] as const;

const ALL_SEEDS = Object.entries(ENGLISH_LOWER_LEAGUE_SQUADS).flatMap(
  ([clubId, seeds]) => seeds.map((seed) => ({ clubId, seed })),
);

describe("English lower-league starting squads 2026/27", () => {
  it("covers all 48 configured clubs with verified, unique player profiles", () => {
    const expectedClubIds = new Set(DIVISIONS.flatMap((division) => division.clubIds));
    const sourceIds = new Set<string>();

    for (const division of DIVISIONS) {
      assert.equal(division.clubIds.length, 24);
      assert.equal(
        division.clubIds.reduce(
          (count, clubId) => count + (ENGLISH_LOWER_LEAGUE_SQUADS[clubId]?.length ?? 0),
          0,
        ),
        division.expectedPlayers,
      );

      for (const clubId of division.clubIds) {
        assert.ok(
          (ENGLISH_LOWER_LEAGUE_SQUADS[clubId]?.length ?? 0) >= 15,
          `${clubId} is missing its researched squad`,
        );
      }
    }

    assert.equal(Object.keys(ENGLISH_LOWER_LEAGUE_SQUADS).length, expectedClubIds.size);
    for (const clubId of Object.keys(ENGLISH_LOWER_LEAGUE_SQUADS)) {
      assert.ok(expectedClubIds.has(clubId), `unexpected squad group ${clubId}`);
    }

    for (const { clubId, seed } of ALL_SEEDS) {
      assert.match(seed.sourceId ?? "", /^\d+$/, `${seed.name} has no stable profile ID`);
      assert.ok(!sourceIds.has(seed.sourceId!), `duplicate profile ID ${seed.sourceId}`);
      sourceIds.add(seed.sourceId!);
      assert.ok(seed.age >= 15 && seed.age <= 50, `${seed.name} has an invalid age`);
      assert.ok(seed.ovr >= 1 && seed.ovr <= 100, `${seed.name} has an invalid GRL`);
      assert.ok(seed.pot !== undefined && seed.pot >= seed.ovr, `${seed.name} has invalid potential`);
      assert.ok(NAT_LABEL[seed.nat], `${seed.name} has an unknown nationality ${seed.nat}`);
      assert.ok(seed.marketValueEur === null || (seed.marketValueEur !== undefined && seed.marketValueEur >= 0));
      assert.ok(seed.contractExpiry === null || seed.contractExpiry === undefined || /^\d{2}\/\d{2}\/\d{4}$/.test(seed.contractExpiry));
      assert.ok(seed.contract === undefined || (seed.contract >= 1 && seed.contract <= 5));
      assert.ok(seed.loanFrom === undefined || CLUBS.some((club) => club.id === seed.loanFrom));

      const division = DIVISIONS.find(({ clubIds }) => clubIds.includes(clubId));
      assert.ok(division);
      assert.ok(seed.ovr >= division.minOverall);
      assert.ok(seed.ovr <= division.maxOverall);
      assert.ok(seed.pot! <= division.maxPotential);
    }
  });

  it("builds bounded squads with correct clubs, stable IDs, and mapped loans", () => {
    const usedNames = new Set<string>();
    const playerIds = new Set<string>();
    let index = 0;
    let importedCount = 0;
    let mappedLoanCount = 0;

    for (const division of DIVISIONS) {
      for (const clubId of division.clubIds) {
        const seeds = ENGLISH_LOWER_LEAGUE_SQUADS[clubId] ?? [];
        const squad = buildSquad(clubId, new Rng(20261011 + index++), usedNames);
        assert.ok(squad.length >= 18, `${clubId} has an undersized squad`);
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
          if (seed.loanFrom) mappedLoanCount += 1;
        }
      }
    }

    assert.equal(importedCount, 1289);
    assert.equal(mappedLoanCount, 186);
  });

  it("loads the researched players and represented loans into new careers", () => {
    const save = createCareer("sb_pal", 20261011);
    const players = new Map(save.players.map((player) => [player.id, player]));
    const expectedLoans = new Map(
      ALL_SEEDS.filter(({ seed }) => seed.loanFrom).map(({ clubId, seed }) => [
        `tm-${seed.sourceId}`,
        { clubId, seed },
      ]),
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
