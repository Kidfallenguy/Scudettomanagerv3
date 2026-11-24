import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CLUBS, domesticIds } from "./clubs.ts";
import { createCareer } from "./world.ts";
import { buildSquad } from "./squads.ts";
import { Rng } from "./rng.ts";
import { SPANISH_SQUAD_SEEDS } from "./spanish-squads.ts";

describe("Spanish starting squads 2026/27", () => {
  it("loads verified players with stable, unique identities in all 62 configured clubs", () => {
    const divisions = [
      { league: "segunda", expectedClubs: 22 },
      { league: "primeraFed1", expectedClubs: 20 },
      { league: "primeraFed2", expectedClubs: 20 },
    ] as const;
    const usedNames = new Set<string>();
    const playerIds = new Set<string>();
    let seedCount = 0;

    for (const [divisionIndex, division] of divisions.entries()) {
      const clubIds = domesticIds(division.league);
      assert.equal(clubIds.length, division.expectedClubs);

      for (const [clubIndex, clubId] of clubIds.entries()) {
        const seeds = SPANISH_SQUAD_SEEDS[clubId] ?? [];
        assert.ok(seeds.length >= 15, `${clubId} has no usable researched squad`);
        seedCount += seeds.length;

        const squad = buildSquad(clubId, new Rng(20261011 + divisionIndex * 100 + clubIndex), usedNames);
        assert.ok(squad.length >= 25, `${clubId} has only ${squad.length} players`);
        for (const seed of seeds) {
          const player = squad.find((candidate) => candidate.id === `tm-${seed.sourceId}`);
          assert.ok(player, `${seed.name} is missing from ${clubId}`);
          assert.equal(player.clubId, clubId);
          assert.ok(player.age >= 15 && player.age <= 50);
          assert.ok(player.ovr >= 1 && player.ovr <= 100);
          assert.ok(player.pot >= player.ovr && player.pot <= 100);
          assert.ok(seed.marketValueEur === null || seed.marketValueEur >= 0);
          assert.ok(player.value > 0);
          assert.ok(player.contract >= 1);
          assert.ok(CLUBS.some((club) => club.id === player.clubId));
          assert.ok(!playerIds.has(player.id), `duplicate player ID ${player.id}`);
          playerIds.add(player.id);
        }
      }
    }

    assert.equal(seedCount, 1519);
    assert.equal(playerIds.size, seedCount);
  });

  it("creates initial loan records only when both clubs and the player exist", () => {
    const save = createCareer("gir", 20261011);
    const seeds = Object.values(SPANISH_SQUAD_SEEDS).flat();
    assert.ok(save.loans.length > 0);

    for (const seed of seeds) {
      const player = save.players.find((candidate) => candidate.id === `tm-${seed.sourceId}`);
      assert.ok(player, `missing new-career player ${seed.name}`);
      assert.equal(player.pot, seed.pot);
      assert.ok(CLUBS.some((club) => club.id === player.clubId));
    }

    for (const loan of save.loans) {
      const player = save.players.find((candidate) => candidate.id === loan.playerId);
      assert.ok(player, `missing loan player ${loan.playerId}`);
      assert.equal(player.loanFrom, loan.fromClubId);
      assert.equal(player.clubId, loan.toClubId);
      assert.ok(CLUBS.some((club) => club.id === loan.fromClubId));
      assert.ok(CLUBS.some((club) => club.id === loan.toClubId));
      assert.equal(loan.seasonsLeft, 1);
    }
  });
});
