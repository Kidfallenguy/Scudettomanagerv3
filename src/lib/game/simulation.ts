import { clubById, competitionToLeague, playableLeague, type PlayableLeague } from "./clubs";
import { Rng } from "./rng";
import type { Fixture, GameSave, MatchResult } from "./types";

export function shouldUseDetailedSimulation(
  save: Pick<GameSave, "clubId">,
  fixture: Fixture,
  managedLeague?: PlayableLeague,
): boolean {
  if (fixture.homeId === save.clubId || fixture.awayId === save.clubId) return true;

  const league = competitionToLeague(fixture.competition);
  if (!league) return true;
  return league === (managedLeague ?? playableLeague(clubById(save.clubId).league));
}

function randomScore(rng: Rng): number {
  const roll = rng.int(0, 99);
  if (roll < 22) return 0;
  if (roll < 52) return 1;
  if (roll < 77) return 2;
  if (roll < 91) return 3;
  if (roll < 97) return 4;
  if (roll < 99) return 5;
  return 6;
}

function fixtureHash(id: string): number {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash = Math.imul(hash ^ id.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

/** Marcador pseudoaleatorio ligero para ligas secundarias; conserva la reproducibilidad de la carrera. */
export function simulateQuickMatch(fixture: Fixture, seed: number): MatchResult {
  const rng = new Rng(seed ^ fixtureHash(fixture.id));
  const homeGoals = randomScore(rng);
  const awayGoals = randomScore(rng);
  const emptyStats = { shots: 0, onTarget: 0, possession: 50, corners: 0, fouls: 0, yellows: 0, reds: 0 };

  return {
    fixtureId: fixture.id,
    homeId: fixture.homeId,
    awayId: fixture.awayId,
    homeGoals,
    awayGoals,
    events: [],
    homeStats: { ...emptyStats },
    awayStats: { ...emptyStats },
    homeLineup: [],
    awayLineup: [],
    homeGrl: 65,
    awayGrl: 65,
  };
}
