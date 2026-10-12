import { leagueInfo } from "./clubs";
import type { Competition, LeagueKind, PlayableLeagueId } from "./types";

export const PLAYABLE_LEAGUES: PlayableLeagueId[] = [
  "serieA",
  "premier",
  "laliga",
  "bundesliga",
  "ligue1",
  "argentina",
];

export const CONTINENTAL: Competition[] = [
  "ucl",
  "uel",
  "uecl",
  "libertadores",
  "sudamericana",
];

export const COMP_THEME: Record<
  Competition,
  { bg: string; accent: string; fg: string; label: string; short: string }
> = {
  serieA: { bg: "#12141a", accent: "#c81c2e", fg: "#efe8dc", label: "Serie A", short: "Serie A" },
  premier: { bg: "#12141a", accent: "#3d0a4a", fg: "#efe8dc", label: "Premier League", short: "Premier" },
  laliga: { bg: "#12141a", accent: "#c81c2e", fg: "#efe8dc", label: "La Liga", short: "La Liga" },
  bundesliga: { bg: "#12141a", accent: "#d0021b", fg: "#efe8dc", label: "Bundesliga", short: "Bundesliga" },
  ligue1: { bg: "#12141a", accent: "#091c3e", fg: "#efe8dc", label: "Ligue 1", short: "Ligue 1" },
  argentina: { bg: "#12141a", accent: "#74acdf", fg: "#efe8dc", label: "Liga Profesional", short: "LPF" },
  coppa: { bg: "#16120e", accent: "#c9a227", fg: "#efe8dc", label: "Copa nacional", short: "Copa" },
  ucl: { bg: "#071028", accent: "#2f6bff", fg: "#e8eefc", label: "UEFA Champions League", short: "Champions" },
  uel: { bg: "#241208", accent: "#e07020", fg: "#fbeee0", label: "UEFA Europa League", short: "Europa" },
  uecl: { bg: "#0a2418", accent: "#2d9a55", fg: "#e4f5ea", label: "UEFA Conference League", short: "Conference" },
  libertadores: { bg: "#2a0a12", accent: "#b71c34", fg: "#f8e8ea", label: "Copa Libertadores", short: "Libertadores" },
  sudamericana: { bg: "#0a2833", accent: "#4eb8d9", fg: "#e6f6fb", label: "Copa Sudamericana", short: "Sudamericana" },
  supercoppa: { bg: "#16120e", accent: "#c9a227", fg: "#efe8dc", label: "Supercopa", short: "Supercopa" },
  trofeo: { bg: "#16120e", accent: "#e8c547", fg: "#efe8dc", label: "Trofeo de Campeones", short: "Trofeo" },
  mundial: { bg: "#140e08", accent: "#d4a017", fg: "#f7efd8", label: "Mundial de Clubes", short: "Mundial" },
  intercontinental: { bg: "#0c1020", accent: "#c9a227", fg: "#f4ead0", label: "Copa Intercontinental", short: "Intercontinental" },
  transatlantica: { bg: "#071820", accent: "#3db8c5", fg: "#e4f4f6", label: "Copa Transatlántica", short: "Transatlántica" },
};

export type QualSpots = {
  ucl: number;
  uel: number;
  uecl: number;
  releg: number;
  libertadores: number;
  sudamericana: number;
};

export const QUAL_SPOTS: Record<PlayableLeagueId, QualSpots> = {
  serieA: { ucl: 4, uel: 2, uecl: 1, releg: 3, libertadores: 0, sudamericana: 0 },
  premier: { ucl: 4, uel: 2, uecl: 1, releg: 3, libertadores: 0, sudamericana: 0 },
  laliga: { ucl: 4, uel: 2, uecl: 1, releg: 3, libertadores: 0, sudamericana: 0 },
  bundesliga: { ucl: 4, uel: 2, uecl: 1, releg: 3, libertadores: 0, sudamericana: 0 },
  ligue1: { ucl: 3, uel: 2, uecl: 1, releg: 3, libertadores: 0, sudamericana: 0 },
  argentina: { ucl: 0, uel: 0, uecl: 0, releg: 0, libertadores: 4, sudamericana: 6 },
};

export type QualBand = "ucl" | "uel" | "uecl" | "libertadores" | "sudamericana" | "releg" | "mid";

