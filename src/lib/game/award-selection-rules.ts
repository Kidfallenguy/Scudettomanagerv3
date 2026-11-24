import type { LeagueKind } from "./types";

const TOP_FLIGHT_LEAGUES = new Set<LeagueKind>([
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
]);

const SECOND_TIER_LEAGUES = new Set<LeagueKind>([
  "championship",
  "serieB",
  "segunda",
  "bundesliga2",
  "ligue2",
  "primeraNacional",
  "brasileiraoB",
  "primeira2",
  "eersteDivisie",
  "uslChampionship",
  "saudiFirstDivision",
]);

export function isTopFlightLeague(league: LeagueKind): boolean {
  return TOP_FLIGHT_LEAGUES.has(league);
}

export function hasAwardClubEligibility(
  league: LeagueKind,
  titleCount: number,
): boolean {
  return (
    titleCount > 0 &&
    (isTopFlightLeague(league) || SECOND_TIER_LEAGUES.has(league))
  );
}

export function meetsAwardPerformanceThreshold(
  apps: number,
  requiredApps: number,
  performance: number,
): boolean {
  return (
    Number.isFinite(performance) &&
    apps >= requiredApps &&
    performance >= Math.max(2, apps * 0.2)
  );
}
