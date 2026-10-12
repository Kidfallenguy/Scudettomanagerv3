import type { HonourKind } from "./honours";
import type { LeagueKind } from "./types";

export const TROPHY_PRIZE: Record<HonourKind, number> = {
  ucl: 82_000_000,
  mundial: 80_000_000,
  intercontinental: 18_000_000,
  transatlantica: 10_000_000,
  libertadores: 28_000_000,
  scudetto: 36_000_000,
  uel: 22_000_000,
  uecl: 12_000_000,
  sudamericana: 10_000_000,
  coppa: 12_000_000,
  carabao: 4_000_000,
  recopa: 10_000_000,
  supercoppa: 7_000_000,
  trofeo: 4_000_000,
};

export const TROPHY_NAME: Record<HonourKind, string> = {
  scudetto: "el Scudetto",
  coppa: "la Coppa Italia",
  carabao: "la Carabao Cup",
  supercoppa: "la Supercoppa Italiana",
  ucl: "la Champions League",
  uel: "la Europa League",
  uecl: "la Conference League",
  libertadores: "la Copa Libertadores",
  sudamericana: "la Copa Sudamericana",
  recopa: "la Recopa",
  trofeo: "el Trofeo de Campeones",
  mundial: "el Mundial de Clubes",
  intercontinental: "la Copa Intercontinental",
  transatlantica: "la Copa Transatlántica",
};

