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

function fixtureHash(id: string): number {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash = Math.imul(hash ^ id.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

/** Marcador ligero que usa el prestigio como grandeza del club, sin consultar ni simular sus plantillas. */
export function simulateQuickMatch(fixture: Fixture, seed: number): MatchResult {
  const rng = new Rng(seed ^ fixtureHash(fixture.id));
  const homePrestige = clubById(fixture.homeId).prestige;
  const awayPrestige = clubById(fixture.awayId).prestige;
  const strengthFactor = Math.exp(Math.max(-24, Math.min(24, homePrestige - awayPrestige)) * 0.03);
  const homeGoals = Math.min(6, rng.poisson(1.45 * strengthFactor));
  const awayGoals = Math.min(6, rng.poisson(1.1 / strengthFactor));
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
