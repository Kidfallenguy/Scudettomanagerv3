import { leagueInfo } from "./clubs";
import type { Competition, LeagueKind, PlayableLeagueId } from "./types";
import { saudiKingsCupFinalRound, saudiKingsCupStage } from "./saudi-cups";

export const PLAYABLE_LEAGUES: PlayableLeagueId[] = [
  "serieA",
  "serieB",
  "serieC",
  "serieD",
  "premier",
  "championship",
  "leagueOne",
  "leagueTwo",
  "laliga",
  "segunda",
  "primeraFed1",
  "primeraFed2",
  "bundesliga",
  "bundesliga2",
  "bundesliga3",
  "ligue1",
  "ligue2",
  "ligue3",
  "argentina",
  "primeraNacional",
  "primeraBMetro",
  "argentinaCuarta",
  "argentinaQuinta",
  "promocionalAmateur",
  "brasileirao",
  "brasileiraoB",
  "brasileiraoC",
  "primeira",
  "primeira2",
  "eredivisie",
  "eersteDivisie",
  "tweedeDivisie",
  "mls",
  "uslChampionship",
  "saudiProLeague",
  "saudiFirstDivision",
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
  serieB: { bg: "#12141a", accent: "#1f5fa8", fg: "#efe8dc", label: "Serie B", short: "Serie B" },
  serieC: { bg: "#12141a", accent: "#2d7d46", fg: "#efe8dc", label: "Serie C", short: "Serie C" },
  serieD: { bg: "#12141a", accent: "#8a5a2b", fg: "#efe8dc", label: "Serie D", short: "Serie D" },
  premier: { bg: "#12141a", accent: "#3d0a4a", fg: "#efe8dc", label: "Premier League", short: "Premier" },
  championship: { bg: "#12141a", accent: "#1c3f7a", fg: "#efe8dc", label: "EFL Championship", short: "Championship" },
  leagueOne: { bg: "#12141a", accent: "#0b7a43", fg: "#efe8dc", label: "EFL League One", short: "League One" },
  leagueTwo: { bg: "#12141a", accent: "#d71920", fg: "#efe8dc", label: "EFL League Two", short: "League Two" },
  laliga: { bg: "#12141a", accent: "#c81c2e", fg: "#efe8dc", label: "LaLiga EA Sports", short: "LaLiga" },
  segunda: { bg: "#12141a", accent: "#e8601c", fg: "#efe8dc", label: "LaLiga Hypermotion", short: "Hypermotion" },
  primeraFed1: { bg: "#12141a", accent: "#3a8f5c", fg: "#efe8dc", label: "Primera Federación · Grupo 1", short: "1ª Fed. G1" },
  primeraFed2: { bg: "#12141a", accent: "#2f8aa8", fg: "#efe8dc", label: "Primera Federación · Grupo 2", short: "1ª Fed. G2" },
  bundesliga: { bg: "#12141a", accent: "#d0021b", fg: "#efe8dc", label: "Bundesliga", short: "Bundesliga" },
  bundesliga2: { bg: "#12141a", accent: "#e8590c", fg: "#efe8dc", label: "2. Bundesliga", short: "2. Bundesliga" },
  bundesliga3: { bg: "#12141a", accent: "#0f8a8a", fg: "#efe8dc", label: "3. Liga", short: "3. Liga" },
  ligue1: { bg: "#12141a", accent: "#091c3e", fg: "#efe8dc", label: "Ligue 1", short: "Ligue 1" },
  ligue2: { bg: "#12141a", accent: "#1d6fb8", fg: "#efe8dc", label: "Ligue 2", short: "Ligue 2" },
  ligue3: { bg: "#12141a", accent: "#e59b32", fg: "#efe8dc", label: "Ligue 3", short: "Ligue 3" },
  argentina: { bg: "#12141a", accent: "#74acdf", fg: "#efe8dc", label: "Liga Profesional", short: "LPF" },
  primeraNacional: { bg: "#12141a", accent: "#2f7ec9", fg: "#efe8dc", label: "Primera Nacional", short: "P. Nacional" },
  primeraBMetro: { bg: "#12141a", accent: "#4b8e5a", fg: "#efe8dc", label: "Primera B Metro / Federal A", short: "3.ª Argentina" },
  argentinaCuarta: { bg: "#12141a", accent: "#8a5a2b", fg: "#efe8dc", label: "Cuarta División Argentina", short: "4.ª Argentina" },
  argentinaQuinta: { bg: "#12141a", accent: "#9b7040", fg: "#efe8dc", label: "Quinta División Argentina", short: "5.ª Argentina" },
  promocionalAmateur: { bg: "#12141a", accent: "#6d7d46", fg: "#efe8dc", label: "Torneo Promocional Amateur", short: "Promocional" },
  brasileirao: { bg: "#12141a", accent: "#009c3b", fg: "#efe8dc", label: "Brasileirão Série A", short: "Brasileirão" },
  brasileiraoB: { bg: "#12141a", accent: "#f2c200", fg: "#efe8dc", label: "Brasileirão Série B", short: "Série B" },
  brasileiraoC: { bg: "#12141a", accent: "#2d7d46", fg: "#efe8dc", label: "Brasileirão Série C", short: "Série C" },
  primeira: { bg: "#12141a", accent: "#0f8a4f", fg: "#efe8dc", label: "Primeira Liga", short: "Primeira" },
  primeira2: { bg: "#12141a", accent: "#c8941a", fg: "#efe8dc", label: "Liga Portugal 2", short: "Liga Portugal 2" },
  eredivisie: { bg: "#12141a", accent: "#f36f21", fg: "#efe8dc", label: "Eredivisie", short: "Eredivisie" },
  eersteDivisie: { bg: "#12141a", accent: "#f58220", fg: "#efe8dc", label: "Eerste Divisie", short: "Eerste Divisie" },
  tweedeDivisie: { bg: "#12141a", accent: "#00843d", fg: "#efe8dc", label: "Tweede Divisie", short: "Tweede Divisie" },
  mls: { bg: "#12141a", accent: "#d71920", fg: "#efe8dc", label: "Major League Soccer", short: "MLS" },
  uslChampionship: { bg: "#12141a", accent: "#153b6b", fg: "#efe8dc", label: "USL Championship", short: "USL Championship" },
  saudiProLeague: { bg: "#12141a", accent: "#16834b", fg: "#efe8dc", label: "Saudi Pro League", short: "Saudi Pro" },
  saudiFirstDivision: { bg: "#12141a", accent: "#9c7a34", fg: "#efe8dc", label: "Saudi First Division League", short: "Saudi First" },
  kingsCup: { bg: "#17140d", accent: "#c9a227", fg: "#f7efd8", label: "King's Cup", short: "King's Cup" },
  saudiSuperCup: { bg: "#0f1b19", accent: "#16834b", fg: "#e8f4ed", label: "Saudi Super Cup", short: "Saudi Super Cup" },
  coppa: { bg: "#16120e", accent: "#c9a227", fg: "#efe8dc", label: "Copa nacional", short: "Copa" },
  carabao: { bg: "#10161a", accent: "#2f9e8f", fg: "#e6f4f1", label: "Carabao Cup", short: "Carabao" },
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
  /** Ascenso directo (2ª división). */
  promo?: number;
  /** Plazas de playoff de ascenso (inmediatamente después del ascenso directo). */
  playoff?: number;
  /** Plazas de playoff de permanencia (inmediatamente antes de la zona de descenso directo). */
  relegPlayoff?: number;
  ucl: number;
  uel: number;
  uecl: number;
  releg: number;
  libertadores: number;
  sudamericana: number;
};

