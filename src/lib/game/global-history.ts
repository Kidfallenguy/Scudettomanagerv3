import { isAwardKind, type AwardKind } from "./awards";
import { clubById } from "./clubs";
import type { Fixture, GameSave } from "./types";

export interface GlobalAwardWin {
  id: string;
  kind: AwardKind;
  season: number;
  clubId: string;
  clubName: string;
  winnerName: string;
}

export interface GlobalCareerHistory {
  matchKeys: string[];
  seasonKeys: string[];
  played: number;
  won: number;
  drawn: number;
  lost: number;
  awards: GlobalAwardWin[];
}

export const EMPTY_GLOBAL_CAREER_HISTORY: GlobalCareerHistory = {
  matchKeys: [],
  seasonKeys: [],
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  awards: [],
};

export function normalizeGlobalCareerHistory(
  raw: unknown,
): GlobalCareerHistory {
  if (!raw || typeof raw !== "object")
    return { ...EMPTY_GLOBAL_CAREER_HISTORY };
  const value = raw as Partial<GlobalCareerHistory>;
  const matchKeys = Array.isArray(value.matchKeys)
    ? [
        ...new Set(
          value.matchKeys.filter(
            (key): key is string => typeof key === "string",
          ),
        ),
      ]
    : [];
  const seasonKeys = Array.isArray(value.seasonKeys)
    ? [
        ...new Set(
          value.seasonKeys.filter(
            (key): key is string => typeof key === "string",
          ),
        ),
      ]
    : [];
  const awards = Array.isArray(value.awards)
    ? value.awards.flatMap((award): GlobalAwardWin[] => {
        if (
          !award ||
          typeof award.id !== "string" ||
          !isAwardKind(award.kind) ||
          !Number.isFinite(award.season) ||
          typeof award.clubId !== "string" ||
          typeof award.clubName !== "string" ||
          typeof award.winnerName !== "string"
        ) {
          return [];
        }
        return [
          {
            id: award.id,
            kind: award.kind,
            season: Math.round(award.season),
            clubId: award.clubId,
            clubName: award.clubName,
            winnerName: award.winnerName,
          },
        ];
      })
    : [];
  const played = Math.max(0, Math.round(Number(value.played) || 0));
  const won = Math.min(played, Math.max(0, Math.round(Number(value.won) || 0)));
  const drawn = Math.min(
    played - won,
    Math.max(0, Math.round(Number(value.drawn) || 0)),
  );
  const lost = Math.min(
    played - won - drawn,
    Math.max(0, Math.round(Number(value.lost) || 0)),
  );
  return { matchKeys, seasonKeys, played, won, drawn, lost, awards };
}

function careerId(save: GameSave): string {
  return (
    save.careerId ??
    `legacy:${save.slot}:${save.clubId}:${save.season}:${save.seed}`
  );
}

export function recordGlobalMatches(
  history: GlobalCareerHistory,
  save: GameSave,
  fixtures: readonly Fixture[],
): GlobalCareerHistory {
  const matchKeys = new Set(history.matchKeys);
  const seasonKeys = new Set(history.seasonKeys);
  let played = 0;
  let won = 0;
  let drawn = 0;
  let lost = 0;

  for (const fixture of fixtures) {
    if (
      !fixture.played ||
      (fixture.homeId !== save.clubId && fixture.awayId !== save.clubId)
    )
      continue;
    const key = `${careerId(save)}:${save.season}:${fixture.id}`;
    if (matchKeys.has(key)) continue;
    matchKeys.add(key);
    seasonKeys.add(`${careerId(save)}:${save.season}`);
    played += 1;
    const goalsFor =
      fixture.homeId === save.clubId
        ? (fixture.homeGoals ?? 0)
        : (fixture.awayGoals ?? 0);
    const goalsAgainst =
      fixture.homeId === save.clubId
        ? (fixture.awayGoals ?? 0)
        : (fixture.homeGoals ?? 0);
    if (goalsFor > goalsAgainst) won += 1;
    else if (goalsFor === goalsAgainst) drawn += 1;
    else lost += 1;
  }

  if (!played) return history;
  return {
    ...history,
    matchKeys: [...matchKeys],
    seasonKeys: [...seasonKeys],
    played: history.played + played,
    won: history.won + won,
    drawn: history.drawn + drawn,
    lost: history.lost + lost,
  };
}

export function recordGlobalCareerSeasons(
  history: GlobalCareerHistory,
  save: GameSave,
): GlobalCareerHistory {
  const seasonKeys = new Set(history.seasonKeys);
  let played = 0;
  let won = 0;
  let drawn = 0;
  let lost = 0;
  for (const season of save.careerHistory ?? []) {
    const key = `${careerId(save)}:${season.season}`;
    if (seasonKeys.has(key)) continue;
    seasonKeys.add(key);
    played += season.played;
    won += season.won;
    drawn += season.drawn;
    lost += season.lost;
  }
  if (!played && seasonKeys.size === history.seasonKeys.length) return history;
  return {
    ...history,
    seasonKeys: [...seasonKeys],
    played: history.played + played,
    won: history.won + won,
    drawn: history.drawn + drawn,
    lost: history.lost + lost,
  };
}

export function recordGlobalSeasonAwards(
  history: GlobalCareerHistory,
  save: GameSave,
): GlobalCareerHistory {
  const managedClubBySeason = new Map(
    (save.careerHistory ?? []).map((season) => [season.season, season.clubId]),
  );
  if (save.seasonOver) managedClubBySeason.set(save.season, save.clubId);
  const awardIds = new Set(history.awards.map((award) => award.id));
  const awards = [...history.awards];
  for (const award of save.awards ?? []) {
    const winner = award.winner;
    const managedClubId = managedClubBySeason.get(award.season);
    if (!winner || !managedClubId || winner.clubId !== managedClubId) continue;
    const id = `${careerId(save)}:${award.season}:${award.kind}`;
    if (awardIds.has(id)) continue;
    awardIds.add(id);
    awards.push({
      id,
      kind: award.kind,
      season: award.season,
      clubId: winner.clubId,
      clubName:
        save.clubIdentity?.targetClubId === winner.clubId
          ? save.clubIdentity.name
          : clubById(winner.clubId).name,
      winnerName: winner.name,
    });
  }
  return awards.length === history.awards.length
    ? history
    : { ...history, awards };
}

export function globalWinPercentage(history: GlobalCareerHistory): number {
  return history.played ? Math.round((history.won / history.played) * 100) : 0;
}
