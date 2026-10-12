import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyDivisions, clubById, currentDivisions, domesticIds, emptyStanding } from "./clubs.ts";
import { createCareer } from "./world.ts";
import { evolveSeason } from "./season.ts";

describe("Ascensos al cerrar una temporada", () => {
  it("usa las divisiones guardadas en la carrera y arma el calendario en la nueva categoría", () => {
    const userId = domesticIds("leagueTwo")[0]!;
    const swappedClubId = domesticIds("premier")[0]!;
    const save = createCareer(userId, 3001);
    const originalDivisions = currentDivisions();
    const conflictingDivisions = {
      ...save.divisions,
      [userId]: "premier" as const,
      [swappedClubId]: "leagueTwo" as const,
    };

    try {
      applyDivisions(conflictingDivisions);
      for (const league of ["leagueOne", "leagueTwo"] as const) {
        const ids = save.leagueTables[league]!.map((row) => row.clubId);
        const ranked = league === "leagueTwo" ? [userId, ...ids.filter((id) => id !== userId)] : ids;
        save.leagueTables[league] = ranked.map((clubId, index) => ({
          ...emptyStanding(clubId),
          played: 46,
          won: 46 - index,
          pts: 100 - index,
          form: ["W"],
        }));
      }

      const next = evolveSeason(save);

      assert.equal(next.divisions?.[userId], "leagueOne");
      assert.equal(clubById(userId).league, "leagueOne");
      assert.ok(next.fixtures.some((fixture) => fixture.competition === "leagueOne" && (fixture.homeId === userId || fixture.awayId === userId)));
    } finally {
      applyDivisions(originalDivisions);
    }
  });
});