export const QUAL_SPOTS: Record<PlayableLeagueId, QualSpots> = {
  serieA: { ucl: 4, uel: 2, uecl: 1, releg: 3, libertadores: 0, sudamericana: 0 },
  // Serie B (20 clubes): 2 ascensos directos, playoff del 3.º al 6.º (mismo formato que la Championship) y 3 descensos.
  serieB: { promo: 2, playoff: 4, ucl: 0, uel: 0, uecl: 0, releg: 3, libertadores: 0, sudamericana: 0 },
  // Serie C: 3 grupos de 20; 3 ascensos directos y un playoff nacional adicional.
  serieC: { promo: 3, playoff: 1, ucl: 0, uel: 0, uecl: 0, releg: 3, libertadores: 0, sudamericana: 0 },
  // Serie D: grupos regionales; ascenso directo para campeones y vacantes con mecanismos regionales.
  serieD: { promo: 2, playoff: 0, ucl: 0, uel: 0, uecl: 0, releg: 0, libertadores: 0, sudamericana: 0 },
  premier: { ucl: 4, uel: 2, uecl: 1, releg: 3, libertadores: 0, sudamericana: 0 },
  championship: { promo: 2, playoff: 4, ucl: 0, uel: 0, uecl: 0, releg: 3, libertadores: 0, sudamericana: 0 },
  // League One: 2 ascensos directos + playoff 3.º-6.º; descienden 4 a League Two.
  leagueOne: { promo: 2, playoff: 4, ucl: 0, uel: 0, uecl: 0, releg: 4, libertadores: 0, sudamericana: 0 },
  // League Two: 3 ascensos directos + playoff 4.º-7.º. El reglamento EFL desciende los 2 últimos,
  // pero National League no existe en el juego: se conservan allí hasta implementar ese nivel.
  leagueTwo: { promo: 3, playoff: 4, ucl: 0, uel: 0, uecl: 0, releg: 2, libertadores: 0, sudamericana: 0 },
  laliga: { ucl: 4, uel: 2, uecl: 1, releg: 3, libertadores: 0, sudamericana: 0 },
  // LaLiga Hypermotion (22 clubes): 2 ascensos directos, 3.º-6.º juegan el playoff por el tercero y descienden los 4 últimos.
  segunda: { promo: 2, playoff: 4, ucl: 0, uel: 0, uecl: 0, releg: 4, libertadores: 0, sudamericana: 0 },
  // Primera Federación (2 grupos de 20): el campeón de cada grupo asciende directo a LaLiga Hypermotion y del 2.º al 5.º juegan el playoff
  // (los 4 ganadores de las semifinales juegan la final: 2 ascensos más). Los 5 últimos de cada grupo bajarían a la Segunda Federación, que
  // todavía no existe como liga jugable (releg: 0): nadie baja y la tabla no marca zona de descenso.
  primeraFed1: { promo: 1, playoff: 4, ucl: 0, uel: 0, uecl: 0, releg: 0, libertadores: 0, sudamericana: 0 },
  primeraFed2: { promo: 1, playoff: 4, ucl: 0, uel: 0, uecl: 0, releg: 0, libertadores: 0, sudamericana: 0 },
  bundesliga: { ucl: 4, uel: 2, uecl: 1, releg: 3, libertadores: 0, sudamericana: 0 },
  // 2. Bundesliga (18 clubes): 2 ascensos directos, playoff del 3.º al 6.º (mismo formato que la Championship y la Serie B)
  // y 3 descensos (la 3. Liga no es jugable: los descendidos solo se marcan en la tabla).
  bundesliga2: { promo: 2, playoff: 4, ucl: 0, uel: 0, uecl: 0, releg: 3, libertadores: 0, sudamericana: 0 },
  // 3. Liga (20 clubes, 38 jornadas): los 2 primeros ascienden directo a la 2. Bundesliga y el 3.º juega el playoff contra el 16.º de
  // la 2. Bundesliga; los 4 últimos descienden a la Regionalliga (no jugable: por ahora solo se marcan en la tabla; los ascensos y
  // descensos entre divisiones llegan en la siguiente parte).
  bundesliga3: { promo: 2, playoff: 1, ucl: 0, uel: 0, uecl: 0, releg: 4, libertadores: 0, sudamericana: 0 },
  ligue1: { ucl: 3, uel: 2, uecl: 1, releg: 3, libertadores: 0, sudamericana: 0 },
  // Ligue 2 (18 clubes): 2 ascensos directos, 3.º-5.º juegan el playoff (4.º vs 5.º, el ganador contra el 3.º) y su ganador el
  // barrage contra el 16.º de la Ligue 1. Los 3 últimos descienden a la Ligue 3.
  ligue2: { promo: 2, playoff: 3, ucl: 0, uel: 0, uecl: 0, releg: 3, libertadores: 0, sudamericana: 0 },
  // Ligue 3 (18 clubes): tres ascensos directos cubren los tres descensos de la Ligue 2; no hay una cuarta división jugable.
  ligue3: { promo: 3, playoff: 0, ucl: 0, uel: 0, uecl: 0, releg: 0, libertadores: 0, sudamericana: 0 },
  // Liga Profesional (24 clubes): los 2 últimos descienden a la Primera Nacional.
  argentina: { ucl: 0, uel: 0, uecl: 0, releg: 2, libertadores: 4, sudamericana: 6 },
  // Primera Nacional (24 clubes): el campeón asciende directo y del 2.º al 5.º juegan el Reducido por el segundo ascenso.
  // Los 2 últimos descienden a la Tercera División Argentina.
  primeraNacional: { promo: 1, playoff: 4, ucl: 0, uel: 0, uecl: 0, releg: 2, libertadores: 0, sudamericana: 0 },
  primeraBMetro: { promo: 1, playoff: 4, ucl: 0, uel: 0, uecl: 0, releg: 1, libertadores: 0, sudamericana: 0 },
  argentinaCuarta: { promo: 1, playoff: 0, ucl: 0, uel: 0, uecl: 0, releg: 1, libertadores: 0, sudamericana: 0 },
  argentinaQuinta: { promo: 1, playoff: 0, ucl: 0, uel: 0, uecl: 0, releg: 1, libertadores: 0, sudamericana: 0 },
  promocionalAmateur: { promo: 1, playoff: 0, ucl: 0, uel: 0, uecl: 0, releg: 0, libertadores: 0, sudamericana: 0 },
  // Brasileirão (20 clubes), reglamento 2026: los 5 primeros a la Libertadores (más el campeón de la Copa do Brasil, que
  // ocupa un 6.º cupo si no está ya entre ellos) y los 8 siguientes a la Sudamericana. Los 4 últimos descienden a la Série B.
  brasileirao: { ucl: 0, uel: 0, uecl: 0, releg: 4, libertadores: 5, sudamericana: 8 },
  // Série B y Série C: cuatro ascensos/descensos directos en cada enlace de la pirámide.
  brasileiraoB: { promo: 4, playoff: 0, ucl: 0, uel: 0, uecl: 0, releg: 4, libertadores: 0, sudamericana: 0 },
  // Los cuatro primeros ascienden a la Série B. La Série C es la división inferior jugable.
  brasileiraoC: { promo: 4, playoff: 0, ucl: 0, uel: 0, uecl: 0, releg: 0, libertadores: 0, sudamericana: 0 },
  // Primeira Liga (18 clubes): 2 a la Champions, 1 a la Europa League y 1 a la Conference. Los 2 últimos descienden directo a
  // la Liga Portugal 2 y el 16.º juega el playoff de permanencia contra el 3.º de la Liga Portugal 2 (ida y vuelta).
  primeira: { ucl: 2, uel: 1, uecl: 1, releg: 2, relegPlayoff: 1, libertadores: 0, sudamericana: 0 },
  // Liga Portugal 2 (18 clubes): 2 ascensos directos y el 3.º juega el playoff contra el 16.º de la Primeira Liga. La Liga 3
  // no es jugable (releg: 0): nadie baja de la Liga Portugal 2.
  primeira2: { promo: 2, playoff: 1, ucl: 0, uel: 0, uecl: 0, releg: 0, libertadores: 0, sudamericana: 0 },
  // Los dos primeros de cada categoría ascienden y los dos últimos de la categoría superior descienden.
  eredivisie: { ucl: 2, uel: 1, uecl: 1, releg: 2, libertadores: 0, sudamericana: 0 },
  eersteDivisie: { promo: 2, playoff: 0, ucl: 0, uel: 0, uecl: 0, releg: 2, libertadores: 0, sudamericana: 0 },
  tweedeDivisie: { promo: 2, playoff: 0, ucl: 0, uel: 0, uecl: 0, releg: 0, libertadores: 0, sudamericana: 0 },
  mls: { promo: 0, playoff: 9, ucl: 0, uel: 0, uecl: 0, releg: 0, libertadores: 0, sudamericana: 0 },
  uslChampionship: { promo: 0, playoff: 8, ucl: 0, uel: 0, uecl: 0, releg: 0, libertadores: 0, sudamericana: 0 },
  // Saudi Arabia: three direct relegations; the First Division promotes its top two and runs a configurable 3rd–6th playoff for the third place.
  saudiProLeague: { ucl: 0, uel: 0, uecl: 0, releg: 3, libertadores: 0, sudamericana: 0 },
  saudiFirstDivision: { promo: 2, playoff: 4, ucl: 0, uel: 0, uecl: 0, releg: 0, libertadores: 0, sudamericana: 0 },
};