export function trophyPrize(kind: HonourKind, league: LeagueKind): number {
  if (kind === "scudetto") {
    if (league === "premier") return 52_000_000;
    // Campeón de la 2ª división inglesa: el premio real es el ascenso, el cheque es mucho menor.
    if (league === "championship") return 9_000_000;
    // Campeón de la League One: el premio real es el ascenso a la Championship; el cheque es menor.
    if (league === "leagueOne") return 3_500_000;
    // Campeón de League Two: el ascenso pesa más que el premio monetario.
    if (league === "leagueTwo") return 1_500_000;
    if (league === "segunda") return 7_000_000;
    // Campeón de un grupo de la Primera Federación: el premio real es el ascenso a LaLiga Hypermotion.
    if (league === "primeraFed1" || league === "primeraFed2") return 1_200_000;
    // Campeón de Serie B: el premio real es el ascenso; el cheque es menor.
    if (league === "serieB") return 4_000_000;
    // Campeón de la 2. Bundesliga: el premio real es el ascenso; el cheque es menor.
    if (league === "bundesliga2") return 4_500_000;
    // Campeón de la 3. Liga: el premio real es el ascenso a la 2. Bundesliga; el cheque es mucho menor.
    if (league === "bundesliga3") return 1_500_000;
    // Campeón de la Ligue 2: el premio real es el ascenso a la Ligue 1; el cheque es menor.
    if (league === "ligue2") return 4_000_000;
    if (league === "ligue3") return 1_500_000;
    // Campeón de la Primera Nacional: el premio real es el ascenso a la Liga Profesional.
    if (league === "primeraNacional") return 4_000_000;
    if (league === "primeraBMetro") return 1_500_000;
    if (league === "argentinaCuarta") return 300_000;
    if (league === "argentinaQuinta") return 100_000;
    if (league === "promocionalAmateur") return 60_000;
    if (league === "laliga") return 45_000_000;
    if (league === "bundesliga") return 40_000_000;
    if (league === "ligue1") return 42_000_000;
    if (league === "argentina") return 18_000_000;
    if (league === "brasileirao") return 22_000_000;
    // Campeón de la Série B: el cheque es muy inferior al de la Série A (22 M).
    if (league === "brasileiraoB") return 4_500_000;
    if (league === "brasileiraoC") return 1_500_000;
    // Campeón de la Primeira Liga: bastante por debajo de las grandes ligas (derechos de TV y premios menores).
    if (league === "primeira") return 14_000_000;
    // Campeón de la Liga Portugal 2: el premio real es el ascenso a la Primeira Liga; el cheque es mucho menor.
    if (league === "primeira2") return 2_000_000;
    if (league === "eredivisie") return 9_000_000;
    if (league === "eersteDivisie") return 2_500_000;
    if (league === "tweedeDivisie") return 500_000;
    if (league === "mls") return 20_000_000;
    if (league === "uslChampionship") return 1_500_000;
    if (league === "saudiProLeague") return 18_000_000;
    if (league === "saudiFirstDivision") return 2_500_000;
    return TROPHY_PRIZE.scudetto;
  }
  // Taça da Liga: premio menor que el de la Carabao Cup (más para un club de la Primeira Liga que de la Liga Portugal 2).
  if (kind === "carabao" && league === "primeira") return 1_500_000;
  if (kind === "carabao" && league === "primeira2") return 800_000;
  if (kind === "carabao") return league === "premier" || league === "championship" ? 4_000_000 : league === "leagueOne" ? 2_500_000 : league === "leagueTwo" ? 1_500_000 : TROPHY_PRIZE.carabao;
  if (kind === "coppa") {
    if (league === "saudiProLeague") return 4_000_000;
    if (league === "saudiFirstDivision") return 1_000_000;
    if (league === "premier" || league === "championship") return 14_000_000;
    if (league === "laliga" || league === "segunda") return 13_000_000;
    // Copa del Rey ganada por un club de Primera Federación: premio menor que en las categorías superiores.
    if (league === "primeraFed1" || league === "primeraFed2") return 4_000_000;
    // Coppa Italia ganada por un club de Serie B: premio menor que en Serie A.
    if (league === "serieB") return 3_000_000;
    if (league === "leagueOne") return 4_000_000;
    if (league === "leagueTwo") return 2_000_000;
    // DFB-Pokal ganada por un club de la 2. Bundesliga: premio algo menor que en la Bundesliga.
    if (league === "bundesliga2") return 5_000_000;
    // Coupe de France ganada por un club de Ligue 2: premio menor que en Ligue 1.
    if (league === "ligue2") return 3_000_000;
    if (league === "bundesliga") return 12_000_000;
    if (league === "ligue1") return 12_500_000;
    if (league === "argentina") return 6_000_000;
    if (league === "primeraNacional") return 2_500_000;
    if (league === "primeraBMetro") return 1_000_000;
    if (league === "argentinaCuarta" || league === "argentinaQuinta") return 500_000;
    if (league === "brasileirao") return 9_000_000;
    // Copa do Brasil ganada por un club de la Série B: premio menor que en la Série A.
    if (league === "brasileiraoB") return 6_000_000;
    if (league === "brasileiraoC") return 4_500_000;
    // Taça de Portugal: muy por debajo de las grandes copas; un club de la Liga Portugal 2 que la gana cobra algo menos.
    if (league === "primeira") return 4_000_000;
    if (league === "primeira2") return 2_000_000;
    return TROPHY_PRIZE.coppa;
  }
  if (kind === "supercoppa") {
    if (league === "saudiProLeague" || league === "saudiFirstDivision") return 2_500_000;
    if (league === "laliga") return 8_000_000;
    if (league === "premier" || league === "championship") return 7_500_000;
    if (league === "bundesliga") return 7_000_000;
    if (league === "ligue1") return 7_200_000;
    if (league === "argentina") return 3_000_000;
    if (league === "brasileirao") return 3_500_000;
    // Supertaça Cândido de Oliveira.
    if (league === "primeira" || league === "primeira2") return 1_200_000;
    return TROPHY_PRIZE.supercoppa;
  }
  if (kind === "trofeo" && league === "argentina") return 4_000_000;
  return TROPHY_PRIZE[kind];
}

