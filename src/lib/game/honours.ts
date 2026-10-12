import type { LeagueKind } from "./types";
import { leagueInfo } from "./clubs";

export type HonourKind =
  | "scudetto"
  | "coppa"
  | "carabao"
  | "supercoppa"
  | "ucl"
  | "uel"
  | "uecl"
  | "libertadores"
  | "sudamericana"
  | "recopa"
  | "trofeo"
  | "mundial"
  | "intercontinental"
  | "transatlantica";

export interface HonourCounts {
  scudetto: number;
  coppa: number;
  carabao: number;
  supercoppa: number;
  ucl: number;
  uel: number;
  uecl: number;
  libertadores: number;
  sudamericana: number;
  recopa: number;
  trofeo: number;
  mundial: number;
  intercontinental: number;
  transatlantica: number;
}

export interface CareerTrophy {
  id: string;
  kind: HonourKind;
  season: number;
  label: string;
  prize?: number;
}

export type HistoricalCoverageStatus = "complete" | "partial" | "pending";

export interface HistoricalCoverage {
  status: HistoricalCoverageStatus;
  knownKinds: readonly HonourKind[];
  sources: readonly string[];
}

export const HONOUR_LABEL: Record<HonourKind, string> = {
  scudetto: "Liga",
  coppa: "Copa nacional",
  carabao: "Copa de liga",
  supercoppa: "Supercopa nacional",
  ucl: "Champions",
  uel: "Europa League",
  uecl: "Conference",
  libertadores: "Libertadores",
  sudamericana: "Sudamericana",
  recopa: "Recopa",
  trofeo: "Trofeo de Campeones",
  mundial: "Mundial de Clubes",
  intercontinental: "Copa Intercontinental",
  transatlantica: "Copa Transatlántica",
};

export function honourLabel(kind: HonourKind, league: LeagueKind): string {
  if (league === "saudiProLeague" || league === "saudiFirstDivision") {
    if (kind === "coppa") return "King's Cup";
    if (kind === "supercoppa") return "Saudi Super Cup";
  }
  if (league === "premier") {
    if (kind === "scudetto") return "Premier League";
    if (kind === "coppa") return "FA Cup";
    if (kind === "supercoppa") return "Community Shield";
  }
  if (league === "serieA") {
    if (kind === "scudetto") return "Serie A";
    if (kind === "coppa") return "Coppa Italia";
    if (kind === "supercoppa") return "Supercoppa Italiana";
  }
  if (league === "championship") {
    if (kind === "scudetto") return "Championship";
    if (kind === "coppa") return "FA Cup";
    if (kind === "supercoppa") return "Community Shield";
  }
  if (league === "serieB") {
    if (kind === "scudetto") return "Serie B";
    if (kind === "coppa") return "Coppa Italia";
  }
  if (league === "leagueOne") {
    if (kind === "scudetto") return "League One";
    if (kind === "coppa") return "FA Cup";
  }
  if (league === "leagueTwo") {
    if (kind === "scudetto") return "EFL League Two";
    if (kind === "coppa") return "FA Cup";
  }
  if (league === "laliga") {
    if (kind === "scudetto") return "La Liga";
    if (kind === "coppa") return "Copa del Rey";
    if (kind === "supercoppa") return "Supercopa";
  }
  if (league === "serieB") {
    if (kind === "scudetto") return "Serie B";
    if (kind === "coppa") return "Coppa Italia";
  }
  if (league === "ligue2") {
    if (kind === "scudetto") return "Ligue 2";
    if (kind === "coppa") return "Coupe de France";
    // Un club de Ligue 2 que gana la Coupe de France juega (y puede ganar) el Trophée des Champions.
    if (kind === "supercoppa") return "Trophée des Champions";
  }
  if (league === "ligue3" && kind === "scudetto") return "Ligue 3";
  if (league === "bundesliga2") {
    if (kind === "scudetto") return "2. Bundesliga";
    if (kind === "coppa") return "DFB-Pokal";
  }
  if (league === "bundesliga3") {
    if (kind === "scudetto") return "3. Liga";
  }
  if (league === "primeraFed1" || league === "primeraFed2") {
    if (kind === "scudetto") return league === "primeraFed1" ? "Primera Federación G1" : "Primera Federación G2";
    if (kind === "coppa") return "Copa del Rey";
  }
  if (league === "segunda") {
    if (kind === "scudetto") return "LaLiga Hypermotion";
    if (kind === "coppa") return "Copa del Rey";
    if (kind === "supercoppa") return "Supercopa";
  }
  if (league === "bundesliga") {
    if (kind === "scudetto") return "Bundesliga";
    if (kind === "coppa") return "DFB-Pokal";
    if (kind === "supercoppa") return "DFL-Supercup";
  }
  if (league === "ligue1") {
    if (kind === "scudetto") return "Ligue 1";
    if (kind === "coppa") return "Coupe de France";
    if (kind === "supercoppa") return "Trophée des Champions";
  }
  if (league === "primeraNacional") {
    if (kind === "scudetto") return "Primera Nacional";
    if (kind === "coppa") return "Copa Argentina";
    if (kind === "supercoppa") return "SuperCopa Argentina";
  }
  if (league === "primeraBMetro") {
    if (kind === "scudetto") return "Primera B Metro / Federal A";
    if (kind === "coppa") return "Copa Argentina";
  }
  if (league === "argentinaCuarta" || league === "argentinaQuinta" || league === "promocionalAmateur") {
    if (kind === "scudetto") return leagueInfo(league).title;
    if (kind === "coppa" && league !== "promocionalAmateur") return "Copa Argentina";
  }
  if (league === "argentina") {
    if (kind === "scudetto") return "Liga Profesional";
    if (kind === "coppa") return "Copa Argentina";
    if (kind === "supercoppa") return "SuperCopa Argentina";
    if (kind === "trofeo") return "Trofeo de Campeones";
  }
  if (league === "brasileirao") {
    if (kind === "scudetto") return "Brasileirão";
    if (kind === "coppa") return "Copa do Brasil";
    if (kind === "supercoppa") return "Supercopa do Brasil";
  }
  if (league === "brasileiraoB" || league === "brasileiraoC") {
    if (kind === "scudetto") return league === "brasileiraoB" ? "Brasileirão Série B" : "Brasileirão Série C";
    if (kind === "coppa") return "Copa do Brasil";
  }
  if (league === "eredivisie") {
    if (kind === "scudetto") return "Eredivisie";
    if (kind === "coppa") return "KNVB Beker";
    if (kind === "supercoppa") return "Johan Cruijff Schaal";
  }
  if (league === "primeira") {
    if (kind === "scudetto") return "Primeira Liga";
    if (kind === "coppa") return "Taça de Portugal";
    if (kind === "carabao") return "Taça da Liga";
    if (kind === "supercoppa") return "Supertaça";
  }
  if (league === "primeira2") {
    if (kind === "scudetto") return "Liga Portugal 2";
    if (kind === "coppa") return "Taça de Portugal";
    if (kind === "carabao") return "Taça da Liga";
    // Un club de la Liga Portugal 2 que gana la Taça de Portugal juega la Supertaça.
    if (kind === "supercoppa") return "Supertaça";
  }
  if (league === "eersteDivisie" && kind === "scudetto") return "Eerste Divisie";
  if (league === "tweedeDivisie" && kind === "scudetto") return "Tweede Divisie";
  if (league === "mls" && kind === "scudetto") return "MLS Cup";
  if (league === "uslChampionship" && kind === "scudetto") return "USL Championship";
  if (league === "saudiProLeague" && kind === "scudetto") return "Saudi Pro League";
  if (league === "saudiFirstDivision" && kind === "scudetto") return "Saudi First Division League";
  return HONOUR_LABEL[kind];
}