export function qualBandForPlace(league: PlayableLeagueId, place: number, nTeams: number): QualBand {
  const spots = QUAL_SPOTS[league];
  if (spots.ucl && place <= spots.ucl) return "ucl";
  if (spots.uel && place <= spots.ucl + spots.uel) return "uel";
  if (spots.uecl && place <= spots.ucl + spots.uel + spots.uecl) return "uecl";
  if (spots.libertadores && place <= spots.libertadores) return "libertadores";
  if (spots.sudamericana && place <= spots.libertadores + spots.sudamericana) return "sudamericana";
  if (spots.releg && place > nTeams - spots.releg) return "releg";
  return "mid";
}

export const QUAL_COLOR: Record<QualBand, string> = {
  ucl: "var(--color-comp-ucl)",
  uel: "var(--color-comp-uel)",
  uecl: "var(--color-comp-uecl)",
  libertadores: "var(--color-comp-libertadores)",
  sudamericana: "var(--color-comp-sudamericana)",
  releg: "var(--color-bad)",
  mid: "transparent",
};

export const QUAL_LABEL: Record<QualBand, string> = {
  ucl: "Champions",
  uel: "Europa League",
  uecl: "Conference",
  libertadores: "Libertadores",
  sudamericana: "Sudamericana",
  releg: "Descenso",
  mid: "",
};

export function isContinental(comp: Competition) {
  return CONTINENTAL.includes(comp);
}

export function isConmebolLeague(league: LeagueKind) {
  return league === "argentina" || league === "conmebol";
}

export function coppaFinalRound(league: LeagueKind): number {
  return league === "argentina" ? 5 : 4;
}

export function supercoppaFinalRound(league: LeagueKind): number {
  return league === "argentina" ? 2 : 1;
}

export function coppaStageLabel(league: LeagueKind, round: number): string {
  if (league === "argentina") {
    if (round === 1) return "32avos";
    if (round === 2) return "Octavos";
    if (round === 3) return "Cuartos";
    if (round === 4) return "Semifinales";
    if (round === 5) return "Final";
  }
  if (round === 1) return "Octavos";
  if (round === 2) return "Cuartos";
  if (round === 3) return "Semifinales";
  if (round === 4) return "Final";
  return `Ronda ${round}`;
}

/**
 * Champions League 2026/27: una sola fase de liga de 36 equipos (8 jornadas, rondas 1–8),
 * playoff de acceso a Octavos (9, ida y vuelta), Octavos (10), Cuartos (11), Semifinales (12) e ida y vuelta,
 * y Final a partido único (13).
 */
export const UCL_TEAMS = 36;
export const UCL_LEAGUE_ROUNDS = 8;
export const UCL_DIRECT_SPOTS = 8;
export const UCL_PLAYOFF_SPOTS = 24;
export const UCL_PLAYOFF_ROUND = 9;
export const UCL_R16_ROUND = 10;
export const UCL_FINAL_ROUND = 13;

/**
 * Europa League 2026/27: mismo formato que la Champions. Una única fase de liga de 36 equipos (8 jornadas,
 * rondas 1–8), playoff de acceso a Octavos (9, ida y vuelta), Octavos (10), Cuartos (11) y Semifinales (12) a ida y
 * vuelta, y Final a partido único (13).
 */
export const UEL_TEAMS = 36;
export const UEL_LEAGUE_ROUNDS = 8;
export const UEL_DIRECT_SPOTS = 8;
export const UEL_PLAYOFF_SPOTS = 24;
export const UEL_PLAYOFF_ROUND = 9;
export const UEL_R16_ROUND = 10;
export const UEL_FINAL_ROUND = 13;

/**
 * Conference League 2026/27: una única fase de liga de 36 equipos con 6 bombos de 6 (6 jornadas, rondas 1–6;
 * cada equipo juega 6 partidos contra 6 rivales distintos, uno de cada bombo: 3 de local y 3 de visitante),
 * playoff de acceso a Octavos (7, ida y vuelta), Octavos (8), Cuartos (9) y Semifinales (10) a ida y vuelta,
 * y Final a partido único (11).
 */
export const UECL_TEAMS = 36;
export const UECL_POTS = 6;
export const UECL_POT_SIZE = 6;
export const UECL_LEAGUE_ROUNDS = 6;
export const UECL_DIRECT_SPOTS = 8;
export const UECL_PLAYOFF_SPOTS = 24;
export const UECL_PLAYOFF_ROUND = 7;
export const UECL_R16_ROUND = 8;
export const UECL_FINAL_ROUND = 11;

