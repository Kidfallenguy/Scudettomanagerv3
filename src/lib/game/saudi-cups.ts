import type { ClubId, SeasonChampions, Standing } from "./types";

export const SAUDI_SUPER_CUP_2026_TEAMS: ClubId[] = [
  "sau_nas",
  "sau_kho",
  "sau_ahl",
  "sau_qad",
];

export type SaudiSuperCupQualifier =
  | "leagueChampion"
  | "leagueRunnerUp"
  | "kingsCupChampion"
  | "kingsCupRunnerUp";

export const SAUDI_SUPER_CUP_CONFIG: {
  futureQualificationOrder: SaudiSuperCupQualifier[] | null;
  fallbackToLeagueOrder: boolean | null;
} = {
  futureQualificationOrder: null,
  fallbackToLeagueOrder: null,
};

export function saudiSuperCupTeams(
  season: number,
  previousTable: Standing[] = [],
  previousChampions?: Partial<SeasonChampions>,
): ClubId[] {
  if (season === 2026) return [...SAUDI_SUPER_CUP_2026_TEAMS];
  const order = SAUDI_SUPER_CUP_CONFIG.futureQualificationOrder;
  if (!order) return [];
  const table = [...previousTable].sort(
    (a, b) =>
      b.pts - a.pts ||
      b.gf - b.ga - (a.gf - a.ga) ||
      b.gf - a.gf ||
      a.clubId.localeCompare(b.clubId),
  );
  const candidates: Record<SaudiSuperCupQualifier, ClubId | null | undefined> = {
    leagueChampion: table[0]?.clubId,
    leagueRunnerUp: table[1]?.clubId,
    kingsCupChampion: previousChampions?.kingsCup,
    kingsCupRunnerUp: previousChampions?.kingsCupRunnerUp,
  };
  const entrants: ClubId[] = [];
  for (const qualifier of order) {
    const id = candidates[qualifier];
    if (id && !entrants.includes(id)) entrants.push(id);
  }
  if (SAUDI_SUPER_CUP_CONFIG.fallbackToLeagueOrder) {
    for (const row of table) {
      if (entrants.length === 4) break;
      if (!entrants.includes(row.clubId)) entrants.push(row.clubId);
    }
  }
  return entrants.length === 4 ? entrants : [];
}

export const SAUDI_SUPER_CUP_DATES = {
  firstSemifinal: (season: number) => `${season}-12-19`,
  secondSemifinal: (season: number) => `${season}-12-21`,
  final: (season: number) => `${season}-12-23`,
};

export interface SaudiKingsCupConfig {
  entrants: ClubId[] | null;
  roundWeeks: number[];
  firstRoundByes: ClubId[];
}

// Keep entry criteria configurable until the federation confirms the 2026/27 field.
export const SAUDI_KINGS_CUP_CONFIG: SaudiKingsCupConfig = {
  entrants: null,
  roundWeeks: [],
  firstRoundByes: [],
};

export function saudiKingsCupFinalRound() {
  return SAUDI_KINGS_CUP_CONFIG.roundWeeks.length || null;
}

export function saudiKingsCupStage(round: number) {
  const finalRound = saudiKingsCupFinalRound();
  if (!finalRound) return "Ronda";
  if (round === finalRound) return "Final";
  const teamCount = Math.ceil((SAUDI_KINGS_CUP_CONFIG.entrants?.length ?? 0) / 2 ** (round - 1));
  const names: Record<number, string> = {
    4: "Semifinales",
    8: "Cuartos",
    16: "Octavos",
    32: "Dieciseisavos",
  };
  return names[teamCount] ?? `Ronda ${round}`;
}