const EMPTY: HonourCounts = {
  scudetto: 0,
  coppa: 0,
  carabao: 0,
  supercoppa: 0,
  ucl: 0,
  uel: 0,
  uecl: 0,
  libertadores: 0,
  sudamericana: 0,
  recopa: 0,
  trofeo: 0,
  mundial: 0,
  intercontinental: 0,
  transatlantica: 0,
};

/** All-time major honours entering 2026/27 (updated Oct 2026). */
export const HISTORICAL: Record<string, Partial<HonourCounts>> = {
  // ── Serie A ──
  juv: { scudetto: 36, coppa: 15, supercoppa: 9, ucl: 2, uel: 3, recopa: 1, mundial: 0 },
  int: { scudetto: 21, coppa: 9, supercoppa: 8, ucl: 3, uel: 3, recopa: 0, mundial: 1 },
  mil: { scudetto: 19, coppa: 5, supercoppa: 8, ucl: 7, uel: 0, recopa: 2, mundial: 1 },
  nap: { scudetto: 4, coppa: 6, supercoppa: 4, ucl: 0, uel: 1, recopa: 0, mundial: 0 },
  rom: { scudetto: 3, coppa: 9, supercoppa: 2, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  laz: { scudetto: 2, coppa: 7, supercoppa: 5, ucl: 0, uel: 0, recopa: 1, mundial: 0 },
  fio: { scudetto: 2, coppa: 6, supercoppa: 1, ucl: 0, uel: 0, recopa: 1, mundial: 0 },
  gen: { scudetto: 9, coppa: 1, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  tor: { scudetto: 7, coppa: 5, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  bol: { scudetto: 7, coppa: 3, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  par: { scudetto: 0, coppa: 3, supercoppa: 1, ucl: 0, uel: 2, recopa: 1, mundial: 0 },
  ata: { scudetto: 0, coppa: 1, supercoppa: 0, ucl: 0, uel: 1, recopa: 0, mundial: 0 },
  cag: { scudetto: 1, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  ven: { scudetto: 0, coppa: 1, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  com: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  udi: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  lec: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  mon: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  sas: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  fro: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },

  // ── Premier League ──
  mun: { scudetto: 20, coppa: 13, carabao: 6, supercoppa: 21, ucl: 3, uel: 1, recopa: 1, mundial: 1 },
  liv: { scudetto: 20, coppa: 8, carabao: 10, supercoppa: 16, ucl: 6, uel: 3, recopa: 0, mundial: 1 },
  ars: { scudetto: 14, coppa: 14, carabao: 2, supercoppa: 17, ucl: 0, uel: 0, recopa: 1, mundial: 0 },
  mci: { scudetto: 10, coppa: 7, carabao: 8, supercoppa: 7, ucl: 1, uel: 0, recopa: 0, mundial: 1 },
  che: { scudetto: 6, coppa: 8, carabao: 5, supercoppa: 4, ucl: 2, uel: 2, recopa: 2, mundial: 1 },
  tot: { scudetto: 2, coppa: 8, carabao: 4, supercoppa: 7, ucl: 0, uel: 3, recopa: 1, mundial: 0 },
  new: { scudetto: 4, coppa: 6, carabao: 1, supercoppa: 1, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  avl: { scudetto: 7, coppa: 7, carabao: 5, supercoppa: 1, ucl: 1, uel: 0, recopa: 0, mundial: 0 },
  eve: { scudetto: 9, coppa: 5, supercoppa: 9, ucl: 0, uel: 0, recopa: 1, mundial: 0 },
  nfo: { scudetto: 1, coppa: 2, carabao: 4, supercoppa: 1, ucl: 2, uel: 0, recopa: 0, mundial: 0 },
  lee: { scudetto: 3, coppa: 1, supercoppa: 2, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  wol: { scudetto: 3, coppa: 4, carabao: 2, supercoppa: 4, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  whu: { scudetto: 0, coppa: 3, supercoppa: 1, ucl: 0, uel: 0, recopa: 1, mundial: 0 },
  bha: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  cry: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  ful: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  bre: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  bou: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  bur: { scudetto: 2, coppa: 1, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  sun: { scudetto: 6, coppa: 2, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  cov: { scudetto: 0, coppa: 1, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  hul: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  ips: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },

  // ── La Liga ──
  rma: { scudetto: 36, coppa: 20, supercoppa: 13, ucl: 15, uel: 2, recopa: 0, mundial: 5 },
  bar: { scudetto: 29, coppa: 31, supercoppa: 15, ucl: 5, uel: 0, recopa: 4, mundial: 3 },
  atl: { scudetto: 11, coppa: 10, supercoppa: 2, ucl: 0, uel: 3, recopa: 1, mundial: 0 },
  ath: { scudetto: 8, coppa: 24, supercoppa: 3, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  val: { scudetto: 6, coppa: 8, supercoppa: 1, ucl: 0, uel: 1, recopa: 1, mundial: 0 },
  rso: { scudetto: 2, coppa: 3, supercoppa: 1, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  sev: { scudetto: 1, coppa: 5, supercoppa: 1, ucl: 0, uel: 7, recopa: 1, mundial: 0 },
  bet: { scudetto: 1, coppa: 3, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  vil: { scudetto: 0, coppa: 1, supercoppa: 0, ucl: 0, uel: 1, recopa: 0, mundial: 0 },
  esp: { scudetto: 0, coppa: 4, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  dep: { scudetto: 1, coppa: 0, supercoppa: 3, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  ala: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  get: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  ray: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  osa: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  cel: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  rac: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  lev: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  elc: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  mlg: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },

  // ── Bundesliga ──
  bay: { scudetto: 34, coppa: 20, supercoppa: 11, ucl: 6, uel: 1, recopa: 1, mundial: 2 },
  dor: { scudetto: 8, coppa: 5, supercoppa: 6, ucl: 1, uel: 0, recopa: 1, mundial: 0 },
  b04: { scudetto: 1, coppa: 2, supercoppa: 1, ucl: 0, uel: 1, recopa: 0, mundial: 0 },
  rbl: { scudetto: 0, coppa: 2, supercoppa: 1, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  vfb: { scudetto: 5, coppa: 3, supercoppa: 1, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  sge: { scudetto: 1, coppa: 5, supercoppa: 0, ucl: 0, uel: 2, recopa: 1, mundial: 0 },
  hsv: { scudetto: 6, coppa: 3, supercoppa: 0, ucl: 1, uel: 0, recopa: 1, mundial: 0 },
  bmg: { scudetto: 5, coppa: 3, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  svw: { scudetto: 4, coppa: 6, supercoppa: 0, ucl: 0, uel: 0, recopa: 1, mundial: 0 },
  koe: { scudetto: 3, coppa: 4, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  s04: { scudetto: 7, coppa: 5, supercoppa: 1, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  fcu: { scudetto: 0, coppa: 1, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  scf: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  tsg: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  m05: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  fca: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  elv: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  scp: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },

  // ── Ligue 1 ──
  psg: { scudetto: 12, coppa: 16, supercoppa: 13, ucl: 2, uel: 0, recopa: 1, mundial: 0 },
  om: { scudetto: 9, coppa: 10, supercoppa: 3, ucl: 1, uel: 0, recopa: 0, mundial: 0 },
  asm: { scudetto: 8, coppa: 5, supercoppa: 4, ucl: 0, uel: 0, recopa: 1, mundial: 0 },
  ol: { scudetto: 7, coppa: 5, supercoppa: 8, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  lil: { scudetto: 4, coppa: 6, supercoppa: 1, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  nic: { scudetto: 4, coppa: 3, supercoppa: 1, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  fcn: { scudetto: 8, coppa: 4, supercoppa: 3, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  sre: { scudetto: 0, coppa: 3, supercoppa: 1, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  rcl: { scudetto: 1, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  rcs: { scudetto: 1, coppa: 3, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  aux: { scudetto: 1, coppa: 4, supercoppa: 2, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  met: { scudetto: 0, coppa: 2, supercoppa: 1, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  tfc: { scudetto: 0, coppa: 1, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  lor: { scudetto: 0, coppa: 1, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  sbr: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  pfc: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  hac: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  ang: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  tro: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
  lmn: { scudetto: 0, coppa: 0, supercoppa: 0, ucl: 0, uel: 0, recopa: 0, mundial: 0 },

  // ── Liga Profesional ──
  riv: { scudetto: 38, coppa: 3, supercoppa: 3, libertadores: 4, sudamericana: 1, recopa: 3, trofeo: 3, mundial: 1 },
  boc: { scudetto: 35, coppa: 4, supercoppa: 2, libertadores: 6, sudamericana: 2, recopa: 4, trofeo: 2, mundial: 3 },
  rca: { scudetto: 18, coppa: 1, supercoppa: 1, libertadores: 1, sudamericana: 1, recopa: 1, trofeo: 1, mundial: 0 },
  cai: { scudetto: 16, coppa: 2, supercoppa: 1, libertadores: 7, sudamericana: 2, recopa: 3, trofeo: 0, mundial: 2 },
  slo: { scudetto: 15, coppa: 0, supercoppa: 1, libertadores: 1, sudamericana: 1, recopa: 1, trofeo: 0, mundial: 0 },
  vel: { scudetto: 11, coppa: 1, supercoppa: 1, libertadores: 1, sudamericana: 0, recopa: 1, trofeo: 0, mundial: 1 },
  est: { scudetto: 6, coppa: 0, supercoppa: 0, libertadores: 4, sudamericana: 0, recopa: 1, trofeo: 0, mundial: 1 },
  nob: { scudetto: 6, coppa: 0, supercoppa: 0, libertadores: 0, sudamericana: 0, recopa: 0, mundial: 0 },
  hur: { scudetto: 5, coppa: 1, supercoppa: 0, libertadores: 0, sudamericana: 0, recopa: 0, mundial: 0 },
  rcen: { scudetto: 4, coppa: 1, supercoppa: 0, libertadores: 0, sudamericana: 1, recopa: 0, mundial: 0 },
  argj: { scudetto: 3, coppa: 0, supercoppa: 0, libertadores: 0, sudamericana: 0, recopa: 0, mundial: 0 },
  lan: { scudetto: 2, coppa: 0, supercoppa: 0, libertadores: 0, sudamericana: 1, recopa: 0, mundial: 0 },
  tal: { scudetto: 0, coppa: 1, supercoppa: 0, libertadores: 0, sudamericana: 0, recopa: 0, mundial: 0 },
  dyj: { scudetto: 0, coppa: 0, supercoppa: 0, libertadores: 0, sudamericana: 1, recopa: 0, mundial: 0 },
  gim: { scudetto: 0, coppa: 1, supercoppa: 0, libertadores: 0, sudamericana: 0, recopa: 0, mundial: 0 },
  bel: { scudetto: 1, coppa: 0, supercoppa: 0, libertadores: 0, sudamericana: 0, recopa: 0, mundial: 0 },
  ban: { scudetto: 0, coppa: 0, supercoppa: 0, libertadores: 0, sudamericana: 1, recopa: 0, mundial: 0 },
  pla: { scudetto: 0, coppa: 0, supercoppa: 0, libertadores: 0, sudamericana: 0, recopa: 0, mundial: 0 },
  tig: { scudetto: 0, coppa: 0, supercoppa: 0, libertadores: 0, sudamericana: 0, recopa: 0, mundial: 0 },
  atu: { scudetto: 0, coppa: 0, supercoppa: 0, libertadores: 0, sudamericana: 0, recopa: 0, mundial: 0 },
  ins: { scudetto: 0, coppa: 0, supercoppa: 0, libertadores: 0, sudamericana: 0, recopa: 0, mundial: 0 },
  irv: { scudetto: 0, coppa: 0, supercoppa: 0, libertadores: 0, sudamericana: 0, recopa: 0, mundial: 0 },
  bcc: { scudetto: 0, coppa: 0, supercoppa: 0, libertadores: 0, sudamericana: 0, recopa: 0, mundial: 0 },
  rie: { scudetto: 0, coppa: 0, supercoppa: 0, libertadores: 0, sudamericana: 0, recopa: 0, mundial: 0 },

  // ── Primeira Liga ── (títulos de liga y copas europeas; las copas portuguesas parten de cero y se suman jugando)
  pt_ben: { scudetto: 38, ucl: 2, uel: 0, uecl: 0, recopa: 0, mundial: 0 },
  pt_por: { scudetto: 31, ucl: 2, uel: 2, uecl: 0, recopa: 0, mundial: 0 },
  pt_spo: { scudetto: 21, ucl: 0, uel: 0, uecl: 0, recopa: 1, mundial: 0 },
  pt_bra: { scudetto: 0 },
  pt2_por: { scudetto: 1 },
  pt2_lei: { scudetto: 1 },

  // Eredivisie league champions, totals in the cited record table.
  nl_aja: { scudetto: 36 },
  nl_psv: { scudetto: 27 },
  nl_fey: { scudetto: 16 },

  // Brazilian Série B and Copa do Brasil totals through the 2025 seasons.
  bb_for: { scudetto: 1, coppa: 0 },
  bb_cea: { scudetto: 0, coppa: 0 },
  bb_spo: { scudetto: 1, coppa: 1 },
  bb_goi: { scudetto: 2, coppa: 0 },
  bb_juv: { scudetto: 1, coppa: 1 },
  bb_cri: { scudetto: 1, coppa: 1 },
  bb_pon: { scudetto: 0, coppa: 0 },
  bb_nau: { scudetto: 0, coppa: 0 },
  bb_ava: { scudetto: 0, coppa: 0 },
  bb_ame: { scudetto: 2, coppa: 0 },
  bb_crb: { scudetto: 0, coppa: 0 },
  bb_cui: { scudetto: 0, coppa: 0 },
  bb_vno: { scudetto: 0, coppa: 0 },
  bb_acg: { scudetto: 1, coppa: 0 },
  bb_nov: { scudetto: 0, coppa: 0 },
  bb_bsp: { scudetto: 0, coppa: 0 },
  bb_ope: { scudetto: 0, coppa: 0 },
  bb_sbe: { scudetto: 0, coppa: 0 },
  bb_lon: { scudetto: 1, coppa: 0 },
  bb_atc: { scudetto: 0, coppa: 0 },

  // Official Brazilian Série A, Copa do Brasil and Supercopa totals through 2025/26.
  brfla: { scudetto: 8, coppa: 5, supercoppa: 3 },
  brpal: { scudetto: 12, coppa: 4, supercoppa: 1 },
  brbot: { scudetto: 3, coppa: 0, supercoppa: 0 },
  brflu: { scudetto: 4, coppa: 1, supercoppa: 0 },
  brcor: { scudetto: 7, coppa: 4, supercoppa: 2 },
  brsao: { scudetto: 6, coppa: 1, supercoppa: 1 },
  bratm: { scudetto: 3, coppa: 2, supercoppa: 1 },
  brcru: { scudetto: 4, coppa: 6, supercoppa: 0 },
  brgre: { scudetto: 2, coppa: 5, supercoppa: 1 },
  brint: { scudetto: 3, coppa: 1, supercoppa: 0 },
  brbah: { scudetto: 2, coppa: 0, supercoppa: 0 },
  brsan: { scudetto: 8, coppa: 1, supercoppa: 0 },
  brvas: { scudetto: 4, coppa: 1, supercoppa: 0 },
  brath: { scudetto: 1, coppa: 1, supercoppa: 0 },
  brbra: { scudetto: 0, coppa: 0, supercoppa: 0 },
  brvit: { scudetto: 0, coppa: 0, supercoppa: 0 },
  brmir: { scudetto: 0, coppa: 0, supercoppa: 0 },
  brcrb: { scudetto: 0, coppa: 0, supercoppa: 0 },
  brcha: { scudetto: 0, coppa: 0, supercoppa: 0 },
  brrem: { scudetto: 0, coppa: 0, supercoppa: 0 },

  // MLS Cup titles through the completed 2025 season.
  us_atl: { scudetto: 1 },
  us_aus: { scudetto: 0 },
  us_cfm: { scudetto: 0 },
  us_clt: { scudetto: 0 },
  us_chi: { scudetto: 1 },
  us_col: { scudetto: 1 },
  us_ccr: { scudetto: 3 },
  us_cin: { scudetto: 0 },
  us_dal: { scudetto: 0 },
  us_dcu: { scudetto: 4 },
  us_hou: { scudetto: 2 },
  us_mia: { scudetto: 1 },
  us_laf: { scudetto: 1 },
  us_lag: { scudetto: 6 },
  us_mnu: { scudetto: 0 },
  us_nsh: { scudetto: 0 },
  us_ne: { scudetto: 0 },
  us_nyc: { scudetto: 1 },
  us_nyr: { scudetto: 0 },
  us_orl: { scudetto: 0 },
  us_phi: { scudetto: 0 },
  us_por: { scudetto: 1 },
  us_rsl: { scudetto: 1 },
  us_sdf: { scudetto: 0 },
  us_sje: { scudetto: 2 },
  us_sea: { scudetto: 2 },
  us_skc: { scudetto: 2 },
  us_stl: { scudetto: 0 },
  us_tor: { scudetto: 1 },
  us_van: { scudetto: 0 },

  // USL Championship league titles from its 2011 USL Pro season through 2025.
  usl_bhm: { scudetto: 0 },
  usl_bkn: { scudetto: 0 },
  usl_chs: { scudetto: 1 },
  usl_det: { scudetto: 0 },
  usl_hfd: { scudetto: 0 },
  usl_ind: { scudetto: 0 },
  usl_lex: { scudetto: 0 },
  usl_lou: { scudetto: 2 },
  usl_ldn: { scudetto: 0 },
  usl_mia: { scudetto: 0 },
  usl_pit: { scudetto: 1 },
  usl_rif: { scudetto: 0 },
  usl_tbr: { scudetto: 0 },
  usl_jax: { scudetto: 0 },
  usl_cos: { scudetto: 1 },
  usl_elp: { scudetto: 0 },
  usl_lv: { scudetto: 0 },
  usl_mbay: { scudetto: 0 },
  usl_nm: { scudetto: 0 },
  usl_oak: { scudetto: 0 },
  usl_ocs: { scudetto: 1 },
  usl_phx: { scudetto: 1 },
  usl_sac: { scudetto: 1 },
  usl_sa: { scudetto: 1 },
  usl_tul: { scudetto: 0 },

  // ── Saudi Pro League / First Division ──
  sau_hil: { scudetto: 18, coppa: 11, supercoppa: 12, ucl: 2, uel: 1, mundial: 2, intercontinental: 1, transatlantica: 1 },
  sau_nas: { scudetto: 9, coppa: 7, supercoppa: 3, ucl: 0, uel: 1, mundial: 0 },
  sau_ahl: { scudetto: 7, coppa: 5, supercoppa: 4, ucl: 1, mundial: 0 },
  sau_itt: { scudetto: 5, coppa: 4, supercoppa: 2, ucl: 0, uel: 0, mundial: 0 },
  sau_qad: { scudetto: 1, coppa: 1, supercoppa: 0 },
  sau_rae: { scudetto: 1, coppa: 1, supercoppa: 0 },
  sau_sha: { scudetto: 1, coppa: 0, supercoppa: 0 },
  sau_taa: { scudetto: 0, coppa: 1, supercoppa: 0 },
  sau_ett: { scudetto: 0, coppa: 1, supercoppa: 0 },

  // ── Europe / otros ──
  bru: { scudetto: 19, coppa: 12, supercoppa: 17, ucl: 0, uel: 0, recopa: 0, mundial: 0 },
};

/** Per-club research metadata. A missing record is pending, never a confirmed zero. */
const BRAZIL_SERIE_B_SOURCES = [
  "https://en.wikipedia.org/wiki/Campeonato_Brasileiro_S%C3%A9rie_B#Titles_by_team",
  "https://en.wikipedia.org/wiki/Copa_do_Brasil#History",
];

const BRAZIL_SERIE_A_SOURCES = [
  "https://en.wikipedia.org/wiki/List_of_Brazilian_football_champions#Performances",
  "https://en.wikipedia.org/wiki/List_of_Copa_do_Brasil_winners#Performance_by_club",
  "https://en.wikipedia.org/wiki/Supercopa_do_Brasil#Titles_by_club",
];

const MLS_CUP_SOURCE = "https://en.wikipedia.org/wiki/MLS_Cup#MLS_Cup_titles";

const USL_CHAMPIONSHIP_SOURCES = [
  "https://en.wikipedia.org/wiki/USL_Championship#Champions",
  "https://en.wikipedia.org/wiki/2020_USL_Championship_season",
  "https://en.wikipedia.org/wiki/2021_USL_Championship_season",
  "https://en.wikipedia.org/wiki/2022_USL_Championship_season",
  "https://en.wikipedia.org/wiki/2023_USL_Championship_season",
  "https://en.wikipedia.org/wiki/2024_USL_Championship_season",
  "https://en.wikipedia.org/wiki/2025_USL_Championship_season",
];

const PORTUGUESE_TOP_LEAGUE_SOURCE = "https://en.wikipedia.org/wiki/Primeira_Liga#Performance_by_club";
const PORTUGUESE_SECOND_LEAGUE_SOURCE = "https://en.wikipedia.org/wiki/Liga_Portugal_2#Performance_by_club";
const EREDIVISIE_SOURCE = "https://en.wikipedia.org/wiki/Eredivisie#Champions";

const BRAZIL_SERIE_B_IDS = [
  "bb_for", "bb_cea", "bb_spo", "bb_goi", "bb_juv", "bb_cri", "bb_pon", "bb_nau", "bb_ava", "bb_ame",
  "bb_crb", "bb_cui", "bb_vno", "bb_acg", "bb_nov", "bb_bsp", "bb_ope", "bb_sbe", "bb_lon", "bb_atc",
];

const BRAZIL_SERIE_A_IDS = [
  "brfla", "brpal", "brbot", "brflu", "brcor", "brsao", "bratm", "brcru", "brgre", "brint",
  "brbah", "brsan", "brvas", "brath", "brbra", "brvit", "brmir", "brcrb", "brcha", "brrem",
];

const MLS_IDS = [
  "us_atl", "us_aus", "us_cfm", "us_clt", "us_chi", "us_col", "us_ccr", "us_cin", "us_dal", "us_dcu",
  "us_hou", "us_mia", "us_laf", "us_lag", "us_mnu", "us_nsh", "us_ne", "us_nyc", "us_nyr", "us_orl",
  "us_phi", "us_por", "us_rsl", "us_sdf", "us_sje", "us_sea", "us_skc", "us_stl", "us_tor", "us_van",
];

const USL_IDS = [
  "usl_bhm", "usl_bkn", "usl_chs", "usl_det", "usl_hfd", "usl_ind", "usl_lex", "usl_lou", "usl_ldn",
  "usl_mia", "usl_pit", "usl_rif", "usl_tbr", "usl_jax", "usl_cos", "usl_elp", "usl_lv", "usl_mbay",
  "usl_nm", "usl_oak", "usl_ocs", "usl_phx", "usl_sac", "usl_sa", "usl_tul",
];

const PORTUGUESE_TOP_LEAGUE_IDS = ["pt_ben", "pt_por", "pt_spo", "pt_bra"];
const PORTUGUESE_SECOND_LEAGUE_IDS = ["pt2_por", "pt2_lei"];
const EREDIVISIE_IDS = ["nl_aja", "nl_psv", "nl_fey"];

export const HISTORICAL_COVERAGE: Record<string, HistoricalCoverage> = Object.fromEntries(
  [
    ...BRAZIL_SERIE_B_IDS.map((clubId) => [
      clubId,
      { status: "partial", knownKinds: ["scudetto", "coppa"], sources: BRAZIL_SERIE_B_SOURCES },
    ]),
    ...BRAZIL_SERIE_A_IDS.map((clubId) => [
      clubId,
      { status: "partial", knownKinds: ["scudetto", "coppa", "supercoppa"], sources: BRAZIL_SERIE_A_SOURCES },
    ]),
    ...MLS_IDS.map((clubId) => [
      clubId,
      { status: "partial", knownKinds: ["scudetto"], sources: [MLS_CUP_SOURCE] },
    ]),
    ...USL_IDS.map((clubId) => [
      clubId,
      { status: "partial", knownKinds: ["scudetto"], sources: USL_CHAMPIONSHIP_SOURCES },
    ]),
    ...PORTUGUESE_TOP_LEAGUE_IDS.map((clubId) => [
      clubId,
      { status: "partial", knownKinds: ["scudetto"], sources: [PORTUGUESE_TOP_LEAGUE_SOURCE] },
    ]),
    ...PORTUGUESE_SECOND_LEAGUE_IDS.map((clubId) => [
      clubId,
      { status: "partial", knownKinds: ["scudetto"], sources: [PORTUGUESE_SECOND_LEAGUE_SOURCE] },
    ]),
    ...EREDIVISIE_IDS.map((clubId) => [
      clubId,
      { status: "partial", knownKinds: ["scudetto"], sources: [EREDIVISIE_SOURCE] },
    ]),
  ],
);

export function historicalFor(clubId: string): HonourCounts {
  return { ...EMPTY, ...(HISTORICAL[clubId] ?? {}) };
}

export function historicalCoverageFor(clubId: string): HistoricalCoverage {
  const coverage = HISTORICAL_COVERAGE[clubId];
  if (coverage) return coverage;
  const historical = HISTORICAL[clubId];
  return {
    status: historical ? "partial" : "pending",
    knownKinds: historical ? (Object.keys(historical) as HonourKind[]) : [],
    sources: [],
  };
}

export function historicalStatusFor(clubId: string): HistoricalCoverageStatus {
  return historicalCoverageFor(clubId).status;
}

const EUROPEAN_HONOURS: HonourKind[] = ["ucl", "uel", "uecl", "recopa", "mundial", "intercontinental", "transatlantica"];
const SOUTH_AMERICAN_HONOURS: HonourKind[] = ["libertadores", "sudamericana", "recopa", "mundial", "intercontinental", "transatlantica"];

export function honourKinds(league: LeagueKind): HonourKind[] {
  if (league === "mls" || league === "uslChampionship") return ["scudetto"];
  if (league === "saudiProLeague" || league === "saudiFirstDivision") {
    return ["scudetto", "coppa", "supercoppa", "mundial", "intercontinental", "transatlantica"];
  }
  if (league === "serieA") return ["scudetto", "coppa", "supercoppa", ...EUROPEAN_HONOURS];
  if (league === "serieB") return ["scudetto", "coppa", ...EUROPEAN_HONOURS];
  if (league === "premier" || league === "championship" || league === "leagueOne" || league === "leagueTwo") {
    return ["scudetto", "coppa", "carabao", ...(league === "premier" ? ["supercoppa" as const] : []), ...EUROPEAN_HONOURS];
  }
  if (league === "laliga" || league === "segunda" || league === "primeraFed1" || league === "primeraFed2" || league === "rfef") {
    return ["scudetto", "coppa", ...(league === "laliga" ? ["supercoppa" as const] : []), ...EUROPEAN_HONOURS];
  }
  if (league === "bundesliga") return ["scudetto", "coppa", "supercoppa", ...EUROPEAN_HONOURS];
  if (league === "bundesliga2") return ["scudetto", "coppa", ...EUROPEAN_HONOURS];
  if (league === "bundesliga3") return ["scudetto"];
  if (league === "ligue1") return ["scudetto", "coppa", "supercoppa", ...EUROPEAN_HONOURS];
  if (league === "ligue2") return ["scudetto", "coppa", "supercoppa", ...EUROPEAN_HONOURS];
  if (league === "ligue3") return ["scudetto"];
  if (league === "argentina" || league === "primeraNacional") {
    return ["scudetto", "coppa", "supercoppa", "trofeo", ...SOUTH_AMERICAN_HONOURS];
  }
  if (league === "primeraBMetro" || league === "argentinaCuarta" || league === "argentinaQuinta") return ["scudetto", "coppa"];
  if (league === "promocionalAmateur") return ["scudetto"];
  if (league === "brasileirao") return ["scudetto", "coppa", "supercoppa", ...SOUTH_AMERICAN_HONOURS];
  if (league === "brasileiraoB" || league === "brasileiraoC") return ["scudetto", "coppa"];
  if (league === "primeira") return ["scudetto", "coppa", "carabao", "supercoppa", ...EUROPEAN_HONOURS];
  if (league === "primeira2") return ["scudetto", "coppa", "carabao", "supercoppa"];
  if (league === "eredivisie") return ["scudetto", "coppa", "supercoppa", ...EUROPEAN_HONOURS];
  if (league === "eersteDivisie" || league === "tweedeDivisie") return ["scudetto"];
  if (league === "europe") return [...EUROPEAN_HONOURS];
  if (league === "conmebol") return [...SOUTH_AMERICAN_HONOURS];
  return ["scudetto"];
}

function extraCups(year: string, season: number): Pick<
  Record<HonourKind, string>,
  "carabao" | "ucl" | "uel" | "uecl" | "libertadores" | "sudamericana" | "recopa" | "mundial" | "trofeo" | "intercontinental" | "transatlantica"
> {
  return {
    carabao: `Carabao Cup ${year}`,
    ucl: `Champions ${year}`,
    uel: `Europa League ${year}`,
    uecl: `Conference ${year}`,
    libertadores: `Libertadores ${year}`,
    sudamericana: `Sudamericana ${year}`,
    recopa: `Recopa ${season}`,
    mundial: `Mundial de Clubes ${season}`,
    intercontinental: `Copa Intercontinental ${season}`,
    transatlantica: `Copa Transatlántica ${season}`,
    trofeo: `Trofeo de Campeones ${season}`,
  };
}

export function trophyLabel(kind: HonourKind, season: number, league?: LeagueKind) {
  const year = `${season}/${String(season + 1).slice(2)}`;
  const extra = extraCups(year, season);
  if (league === "saudiProLeague" || league === "saudiFirstDivision") {
    if (kind === "coppa") return `King's Cup ${year}`;
    if (kind === "supercoppa") return `Saudi Super Cup ${season}`;
  }
  if (league === "premier") {
    const map: Record<HonourKind, string> = {
      scudetto: `Premier League ${year}`,
      coppa: `FA Cup ${year}`,
      supercoppa: `Community Shield ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "championship") {
    const map: Record<HonourKind, string> = {
      scudetto: `Championship ${year}`,
      coppa: `FA Cup ${year}`,
      supercoppa: `Community Shield ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "leagueOne") {
    const map: Record<HonourKind, string> = {
      scudetto: `League One ${year}`,
      coppa: `FA Cup ${year}`,
      supercoppa: `Community Shield ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "leagueTwo") {
    const map: Record<HonourKind, string> = {
      scudetto: `EFL League Two ${year}`,
      coppa: `FA Cup ${year}`,
      supercoppa: `Community Shield ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "serieB") {
    const map: Record<HonourKind, string> = {
      scudetto: `Serie B ${year}`,
      coppa: `Coppa Italia ${year}`,
      supercoppa: `Supercoppa ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "ligue2") {
    const map: Record<HonourKind, string> = {
      scudetto: `Ligue 2 ${year}`,
      coppa: `Coupe de France ${year}`,
      supercoppa: `Trophée des Champions ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "ligue3") {
    const map: Record<HonourKind, string> = {
      scudetto: `Ligue 3 ${year}`,
      coppa: `Coupe de France ${year}`,
      supercoppa: `Trophée des Champions ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "bundesliga3") {
    const map: Record<HonourKind, string> = {
      scudetto: `3. Liga ${year}`,
      coppa: `DFB-Pokal ${year}`,
      supercoppa: `DFL-Supercup ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "bundesliga2") {
    const map: Record<HonourKind, string> = {
      scudetto: `2. Bundesliga ${year}`,
      coppa: `DFB-Pokal ${year}`,
      supercoppa: `DFL-Supercup ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "primeraFed1" || league === "primeraFed2") {
    const map: Record<HonourKind, string> = {
      scudetto: `Primera Federación ${league === "primeraFed1" ? "G1" : "G2"} ${year}`,
      coppa: `Copa del Rey ${year}`,
      supercoppa: `Supercopa ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "segunda") {
    const map: Record<HonourKind, string> = {
      scudetto: `LaLiga Hypermotion ${year}`,
      coppa: `Copa del Rey ${year}`,
      supercoppa: `Supercopa ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "laliga") {
    const map: Record<HonourKind, string> = {
      scudetto: `La Liga ${year}`,
      coppa: `Copa del Rey ${year}`,
      supercoppa: `Supercopa ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "bundesliga") {
    const map: Record<HonourKind, string> = {
      scudetto: `Bundesliga ${year}`,
      coppa: `DFB-Pokal ${year}`,
      supercoppa: `DFL-Supercup ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "ligue1") {
    const map: Record<HonourKind, string> = {
      scudetto: `Ligue 1 ${year}`,
      coppa: `Coupe de France ${year}`,
      supercoppa: `Trophée des Champions ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "primeraNacional") {
    const map: Record<HonourKind, string> = {
      scudetto: `Primera Nacional ${season}`,
      coppa: `Copa Argentina ${season}`,
      supercoppa: `SuperCopa Argentina ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "primeraBMetro") {
    const map: Record<HonourKind, string> = {
      scudetto: `Primera B Metro / Federal A ${season}`,
      coppa: `Copa Argentina ${season}`,
      supercoppa: `SuperCopa Argentina ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "argentinaCuarta" || league === "argentinaQuinta" || league === "promocionalAmateur") {
    return kind === "coppa"
      ? `Copa Argentina ${season}`
      : kind === "scudetto"
        ? `${leagueInfo(league).title} ${season}`
        : `${leagueInfo(league).title} ${season}`;
  }
  if (league === "argentina") {
    const map: Record<HonourKind, string> = {
      scudetto: `Liga Profesional ${season}`,
      coppa: `Copa Argentina ${season}`,
      supercoppa: `SuperCopa Argentina ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "brasileirao") {
    const map: Record<HonourKind, string> = {
      scudetto: `Brasileirão ${season}`,
      coppa: `Copa do Brasil ${season}`,
      supercoppa: `Supercopa do Brasil ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "primeira") {
    const map: Record<HonourKind, string> = {
      scudetto: `Primeira Liga ${year}`,
      coppa: `Taça de Portugal ${year}`,
      supercoppa: `Supertaça ${season}`,
      ...extra,
      carabao: `Taça da Liga ${year}`,
    };
    return map[kind];
  }
  if (league === "primeira2") {
    const map: Record<HonourKind, string> = {
      scudetto: `Liga Portugal 2 ${year}`,
      coppa: `Taça de Portugal ${year}`,
      supercoppa: `Supertaça ${season}`,
      ...extra,
      carabao: `Taça da Liga ${year}`,
    };
    return map[kind];
  }
  if (league === "eredivisie") {
    const map: Record<HonourKind, string> = {
      scudetto: `Eredivisie ${year}`,
      coppa: `KNVB Beker ${year}`,
      supercoppa: `Johan Cruijff Schaal ${season}`,
      ...extra,
      carabao: `KNVB Beker ${year}`,
    };
    return map[kind];
  }
  if (league === "eersteDivisie" || league === "tweedeDivisie") {
    if (kind === "scudetto") return `${league === "eersteDivisie" ? "Eerste Divisie" : "Tweede Divisie"} ${season}`;
  }
  if (league === "brasileiraoB") {
    const map: Record<HonourKind, string> = {
      scudetto: `Série B ${season}`,
      coppa: `Copa do Brasil ${season}`,
      supercoppa: `Supercopa do Brasil ${season}`,
      ...extra,
    };
    return map[kind];
  }
  if (league === "brasileiraoC") {
    const map: Record<HonourKind, string> = {
      scudetto: `Série C ${season}`,
      coppa: `Copa do Brasil ${season}`,
      supercoppa: `Supercopa do Brasil ${season}`,
      ...extra,
    };
    return map[kind];
  }
  const map: Record<HonourKind, string> = {
    scudetto: `Scudetto ${year}`,
    coppa: `Coppa Italia ${year}`,
    supercoppa: `Supercoppa ${season}`,
    ...extra,
  };
  return map[kind];
}