import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyDivisions, CLUBS, domesticCompetition } from "./clubs.ts";
import { shouldUseDetailedSimulation, simulateQuickMatch } from "./simulation.ts";
import type { Competition, Fixture } from "./types.ts";

const managerClub = CLUBS.find((club) => club.league === "leagueOne")!;
const sameLeagueClub = CLUBS.find((club) => club.league === "leagueOne" && club.id !== managerClub.id)!;
const anotherSameLeagueClub = CLUBS.find(
  (club) => club.league === "leagueOne" && club.id !== managerClub.id && club.id !== sameLeagueClub.id,
)!;
const lowerLeagueClub = CLUBS.find((club) => club.league === "leagueTwo")!;
const otherLowerLeagueClub = CLUBS.find((club) => club.league === "leagueTwo" && club.id !== lowerLeagueClub.id)!;
function fixture(competition: Competition, homeId: string, awayId: string): Fixture {
  return { id: `${competition}-${homeId}-${awayId}`, competition, round: 1, homeId, awayId, played: false };
}

function save(clubId = managerClub.id) {
  return { clubId };
}

describe("career match simulation", () => {
  it("simulates only the manager's current league and keeps cup fixtures complete", () => {
    const managerLeagueFixture = fixture(
      domesticCompetition(managerClub.league),
      managerClub.id,
      sameLeagueClub.id,
    );
    const lowerFixture = fixture(
      domesticCompetition(lowerLeagueClub.league),
      lowerLeagueClub.id,
      otherLowerLeagueClub.id,
    );
    const cupFixture = fixture("coppa", lowerLeagueClub.id, otherLowerLeagueClub.id);

    assert.equal(shouldUseDetailedSimulation(save(), managerLeagueFixture), true);
    assert.equal(shouldUseDetailedSimulation(save(), lowerFixture), false);
    assert.equal(shouldUseDetailedSimulation(save(), cupFixture), true);
  });

  it("moves detailed simulation to the managed club's new division after promotion", () => {
    applyDivisions({ [managerClub.id]: "leagueTwo" });
    try {
      const promotedLeagueMatch = fixture(
        domesticCompetition("leagueTwo"),
        managerClub.id,
        otherLowerLeagueClub.id,
      );
      const formerLeagueMatch = fixture(
        domesticCompetition("leagueOne"),
        sameLeagueClub.id,
        anotherSameLeagueClub.id,
      );
      const otherClubInFormerLeague = save(sameLeagueClub.id);

      assert.equal(shouldUseDetailedSimulation(save(managerClub.id), promotedLeagueMatch), true);
      assert.equal(shouldUseDetailedSimulation(save(managerClub.id), formerLeagueMatch), false);
      assert.equal(shouldUseDetailedSimulation(otherClubInFormerLeague, promotedLeagueMatch), false);
      assert.equal(shouldUseDetailedSimulation(otherClubInFormerLeague, formerLeagueMatch), true);
    } finally {
      applyDivisions();
    }
  });

  it("keeps quick scores deterministic and favors the more prestigious club", () => {
    const leagueOneClubs = CLUBS.filter((club) => club.league === managerClub.league);
    const strongest = [...leagueOneClubs].sort((a, b) => b.prestige - a.prestige)[0]!;
    const weakest = [...leagueOneClubs].sort((a, b) => a.prestige - b.prestige)[0]!;
    const match = fixture(domesticCompetition(strongest.league), strongest.id, weakest.id);
    const sameDayFixture = fixture(
      domesticCompetition(strongest.league),
      weakest.id,
      strongest.id,
    );
    const first = simulateQuickMatch(match, 7331);
    const second = simulateQuickMatch(match, 7331);
    const uniqueScores = new Set(
      Array.from({ length: 100 }, (_, index) => {
        sameDayFixture.id = `quick-${index}`;
        const result = simulateQuickMatch(sameDayFixture, 7331);
        return `${result.homeGoals}-${result.awayGoals}`;
      }),
    );
    let strongerWins = 0;
    let strongerLosses = 0;
    for (let index = 0; index < 500; index += 1) {
      match.id = `stronger-home-${index}`;
      const homeFavorite = simulateQuickMatch(match, 7331);
      if (homeFavorite.homeGoals > homeFavorite.awayGoals) strongerWins += 1;
      if (homeFavorite.homeGoals < homeFavorite.awayGoals) strongerLosses += 1;

      sameDayFixture.id = `stronger-away-${index}`;
      const awayFavorite = simulateQuickMatch(sameDayFixture, 7331);
      if (awayFavorite.awayGoals > awayFavorite.homeGoals) strongerWins += 1;
      if (awayFavorite.awayGoals < awayFavorite.homeGoals) strongerLosses += 1;
    }

    assert.deepEqual(first, second);
    assert.ok(uniqueScores.size > 20);
    assert.ok(strongerWins > strongerLosses * 2);
    assert.ok(first.homeGoals >= 0 && first.homeGoals <= 6);
    assert.ok(first.awayGoals >= 0 && first.awayGoals <= 6);
    assert.deepEqual(first.events, []);
    assert.deepEqual(first.homeStats, { shots: 0, onTarget: 0, possession: 50, corners: 0, fouls: 0, yellows: 0, reds: 0 });
    assert.deepEqual(first.homeLineup, []);
    assert.deepEqual(first.awayLineup, []);
  });
});