export function trophyName(kind: HonourKind, league: LeagueKind): string {
  if ((league === "saudiProLeague" || league === "saudiFirstDivision") && kind === "coppa") return "la King's Cup";
  if ((league === "saudiProLeague" || league === "saudiFirstDivision") && kind === "supercoppa") return "la Saudi Super Cup";
  if (league === "leagueOne") {
    if (kind === "scudetto") return "la League One";
    if (kind === "coppa") return "la FA Cup";
  }
  if (league === "leagueTwo") {
    if (kind === "scudetto") return "la League Two";
    if (kind === "coppa") return "la FA Cup";
  }
  if (league === "leagueTwo") {
    if (kind === "scudetto") return "la League Two";
    if (kind === "coppa") return "la FA Cup";
  }
  if (league === "championship") {
    if (kind === "scudetto") return "la Championship";
    if (kind === "coppa") return "la FA Cup";
    if (kind === "supercoppa") return "el Community Shield";
  }
  if (league === "premier") {
    if (kind === "scudetto") return "la Premier League";
    if (kind === "coppa") return "la FA Cup";
    if (kind === "supercoppa") return "el Community Shield";
  }
  if (league === "serieB") {
    if (kind === "scudetto") return "la Serie B";
    if (kind === "coppa") return "la Coppa Italia";
  }
  if (league === "bundesliga2") {
    if (kind === "scudetto") return "la 2. Bundesliga";
    if (kind === "coppa") return "la DFB-Pokal";
  }
  if (league === "bundesliga3") {
    if (kind === "scudetto") return "la 3. Liga";
  }
  if (league === "ligue2") {
    if (kind === "scudetto") return "la Ligue 2";
    if (kind === "coppa") return "la Coupe de France";
  }
  if (league === "primeraFed1" || league === "primeraFed2") {
    if (kind === "scudetto") return league === "primeraFed1" ? "el Grupo 1 de la Primera Federación" : "el Grupo 2 de la Primera Federación";
    if (kind === "coppa") return "la Copa del Rey";
  }
  if (league === "segunda") {
    if (kind === "scudetto") return "LaLiga Hypermotion";
    if (kind === "coppa") return "la Copa del Rey";
    if (kind === "supercoppa") return "la Supercopa de España";
  }
  if (league === "primeraNacional") {
    if (kind === "scudetto") return "la Primera Nacional";
    if (kind === "coppa") return "la Copa Argentina";
  }
  if (league === "primeraBMetro") {
    if (kind === "scudetto") return "la Primera B Metro / Federal A";
    if (kind === "coppa") return "la Copa Argentina";
  }
  if (league === "laliga") {
    if (kind === "scudetto") return "La Liga";
    if (kind === "coppa") return "la Copa del Rey";
    if (kind === "supercoppa") return "la Supercopa de España";
  }
  if (league === "bundesliga") {
    if (kind === "scudetto") return "la Bundesliga";
    if (kind === "coppa") return "la DFB-Pokal";
    if (kind === "supercoppa") return "la DFL-Supercup";
  }
  if (league === "ligue1") {
    if (kind === "scudetto") return "la Ligue 1";
    if (kind === "coppa") return "la Coupe de France";
    if (kind === "supercoppa") return "el Trophée des Champions";
  }
  if (league === "argentina") {
    if (kind === "scudetto") return "la Liga Profesional";
    if (kind === "coppa") return "la Copa Argentina";
    if (kind === "supercoppa") return "la SuperCopa Argentina";
    if (kind === "trofeo") return "el Trofeo de Campeones";
  }
  if (league === "brasileiraoB") {
    if (kind === "scudetto") return "la Série B";
    if (kind === "coppa") return "la Copa do Brasil";
  }
  if (league === "primeira") {
    if (kind === "scudetto") return "la Primeira Liga";
    if (kind === "coppa") return "la Taça de Portugal";
    if (kind === "carabao") return "la Taça da Liga";
    if (kind === "supercoppa") return "la Supertaça Cândido de Oliveira";
  }
  if (league === "primeira2") {
    if (kind === "scudetto") return "la Liga Portugal 2";
    if (kind === "coppa") return "la Taça de Portugal";
    if (kind === "carabao") return "la Taça da Liga";
    // Un club de la Liga Portugal 2 que gana la Taça de Portugal juega (y puede ganar) la Supertaça.
    if (kind === "supercoppa") return "la Supertaça Cândido de Oliveira";
  }
  if (league === "brasileirao") {
    if (kind === "scudetto") return "el Brasileirão";
    if (kind === "coppa") return "la Copa do Brasil";
    if (kind === "supercoppa") return "la Supercopa do Brasil";
  }
  return TROPHY_NAME[kind];
}