/** Jornadas de la fase de liga/grupos de la competición (0 si no tiene). */
export function leaguePhaseRounds(comp: Competition): number {
  if (comp === "ucl") return UCL_LEAGUE_ROUNDS;
  if (comp === "uel") return UEL_LEAGUE_ROUNDS;
  if (comp === "uecl") return UECL_LEAGUE_ROUNDS;
  if (comp === "libertadores") return 6;
  if (comp === "mundial") return 3;
  return 0;
}

export function isTwoLeggedStage(comp: Competition, round: number) {
  if (!isContinental(comp)) return false;
  if (comp === "ucl") return round >= UCL_PLAYOFF_ROUND && round < UCL_FINAL_ROUND;
  if (comp === "uel") return round >= UEL_PLAYOFF_ROUND && round < UEL_FINAL_ROUND;
  if (comp === "uecl") return round >= UECL_PLAYOFF_ROUND && round < UECL_FINAL_ROUND;
  if (comp === "libertadores") return round >= 7 && round <= 9;
  if (comp === "sudamericana") return round >= 1 && round <= 3;
  return false;
}

export function uclStageName(round: number): string {
  if (round <= UCL_LEAGUE_ROUNDS) return `Fase de liga · J${round}`;
  return (
    ({ 9: "Playoff de acceso a Octavos", 10: "Octavos", 11: "Cuartos", 12: "Semifinales", 13: "Final" } as Record<number, string>)[round] ??
    `Ronda ${round}`
  );
}

export function uelStageName(round: number): string {
  if (round <= UEL_LEAGUE_ROUNDS) return `Fase de liga · J${round}`;
  return (
    ({ 9: "Playoff de acceso a Octavos", 10: "Octavos", 11: "Cuartos", 12: "Semifinales", 13: "Final" } as Record<number, string>)[round] ??
    `Ronda ${round}`
  );
}

export function ueclStageName(round: number): string {
  if (round <= UECL_LEAGUE_ROUNDS) return `Fase de liga · J${round}`;
  return (
    ({ 7: "Playoff de acceso a Octavos", 8: "Octavos", 9: "Cuartos", 10: "Semifinales", 11: "Final" } as Record<number, string>)[round] ??
    `Ronda ${round}`
  );
}

export function knockoutRoundLabel(comp: Competition, round: number, leg?: 1 | 2) {
  const stage = (() => {
    if (comp === "ucl") return uclStageName(round);
    if (comp === "uel") return uelStageName(round);
    if (comp === "uecl") return ueclStageName(round);
    if (comp === "libertadores") {
      if (round <= 6) return `Fase de grupos · J${round}`;
      if (round === 7) return "Octavos";
      if (round === 8) return "Cuartos";
      if (round === 9) return "Semifinales";
      if (round === 10) return "Final";
    }
    if (comp === "sudamericana") {
      if (round === 1) return "Octavos";
      if (round === 2) return "Cuartos";
      if (round === 3) return "Semifinales";
      if (round === 4) return "Final";
    }
    if (comp === "supercoppa") {
      if (round === 1) return "Semifinales";
      if (round === 2) return "Final";
    }
    if (comp === "mundial") {
      if (round <= 3) return `Fase de grupos · J${round}`;
      if (round === 4) return "Octavos";
      if (round === 5) return "Cuartos";
      if (round === 6) return "Semifinales";
      if (round === 7) return "Final";
    }
    if (comp === "intercontinental" || comp === "transatlantica") return "Final";
    return `Ronda ${round}`;
  })();
  const legTxt = leg === 1 ? " · Ida" : leg === 2 ? " · Vuelta" : "";
  return `${COMP_THEME[comp].short} · ${stage}${legTxt}`;
}

export function continentalHome(comp: Competition) {
  return comp === "libertadores" || comp === "sudamericana" ? "conmebol" : "europe";
}

export function finalRoundOf(comp: Competition, league?: LeagueKind): number | null {
  if (comp === "ucl") return UCL_FINAL_ROUND;
  if (comp === "libertadores") return 10;
  if (comp === "uel") return UEL_FINAL_ROUND;
  if (comp === "uecl") return UECL_FINAL_ROUND;
  if (comp === "sudamericana") return 4;
  if (comp === "coppa") return coppaFinalRound(league ?? "serieA");
  if (comp === "supercoppa") return supercoppaFinalRound(league ?? "serieA");
  if (comp === "trofeo" || comp === "intercontinental" || comp === "transatlantica") return 1;
  if (comp === "mundial") return 7;
  return null;
}