export type QualBand = "promo" | "playoff" | "relegPlayoff" | "ucl" | "uel" | "uecl" | "libertadores" | "sudamericana" | "releg" | "mid";

export function qualBandForPlace(league: PlayableLeagueId, place: number, nTeams: number): QualBand {
  const spots = QUAL_SPOTS[league];
  if (spots.promo && place <= spots.promo) return "promo";
  if (spots.playoff && place <= (spots.promo ?? 0) + spots.playoff) return "playoff";
  if (spots.ucl && place <= spots.ucl) return "ucl";
  if (spots.uel && place <= spots.ucl + spots.uel) return "uel";
  if (spots.uecl && place <= spots.ucl + spots.uel + spots.uecl) return "uecl";
  if (spots.libertadores && place <= spots.libertadores) return "libertadores";
  if (spots.sudamericana && place <= spots.libertadores + spots.sudamericana) return "sudamericana";
  if (spots.releg && place > nTeams - spots.releg) return "releg";
  if (spots.relegPlayoff && place > nTeams - spots.releg - spots.relegPlayoff) return "relegPlayoff";
  return "mid";
}

export const QUAL_COLOR: Record<QualBand, string> = {
  promo: "var(--color-good)",
  playoff: "var(--color-warn)",
  relegPlayoff: "var(--color-warn)",
  ucl: "var(--color-comp-ucl)",
  uel: "var(--color-comp-uel)",
  uecl: "var(--color-comp-uecl)",
  libertadores: "var(--color-comp-libertadores)",
  sudamericana: "var(--color-comp-sudamericana)",
  releg: "var(--color-bad)",
  mid: "transparent",
};

export const QUAL_LABEL: Record<QualBand, string> = {
  promo: "Ascenso directo",
  playoff: "Playoff de ascenso",
  relegPlayoff: "Playoff de permanencia",
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

/** Liga Profesional y Primera Nacional: las dos divisiones argentinas (mismo calendario y mismo país). */
export function isArgentineLeague(league: LeagueKind): boolean {
  return (
    league === "argentina" ||
    league === "primeraNacional" ||
    league === "primeraBMetro" ||
    league === "argentinaCuarta" ||
    league === "argentinaQuinta" ||
    league === "promocionalAmateur"
  );
}

/** Brasileirão Série A y Série B (Brasil). */
export function isBrazilianLeague(league: LeagueKind): boolean {
  return league === "brasileirao" || league === "brasileiraoB" || league === "brasileiraoC";
}

/** Ligas sudamericanas que juegan por año natural (Argentina y Brasil): temporada "2026", no "2026/27". */
export function isCalendarYearLeague(league: LeagueKind): boolean {
  return isArgentineLeague(league) || isBrazilianLeague(league);
}

export function isConmebolLeague(league: LeagueKind) {
  return isCalendarYearLeague(league) || league === "conmebol";
}

/** Bundesliga y 2. Bundesliga comparten la DFB-Pokal (36 clubes). */
export function isGermanLeague(league: LeagueKind): boolean {
  return league === "bundesliga" || league === "bundesliga2";
}

/** Ligue 1 y Ligue 2 comparten la Coupe de France (36 clubes). */
export function isFrenchLeague(league: LeagueKind): boolean {
  return league === "ligue1" || league === "ligue2";
}

/** Copas nacionales con dos divisiones mezcladas (6 rondas con ronda previa/primera ronda): Inglaterra, Alemania y Francia (Brasil y Argentina tienen su propio cuadro de 6 rondas). */
export function isTwoTierCupLeague(league: LeagueKind): boolean {
  return isEnglishLeague(league) || isGermanLeague(league) || isFrenchLeague(league);
}

/** LaLiga EA Sports, LaLiga Hypermotion y los dos grupos de la Primera Federación comparten la Copa del Rey. */
export function isSpanishLeague(league: LeagueKind): boolean {
  return league === "laliga" || league === "segunda" || league === "primeraFed1" || league === "primeraFed2";
}

/** Primeira Liga y Liga Portugal 2 comparten la Taça de Portugal y la Taça da Liga (clubes elegibles, sin equipos B). */
export function isPortugueseLeague(league: LeagueKind): boolean {
  return league === "primeira" || league === "primeira2";
}

/** Premier, Championship, League One y League Two comparten FA Cup y Carabao Cup. */
export function isEnglishLeague(league: LeagueKind): boolean {
  return league === "premier" || league === "championship" || league === "leagueOne" || league === "leagueTwo";
}

/**
 * Copas de Alemania, Francia y Portugal (y Taça da Liga): 6 rondas, la semifinal es la 5.
 */
export const ENGLISH_CUP_FINAL_ROUND = 6;
export const ENGLISH_CUP_SEMI_ROUND = 5;

/**
 * Copas inglesas (FA Cup y Carabao Cup), 92 clubes EFL/PL, eliminación directa en 7 rondas:
 * 1 Primera ronda (56 clubes, incluyendo League One y League Two; 28 cruces) · 2 (64 clubes) · 3 Dieciseisavos ·
 * 4 Octavos · 5 Cuartos · 6 Semifinales · 7 Final.
 * La FA Cup se juega a partido único (sin repetición); la Carabao Cup tiene semifinales a ida y vuelta.
 */
export const EFL_CUP_FINAL_ROUND = 7;
export const EFL_CUP_SEMI_ROUND = 6;

/** Ronda de semifinales de la copa de liga (Carabao Cup / Taça da Liga) según la liga del club. */
export function carabaoSemiRound(league?: LeagueKind): number {
  return league && isEnglishLeague(league) ? EFL_CUP_SEMI_ROUND : ENGLISH_CUP_SEMI_ROUND;
}

export const ARGENTINE_CUP_FINAL_ROUND = 7;

export function coppaFinalRound(league: LeagueKind): number {
  // DFB-Pokal: ronda previa (solo 8 clubes de la 2. Bundesliga), dieciseisavos (32), octavos, cuartos, semifinales y final.
  // Coupe de France: 7.ª ronda (8 clubes de Ligue 2), 32avos (32), octavos, cuartos, semifinales y final.
  if (isEnglishLeague(league)) return EFL_CUP_FINAL_ROUND;
  if (isTwoTierCupLeague(league)) return ENGLISH_CUP_FINAL_ROUND;
  // Taça de Portugal: primera ronda (solo los 2 clubes de menor prestigio), 32avos, octavos, cuartos, semifinales y final.
  if (isPortugueseLeague(league)) return ENGLISH_CUP_FINAL_ROUND;
  // Copa del Rey (LaLiga + Hypermotion + Primera Federación): primera eliminatoria, dieciseisavos, octavos, cuartos, semifinales y final.
  if (isSpanishLeague(league)) return ENGLISH_CUP_FINAL_ROUND;
  // Copa Argentina (70 clubes): fase previa, 64avos, 32avos, octavos, cuartos, semifinales y final.
  // Copa do Brasil (44 clubes: Série A, Série B y cuatro clasificados de Série C): primera fase y eliminación directa.
  if (isArgentineLeague(league)) return ARGENTINE_CUP_FINAL_ROUND;
  if (isBrazilianLeague(league)) return 6;
  return 4;
}

/** Nombre de la copa de liga portuguesa (se guarda en la competición "carabao", que es el espacio de copa de liga del juego). */
export const PORTUGUESE_LEAGUE_CUP_LABEL = "Taça da Liga";

export function carabaoFinalRound(league?: LeagueKind): number {
  return league && isEnglishLeague(league) ? EFL_CUP_FINAL_ROUND : ENGLISH_CUP_FINAL_ROUND;
}

export function supercoppaFinalRound(league: LeagueKind): number {
  return league === "argentina" ? 2 : 1;
}

export function englishCupStageLabel(round: number, league?: LeagueKind): string {
  // Copas inglesas de 7 rondas (incluye los participantes EFL hasta League Two).
  if (league && isEnglishLeague(league)) {
    return (
      ({ 1: "Primera ronda", 2: "32avos", 3: "Dieciseisavos", 4: "Octavos", 5: "Cuartos", 6: "Semifinales", 7: "Final" } as Record<number, string>)[
        round
      ] ?? `Ronda ${round}`
    );
  }
  return (
    ({ 1: "Primera ronda", 2: "Dieciseisavos", 3: "Octavos", 4: "Cuartos", 5: "Semifinales", 6: "Final" } as Record<number, string>)[
      round
    ] ?? `Ronda ${round}`
  );
}

export function coppaStageLabel(league: LeagueKind, round: number): string {
  if (isEnglishLeague(league)) return englishCupStageLabel(round, league);
  // Taça de Portugal: mismas seis rondas (Primera ronda · Dieciseisavos · Octavos · Cuartos · Semifinales · Final).
  if (isPortugueseLeague(league)) return englishCupStageLabel(round);
  // Copa del Rey: la primera eliminatoria la juegan los clubes de Primera Federación y los que no entran directo.
  if (isSpanishLeague(league)) return round === 1 ? "Primera eliminatoria" : englishCupStageLabel(round);
  if (isGermanLeague(league)) return round === 1 ? "Ronda previa" : englishCupStageLabel(round);
  // Coupe de France: 7.ª ronda (8 clubes de Ligue 2), 32avos (entran los 18 de Ligue 1 y los otros 10 de Ligue 2), octavos…
  if (isFrenchLeague(league)) {
    if (round === 1) return "7.ª ronda";
    if (round === 2) return "32avos";
    if (round === 3) return "Octavos";
    if (round === 4) return "Cuartos";
    if (round === 5) return "Semifinales";
    if (round === 6) return "Final";
  }
  if (isBrazilianLeague(league)) {
    if (round === 1) return "Primera fase";
    if (round === 2) return "32avos";
    if (round === 3) return "Octavos";
    if (round === 4) return "Cuartos";
    if (round === 5) return "Semifinales";
    if (round === 6) return "Final";
  }
  if (isArgentineLeague(league)) {
    if (round === 1) return "Fase previa";
    if (round === 2) return "64avos";
    if (round === 3) return "32avos";
    if (round === 4) return "Octavos";
    if (round === 5) return "Cuartos";
    if (round === 6) return "Semifinales";
    if (round === 7) return "Final";
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

export function isTwoLeggedStage(comp: Competition, round: number, league?: LeagueKind) {
  if (comp === "carabao") return round === carabaoSemiRound(league);
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

export function knockoutRoundLabel(comp: Competition, round: number, leg?: 1 | 2, league?: LeagueKind) {
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
    if (comp === "kingsCup") {
      return saudiKingsCupStage(round);
    }
    if (comp === "saudiSuperCup") {
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
    if (comp === "carabao") return englishCupStageLabel(round, league);
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
  if (comp === "kingsCup") return saudiKingsCupFinalRound();
  if (comp === "saudiSuperCup") return 2;
  if (comp === "carabao") return carabaoFinalRound(league);
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
  // La "copa de liga" de Portugal es la Taça da Liga (Allianz Cup); en Inglaterra, la Carabao Cup.
  if (league && comp === "carabao" && isPortugueseLeague(league)) return PORTUGUESE_LEAGUE_CUP_LABEL;
  return COMP_THEME[comp].label;
}

/** Nombre corto (chips, filtros, leyendas) con el mismo criterio que {@link compLabel}. */
export function compShort(comp: Competition, league?: LeagueKind | null): string {
  if (league && (comp === "coppa" || comp === "supercoppa")) return compLabel(comp, league);
  if (league && comp === "carabao" && isPortugueseLeague(league)) return PORTUGUESE_LEAGUE_CUP_LABEL;
  return COMP_THEME[comp].short;
}

/** Copas continentales de la región del club: UEFA para ligas europeas, CONMEBOL para Argentina. */
export function continentalCompsFor(league: LeagueKind): Competition[] {
  if (league === "saudiProLeague" || league === "saudiFirstDivision") return [];
  return isConmebolLeague(league) ? ["libertadores", "sudamericana"] : ["ucl", "uel", "uecl"];
}

/** ¿Esta competición pertenece al país/región del club? Las ligas y copas de otros países no. */
export function compBelongsToLeague(comp: Competition, league: LeagueKind): boolean {
  if ((comp === "coppa" || comp === "supercoppa") && league === "promocionalAmateur") return false;
  // La Carabao Cup es inglesa y la Taça da Liga portuguesa (mismo espacio de "copa de liga" en el calendario).
  if (comp === "carabao") return isEnglishLeague(league) || isPortugueseLeague(league);
  // La Community Shield es solo para la Premier: el campeón de Championship no la juega.
  if (comp === "supercoppa" && (league === "championship" || league === "leagueOne" || league === "segunda" || league === "primeraFed1" || league === "primeraFed2" || league === "primeraNacional" || league === "primeraBMetro" || league === "argentinaCuarta" || league === "argentinaQuinta")) return false;
  // La League One juega la FA Cup y la Carabao Cup (con la Premier y la Championship), pero no la Community Shield.
  // La Supercoppa Italiana es solo para la Serie A: el campeón de Serie B no la juega (pero sí la Coppa Italia).
  if (comp === "supercoppa" && league === "serieB") return false;
  // La DFL-Supercup es solo para la Bundesliga: el campeón de la 2. Bundesliga no la juega (pero sí la DFB-Pokal).
  if (comp === "supercoppa" && league === "bundesliga2") return false;
  // La 3. Liga no juega la DFB-Pokal en este modo (la copa alemana es solo Bundesliga + 2. Bundesliga) ni la DFL-Supercup.
  if ((comp === "coppa" || comp === "supercoppa") && league === "bundesliga3") return false;
  // El Trophée des Champions es solo para la Ligue 1: el campeón de Ligue 2 no lo juega.
  if (comp === "supercoppa" && (league === "ligue2" || league === "ligue3")) return false;
  // La Supercopa do Brasil es solo para la Série A.
  if (comp === "supercoppa" && (league === "brasileiraoB" || league === "brasileiraoC")) return false;
  // La Supertaça es solo para la Primeira Liga: el campeón de la Liga Portugal 2 no la juega (sí la Taça de Portugal; y si un
  // club de la Liga Portugal 2 gana la Taça, juega la Supertaça: el calendario la trae solo en ese caso).
  if (comp === "supercoppa" && league === "primeira2") return false;
  if (comp === "kingsCup" || comp === "saudiSuperCup") {
    return league === "saudiProLeague" || league === "saudiFirstDivision";
  }
  if (comp === "coppa" || comp === "supercoppa" || comp === "mundial" || comp === "intercontinental" || comp === "transatlantica") return true;
  if (comp === "trofeo") return league === "argentina";
  if (isContinental(comp)) return continentalCompsFor(league).includes(comp);
  return comp === league;
}

/** Nombre de la ronda de eliminación directa (sin el nombre de la competición). */
export function stageLabel(comp: Competition, league: LeagueKind, round: number): string {
  if (comp === "coppa") return coppaStageLabel(league, round);
  if (comp === "kingsCup") return saudiKingsCupStage(round);
  if (comp === "carabao") return englishCupStageLabel(round, league);
  if (comp === "supercoppa") return round >= supercoppaFinalRound(league) ? "Final" : "Semifinales";
  if (comp === "saudiSuperCup") return round >= 2 ? "Final" : "Semifinales";
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