/** Fondo de pantalla completa teñido con el color de la competición (azul Champions, naranja Europa, verde Conference…). */
export function compBackdropStyle(comp: Competition | null | undefined): Record<string, string> {
  if (!comp) return {};
  const t = COMP_THEME[comp];
  return {
    background: `radial-gradient(ellipse 90% 45% at 50% 0%, color-mix(in oklab, ${t.accent} 38%, transparent), transparent 70%), linear-gradient(180deg, color-mix(in oklab, ${t.accent} 14%, ${t.bg}) 0%, ${t.bg} 60%)`,
    "--club": t.accent,
  };
}

/** Panel más pequeño (por ejemplo la pestaña de una copa dentro de Tablas). */
export function compPanelStyle(comp: Competition | null | undefined): Record<string, string> {
  if (!comp) return {};
  const t = COMP_THEME[comp];
  return {
    background: `linear-gradient(180deg, color-mix(in oklab, ${t.accent} 22%, ${t.bg}) 0%, ${t.bg} 100%)`,
    boxShadow: `0 0 0 1px color-mix(in oklab, ${t.accent} 45%, transparent)`,
  };
}

/**
 * Nombre completo de una competición según el país del club del usuario.
 * La copa y la supercopa nacionales se llaman distinto en cada país (Copa Argentina, FA Cup, Coppa Italia…),
 * así que nunca deben mostrarse con un nombre fijo.
 */
export function compLabel(comp: Competition, league?: LeagueKind | null): string {
  if (league && (comp === "coppa" || comp === "supercoppa")) {
    const info = leagueInfo(league);
    return comp === "coppa" ? info.cup : info.superCup;
  }
  return COMP_THEME[comp].label;
}

/** Nombre corto (chips, filtros, leyendas) con el mismo criterio que {@link compLabel}. */
export function compShort(comp: Competition, league?: LeagueKind | null): string {
  if (league && (comp === "coppa" || comp === "supercoppa")) return compLabel(comp, league);
  return COMP_THEME[comp].short;
}

/** Copas continentales de la región del club: UEFA para ligas europeas, CONMEBOL para Argentina. */
export function continentalCompsFor(league: LeagueKind): Competition[] {
  return isConmebolLeague(league) ? ["libertadores", "sudamericana"] : ["ucl", "uel", "uecl"];
}

/** ¿Esta competición pertenece al país/región del club? Las ligas y copas de otros países no. */
export function compBelongsToLeague(comp: Competition, league: LeagueKind): boolean {
  if (comp === "coppa" || comp === "supercoppa" || comp === "mundial" || comp === "intercontinental" || comp === "transatlantica") return true;
  if (comp === "trofeo") return league === "argentina";
  if (isContinental(comp)) return continentalCompsFor(league).includes(comp);
  return comp === league;
}

/** Nombre de la ronda de eliminación directa (sin el nombre de la competición). */
export function stageLabel(comp: Competition, league: LeagueKind, round: number): string {
  if (comp === "coppa") return coppaStageLabel(league, round);
  if (comp === "supercoppa") return round >= supercoppaFinalRound(league) ? "Final" : "Semifinales";
  if (comp === "trofeo") return "Final";
  if (comp === "intercontinental" || comp === "transatlantica") return "Final";
  if (comp === "mundial") {
    if (round <= 3) return `Fase de grupos · J${round}`;
    return ({ 4: "Octavos", 5: "Cuartos", 6: "Semifinales", 7: "Final" } as Record<number, string>)[round] ?? `Ronda ${round}`;
  }
  if (comp === "ucl") return uclStageName(round);
  if (comp === "uel") return uelStageName(round);
  if (comp === "uecl") return ueclStageName(round);
  if (comp === "libertadores") {
    if (round <= 6) return `Fase de grupos · J${round}`;
    return ({ 7: "Octavos", 8: "Cuartos", 9: "Semifinales", 10: "Final" } as Record<number, string>)[round] ?? `Ronda ${round}`;
  }
  if (comp === "sudamericana") {
    return ({ 1: "Octavos", 2: "Cuartos", 3: "Semifinales", 4: "Final" } as Record<number, string>)[round] ?? `Ronda ${round}`;
  }
  return `Ronda ${round}`;
}
