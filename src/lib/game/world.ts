import { createSeasonAwards } from "./awards";
import {
  ALL_PLAYABLE_LEAGUES,
  BRAZILIAN_IDS,
  CLUBS,
  applyDivisions,
  clubById,
  competitionToLeague,
  currentDivisions,
  domesticCompetition,
  domesticIds,
  emptyLeagueTables,
  emptyStanding,
  argentineCupIds,
  brazilianCupIds,
  germanCupIds,
  frenchCupIds,
  englishCupIds,
  portugueseCupIds,
  spanishCupIds,
  isDomesticCompetition,
  leagueInfo,
  playableLeague,
  startingBudget,
} from "./clubs";
import {
  COMP_THEME,
  QUAL_SPOTS,
  UCL_DIRECT_SPOTS,
  UCL_FINAL_ROUND,
  UCL_LEAGUE_ROUNDS,
  UCL_PLAYOFF_ROUND,
  UCL_PLAYOFF_SPOTS,
  UCL_R16_ROUND,
  UCL_TEAMS,
  UEL_DIRECT_SPOTS,
  UEL_FINAL_ROUND,
  UEL_LEAGUE_ROUNDS,
  UEL_PLAYOFF_ROUND,
  UEL_PLAYOFF_SPOTS,
  UEL_R16_ROUND,
  UEL_TEAMS,
  UECL_DIRECT_SPOTS,
  UECL_FINAL_ROUND,
  UECL_LEAGUE_ROUNDS,
  UECL_PLAYOFF_ROUND,
  UECL_PLAYOFF_SPOTS,
  UECL_POTS,
  UECL_POT_SIZE,
  UECL_R16_ROUND,
  UECL_TEAMS,
  ENGLISH_CUP_SEMI_ROUND,
  carabaoSemiRound,
  carabaoFinalRound,
  coppaFinalRound,
  isSpanishLeague,
  coppaStageLabel,
  englishCupStageLabel,
  finalRoundOf,
  isArgentineLeague,
  isBrazilianLeague,
  isCalendarYearLeague,
  isGermanLeague,
  isFrenchLeague,
  isTwoTierCupLeague,
  isEnglishLeague,
  isPortugueseLeague,
  knockoutRoundLabel,
  supercoppaFinalRound,
  PORTUGUESE_LEAGUE_CUP_LABEL,
} from "./competitions";
import { CONMEBOL_GHOST_IDS, EUROPE_GHOST_IDS } from "./fictional";
import {
  assembleMundial,
  intercontinentalPair,
  mundialR16Pairs,
  isMundialSeason,
  transatlanticaPair,
  MUNDIAL_FINAL_ROUND,
  MUNDIAL_GROUP_ROUNDS,
  MUNDIAL_GROUPS,
  mundialStageName,
} from "./mundial";
import { penaltyWinner } from "./knockout";
import { seedAcademy } from "./academy";
import { ensureTerms, titleBonusTotal } from "./contracts";
import { createEventState } from "./events";
import { seedFreeAgents } from "./free-agents";
import { historicalFor, trophyLabel, type HonourKind } from "./honours";
import { trophyName, trophyPrize } from "./prizes";
import { Rng } from "./rng";
import { creditTitleIdolatry } from "./player-relations";
import {
  SAUDI_KINGS_CUP_CONFIG,
  SAUDI_SUPER_CUP_DATES,
  saudiSuperCupTeams,
} from "./saudi-cups";
import { sponsorTitleBonus } from "./sponsors";
import { addNewGen11, NEW_GEN_11 } from "./new-gen";
import { buildSquad, plantHiddenGems } from "./squads";
import { pickBench, pickXi } from "./tactics";
import { formatMoney, uid } from "./format";
import type {
  CalendarSlot,
  ClubId,
  Competition,
  Fixture,
  GameSave,
  LeagueKind,
  LeagueTables,
  NewsItem,
  PlayableLeagueId,
  Standing,
} from "./types";

function roundRobin(ids: string[]): Array<Array<[string, string]>> {
  const teams = [...ids];
  if (teams.length % 2 === 1) teams.push("bye");
  const n = teams.length;
  const half = n / 2;
  const rounds: Array<Array<[string, string]>> = [];
  const arr = [...teams];
  for (let r = 0; r < n - 1; r++) {
    const matches: Array<[string, string]> = [];
    for (let i = 0; i < half; i++) {
      const a = arr[i]!;
      const b = arr[n - 1 - i]!;
      if (a === "bye" || b === "bye") continue;
      if (r % 2 === 0) matches.push([a, b]);
      else matches.push([b, a]);
    }
    rounds.push(matches);
    const last = arr.pop()!;
    arr.splice(1, 0, last);
  }
  return rounds;
}

function mlsSchedule(ids: string[]): Array<Array<[string, string]>> {
  const eastern = ids.filter((id) => clubById(id).conference === "Eastern");
  const western = ids.filter((id) => clubById(id).conference === "Western");
  const makeDouble = (teams: string[]) => {
    const first = roundRobin(teams);
    return [...first, ...first.map((round) => round.map(([home, away]) => [away, home] as [string, string]))];
  };
  const eastRounds = makeDouble(eastern);
  const westRounds = makeDouble(western);
  const rounds: Array<Array<[string, string]>> = [];

  for (let i = 0; i < Math.max(eastRounds.length, westRounds.length); i++) {
    rounds.push([...(eastRounds[i] ?? []), ...(westRounds[i] ?? [])]);
  }

  for (let shift = 0; shift < 6; shift++) {
    const interconference: Array<[string, string]> = [];
    eastern.forEach((east, i) => {
      const west = western[(i + shift) % western.length]!;
      interconference.push(shift % 2 === 0 ? [east, west] : [west, east]);
    });
    rounds.push(interconference);
  }
  return rounds;
}

function uslSchedule(ids: string[]): Array<Array<[string, string]>> {
  const first = roundRobin(ids);
  const extraLegs = first.slice(0, 6).map((round) => round.map(([home, away]) => [away, home] as [string, string]));
  const counts = new Map(ids.map((id) => [id, 0]));
  for (const round of [...first, ...extraLegs]) {
    for (const [home, away] of round) {
      counts.set(home, counts.get(home)! + 1);
      counts.set(away, counts.get(away)! + 1);
    }
  }
  const needOneMore = ids.filter((id) => counts.get(id) === 29);
  const finalRound: Array<[string, string]> = [];
  for (let i = 0; i < needOneMore.length; i += 2) {
    finalRound.push([needOneMore[i]!, needOneMore[i + 1]!]);
  }
  return [...first, ...extraLegs, finalRound];
}

function addFixture(
  fixtures: Fixture[],
  competition: Fixture["competition"],
  round: number,
  homeId: string,
  awayId: string,
  extra?: { leg?: 1 | 2; tieId?: string },
) {
  const id = `${competition}-${round}-${homeId}-${awayId}-${fixtures.length}`;
  fixtures.push({
    id,
    competition,
    round,
    homeId,
    awayId,
    played: false,
    leg: extra?.leg,
    tieId: extra?.tieId,
  });
  return id;
}

function isoDate(year: number, month: number, day: number) {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function rankedByPrestige(ids: string[]) {
  return [...ids].sort((a, b) => clubById(b).prestige - clubById(a).prestige);
}

export function qualifyContinentals(tables: LeagueTables): {
  ucl: string[];
  uel: string[];
  uecl: string[];
} {
  const ucl: string[] = [];
  const uel: string[] = [];
  const uecl: string[] = [];
  for (const league of ALL_PLAYABLE_LEAGUES) {
    const spots = QUAL_SPOTS[league];
    if (!spots.ucl && !spots.uel && !spots.uecl) continue;
    const ranked = sortTable(tables[league] ?? []).map((r) => r.clubId);
    if (!ranked.length) {
      ranked.push(...rankedByPrestige(domesticIds(league)));
    }
    ucl.push(...ranked.slice(0, spots.ucl));
    uel.push(...ranked.slice(spots.ucl, spots.ucl + spots.uel));
    uecl.push(...ranked.slice(spots.ucl + spots.uel, spots.ucl + spots.uel + spots.uecl));
  }
  return { ucl, uel, uecl };
}

/**
 * Argentina: Libertadores = 1°, 2°, 3° + campeón de Copa Argentina (si ya está entre los 3 primeros entra el 4°).
 * Sudamericana = los 6 mejores siguientes de la tabla que no hayan clasificado a Libertadores.
 */
export function qualifyArgentina(
  table: Standing[],
  coppaWinner: string | null,
): { lib: string[]; sud: string[] } {
  const ranked = (table.length ? sortTable(table) : []).map((r) => r.clubId);
  const ids = ranked.length ? ranked : rankedByPrestige(domesticIds("argentina"));
  const argSet = new Set(domesticIds("argentina"));
  const copa = coppaWinner && argSet.has(coppaWinner) ? coppaWinner : null;
  const lib: string[] = [];
  for (const id of ids.slice(0, 3)) lib.push(id);
  if (copa && !lib.includes(copa)) lib.push(copa);
  for (const id of ids) {
    if (lib.length >= 4) break;
    if (!lib.includes(id)) lib.push(id);
  }
  const sud: string[] = [];
  for (const id of ids) {
    if (sud.length >= 6) break;
    if (!lib.includes(id)) sud.push(id);
  }
  return { lib, sud };
}

/**
 * Brasil (Brasileirão 2026): Libertadores = los 5 primeros de la tabla + el campeón de la Copa do Brasil (si ya está
 * entre los 5 primeros entra el 6.º), 6 plazas en total. Sudamericana = los 8 mejores siguientes que no hayan
 * clasificado a Libertadores. Sin tabla todavía (partida nueva) se ordena por prestigio.
 */
export function qualifyBrazil(
  table: Standing[],
  copaWinner: string | null,
): { lib: string[]; sud: string[] } {
  const ranked = (table.length ? sortTable(table) : []).map((r) => r.clubId);
  const ids = ranked.length ? ranked : rankedByPrestige(domesticIds("brasileirao"));
  // Cualquier club brasileño puede ganar la Copa do Brasil y obtener su plaza continental.
  const brSet = new Set(BRAZILIAN_IDS);
  const copa = copaWinner && brSet.has(copaWinner) ? copaWinner : null;
  const lib: string[] = ids.slice(0, 5);
  if (copa && !lib.includes(copa)) lib.push(copa);
  for (const id of ids) {
    if (lib.length >= 6) break;
    if (!lib.includes(id)) lib.push(id);
  }
  const sud: string[] = [];
  for (const id of ids) {
    if (sud.length >= 8) break;
    if (!lib.includes(id)) sud.push(id);
  }
  return { lib, sud };
}

function conmebolFillIds() {
  // Argentina y Brasil tienen liga propia: sus clubes entran por la tabla, no como relleno.
  return CONMEBOL_GHOST_IDS.filter((id) => {
    const country = clubById(id).country;
    return country !== "ARG" && country !== "BRA";
  });
}

export function seedQualifiersFromPrestige() {
  const tables = emptyLeagueTables();
  for (const league of ALL_PLAYABLE_LEAGUES) {
    const ranked = rankedByPrestige(domesticIds(league));
    tables[league] = ranked.map((id, i) => ({
      ...emptyStanding(id),
      pts: Math.max(0, 90 - i * 3),
    }));
  }
  return qualifyContinentals(tables);
}

function fillExclusive(base: string[], pool: string[], need: number, used: Set<string>) {
  const out = [...base];
  for (const id of pool) {
    if (out.length >= need) break;
    if (used.has(id) || out.includes(id)) continue;
    out.push(id);
    used.add(id);
  }
  return out.slice(0, need);
}

/**
 * Champions League 2026/27: los 36 participantes juegan una única fase de liga.
 * `uclGroups` conserva su nombre por compatibilidad con partidas y pantallas, pero ahora contiene UN solo
 * bloque con los 36 equipos (`[[...36 ids]]`): es la tabla única de la fase de liga.
 */
export function makeUclGroups(teams: string[], rng: Rng): string[][] {
  const list = rng.shuffle(teams).slice(0, UCL_TEAMS);
  while (list.length < UCL_TEAMS) {
    const extra = EUROPE_GHOST_IDS.find((id) => !list.includes(id));
    if (!extra) break;
    list.push(extra);
  }
  return list.length === UCL_TEAMS ? [list] : [];
}

/**
 * Sorteo de la fase de liga: 8 jornadas, cada equipo juega 8 partidos contra 8 rivales distintos,
 * 4 de local y 4 de visitante. Se eligen 8 rondas distintas de un round-robin completo (cada ronda es un
 * emparejamiento perfecto, así todos juegan en todas las jornadas) y se orienta cada cruce con recorridos
 * eulerianos: en un grafo donde todos tienen grado 8, cada equipo termina con 4 salidas (local) y 4 entradas (visita).
 */
export function buildUclLeaguePhase(teams: string[], rng: Rng): Array<Array<[string, string]>> {
  const ids = rng.shuffle(teams);
  const all = roundRobin(ids); // n - 1 rondas, cada una con n / 2 partidos
  const chosen = rng.shuffle(all.map((_, i) => i)).slice(0, UCL_LEAGUE_ROUNDS).sort((a, b) => a - b);
  const edges: Array<{ r: number; a: string; b: string; used: boolean }> = [];
  const adj = new Map<string, number[]>();
  chosen.forEach((ri, r) => {
    for (const [a, b] of all[ri]!) {
      const idx = edges.push({ r, a, b, used: false }) - 1;
      adj.set(a, [...(adj.get(a) ?? []), idx]);
      adj.set(b, [...(adj.get(b) ?? []), idx]);
    }
  });
  const rounds: Array<Array<[string, string]>> = Array.from({ length: UCL_LEAGUE_ROUNDS }, () => []);
  for (const start of ids) {
    // Recorrido cerrado desde `start`: cada paso v → w deja a v de local contra w.
    for (;;) {
      let v = start;
      let moved = false;
      for (;;) {
        const next = (adj.get(v) ?? []).find((e) => !edges[e]!.used);
        if (next === undefined) break;
        const e = edges[next]!;
        e.used = true;
        const w = e.a === v ? e.b : e.a;
        rounds[e.r]!.push([v, w]);
        v = w;
        moved = true;
      }
      if (!moved) break;
    }
  }
  return rounds;
}

/** Tabla de la fase de liga ordenada por puntos y diferencia de gol. */
export function uclLeagueRanking(save: GameSave): string[] {
  return sortTable(save.uclStandings ?? []).map((r) => r.clubId);
}

/** Tabla de la fase de liga de la Europa League ordenada por puntos y diferencia de gol. */
export function uelLeagueRanking(save: GameSave): string[] {
  return sortTable(save.uelStandings ?? []).map((r) => r.clubId);
}

/**
 * Sorteo de la fase de liga de la Europa League: mismo método que la Champions (8 jornadas, 8 rivales distintos,
 * 4 de local y 4 de visitante por equipo). Tiene las mismas 8 jornadas, así que reutiliza el generador.
 */
export function buildUelLeaguePhase(teams: string[], rng: Rng): Array<Array<[string, string]>> {
  return buildUclLeaguePhase(teams, rng);
}

/** Tabla de la fase de liga de la Conference League ordenada por puntos y diferencia de gol. */
export function ueclLeagueRanking(save: GameSave): string[] {
  return sortTable(save.ueclStandings ?? []).map((r) => r.clubId);
}

/** Asociación (país) de un club para evitar cruces entre equipos del mismo país. */
function associationOf(id: string): string {
  const c = clubById(id);
  return c.country ?? c.league;
}

/**
 * Bombos de la Conference League: los 36 equipos ordenados por prestigio (con sorteo en los empates)
 * y repartidos en 6 bombos de 6. El Bombo 1 tiene a los 6 de mayor prestigio y el Bombo 6 a los 6 de menor.
 */
export function makeUeclPots(teams: string[], rng: Rng): string[][] {
  const shuffled = rng.shuffle(teams).slice(0, UECL_TEAMS);
  const ranked = [...shuffled].sort((a, b) => clubById(b).prestige - clubById(a).prestige);
  const pots: string[][] = [];
  for (let i = 0; i < UECL_POTS; i++) pots.push(ranked.slice(i * UECL_POT_SIZE, (i + 1) * UECL_POT_SIZE));
  return pots;
}

/** Emparejamiento perfecto (por permutación) entre dos listas de igual tamaño minimizando choques de asociación. */
function bestBijection(a: string[], b: string[], rng: Rng): string[] {
  const clash = (perm: string[]) => perm.reduce((n, id, i) => n + (associationOf(a[i]!) === associationOf(id) ? 1 : 0), 0);
  let best = rng.shuffle(b);
  let bestScore = clash(best);
  for (let attempt = 0; attempt < 60 && bestScore > 0; attempt++) {
    const cand = rng.shuffle(b);
    // Mejora local: intercambios que reduzcan los choques.
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < cand.length; i++) {
        if (associationOf(a[i]!) !== associationOf(cand[i]!)) continue;
        for (let j = 0; j < cand.length; j++) {
          if (j === i) continue;
          const okI = associationOf(a[i]!) !== associationOf(cand[j]!);
          const okJ = associationOf(a[j]!) !== associationOf(cand[i]!);
          if (okI && okJ) {
            [cand[i], cand[j]] = [cand[j]!, cand[i]!];
            break;
          }
        }
      }
    }
    const score = clash(cand);
    if (score < bestScore) {
      best = cand;
      bestScore = score;
    }
  }
  return best;
}

/** Emparejamiento perfecto dentro de un bombo (3 cruces de 6 equipos) minimizando choques de asociación. */
function bestPotMatching(pot: string[], rng: Rng): Array<[string, string]> {
  let best: Array<[string, string]> = [];
  let bestScore = Infinity;
  for (let attempt = 0; attempt < 80 && bestScore > 0; attempt++) {
    const order = rng.shuffle(pot);
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < order.length; i += 2) pairs.push([order[i]!, order[i + 1]!]);
    const score = pairs.reduce((n, [x, y]) => n + (associationOf(x) === associationOf(y) ? 1 : 0), 0);
    if (score < bestScore) {
      best = pairs;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Sorteo de la fase de liga de la Conference League: 36 equipos en 6 bombos de 6, 6 jornadas.
 * Cada equipo juega 6 partidos contra 6 rivales DISTINTOS: uno de cada bombo (uno de su propio bombo y uno de cada
 * uno de los otros cinco). Evita cruces entre equipos de la misma asociación cuando es posible.
 *
 * Construcción: las jornadas 1–5 enfrentan a los bombos de a pares (circle method sobre 6 bombos, así todos los
 * bombos se cruzan una sola vez) y la jornada 6 enfrenta a cada equipo con otro de su mismo bombo. Cada jornada es un
 * emparejamiento perfecto (todos juegan en todas las jornadas). La localía se reparte con recorridos eulerianos
 * (grado 6 en todos los equipos): cada equipo termina con exactamente 3 partidos de local y 3 de visitante.
 */
export function buildUeclLeaguePhase(teams: string[], rng: Rng): Array<Array<[string, string]>> {
  const pots = makeUeclPots(teams, rng);
  if (pots.length !== UECL_POTS || pots.some((p) => p.length !== UECL_POT_SIZE)) return [];

  // Rondas de bombos (circle method): 5 rondas de 3 pares de bombos.
  const potIdx = rng.shuffle(pots.map((_, i) => i));
  const fixed = potIdx[0]!;
  const rest = potIdx.slice(1);
  const potRounds: Array<Array<[number, number]>> = [];
  for (let r = 0; r < UECL_POTS - 1; r++) {
    const ring = [fixed, ...rest];
    const pairs: Array<[number, number]> = [];
    for (let i = 0; i < UECL_POTS / 2; i++) pairs.push([ring[i]!, ring[UECL_POTS - 1 - i]!]);
    potRounds.push(pairs);
    rest.unshift(rest.pop()!);
  }

  // Partidos sin localía definida, agrupados por jornada.
  const undirected: Array<Array<[string, string]>> = [];
  for (const pairs of potRounds) {
    const round: Array<[string, string]> = [];
    for (const [pa, pb] of pairs) {
      const a = pots[pa]!;
      const b = pots[pb]!;
      const perm = bestBijection(a, b, rng);
      for (let i = 0; i < a.length; i++) round.push([a[i]!, perm[i]!]);
    }
    undirected.push(round);
  }
  const intra: Array<[string, string]> = [];
  for (const pot of pots) intra.push(...bestPotMatching(pot, rng));
  undirected.push(intra);

  // Localía: recorridos eulerianos sobre el grafo completo de partidos (grado 6 en cada equipo).
  const ids = rng.shuffle(teams.slice(0, UECL_TEAMS));
  const edges: Array<{ r: number; a: string; b: string; used: boolean }> = [];
  const adj = new Map<string, number[]>();
  undirected.forEach((round, r) => {
    for (const [a, b] of round) {
      const idx = edges.push({ r, a, b, used: false }) - 1;
      adj.set(a, [...(adj.get(a) ?? []), idx]);
      adj.set(b, [...(adj.get(b) ?? []), idx]);
    }
  });
  const rounds: Array<Array<[string, string]>> = Array.from({ length: UECL_LEAGUE_ROUNDS }, () => []);
  for (const start of ids) {
    for (;;) {
      let v = start;
      let moved = false;
      for (;;) {
        const next = (adj.get(v) ?? []).find((e) => !edges[e]!.used);
        if (next === undefined) break;
        const e = edges[next]!;
        e.used = true;
        const w = e.a === v ? e.b : e.a;
        rounds[e.r]!.push([v, w]); // v juega de local contra w
        v = w;
        moved = true;
      }
      if (!moved) break;
    }
  }
  return rounds;
}

/** Cupos por país de relleno en Libertadores y Sudamericana (Argentina y Brasil entran por su tabla, no por cupo). */
const LIB_QUOTA: Array<[string, number]> = [
  ["COL", 3],
  ["CHI", 3],
  ["PAR", 3],
  ["ECU", 3],
  ["BOL", 3],
  ["URU", 2],
  ["PER", 2],
  ["VEN", 2],
];
const SUD_QUOTA: Array<[string, number]> = [
  ["COL", 1],
  ["CHI", 1],
  ["PAR", 1],
  ["ECU", 1],
  ["URU", 1],
  ["PER", 1],
  ["BOL", 1],
  ["VEN", 1],
];

/**
 * Elige `need` clubes sudamericanos (no argentinos) respetando cupos por país. Dentro de cada país
 * manda el prestigio con un poco de azar, así la lista rota de una temporada a otra.
 */
function pickConmebol(need: number, quota: Array<[string, number]>, taken: Set<string>, rng: Rng): string[] {
  const noisy = new Map<string, number>();
  for (const id of conmebolFillIds()) noisy.set(id, clubById(id).prestige + rng.int(-5, 5));
  const byCountry = new Map<string, string[]>();
  for (const id of [...noisy.keys()].sort((a, b) => noisy.get(b)! - noisy.get(a)!)) {
    if (taken.has(id)) continue;
    const c = clubById(id).country ?? "";
    byCountry.set(c, [...(byCountry.get(c) ?? []), id]);
  }
  const out: string[] = [];
  const count = new Map<string, number>();
  let progressed = true;
  while (out.length < need && progressed) {
    progressed = false;
    for (const [country, max] of quota) {
      if (out.length >= need) break;
      if ((count.get(country) ?? 0) >= max) continue;
      const next = byCountry.get(country)?.shift();
      if (!next) continue;
      out.push(next);
      count.set(country, (count.get(country) ?? 0) + 1);
      progressed = true;
    }
  }
  if (out.length < need) {
    const rest = [...byCountry.values()].flat().sort((a, b) => noisy.get(b)! - noisy.get(a)!);
    for (const id of rest) {
      if (out.length >= need) break;
      out.push(id);
    }
  }
  return out;
}

export function makeLibGroups(seeded: string[], rng: Rng): string[][] {
  const used = new Set(seeded);
  const list = [...seeded];
  for (const id of pickConmebol(32 - list.length, LIB_QUOTA, used, rng)) {
    if (list.length >= 32) break;
    if (used.has(id)) continue;
    list.push(id);
    used.add(id);
  }
  while (list.length < 32) {
    const extra = CONMEBOL_GHOST_IDS.find((id) => !used.has(id));
    if (!extra) break;
    list.push(extra);
    used.add(extra);
  }
  const shuffled = rng.shuffle(list).slice(0, 32);
  const groups: string[][] = [];
  for (let i = 0; i < 8; i++) groups.push(shuffled.slice(i * 4, i * 4 + 4));
  return groups.filter((g) => g.length === 4);
}

export function assembleContinentals(
  fromTables: LeagueTables,
  rng: Rng,
  coppaWinner: string | null = null,
): {
  uclGroups: string[][];
  uelTeams: string[];
  ueclTeams: string[];
  libGroups: string[][];
  sudTeams: string[];
} {
  const q = qualifyContinentals(fromTables);
  const used = new Set<string>([...q.ucl, ...q.uel, ...q.uecl]);
  const europePool = rankedByPrestige([
    ...EUROPE_GHOST_IDS,
    ...CLUBS.filter((c) => c.league === "europe").map((c) => c.id),
  ]);
  const ucl = fillExclusive(q.ucl, europePool, UCL_TEAMS, used);
  const uclGroups = makeUclGroups(ucl, rng);

  // Un club solo puede estar en UNA copa continental a la vez: lo que ya juega Champions
  // (incluidos los equipos de relleno) no puede aparecer en Europa League ni Conference.
  const taken = new Set<string>(uclGroups.flat());
  const onlyFree = (ids: string[]) => ids.filter((id) => !taken.has(id));
  const uelBase = onlyFree(q.uel);
  uelBase.forEach((id) => taken.add(id));
  const reservedForConference = new Set(q.uecl);
  // Europa League 2026/27: 36 equipos (los clasificados por tabla + relleno hasta completar los 36).
  const uel = fillExclusive(
    uelBase,
    europePool.filter((id) => !taken.has(id) && !reservedForConference.has(id)),
    UEL_TEAMS,
    new Set(taken),
  );
  uel.forEach((id) => taken.add(id));
  const ueclBase = onlyFree(q.uecl);
  ueclBase.forEach((id) => taken.add(id));
  // Conference League 2026/27: 36 equipos (los clasificados por tabla + relleno hasta completar los 36).
  const uecl = fillExclusive(ueclBase, europePool.filter((id) => !taken.has(id)), UECL_TEAMS, new Set(taken));
  uecl.forEach((id) => taken.add(id));

  const arg = qualifyArgentina(fromTables.argentina ?? [], coppaWinner);
  const bra = qualifyBrazil(fromTables.brasileirao ?? [], coppaWinner);
  const southLib = [...arg.lib, ...bra.lib];
  const southSud = [...arg.sud, ...bra.sud];
  southLib.forEach((id) => taken.add(id));
  southSud.forEach((id) => taken.add(id));
  const libGroups = makeLibGroups(southLib, rng);
  const libFlat = new Set(libGroups.flat());
  const sudBase = southSud.filter((id) => !libFlat.has(id));
  const sudTaken = new Set<string>([...libFlat, ...sudBase]);
  const sudTeams = [...sudBase, ...pickConmebol(16 - sudBase.length, SUD_QUOTA, sudTaken, rng)].slice(0, 16);
  return {
    uclGroups,
    uelTeams: rng.shuffle(uel).slice(0, UEL_TEAMS),
    ueclTeams: rng.shuffle(uecl).slice(0, UECL_TEAMS),
    libGroups,
    sudTeams: rng.shuffle(sudTeams).slice(0, 16),
  };
}

function pair(ids: string[]): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (let i = 0; i < ids.length; i += 2) {
    const a = ids[i];
    const b = ids[i + 1];
    if (a && b) out.push([a, b]);
  }
  return out;
}

function addTwoLegged(
  fixtures: Fixture[],
  competition: Competition,
  round: number,
  pairs: Array<[string, string]>,
) {
  const ida: string[] = [];
  const vuelta: string[] = [];
  for (const [h, a] of pairs) {
    const tieId = uid("tie");
    ida.push(addFixture(fixtures, competition, round, h, a, { leg: 1, tieId }));
    vuelta.push(addFixture(fixtures, competition, round, a, h, { leg: 2, tieId }));
  }
  return { ida, vuelta };
}

export function buildSeasonSchedule(opts: {
  clubId: ClubId;
  seed: number;
  season: number;
  uclGroups: string[][];
  uelTeams: string[];
  ueclTeams: string[];
  libGroups: string[][];
  sudTeams: string[];
  supercoppa?: [string, string] | null;
  supercoppaFour?: string[] | null;
  saudiSuperCupFour?: string[] | null;
  saudiKingsCupEntrants?: string[] | null;
  saudiKingsCupWeeks?: number[];
  /** Cuatro clasificados de la Série C; al crear partida se usan los cuatro de mayor prestigio. */
  brazilianCupQualifiers?: string[];
  mundialGroups?: string[][];
  intercontinental?: [string, string] | null;
  transatlantica?: [string, string] | null;
}): { fixtures: Fixture[]; calendar: CalendarSlot[] } {
  const rng = new Rng(opts.seed);
  const fixtures: Fixture[] = [];
  const calendar: CalendarSlot[] = [];
  const league = clubById(opts.clubId).league;
  const leagueComp = domesticCompetition(league);
  const info = leagueInfo(league);
  const year = opts.season;

  const leagueRounds = {} as Record<PlayableLeagueId, Array<Array<[string, string]>>>;
  let maxMd = 0;
  for (const lg of ALL_PLAYABLE_LEAGUES) {
    const ids = domesticIds(lg);
    if (lg === "mls") {
      leagueRounds[lg] = mlsSchedule(ids);
    } else if (lg === "uslChampionship") {
      leagueRounds[lg] = uslSchedule(ids);
    } else {
      const first = roundRobin(ids);
      const second = first.map((round) => round.map(([a, b]) => [b, a] as [string, string]));
      leagueRounds[lg] = [...first, ...second];
    }
    maxMd = Math.max(maxMd, leagueRounds[lg].length);
  }

  const pushSlot = (
    competition: CalendarSlot["competition"],
    round: number,
    title: string,
    ids: string[],
    date: string,
    extra?: { leg?: 1 | 2; byes?: string[] },
  ) => {
    calendar.push({
      id: `${competition}-${round}-${extra?.leg ?? 0}-${calendar.length}`,
      competition,
      round,
      title,
      fixtures: ids,
      date,
      leg: extra?.leg,
      byes: extra?.byes,
    });
  };

  const argentine = isArgentineLeague(league);
  const saudiLeague = league === "saudiProLeague" || league === "saudiFirstDivision";
  const saudiSuperCupFour =
    saudiLeague && opts.saudiSuperCupFour?.length === 4 ? rng.shuffle(opts.saudiSuperCupFour) : [];
  const saudiSuperCupSemis =
    saudiSuperCupFour.length === 4
      ? pair(saudiSuperCupFour).map(([home, away]) => addFixture(fixtures, "saudiSuperCup", 1, home, away))
      : [];
  const saudiKingsCupEntrants =
    saudiLeague && opts.saudiKingsCupEntrants ? [...opts.saudiKingsCupEntrants] : [];
  const saudiKingsCupByes =
    saudiKingsCupEntrants.length &&
    opts.saudiKingsCupWeeks?.length
      ? [...new Set(SAUDI_KINGS_CUP_CONFIG.firstRoundByes)].filter((id) => saudiKingsCupEntrants.includes(id))
      : [];
  const saudiKingsCupFirstRoundClubs = saudiKingsCupEntrants.filter((id) => !saudiKingsCupByes.includes(id));
  const saudiKingsCupRoundWeeks = opts.saudiKingsCupWeeks ?? SAUDI_KINGS_CUP_CONFIG.roundWeeks;
  const saudiKingsCupRoundOne =
    saudiKingsCupEntrants.length >= 2 &&
    saudiKingsCupRoundWeeks.length > 0 &&
    saudiKingsCupFirstRoundClubs.length % 2 === 0 &&
    saudiKingsCupByes.length + saudiKingsCupFirstRoundClubs.length / 2 === 2 ** (saudiKingsCupRoundWeeks.length - 1)
      ? pair(rng.shuffle(saudiKingsCupFirstRoundClubs)).map(([home, away]) => addFixture(fixtures, "kingsCup", 1, home, away))
      : [];
  const superCupDates = {
    firstSemifinal: SAUDI_SUPER_CUP_DATES.firstSemifinal(year),
    secondSemifinal: SAUDI_SUPER_CUP_DATES.secondSemifinal(year),
    final: SAUDI_SUPER_CUP_DATES.final(year),
  };
  let saudiSuperCupScheduled = false;
  let saudiSuperCupFinalScheduled = false;
  // Argentina y Brasil juegan por año natural (arrancan en febrero): mismas fechas.
  const calYear = isCalendarYearLeague(league);
  let cursorDate = isoDate(year, calYear ? 2 : 8, calYear ? 7 : 9);
  let fifaDate = isoDate(year, calYear ? 1 : 6, calYear ? 10 : 15);

  if (opts.intercontinental) {
    const [h, a] = opts.intercontinental;
    pushSlot(
      "intercontinental",
      1,
      "Copa Intercontinental",
      [addFixture(fixtures, "intercontinental", 1, h, a)],
      fifaDate,
    );
    fifaDate = addDays(fifaDate, 4);
  }
  if (opts.transatlantica) {
    const [h, a] = opts.transatlantica;
    pushSlot(
      "transatlantica",
      1,
      "Copa Transatlántica",
      [addFixture(fixtures, "transatlantica", 1, h, a)],
      fifaDate,
    );
    fifaDate = addDays(fifaDate, 4);
  }
  if ((opts.mundialGroups ?? []).length === MUNDIAL_GROUPS) {
    const groupSlots: string[][] = Array.from({ length: MUNDIAL_GROUP_ROUNDS }, () => []);
    for (const group of opts.mundialGroups ?? []) {
      roundRobin(group).forEach((matches, i) => {
        for (const [h, a] of matches) {
          groupSlots[i]!.push(addFixture(fixtures, "mundial", i + 1, h, a));
        }
      });
    }
    for (let r = 1; r <= MUNDIAL_GROUP_ROUNDS; r++) {
      pushSlot("mundial", r, `Mundial de Clubes · ${mundialStageName(r)}`, groupSlots[r - 1] ?? [], fifaDate);
      fifaDate = addDays(fifaDate, 4);
    }
    for (let r = MUNDIAL_GROUP_ROUNDS + 1; r <= MUNDIAL_FINAL_ROUND; r++) {
      pushSlot("mundial", r, `Mundial de Clubes · ${mundialStageName(r)}`, [], fifaDate);
      fifaDate = addDays(fifaDate, 4);
    }
  }

  if (opts.supercoppaFour && opts.supercoppaFour.length >= 4) {
    const four = rng.shuffle(opts.supercoppaFour.slice(0, 4));
    const semiIds = pair(four).map(([h, a]) => addFixture(fixtures, "supercoppa", 1, h, a));
    pushSlot("supercoppa", 1, `${info.superCup} · Semifinales`, semiIds, cursorDate);
    cursorDate = addDays(cursorDate, 7);
    pushSlot("supercoppa", 2, `${info.superCup} · Final`, [], cursorDate);
    cursorDate = addDays(cursorDate, 7);
  } else if (opts.supercoppa) {
    const [h, a] = opts.supercoppa;
    pushSlot(
      "supercoppa",
      1,
      info.superCup,
      [addFixture(fixtures, "supercoppa", 1, h, a)],
      cursorDate,
    );
    cursorDate = addDays(cursorDate, 7);
  }

  // Champions: una única fase de liga de 36 equipos, 8 jornadas.
  const uclLeagueSlots: string[][] = Array.from({ length: UCL_LEAGUE_ROUNDS }, () => []);
  const uclTeams = opts.uclGroups.flat();
  if (uclTeams.length === UCL_TEAMS) {
    buildUclLeaguePhase(uclTeams, rng).forEach((matches, i) => {
      for (const [h, a] of matches) uclLeagueSlots[i]!.push(addFixture(fixtures, "ucl", i + 1, h, a));
    });
  }
  // Europa League: una única fase de liga de 36 equipos, 8 jornadas (mismo formato que la Champions).
  // Usa su propio generador aleatorio para no alterar los sorteos de las demás competiciones.
  const uelLeagueSlots: string[][] = Array.from({ length: UEL_LEAGUE_ROUNDS }, () => []);
  if (opts.uelTeams.length === UEL_TEAMS) {
    buildUelLeaguePhase(opts.uelTeams, new Rng(opts.seed + 7001)).forEach((matches, i) => {
      for (const [h, a] of matches) uelLeagueSlots[i]!.push(addFixture(fixtures, "uel", i + 1, h, a));
    });
  }
  const libGroupSlots: string[][] = Array.from({ length: 6 }, () => []);
  for (const group of opts.libGroups) {
    const rr = roundRobin(group);
    rr.forEach((matches, i) => {
      for (const [h, a] of matches) {
        libGroupSlots[i]!.push(addFixture(fixtures, "libertadores", i + 1, h, a));
      }
    });
  }

  const english = isEnglishLeague(league);
  const german = isGermanLeague(league);
  const french = isFrenchLeague(league);
  const domestic = domesticIds(league);
  // Premier y Championship comparten FA Cup y Carabao Cup (44 clubes), cada una con su propio sorteo.
  // Bundesliga y 2. Bundesliga comparten la DFB-Pokal (36 clubes): ronda previa de 8 clubes de la 2. Bundesliga y
  // dieciseisavos con los 32 restantes (los 18 de la Bundesliga entran directo).
  // Segunda: su copa conserva un cuadro de 16 (octavos a final) hasta que llegue la Copa del Rey completa.
  // Copa Argentina: desde la Liga Profesional hasta la Quinta División; el Promocional Amateur queda excluido.
  const coppaPool = league === "segunda" || league === "primeraFed1" || league === "primeraFed2" ? rankedByPrestige(domestic).slice(0, 16) : domestic;
  // Copa do Brasil: Série A + Série B y cuatro clasificados de Série C (ver drawBrazilianCup).
  const brazilian = isBrazilianLeague(league);
  // Taça de Portugal y Taça da Liga: Primeira Liga + Liga Portugal 2, sin equipos B (ver drawPortugueseCup).
  const portuguese = isPortugueseLeague(league);
  // Copa del Rey: LaLiga + Hypermotion + 21 clubes de Primera Federación (ver drawSpanishCup).
  const spanish = isSpanishLeague(league);
  // La League One juega la FA Cup y la Carabao Cup junto con la Premier y la Championship (68 clubes, 7 rondas).
  // La 3. Liga no juega copas en este modo (la DFB-Pokal es solo Bundesliga + 2. Bundesliga): solo su liga.
  const noCups =
    league === "bundesliga3" ||
    league === "promocionalAmateur" ||
    league === "mls" ||
    league === "uslChampionship" ||
    league === "saudiProLeague" ||
    league === "saudiFirstDivision";
  const coppaDraw: { firstRound: Array<[string, string]>; byes: string[] } = noCups
    ? { firstRound: [], byes: [] }
    : english
    ? drawEnglishCup(rng)
    : german
      ? drawGermanCup(rng)
      : french
        ? drawFrenchCup(rng)
        : portuguese
        ? drawPortugueseCup(rng)
        : spanish
        ? drawSpanishCup(rng)
        : argentine
        ? drawArgentineCup(rng)
        : brazilian
        ? drawBrazilianCup(rng, opts.brazilianCupQualifiers)
        : drawCoppa(opts.clubId, coppaPool, rng);
  const coppaR1 = coppaDraw.firstRound.map(([h, a]) => addFixture(fixtures, "coppa", 1, h, a));
  // Copa de liga: Carabao Cup (Inglaterra) o Taça da Liga (Portugal), cada una con su propio sorteo.
  const carabaoDraw = english
    ? drawEnglishCup(new Rng(opts.seed + 7301))
    : portuguese
      ? drawPortugueseCup(new Rng(opts.seed + 7301))
      : null;
  const carabaoR1 = carabaoDraw
    ? carabaoDraw.firstRound.map(([h, a]) => addFixture(fixtures, "carabao", 1, h, a))
    : [];

  // Conference League: una única fase de liga de 36 equipos con 6 bombos, 6 jornadas.
  // Usa su propio generador aleatorio para no alterar los sorteos de las demás competiciones.
  const ueclLeagueSlots: string[][] = Array.from({ length: UECL_LEAGUE_ROUNDS }, () => []);
  if (opts.ueclTeams.length === UECL_TEAMS) {
    buildUeclLeaguePhase(opts.ueclTeams, new Rng(opts.seed + 7101)).forEach((matches, i) => {
      for (const [h, a] of matches) ueclLeagueSlots[i]!.push(addFixture(fixtures, "uecl", i + 1, h, a));
    });
  }
  const sudR16 = opts.sudTeams.length >= 16 ? addTwoLegged(fixtures, "sudamericana", 1, pair(opts.sudTeams)) : { ida: [] as string[], vuelta: [] as string[] };

  const libWeeks = [3, 5, 7, 9, 11, 13];
  const uclLeagueWeeks = [3, 5, 7, 9, 11, 13, 15, 17];
  const uclPlayoffIda = 19;
  const uclPlayoffVuelta = 20;
  // Copas inglesas en jornadas libres de Europa: FA Cup (6 rondas) y Carabao Cup (6 rondas, semifinal a ida y vuelta).
  const coppaWeeks = english
    ? [2, 16, 21, 24, 28, 37, 44]
    : german || french || portuguese || spanish
      ? [2, 16, 24, 28, 33, 38]
      : argentine
        ? [4, 9, 14, 21, 30, 40]
        : brazilian
          ? [4, 9, 14, 22, 30, 38]
          : [6, 14, 24, 32];
  const carabaoWeeks = portuguese ? [1, 8, 14, 19] : english ? [1, 10, 18, 25, 29] : [1, 18, 25, 29];
  const carabaoSemiIda = 32;
  const carabaoSemiVuelta = 33;
  const carabaoFinal = 40;
  // Taça da Liga: semifinales y final a partido único (sin ida y vuelta).
  const ptLeagueCupSemi = 23;
  const ptLeagueCupFinal = 27;
  const uclKoIda = [22, 26, 30];
  const uclKoVuelta = [23, 27, 31];
  const uclFinal = 36;
  // Europa League (jueves): fase de liga en las mismas jornadas que la Champions, playoff, octavos, cuartos,
  // semifinales a ida y vuelta y final a partido único una jornada antes que la de la Champions.
  const uelLeagueWeeks = [3, 5, 7, 9, 11, 13, 15, 17];
  const uelPlayoffIda = 19;
  const uelPlayoffVuelta = 20;
  const uelKoIda = [22, 26, 30];
  const uelKoVuelta = [23, 27, 31];
  const uelFinal = 35;
  // Conference (jueves): fase de liga (6 jornadas), playoff, octavos, cuartos y semifinales a ida y vuelta,
  // final a partido único. Sudamericana conserva su calendario de siempre (octavos, cuartos, semifinales y final).
  const ueclLeagueWeeks = [4, 6, 8, 10, 12, 14];
  const ueclPlayoffIda = 19;
  const ueclPlayoffVuelta = 20;
  const ueclKoIda = [22, 26, 30];
  const ueclKoVuelta = [23, 27, 31];
  const ueclFinal = 34;
  const minorIda = [10, 20, 28];
  const minorVuelta = [12, 21, 29];
  const minorFinal = 34;
  const libKoIda = [18, 25, 33];
  const libKoVuelta = [19, 26, 34];
  const libFinal = 37;

  let saturday = isoDate(year, calYear ? 2 : 8, calYear ? 14 : 16);

  for (let md = 1; md <= maxMd; md++) {
    const date = saturday;
    const ids: string[] = [];
    const saudiProIds: string[] = [];
    for (const lg of ALL_PLAYABLE_LEAGUES) {
      const matches = leagueRounds[lg][md - 1];
      if (!matches) continue;
      const comp = domesticCompetition(lg);
      for (const [h, a] of matches) {
        const fixtureId = addFixture(fixtures, comp, md, h, a);
        if (saudiSuperCupFour.length === 4 && lg === "saudiProLeague" && date >= superCupDates.firstSemifinal) {
          saudiProIds.push(fixtureId);
        } else {
          ids.push(fixtureId);
        }
      }
    }
    if (!saudiSuperCupScheduled && saudiSuperCupFour.length === 4 && date >= superCupDates.firstSemifinal) {
      const semiOne = saudiSuperCupSemis[0];
      if (semiOne) pushSlot("saudiSuperCup", 1, "Saudi Super Cup · Semifinal", [semiOne], superCupDates.firstSemifinal);
      saudiSuperCupScheduled = true;
    }
    pushSlot(leagueComp, md, `${info.title} · Jornada ${md}`, ids, date);
    if (!saudiSuperCupFinalScheduled && saudiSuperCupScheduled && saudiSuperCupFour.length === 4) {
      const semiTwo = saudiSuperCupSemis[1];
      if (semiTwo) pushSlot("saudiSuperCup", 1, "Saudi Super Cup · Semifinal", [semiTwo], superCupDates.secondSemifinal);
      pushSlot("saudiSuperCup", 2, "Saudi Super Cup · Final", [], superCupDates.final);
      saudiSuperCupFinalScheduled = true;
    }

    const midweek = addDays(date, 3);
    let saudiKingsCupDate = midweek;
    if (
      saudiKingsCupRoundOne.length > 0 &&
      saudiSuperCupFour.length === 4 &&
      saudiKingsCupDate >= superCupDates.firstSemifinal &&
      saudiKingsCupDate <= superCupDates.final
    ) {
      saudiKingsCupDate = addDays(superCupDates.final, 3);
    }

    if (saudiKingsCupRoundOne.length > 0) {
      saudiKingsCupRoundWeeks.forEach((week, i) => {
        if (md !== week || i >= saudiKingsCupRoundWeeks.length) return;
        const round = i + 1;
        pushSlot(
          "kingsCup",
          round,
          `King's Cup · ${knockoutRoundLabel("kingsCup", round)}`,
          round === 1 ? saudiKingsCupRoundOne : [],
          saudiKingsCupDate,
          round === 2 && saudiKingsCupByes.length ? { byes: saudiKingsCupByes } : undefined,
        );
      });
    }

    const uclLeagueIdx = uclLeagueWeeks.indexOf(md);
    if (uclLeagueIdx >= 0 && uclLeagueSlots[uclLeagueIdx]?.length) {
      pushSlot("ucl", uclLeagueIdx + 1, knockoutRoundLabel("ucl", uclLeagueIdx + 1), uclLeagueSlots[uclLeagueIdx] ?? [], midweek);
    }
    const libIdx = libWeeks.indexOf(md);
    if (libIdx >= 0 && libGroupSlots[libIdx]?.length) {
      pushSlot(
        "libertadores",
        libIdx + 1,
        knockoutRoundLabel("libertadores", libIdx + 1),
        libGroupSlots[libIdx] ?? [],
        addDays(midweek, 1),
      );
    }

    coppaWeeks.forEach((week, i) => {
      if (noCups || md !== week) return;
      const round = i + 1;
      const title = `${info.cup} · ${coppaStageLabel(league, round)}`;
      if (round === 1) {
        pushSlot("coppa", 1, title, coppaR1, midweek);
      } else if (round === 2 && coppaDraw.byes.length) {
        pushSlot("coppa", 2, title, [], midweek, { byes: coppaDraw.byes });
      } else {
        pushSlot("coppa", round, title, [], midweek);
      }
    });

    if (carabaoDraw) {
      const cabTitle = (round: number, leg?: 1 | 2) =>
        `${portuguese ? PORTUGUESE_LEAGUE_CUP_LABEL : "Carabao Cup"} · ${englishCupStageLabel(round, english ? league : undefined)}${leg === 1 ? " · Ida" : leg === 2 ? " · Vuelta" : ""}`;
      const cabDate = addDays(midweek, 1);
      carabaoWeeks.forEach((week, i) => {
        if (md !== week) return;
        const round = i + 1;
        if (round === 1) pushSlot("carabao", 1, cabTitle(1), carabaoR1, cabDate);
        else if (round === 2) pushSlot("carabao", 2, cabTitle(2), [], cabDate, { byes: carabaoDraw.byes });
        else pushSlot("carabao", round, cabTitle(round), [], cabDate);
      });
      if (portuguese) {
        if (md === ptLeagueCupSemi) pushSlot("carabao", ENGLISH_CUP_SEMI_ROUND, cabTitle(ENGLISH_CUP_SEMI_ROUND), [], cabDate);
        if (md === ptLeagueCupFinal) pushSlot("carabao", carabaoFinalRound(), cabTitle(carabaoFinalRound()), [], cabDate);
      } else {
        const cabSemi = carabaoSemiRound(league);
        const cabFinal = carabaoFinalRound(league);
        if (md === carabaoSemiIda) pushSlot("carabao", cabSemi, cabTitle(cabSemi, 1), [], cabDate, { leg: 1 });
        if (md === carabaoSemiVuelta) pushSlot("carabao", cabSemi, cabTitle(cabSemi, 2), [], cabDate, { leg: 2 });
        if (md === carabaoFinal) pushSlot("carabao", cabFinal, cabTitle(cabFinal), [], cabDate);
      }

      if (saudiProIds.length) {
        pushSlot(
          "saudiProLeague",
          md,
          `Saudi Pro League · Jornada ${md}`,
          saudiProIds,
          addDays(date, 7),
        );
      }
    }

    if (md === minorIda[0]) {
      if (sudR16.ida.length) pushSlot("sudamericana", 1, knockoutRoundLabel("sudamericana", 1, 1), sudR16.ida, addDays(midweek, 1), { leg: 1 });
    }
    if (md === minorVuelta[0]) {
      if (sudR16.vuelta.length) pushSlot("sudamericana", 1, knockoutRoundLabel("sudamericana", 1, 2), sudR16.vuelta, addDays(midweek, 1), { leg: 2 });
    }
    if (md === minorIda[1]) {
      pushSlot("sudamericana", 2, knockoutRoundLabel("sudamericana", 2, 1), [], addDays(midweek, 1), { leg: 1 });
    }
    if (md === minorVuelta[1]) {
      pushSlot("sudamericana", 2, knockoutRoundLabel("sudamericana", 2, 2), [], addDays(midweek, 1), { leg: 2 });
    }
    if (md === minorIda[2]) {
      pushSlot("sudamericana", 3, knockoutRoundLabel("sudamericana", 3, 1), [], addDays(midweek, 1), { leg: 1 });
    }
    if (md === minorVuelta[2]) {
      pushSlot("sudamericana", 3, knockoutRoundLabel("sudamericana", 3, 2), [], addDays(midweek, 1), { leg: 2 });
    }
    if (md === minorFinal) {
      pushSlot("sudamericana", 4, knockoutRoundLabel("sudamericana", 4), [], addDays(midweek, 1));
    }

    // Europa League (jueves): fase de liga (1–8), playoff (9), octavos (10), cuartos (11), semifinales (12) a ida y vuelta; final (13) a partido único.
    const uelThursday = addDays(midweek, 2);
    const uelLeagueIdx = uelLeagueWeeks.indexOf(md);
    if (uelLeagueIdx >= 0 && uelLeagueSlots[uelLeagueIdx]?.length) {
      pushSlot("uel", uelLeagueIdx + 1, knockoutRoundLabel("uel", uelLeagueIdx + 1), uelLeagueSlots[uelLeagueIdx] ?? [], uelThursday);
    }
    if (opts.uelTeams.length === UEL_TEAMS) {
      if (md === uelPlayoffIda) pushSlot("uel", UEL_PLAYOFF_ROUND, knockoutRoundLabel("uel", UEL_PLAYOFF_ROUND, 1), [], uelThursday, { leg: 1 });
      if (md === uelPlayoffVuelta) pushSlot("uel", UEL_PLAYOFF_ROUND, knockoutRoundLabel("uel", UEL_PLAYOFF_ROUND, 2), [], uelThursday, { leg: 2 });
      [UEL_R16_ROUND, UEL_R16_ROUND + 1, UEL_R16_ROUND + 2].forEach((round, i) => {
        if (md === uelKoIda[i]) pushSlot("uel", round, knockoutRoundLabel("uel", round, 1), [], uelThursday, { leg: 1 });
        if (md === uelKoVuelta[i]) pushSlot("uel", round, knockoutRoundLabel("uel", round, 2), [], uelThursday, { leg: 2 });
      });
      if (md === uelFinal) pushSlot("uel", UEL_FINAL_ROUND, knockoutRoundLabel("uel", UEL_FINAL_ROUND), [], uelThursday);
    }

    // Conference League (jueves): fase de liga (1–6), playoff (7), octavos (8), cuartos (9), semifinales (10) a ida y vuelta; final (11) a partido único.
    const ueclLeagueIdx = ueclLeagueWeeks.indexOf(md);
    if (ueclLeagueIdx >= 0 && ueclLeagueSlots[ueclLeagueIdx]?.length) {
      pushSlot("uecl", ueclLeagueIdx + 1, knockoutRoundLabel("uecl", ueclLeagueIdx + 1), ueclLeagueSlots[ueclLeagueIdx] ?? [], uelThursday);
    }
    if (opts.ueclTeams.length === UECL_TEAMS) {
      if (md === ueclPlayoffIda) pushSlot("uecl", UECL_PLAYOFF_ROUND, knockoutRoundLabel("uecl", UECL_PLAYOFF_ROUND, 1), [], uelThursday, { leg: 1 });
      if (md === ueclPlayoffVuelta) pushSlot("uecl", UECL_PLAYOFF_ROUND, knockoutRoundLabel("uecl", UECL_PLAYOFF_ROUND, 2), [], uelThursday, { leg: 2 });
      [UECL_R16_ROUND, UECL_R16_ROUND + 1, UECL_R16_ROUND + 2].forEach((round, i) => {
        if (md === ueclKoIda[i]) pushSlot("uecl", round, knockoutRoundLabel("uecl", round, 1), [], uelThursday, { leg: 1 });
        if (md === ueclKoVuelta[i]) pushSlot("uecl", round, knockoutRoundLabel("uecl", round, 2), [], uelThursday, { leg: 2 });
      });
      if (md === ueclFinal) pushSlot("uecl", UECL_FINAL_ROUND, knockoutRoundLabel("uecl", UECL_FINAL_ROUND), [], uelThursday);
    }

    // Champions: playoff (9), octavos (10), cuartos (11), semifinales (12) a ida y vuelta; final (13) a partido único.
    if (md === uclPlayoffIda) pushSlot("ucl", UCL_PLAYOFF_ROUND, knockoutRoundLabel("ucl", UCL_PLAYOFF_ROUND, 1), [], midweek, { leg: 1 });
    if (md === uclPlayoffVuelta) pushSlot("ucl", UCL_PLAYOFF_ROUND, knockoutRoundLabel("ucl", UCL_PLAYOFF_ROUND, 2), [], midweek, { leg: 2 });
    [UCL_R16_ROUND, UCL_R16_ROUND + 1, UCL_R16_ROUND + 2].forEach((round, i) => {
      if (md === uclKoIda[i]) pushSlot("ucl", round, knockoutRoundLabel("ucl", round, 1), [], midweek, { leg: 1 });
      if (md === uclKoVuelta[i]) pushSlot("ucl", round, knockoutRoundLabel("ucl", round, 2), [], midweek, { leg: 2 });
    });
    if (md === uclFinal) pushSlot("ucl", UCL_FINAL_ROUND, knockoutRoundLabel("ucl", UCL_FINAL_ROUND), [], midweek);

    if (md === libKoIda[0]) pushSlot("libertadores", 7, knockoutRoundLabel("libertadores", 7, 1), [], midweek, { leg: 1 });
    if (md === libKoVuelta[0]) pushSlot("libertadores", 7, knockoutRoundLabel("libertadores", 7, 2), [], midweek, { leg: 2 });
    if (md === libKoIda[1]) pushSlot("libertadores", 8, knockoutRoundLabel("libertadores", 8, 1), [], midweek, { leg: 1 });
    if (md === libKoVuelta[1]) pushSlot("libertadores", 8, knockoutRoundLabel("libertadores", 8, 2), [], midweek, { leg: 2 });
    if (md === libKoIda[2]) pushSlot("libertadores", 9, knockoutRoundLabel("libertadores", 9, 1), [], midweek, { leg: 1 });
    if (md === libKoVuelta[2]) pushSlot("libertadores", 9, knockoutRoundLabel("libertadores", 9, 2), [], midweek, { leg: 2 });
    if (md === libFinal) pushSlot("libertadores", 10, knockoutRoundLabel("libertadores", 10), [], midweek);

    saturday = addDays(saturday, 7);
  }

  // Liga Argentina: el Trofeo de Campeones cierra la temporada, después de la última fecha.
  // Lo juegan el campeón del Apertura (1ª rueda) y el del Clausura (2ª rueda); el cruce se arma al llegar.
  if (league === "argentina") {
    pushSlot("trofeo", 1, "Trofeo de Campeones", [], saturday);
  }

  calendar.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || a.id.localeCompare(b.id));
  return { fixtures, calendar };
}

export function createCareer(clubId: ClubId, seed = Date.now() % 1_000_000_000, slot = 0): GameSave {
  // Partida nueva: las divisiones inglesas arrancan como en la 2026/27 (puede venir de una partida con ascensos y descensos).
  applyDivisions(null);
  const rng = new Rng(seed);
  const used = new Set<string>();
  for (const prospect of NEW_GEN_11) used.add(prospect.name);
  const seenClub = new Set<string>();
  const players = CLUBS.filter((c) => {
    if (seenClub.has(c.id)) return false;
    seenClub.add(c.id);
    return true;
  }).flatMap((c) => {
    const squad = buildSquad(c.id, rng, used);
    if (c.ghost) for (const p of squad) p.locked = true;
    return squad;
  });
  addNewGen11(players, rng, used);
  const initialLoans = players
    .filter((player) => player.loanFrom)
    .map((player) => ({
      playerId: player.id,
      fromClubId: player.loanFrom!,
      toClubId: player.clubId,
      seasonsLeft: player.loanSeasons,
      fee: 0,
    }));
  plantHiddenGems(players, rng);
  for (let i = 0; i < players.length; i++) players[i] = ensureTerms(players[i]!);
  const freeAgents = seedFreeAgents(rng, used).map(ensureTerms);
  const club = clubById(clubId);
  const squad = players.filter((p) => p.clubId === clubId);
  const leagueTables = emptyLeagueTables();
  const prestigeTables = emptyLeagueTables();
  for (const lg of ALL_PLAYABLE_LEAGUES) {
    const ranked = rankedByPrestige(domesticIds(lg));
    prestigeTables[lg] = ranked.map((id, i) => ({
      ...emptyStanding(id),
      pts: Math.max(0, 90 - i * 3),
    }));
  }
  const assembled = assembleContinentals(prestigeTables, rng);
  const mundial = !isMundialSeason(2026)
    ? { teams: [] as string[], groups: [] as string[][] }
    : assembleMundial({
    rng: new Rng(seed + 9091),
    uclTeams: assembled.uclGroups.flat(),
    uelTeams: assembled.uelTeams,
    ueclTeams: assembled.ueclTeams,
    libTeams: assembled.libGroups.flat(),
    sudTeams: assembled.sudTeams,
  });
  const intercontinental = intercontinentalPair(null, {
    ucl: rankedByPrestige(assembled.uclGroups.flat()),
    lib: rankedByPrestige(assembled.libGroups.flat()),
  });
  const transatlantica = transatlanticaPair(
    null,
    {
      uel: rankedByPrestige(assembled.uelTeams),
      sud: rankedByPrestige(assembled.sudTeams),
    },
    intercontinental,
  );
  const { fixtures, calendar } = buildSeasonSchedule({
    clubId,
    seed,
    season: 2026,
    uclGroups: assembled.uclGroups,
    uelTeams: assembled.uelTeams,
    ueclTeams: assembled.ueclTeams,
    libGroups: assembled.libGroups,
    sudTeams: assembled.sudTeams,
    mundialGroups: mundial.groups,
    intercontinental,
    transatlantica,
    saudiSuperCupFour: saudiSuperCupTeams(2026),
    saudiKingsCupEntrants: SAUDI_KINGS_CUP_CONFIG.entrants,
    saudiKingsCupWeeks: SAUDI_KINGS_CUP_CONFIG.roundWeeks,
  });

  const info = leagueInfo(club.league);
  const news: NewsItem[] = [
    {
      id: "n0",
      week: 0,
      tone: "good",
      title: `Bienvenido a ${club.name}`,
      body: `El consejo te entrega las llaves de ${club.stadium}. ${info.goal} ${
        club.league === "argentina"
          ? "Libertadores se entra por la tabla y la Copa Argentina. Los dos últimos descienden a la Primera Nacional."
          : club.league === "brasileiraoC"
            ? "Juegas las 38 jornadas de la Série C, a ida y vuelta, contra otros 19 clubes. Los 4 primeros ascienden a la Série B. Hay cuatro cupos de Série C para la Copa do Brasil."
          : club.league === "brasileiraoB"
            ? "Juegas las 38 jornadas de la Série B, a ida y vuelta, contra otros 19 clubes. Los 4 primeros ascienden directo a la Série A y los 4 últimos bajan a la Série C. Además disputas la Copa do Brasil."
          : club.league === "brasileirao"
            ? "Los 5 primeros van a la Libertadores (también el campeón de la Copa do Brasil) y del 6.º al 13.º a la Sudamericana. Además disputas la Copa do Brasil. Los 4 últimos descienden a la Série B y en su lugar suben los 4 primeros de esa categoría."
          : club.league === "primeira"
            ? "Juegas las 34 jornadas de la Primeira Liga, a ida y vuelta, contra otros 17 clubes. Los 2 primeros van a la Champions, el 3.º a la Europa League y el 4.º a la Conference. Los dos últimos descienden directo a la Liga Portugal 2 y el 16.º juega un playoff a ida y vuelta contra el 3.º de esa categoría. Las copas portuguesas llegan más adelante."
          : club.league === "leagueOne"
            ? "Juegas las 46 jornadas de la League One, a ida y vuelta, contra otros 23 clubes. Los dos primeros ascienden directo a la Championship y del 3.º al 6.º juegan el playoff; los cuatro últimos descienden a League Two. Además disputas la FA Cup y la Carabao Cup."
          : club.league === "leagueTwo"
            ? "Juegas las 46 jornadas de EFL League Two, a ida y vuelta, contra otros 23 clubes. Los tres primeros ascienden directo a League One y del 4.º al 7.º juegan el playoff por el último ascenso. La EFL desciende los dos últimos a National League; como esa división aún no está implementada, conservan su plaza. Participas en FA Cup y Carabao Cup."
          : club.league === "primeira2"
            ? "Juegas las 34 jornadas de la Liga Portugal 2, a ida y vuelta, contra otros 17 clubes. Los dos primeros ascienden directo a la Primeira Liga y el 3.º juega un playoff a ida y vuelta contra el 16.º de la Primeira. No existe una categoría inferior jugable: nadie desciende de la Liga Portugal 2. Las copas portuguesas llegan más adelante."
          : club.league === "bundesliga3"
            ? "Juegas las 38 jornadas de la 3. Liga, a ida y vuelta, contra otros 19 clubes. Los dos primeros ascienden directo a la 2. Bundesliga y el 3.º juega un playoff contra el 16.º de la 2. Bundesliga; los cuatro últimos marcan la zona de descenso a la Regionalliga. Las copas alemanas y los ascensos y descensos llegan más adelante."
          : club.league === "bundesliga2"
            ? "Los dos primeros ascienden directo a la Bundesliga; del 3.º al 6.º juegan el playoff de ascenso. Además disputas la DFB-Pokal."
          : club.league === "ligue2"
            ? "Los dos primeros ascienden directo a la Ligue 1; del 3.º al 5.º juegan el playoff (4.º vs 5.º, el ganador contra el 3.º) y su ganador, el barrage contra el 16.º de la Ligue 1. Los tres últimos descienden a la Ligue 3."
          : club.league === "ligue3"
            ? "Juegas 34 jornadas, a ida y vuelta, contra los otros 17 clubes. Los tres primeros ascienden a la Ligue 2. La categoría inferior todavía no está implementada."
          : club.league === "serieB"
            ? "Los dos primeros ascienden directo; del 3.º al 6.º juegan el playoff de ascenso. Además disputas la Coppa Italia."
          : club.league === "primeraNacional"
            ? "El campeón asciende directo a la Liga Profesional; del 2.º al 5.º juegan el Reducido por el segundo ascenso. Los dos últimos descienden a la Tercera División Argentina."
          : club.league === "primeraBMetro"
            ? "El campeón asciende directo a la Primera Nacional; del 2.º al 5.º juegan el Reducido por el segundo ascenso. Un club desciende a la Cuarta División Argentina."
          : club.league === "argentinaCuarta"
            ? "Juegas a ida y vuelta por la tabla general. El campeón asciende a la Tercera División Argentina y el último desciende a la Quinta División. La Copa Argentina incluye a esta categoría."
          : club.league === "argentinaQuinta"
            ? "La categoría tiene una liga de ida y vuelta; el campeón asciende a la Cuarta División y el último desciende al Torneo Promocional Amateur. La Copa Argentina incluye a esta categoría."
          : club.league === "promocionalAmateur"
            ? "Juegas la liga de ida y vuelta por el ascenso a la Quinta División. Esta categoría no participa en la Copa Argentina."
          : club.league === "primeraFed1" || club.league === "primeraFed2"
            ? "Juegas las 38 jornadas de tu grupo de la Primera Federación, a ida y vuelta, contra otros 19 clubes. El campeón asciende directo a LaLiga Hypermotion y del 2.º al 5.º juegan el playoff por otras dos plazas (con los del otro grupo). Todavía no existe la Segunda Federación: nadie desciende."
          : club.league === "segunda"
            ? "Los dos primeros ascienden directo a LaLiga EA Sports; del 3.º al 6.º juegan el playoff por el tercer ascenso. Los cuatro últimos descienden a la Primera Federación, donde te espera un grupo de 20 clubes."
          : club.league === "championship"
            ? "Los dos primeros ascienden directo; del 3.º al 6.º juegan el playoff. Además disputas la FA Cup y la Carabao Cup."
            : club.league === "premier"
              ? "A Champions, Europa League o Conference League se entra por la tabla. Además disputas la FA Cup y la Carabao Cup."
              : "A Champions, Europa League o Conference League se entra por la tabla."
      }`,
    },
  ];

  const userLeague = playableLeague(club.league);

  return {
    version: 6,
    slot,
    careerId: uid("career"),
    seed,
    season: 2026,
    week: 1,
    cursor: 0,
    clubId,
    screen: "office",
    players,
    standings: leagueTables[userLeague],
    leagueTables,
    uclStandings: assembled.uclGroups.flat().map(emptyStanding),
    uelStandings: assembled.uelTeams.map(emptyStanding),
    ueclStandings: assembled.ueclTeams.map(emptyStanding),
    libStandings: assembled.libGroups.flat().map(emptyStanding),
    mundialStandings: mundial.groups.flat().map(emptyStanding),
    fixtures,
    calendar,
    tactics: (() => {
      const lineup = pickXi(squad, "433");
      return {
        formation: "433" as const,
        mentality: "balanced" as const,
        lineup,
        bench: pickBench(squad, lineup),
        numberColor: "auto" as const,
      };
    })(),
    budget: startingBudget(club.prestige, club.league),
    divisions: currentDivisions(),
    news,
    lastMatch: null,
    trophies: [],
    honours: historicalFor(clubId),
    careerTrophies: [],
    careerHistory: [],
    awards: createSeasonAwards(2026),
    seasonOver: false,
    pendingFixtureId: null,
    trainingPlans: [],
    trainingReports: [],
    academy: seedAcademy(clubId, rng, used),
    scouts: [],
    academyLevel: 1,
    offers: [],
    loans: initialLoans,
    popups: [],
    tempLineupBackup: null,
    uclGroups: assembled.uclGroups,
    uelTeams: assembled.uelTeams,
    ueclTeams: assembled.ueclTeams,
    libGroups: assembled.libGroups,
    sudTeams: assembled.sudTeams,
    mundialGroups: mundial.groups,
    lastChampions: {
      scudetto: null,
      coppa: null,
      carabao: null,
      supercoppa: null,
      kingsCup: null,
      saudiSuperCup: null,
      kingsCupRunnerUp: null,
      saudiSuperCupRunnerUp: null,
      ucl: null,
      uel: null,
      uecl: null,
      libertadores: null,
      sudamericana: null,
      coppaRunnerUp: null,
      mundial: null,
      intercontinental: null,
      transatlantica: null,
    },
    worldHonours: [],
    freeAgents,
    clubFinance: {},
    transferLog: [],
    board: null,
    clubSponsors: {},
    sponsorOffers: [],
    sponsorSearchSeason: null,
    sponsorLockUntil: null,
    sponsorHistory: [],
    events: createEventState(),
  };
}

/** La fase previa deja un cuadro de 64 equipos para la Copa Argentina. */
function drawArgentineCup(rng: Rng): { firstRound: Array<[string, string]>; byes: string[] } {
  const { profesional, nacional, metropolitana, cuarta, quinta } = argentineCupIds();
  const entrants = [...new Set([...profesional, ...nacional, ...metropolitana, ...cuarta, ...quinta])];
  const ranked = rankedByPrestige(entrants);
  const nextRoundSize = 2 ** Math.floor(Math.log2(ranked.length - 1));
  const nPlaying = Math.min(ranked.length, 2 * (ranked.length - nextRoundSize));
  const nBye = ranked.length - nPlaying;
  const byes = ranked.slice(0, nBye);
  const play = ranked.slice(nBye);
  return { firstRound: pair(rng.shuffle(play)), byes };
}

/**
 * Sorteo de la DFB-Pokal (Bundesliga + 2. Bundesliga, 36 clubes): la ronda previa la juegan solo los 8 clubes de menor
 * prestigio de la 2. Bundesliga (4 cruces); los otros 28 (los 18 de la Bundesliga y los 10 mejores de la 2. Bundesliga)
 * entran en la segunda ronda (dieciseisavos) con los 4 ganadores: 32 clubes.
 */
function drawGermanCup(rng: Rng): { firstRound: Array<[string, string]>; byes: string[] } {
  const { bundesliga, bundesliga2 } = germanCupIds();
  const weakest = rankedByPrestige(bundesliga2).slice(-8);
  const weakSet = new Set(weakest);
  const byes = rankedByPrestige([...bundesliga, ...bundesliga2.filter((id) => !weakSet.has(id))]);
  return { firstRound: pair(rng.shuffle(weakest)), byes };
}

/**
 * Sorteo de la Coupe de France (Ligue 1 + Ligue 2, 36 clubes): la 7.ª ronda la juegan los 8 clubes de menor prestigio de la
 * Ligue 2 (4 cruces); los otros 10 de la Ligue 2 pasan directo (no hay clubes aficionados en el juego) y los 18 de la
 * Ligue 1 entran en los 32avos (ronda 2) con los 4 ganadores: 32 clubes. Un club de Ligue 2 puede cruzarse con uno de
 * Ligue 1 desde los 32avos y llegar hasta la final.
 */
function drawFrenchCup(rng: Rng): { firstRound: Array<[string, string]>; byes: string[] } {
  const { ligue1, ligue2 } = frenchCupIds();
  const weakest = rankedByPrestige(ligue2).slice(-8);
  const weakSet = new Set(weakest);
  const byes = rankedByPrestige([...ligue1, ...ligue2.filter((id) => !weakSet.has(id))]);
  return { firstRound: pair(rng.shuffle(weakest)), byes };
}

/**
 * Copa do Brasil (44 clubes): Série A + Série B y cuatro clasificados de la Série C. Los 24 de menor prestigio juegan
 * la primera fase; 20 entran directamente a 32avos junto a los 12 ganadores.
 * Después, eliminación directa hasta la final. Los clubes de cualquier división pueden cruzarse y ganar.
 */
function drawBrazilianCup(rng: Rng, serieCQualifiers?: string[]): { firstRound: Array<[string, string]>; byes: string[] } {
  const { serieA, serieB, serieC } = brazilianCupIds(serieCQualifiers);
  const ranked = rankedByPrestige([...serieA, ...serieB, ...serieC]);
  const nPlay = Math.max(0, Math.min(ranked.length - (ranked.length % 2), 2 * (ranked.length - 32)));
  const byes = ranked.slice(0, ranked.length - nPlay);
  const play = ranked.slice(ranked.length - nPlay);
  return { firstRound: pair(rng.shuffle(play)), byes };
}

/**
 * Sorteo de la Taça de Portugal y de la Taça da Liga: Primeira Liga + Liga Portugal 2 actuales, sin los equipos B (33
 * clubes con la lista 2026/27). Con más de 32 clubes, los de menor prestigio juegan una primera ronda previa (2 clubes = 1
 * cruce) y el resto entra directo en la segunda ronda (32avos) junto a los ganadores: 32 clubes. Un club de la Liga
 * Portugal 2 puede cruzarse con uno de la Primeira Liga desde los 32avos y llegar hasta la final.
 */
function drawPortugueseCup(rng: Rng): { firstRound: Array<[string, string]>; byes: string[] } {
  const { primeira, primeira2 } = portugueseCupIds();
  const ranked = rankedByPrestige([...primeira, ...primeira2]);
  const nPlay = Math.max(0, Math.min(ranked.length - (ranked.length % 2), 2 * (ranked.length - 32)));
  const byes = ranked.slice(0, ranked.length - nPlay);
  const play = ranked.slice(ranked.length - nPlay);
  return { firstRound: pair(rng.shuffle(play)), byes };
}

/**
 * Sorteo de la Copa del Rey: LaLiga EA Sports + LaLiga Hypermotion (sin filiales) + 21 clubes de Primera Federación. Para
 * llegar a 32 clubes en los dieciseisavos, los de mayor prestigio de LaLiga entran directo (como los de la Supercopa) y todos
 * los demás juegan la primera eliminatoria a partido único. Cada club de Primera Federación se enfrenta a un rival de
 * categoría superior y juega en casa; los que sobren se emparejan entre sí.
 */
function drawSpanishCup(rng: Rng): { firstRound: Array<[string, string]>; byes: string[] } {
  const { laliga, segunda, fed } = spanishCupIds();
  const total = laliga.length + segunda.length + fed.length;
  const nPlay = Math.max(0, Math.min(total - (total % 2), 2 * (total - 32)));
  const byes = rankedByPrestige(laliga).slice(0, total - nPlay);
  const byeSet = new Set(byes);
  const fedPlay = rng.shuffle(fed.filter((id) => !byeSet.has(id)));
  const others = rng.shuffle([...laliga, ...segunda].filter((id) => !byeSet.has(id)));
  const out: Array<[string, string]> = [];
  while (fedPlay.length && others.length) out.push([fedPlay.pop()!, others.pop()!]);
  out.push(...pair(rng.shuffle([...fedPlay, ...others])));
  return { firstRound: out, byes };
}

function drawCoppa(
  userId: string,
  ids: string[],
  rng: Rng,
): { firstRound: Array<[string, string]>; byes: string[] } {
  if (ids.length > 16) {
    const ranked = rankedByPrestige(ids);
    let byes = ranked.slice(0, 8);
    let play = ranked.slice(8);
    if (!play.includes(userId) && !byes.includes(userId)) {
      play = [...play.slice(0, -1), userId];
    }
    return { firstRound: pair(rng.shuffle(play)), byes };
  }
  const ranked = [...ids].sort((a, b) => clubById(b).prestige - clubById(a).prestige);
  const top = ranked.slice(0, 16);
  if (!top.includes(userId)) top[15] = userId;
  return { firstRound: pair(rng.shuffle(top)), byes: [] };
}

export function sortTable(rows: Standing[]): Standing[] {
  const sorted = [...rows].sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    const gdA = a.gf - a.ga;
    const gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.clubId.localeCompare(b.clubId);
  });
  // Reglas alemanas (3. Liga): puntos, diferencia de goles y goles a favor; si siguen igualados, el enfrentamiento directo entre los
  // empatados (puntos, diferencia de goles y goles de visitante). Solo se aplica a las tablas que llevan el balance directo (h2h).
  if (!sorted.some((r) => r.h2h)) return sorted;
  const out: Standing[] = [];
  for (let i = 0; i < sorted.length; ) {
    let j = i + 1;
    while (
      j < sorted.length &&
      sorted[j]!.pts === sorted[i]!.pts &&
      sorted[j]!.gf - sorted[j]!.ga === sorted[i]!.gf - sorted[i]!.ga &&
      sorted[j]!.gf === sorted[i]!.gf
    ) {
      j++;
    }
    const group = sorted.slice(i, j);
    if (group.length > 1) {
      const ids = new Set(group.map((r) => r.clubId));
      const mini = (r: Standing) => {
        let pts = 0;
        let gf = 0;
        let ga = 0;
        let awayGf = 0;
        for (const [id, v] of Object.entries(r.h2h ?? {})) {
          if (!ids.has(id)) continue;
          pts += v.pts;
          gf += v.gf;
          ga += v.ga;
          awayGf += v.awayGf;
        }
        return { pts, gd: gf - ga, awayGf };
      };
      group.sort((a, b) => {
        const ma = mini(a);
        const mb = mini(b);
        if (mb.pts !== ma.pts) return mb.pts - ma.pts;
        if (mb.gd !== ma.gd) return mb.gd - ma.gd;
        if (mb.awayGf !== ma.awayGf) return mb.awayGf - ma.awayGf;
        return a.clubId.localeCompare(b.clubId);
      });
    }
    out.push(...group);
    i = j;
  }
  return out;
}

/** Anota el balance directo de un partido (solo la 3. Liga lo necesita para su desempate). */
function recordHeadToHead(row: Standing, rivalId: string, gf: number, ga: number, away: boolean) {
  row.h2h ??= {};
  const cur = row.h2h[rivalId] ?? { pts: 0, gf: 0, ga: 0, awayGf: 0 };
  cur.pts += gf > ga ? 3 : gf === ga ? 1 : 0;
  cur.gf += gf;
  cur.ga += ga;
  if (away) cur.awayGf += gf;
  row.h2h[rivalId] = cur;
}

export function applyResultToTable(
  rows: Standing[],
  homeId: string,
  awayId: string,
  hg: number,
  ag: number,
) {
  const home = rows.find((r) => r.clubId === homeId);
  const away = rows.find((r) => r.clubId === awayId);
  if (!home || !away) return;
  home.played += 1;
  away.played += 1;
  if (clubById(homeId).league === "bundesliga3" && clubById(awayId).league === "bundesliga3") {
    recordHeadToHead(home, awayId, hg, ag, false);
    recordHeadToHead(away, homeId, ag, hg, true);
  }
  home.gf += hg;
  home.ga += ag;
  away.gf += ag;
  away.ga += hg;
  const hForm: "W" | "D" | "L" = hg > ag ? "W" : hg === ag ? "D" : "L";
  const aForm: "W" | "D" | "L" = ag > hg ? "W" : ag === hg ? "D" : "L";
  home.form = [...home.form, hForm].slice(-5);
  away.form = [...away.form, aForm].slice(-5);
  if (hg > ag) {
    home.won += 1;
    home.pts += 3;
    away.lost += 1;
  } else if (ag > hg) {
    away.won += 1;
    away.pts += 3;
    home.lost += 1;
  } else {
    home.drawn += 1;
    away.drawn += 1;
    home.pts += 1;
    away.pts += 1;
  }
}

/** Sorteo compartido por FA Cup y Carabao Cup: 92 clubes, reducidos a 64 para continuar el cuadro a 7 rondas. */
function drawEnglishCup(rng: Rng): { firstRound: Array<[string, string]>; byes: string[] } {
  const { premier, championship, leagueOne, leagueTwo } = englishCupIds();
  const earlyRound = rng.shuffle([...leagueOne, ...leagueTwo, ...rng.shuffle(championship).slice(0, 8)]);
  const direct = [...premier, ...championship.filter((id) => !earlyRound.includes(id))];
  return { firstRound: pair(earlyRound), byes: rankedByPrestige(direct) };
}

/**
 * Dieciseisavos de las copas inglesas: cada ganador de la primera ronda (Championship) recibe a un equipo de la Premier
 * y los que sobran de la Premier se enfrentan entre sí. Los cruces y la localía son al azar pero estables por partida.
 */
function pairEnglishRoundTwo(winners: string[], premierByes: string[], seed: number): Array<[string, string]> {
  const rng = new Rng(seed + 31);
  const top = rng.shuffle(premierByes);
  const out: Array<[string, string]> = [];
  const n = Math.min(winners.length, top.length);
  for (let i = 0; i < n; i++) {
    const w = winners[i]!;
    const t = top[i]!;
    out.push(rng.chance(0.5) ? [w, t] : [t, w]);
  }
  out.push(...pair(top.slice(n)));
  // Si sobraran ganadores (no ocurre con 12 + 20) se emparejan entre sí.
  out.push(...pair(winners.slice(n)));
  return out;
}

export function wageBill(players: { clubId: string; wage: number }[], clubId: string) {
  return players.filter((p) => p.clubId === clubId).reduce((s, p) => s + p.wage, 0);
}

export function fixtureWinner(f: Fixture): string | null {
  if (!f.played || f.homeGoals === undefined || f.awayGoals === undefined) return null;
  if (f.homeGoals > f.awayGoals) return f.homeId;
  if (f.awayGoals > f.homeGoals) return f.awayId;
  return null;
}

export function tieWinner(save: GameSave, tieId: string): string | null {
  const legs = save.fixtures.filter((f) => f.tieId === tieId && f.played);
  const first = legs.find((l) => l.leg === 1);
  const second = legs.find((l) => l.leg === 2);
  if (!first || first.homeGoals === undefined || first.awayGoals === undefined) return null;
  if (!second) return null;
  if (second.homeGoals === undefined || second.awayGoals === undefined) return null;
  const a = first.homeGoals + second.awayGoals;
  const b = first.awayGoals + second.homeGoals;
  if (a !== b) return a > b ? first.homeId : first.awayId;
  // Global igualado: manda la tanda de penales jugada en la vuelta (saves viejos sin tanda: sorteo).
  return penaltyWinner(second) ?? resolveDrawWinner(second, save.seed);
}

/** Tabla de la Liga Profesional armada solo con los partidos jugados de las fechas `from`..`to`. */
function argentinaTableBetween(save: GameSave, from: number, to: number): Standing[] {
  const rows = domesticIds("argentina").map(emptyStanding);
  for (const f of save.fixtures) {
    if (f.competition !== "argentina" || !f.played || f.round < from || f.round > to) continue;
    applyResultToTable(rows, f.homeId, f.awayId, f.homeGoals ?? 0, f.awayGoals ?? 0);
  }
  return sortTable(rows);
}

/**
 * Cruce del Trofeo de Campeones: campeón del Apertura (fechas 1 a la mitad) vs campeón del Clausura
 * (segunda mitad). Si es el mismo club, enfrenta al mejor de la tabla general. Devuelve null hasta que
 * terminó toda la liga.
 */
export function trofeoPair(save: GameSave): [string, string] | null {
  const league = save.fixtures.filter((f) => f.competition === "argentina");
  if (league.length === 0 || league.some((f) => !f.played)) return null;
  const last = Math.max(...league.map((f) => f.round));
  const half = Math.floor(last / 2);
  const apertura = argentinaTableBetween(save, 1, half)[0]?.clubId;
  const clausura = argentinaTableBetween(save, half + 1, last)[0]?.clubId;
  if (!apertura || !clausura) return null;
  if (apertura !== clausura) return [apertura, clausura];
  const general = argentinaTableBetween(save, 1, last).find((r) => r.clubId !== apertura)?.clubId;
  return general ? [apertura, general] : null;
}

export function populateKnockout(save: GameSave, slot: CalendarSlot) {
  if (slot.fixtures.length > 0) return;
  const libGroups = save.libGroups?.length ? save.libGroups : [];

  if (slot.competition === "carabao" && slot.round >= 2) {
    fillCarabaoRound(save, slot);
    return;
  }

  if (
    (slot.competition === "coppa" ||
      slot.competition === "supercoppa" ||
      slot.competition === "kingsCup" ||
      slot.competition === "saudiSuperCup") &&
    slot.round >= 2
  ) {
    const prev = save.fixtures.filter(
      (f) => f.competition === slot.competition && f.round === slot.round - 1 && f.played,
    );
    const winners = prev.map((f) => resolveDrawWinner(f, save.seed)).filter(Boolean);
    // FA Cup: en los dieciseisavos entra la Premier y se cruza con los ganadores de la Championship.
    if (slot.competition === "coppa" && slot.round === 2 && isTwoTierCupLeague(clubById(save.clubId).league) && !isEnglishLeague(clubById(save.clubId).league) && slot.byes?.length) {
      // FA Cup y DFB-Pokal: entran los clubes con bye y se cruzan con los ganadores de la ronda previa.
      const pairs = pairEnglishRoundTwo(winners, slot.byes, save.seed);
      if (pairs.length < 1) return;
      slot.fixtures = pairs.map(([h, a]) => addFixture(save.fixtures, "coppa", 2, h, a));
      return;
    }
    let field = [...winners, ...(slot.byes ?? [])];
    if (field.length < 2) return;
    // Copa Argentina: los que entran con bye se mezclan con los ganadores de la fase previa (sorteo estable por partida).
    if (slot.competition === "coppa" && slot.round === 2 && slot.byes?.length && (isArgentineLeague(clubById(save.clubId).league) || isBrazilianLeague(clubById(save.clubId).league) || isPortugueseLeague(clubById(save.clubId).league) || isSpanishLeague(clubById(save.clubId).league) || isEnglishLeague(clubById(save.clubId).league))) {
      field = new Rng(save.seed + 37).shuffle(field);
    }
    slot.fixtures = pair(field).map(([h, a]) => addFixture(save.fixtures, slot.competition, slot.round, h, a));
    return;
  }

  if (slot.competition === "trofeo") {
    const pairing = trofeoPair(save);
    if (pairing) slot.fixtures = [addFixture(save.fixtures, "trofeo", 1, pairing[0], pairing[1])];
    return;
  }

  if (slot.competition === "ucl") {
    fillUclKnockout(save, slot);
    return;
  }

  if (slot.competition === "uel") {
    fillUelKnockout(save, slot);
    return;
  }

  if (slot.competition === "uecl") {
    fillUeclKnockout(save, slot);
    return;
  }

  if (slot.competition === "mundial") {
    fillMundialKnockout(save, slot);
    return;
  }

  const twoLegComps: Competition[] = ["sudamericana"];
  if (twoLegComps.includes(slot.competition) && slot.round >= 2) {
    fillTwoLegRound(save, slot, slot.competition, slot.round);
    return;
  }
  if (twoLegComps.includes(slot.competition) && slot.round === 1 && slot.leg === 2) {
    return;
  }

  if (slot.competition === "libertadores" && slot.round === 7) {
    const srcGroups = libGroups;
    const standings = save.libStandings;
    const qualified: string[] = [];
    for (const group of srcGroups) {
      const rows = sortTable(standings.filter((s) => group.includes(s.clubId)));
      if (rows[0]) qualified.push(rows[0].clubId);
      if (rows[1]) qualified.push(rows[1].clubId);
    }
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < qualified.length; i += 4) {
      const a1 = qualified[i];
      const a2 = qualified[i + 1];
      const b1 = qualified[i + 2];
      const b2 = qualified[i + 3];
      if (a1 && b2) pairs.push([a1, b2]);
      if (b1 && a2) pairs.push([b1, a2]);
    }
    fillPairSlot(save, slot, slot.competition, 7, pairs);
    return;
  }

  if (slot.competition === "libertadores" && slot.round >= 8) {
    fillTwoLegRound(save, slot, slot.competition, slot.round);
  }
}

/**
 * Carabao Cup: ronda 2 (dieciseisavos, entra la Premier), 3 y 4 a partido único, semifinal (5) a ida y vuelta y
 * final (6) a partido único. Los empates de un solo partido se resuelven con prórroga y penales (ver tick.ts).
 */
function fillCarabaoRound(save: GameSave, slot: CalendarSlot) {
  const round = slot.round;
  // Taça da Liga: todas las rondas a partido único (semifinales incluidas); los 32avos mezclan al azar a los de la
  // Primeira Liga y de la Liga Portugal 2 (sorteo estable por partida).
  const userLeague = clubById(save.clubId).league;
  const portuguese = isPortugueseLeague(userLeague);
  // Carabao Cup (68 clubes, 7 rondas): los 32avos mezclan al azar a los ganadores de la previa y a los 60 que entran directo.
  if (round === 2 && (portuguese || isEnglishLeague(userLeague))) {
    const field = new Rng(save.seed + 41).shuffle([...winnersOfRound(save, "carabao", 1), ...(slot.byes ?? [])]);
    if (field.length < 2) return;
    slot.fixtures = pair(field).map(([h, a]) => addFixture(save.fixtures, "carabao", 2, h, a));
    return;
  }
  if (round === 2) {
    const winners = winnersOfRound(save, "carabao", 1);
    const pairs = pairEnglishRoundTwo(winners, slot.byes ?? [], save.seed + 5);
    if (!pairs.length) return;
    slot.fixtures = pairs.map(([h, a]) => addFixture(save.fixtures, "carabao", 2, h, a));
    return;
  }
  if (round === carabaoSemiRound(userLeague) && !portuguese) {
    const winners = winnersOfRound(save, "carabao", round - 1);
    if (slot.leg === 2 || winners.length >= 2) fillPairSlot(save, slot, "carabao", round, pair(winners));
    return;
  }
  const winners = winnersOfRound(save, "carabao", round - 1);
  if (winners.length < 2) return;
  slot.fixtures = pair(winners).map(([h, a]) => addFixture(save.fixtures, "carabao", round, h, a));
}

function fillMundialKnockout(save: GameSave, slot: CalendarSlot) {
  if (slot.round <= MUNDIAL_GROUP_ROUNDS) return;
  if (slot.round === MUNDIAL_GROUP_ROUNDS + 1) {
    const groups = save.mundialGroups ?? [];
    if (groups.length !== MUNDIAL_GROUPS) return;
    const pairs = mundialR16Pairs(groups, save.mundialStandings ?? []);
    if (pairs.length < 8) return;
    slot.fixtures = pairs.map(([h, a]) => addFixture(save.fixtures, "mundial", slot.round, h, a));
    return;
  }
  const winners = winnersOfRound(save, "mundial", slot.round - 1);
  if (winners.length < 2) return;
  slot.fixtures = pair(winners).map(([h, a]) => addFixture(save.fixtures, "mundial", slot.round, h, a));
}

/**
 * Llaves de la Champions. Playoff: 9.º–16.º (cabezas de serie, vuelta en casa) contra 17.º–24.º.
 * Octavos: los 8 primeros de la fase de liga contra los 8 ganadores del playoff.
 * Cuartos y semifinales se arman con los ganadores del cruce anterior; la final es a partido único.
 */
function fillUclKnockout(save: GameSave, slot: CalendarSlot) {
  const round = slot.round;
  if (round <= UCL_LEAGUE_ROUNDS) return;
  if (round === UCL_PLAYOFF_ROUND) {
    const rank = uclLeagueRanking(save);
    if (rank.length < UCL_PLAYOFF_SPOTS) return;
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < 8; i++) {
      const seeded = rank[UCL_DIRECT_SPOTS + i]!; // 9.º … 16.º
      const unseeded = rank[UCL_PLAYOFF_SPOTS - 1 - i]!; // 24.º … 17.º
      pairs.push([unseeded, seeded]); // ida en casa del no cabeza de serie
    }
    fillPairSlot(save, slot, "ucl", round, pairs);
    return;
  }
  if (round === UCL_R16_ROUND) {
    if (slot.leg === 2) {
      fillPairSlot(save, slot, "ucl", round, []);
      return;
    }
    const rank = uclLeagueRanking(save);
    if (rank.length < UCL_DIRECT_SPOTS) return;
    const playoffWinners = winnersOfRound(save, "ucl", UCL_PLAYOFF_ROUND);
    if (playoffWinners.length < 8) return;
    // Orden de los cruces del playoff (9v24, 10v23, … 16v17): W[i] es el ganador del cruce de la semilla 9 + i.
    const bySeed = new Map<string, string>();
    for (let i = 0; i < 8; i++) {
      const seeded = rank[UCL_DIRECT_SPOTS + i]!;
      const unseeded = rank[UCL_PLAYOFF_SPOTS - 1 - i]!;
      const w = playoffWinners.find((id) => id === seeded || id === unseeded);
      if (w) bySeed.set(String(i), w);
    }
    if (bySeed.size < 8) return;
    // Cuadro: el 1.º se cruza con el ganador del 16.º-17.º (el más flojo), el 2.º con el siguiente, etc.
    const slotOrder = [0, 7, 3, 4, 1, 6, 2, 5]; // evita que los mejores se encuentren antes de la final
    const pairs: Array<[string, string]> = slotOrder.map((direct) => [bySeed.get(String(7 - direct))!, rank[direct]!]);
    fillPairSlot(save, slot, "ucl", round, pairs);
    return;
  }
  if (round === UCL_FINAL_ROUND) {
    const winners = winnersOfRound(save, "ucl", round - 1);
    if (winners.length < 2) return;
    slot.fixtures = pair(winners).map(([h, a]) => addFixture(save.fixtures, "ucl", round, h, a));
    return;
  }
  // Cuartos y semifinales.
  if (slot.leg === 2) {
    fillPairSlot(save, slot, "ucl", round, []);
    return;
  }
  const winners = winnersOfRound(save, "ucl", round - 1);
  if (winners.length < 2) return;
  fillPairSlot(save, slot, "ucl", round, pair(winners));
}

/**
 * Llaves de la Europa League (mismo formato que la Champions).
 * Playoff: 9.º–16.º (cabezas de serie, vuelta en casa) contra 17.º–24.º, a ida y vuelta.
 * Octavos: los 8 primeros de la fase de liga contra los 8 ganadores del playoff.
 * Cuartos y semifinales se arman con los ganadores del cruce anterior; la final es a partido único.
 */
function fillUelKnockout(save: GameSave, slot: CalendarSlot) {
  const round = slot.round;
  if (round <= UEL_LEAGUE_ROUNDS) return;
  if (round === UEL_PLAYOFF_ROUND) {
    if (slot.leg === 2) {
      fillPairSlot(save, slot, "uel", round, []);
      return;
    }
    const rank = uelLeagueRanking(save);
    if (rank.length < UEL_PLAYOFF_SPOTS) return;
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < 8; i++) {
      const seeded = rank[UEL_DIRECT_SPOTS + i]!; // 9.º … 16.º
      const unseeded = rank[UEL_PLAYOFF_SPOTS - 1 - i]!; // 24.º … 17.º
      pairs.push([unseeded, seeded]); // ida en casa del no cabeza de serie
    }
    fillPairSlot(save, slot, "uel", round, pairs);
    return;
  }
  if (round === UEL_R16_ROUND) {
    if (slot.leg === 2) {
      fillPairSlot(save, slot, "uel", round, []);
      return;
    }
    const rank = uelLeagueRanking(save);
    if (rank.length < UEL_DIRECT_SPOTS) return;
    const playoffWinners = winnersOfRound(save, "uel", UEL_PLAYOFF_ROUND);
    if (playoffWinners.length < 8) return;
    // W[i] es el ganador del cruce de la semilla 9 + i (9v24, 10v23, … 16v17).
    const bySeed = new Map<string, string>();
    for (let i = 0; i < 8; i++) {
      const seeded = rank[UEL_DIRECT_SPOTS + i]!;
      const unseeded = rank[UEL_PLAYOFF_SPOTS - 1 - i]!;
      const w = playoffWinners.find((id) => id === seeded || id === unseeded);
      if (w) bySeed.set(String(i), w);
    }
    if (bySeed.size < 8) return;
    // Cuadro: el 1.º se cruza con el ganador del 16.º-17.º (el más flojo), el 2.º con el siguiente, etc.
    const slotOrder = [0, 7, 3, 4, 1, 6, 2, 5]; // evita que los mejores se encuentren antes de la final
    const pairs: Array<[string, string]> = slotOrder.map((direct) => [bySeed.get(String(7 - direct))!, rank[direct]!]);
    fillPairSlot(save, slot, "uel", round, pairs);
    return;
  }
  if (round === UEL_FINAL_ROUND) {
    const winners = winnersOfRound(save, "uel", round - 1);
    if (winners.length < 2) return;
    slot.fixtures = pair(winners).map(([h, a]) => addFixture(save.fixtures, "uel", round, h, a));
    return;
  }
  // Cuartos y semifinales.
  if (slot.leg === 2) {
    fillPairSlot(save, slot, "uel", round, []);
    return;
  }
  const winners = winnersOfRound(save, "uel", round - 1);
  if (winners.length < 2) return;
  fillPairSlot(save, slot, "uel", round, pair(winners));
}

/**
 * Llaves de la Conference League (misma lógica que la Europa League, con 6 jornadas de fase de liga).
 * Playoff (ronda 7): 9.º–16.º (cabezas de serie, vuelta en casa) contra 17.º–24.º, a ida y vuelta.
 * Octavos (8): los 8 primeros de la fase de liga contra los 8 ganadores del playoff.
 * Cuartos (9) y semifinales (10) se arman con los ganadores del cruce anterior; la final (11) es a partido único.
 */
function fillUeclKnockout(save: GameSave, slot: CalendarSlot) {
  const round = slot.round;
  if (round <= UECL_LEAGUE_ROUNDS) return;
  if (round === UECL_PLAYOFF_ROUND) {
    if (slot.leg === 2) {
      fillPairSlot(save, slot, "uecl", round, []);
      return;
    }
    const rank = ueclLeagueRanking(save);
    if (rank.length < UECL_PLAYOFF_SPOTS) return;
    const pairs: Array<[string, string]> = [];
    for (let i = 0; i < 8; i++) {
      const seeded = rank[UECL_DIRECT_SPOTS + i]!; // 9.º … 16.º
      const unseeded = rank[UECL_PLAYOFF_SPOTS - 1 - i]!; // 24.º … 17.º
      pairs.push([unseeded, seeded]); // ida en casa del no cabeza de serie
    }
    fillPairSlot(save, slot, "uecl", round, pairs);
    return;
  }
  if (round === UECL_R16_ROUND) {
    if (slot.leg === 2) {
      fillPairSlot(save, slot, "uecl", round, []);
      return;
    }
    const rank = ueclLeagueRanking(save);
    if (rank.length < UECL_DIRECT_SPOTS) return;
    const playoffWinners = winnersOfRound(save, "uecl", UECL_PLAYOFF_ROUND);
    if (playoffWinners.length < 8) return;
    // W[i] es el ganador del cruce de la semilla 9 + i (9v24, 10v23, … 16v17).
    const bySeed = new Map<string, string>();
    for (let i = 0; i < 8; i++) {
      const seeded = rank[UECL_DIRECT_SPOTS + i]!;
      const unseeded = rank[UECL_PLAYOFF_SPOTS - 1 - i]!;
      const w = playoffWinners.find((id) => id === seeded || id === unseeded);
      if (w) bySeed.set(String(i), w);
    }
    if (bySeed.size < 8) return;
    // Cuadro: el 1.º se cruza con el ganador del 16.º-17.º (el más flojo), el 2.º con el siguiente, etc.
    const slotOrder = [0, 7, 3, 4, 1, 6, 2, 5];
    const pairs: Array<[string, string]> = slotOrder.map((direct) => [bySeed.get(String(7 - direct))!, rank[direct]!]);
    fillPairSlot(save, slot, "uecl", round, pairs);
    return;
  }
  if (round === UECL_FINAL_ROUND) {
    const winners = winnersOfRound(save, "uecl", round - 1);
    if (winners.length < 2) return;
    slot.fixtures = pair(winners).map(([h, a]) => addFixture(save.fixtures, "uecl", round, h, a));
    return;
  }
  // Cuartos y semifinales.
  if (slot.leg === 2) {
    fillPairSlot(save, slot, "uecl", round, []);
    return;
  }
  const winners = winnersOfRound(save, "uecl", round - 1);
  if (winners.length < 2) return;
  fillPairSlot(save, slot, "uecl", round, pair(winners));
}

function fillPairSlot(
  save: GameSave,
  slot: CalendarSlot,
  competition: Competition,
  round: number,
  pairs: Array<[string, string]>,
) {
  if (slot.leg === 2) {
    const ida = save.calendar.find(
      (s) => s.competition === competition && s.round === round && s.leg === 1 && s.fixtures.length,
    );
    if (!ida) return;
    const ids: string[] = [];
    for (const fid of ida.fixtures) {
      const f = save.fixtures.find((x) => x.id === fid);
      if (!f?.tieId) continue;
      const vuelta = save.fixtures.find((x) => x.tieId === f.tieId && x.leg === 2);
      if (vuelta) ids.push(vuelta.id);
    }
    slot.fixtures = ids;
    return;
  }
  const { ida, vuelta } = addTwoLegged(save.fixtures, competition, round, pairs);
  slot.fixtures = ida;
  const vueltaSlot = save.calendar.find(
    (s) => s.competition === competition && s.round === round && s.leg === 2,
  );
  if (vueltaSlot && vueltaSlot.fixtures.length === 0) vueltaSlot.fixtures = vuelta;
  if (finalRoundOf(competition) === round && !slot.leg) {
    slot.fixtures = pairs.map(([h, a]) => addFixture(save.fixtures, competition, round, h, a));
  }
}

function fillTwoLegRound(save: GameSave, slot: CalendarSlot, competition: Competition, round: number) {
  if (finalRoundOf(competition) === round && !slot.leg) {
    const prevRound = round - 1;
    const winners = winnersOfRound(save, competition, prevRound);
    if (winners.length < 2) return;
    slot.fixtures = pair(winners).map(([h, a]) => addFixture(save.fixtures, competition, round, h, a));
    return;
  }
  const prevRound = slot.round === 8 || slot.round === 9 || slot.round === 2 || slot.round === 3 ? slot.round - 1 : slot.round;
  const winners = winnersOfRound(save, competition, prevRound);
  if (winners.length < 2) return;
  fillPairSlot(save, slot, competition, round, pair(winners));
}

function winnersOfRound(save: GameSave, competition: Competition, round: number): string[] {
  const legs = save.fixtures.filter((f) => f.competition === competition && f.round === round && f.played);
  const twoLeg = legs.some((f) => f.tieId);
  if (!twoLeg) return legs.map((f) => resolveDrawWinner(f, save.seed));
  const ties = new Set(legs.map((f) => f.tieId).filter(Boolean) as string[]);
  const winners: string[] = [];
  for (const tieId of ties) {
    const w = tieWinner(save, tieId);
    if (w) winners.push(w);
  }
  return winners;
}

export function resolveDrawWinner(f: Fixture, seed: number): string {
  if (f.homeGoals === undefined || f.awayGoals === undefined) return f.homeId;
  if (f.homeGoals !== f.awayGoals) return fixtureWinner(f) ?? f.homeId;
  const byPens = penaltyWinner(f);
  if (byPens) return byPens;
  const rng = new Rng(seed + f.id.length);
  return rng.chance(0.5) ? f.homeId : f.awayId;
}

const LOWER_DIVISION_PRIZE_MULTIPLIER = 0.5;
const LOWER_DIVISION_LEAGUES = new Set<LeagueKind>([
  "serieB", "serieC", "serieD", "championship", "leagueOne", "leagueTwo",
  "segunda", "rfef", "primeraFed1", "primeraFed2", "bundesliga2", "bundesliga3",
  "ligue2", "ligue3", "primeraNacional", "primeraBMetro", "argentinaCuarta",
  "argentinaQuinta", "promocionalAmateur", "brasileiraoB", "brasileiraoC",
  "primeira2", "eersteDivisie", "tweedeDivisie", "uslChampionship", "saudiFirstDivision",
]);

export function prizeForPlace(place: number, league: LeagueKind = "serieA") {
  const tables: Record<string, number[]> = {
    serieA: [42, 36, 30, 26, 22, 18, 16, 14, 12, 10, 9, 8, 7, 6, 5, 5, 4, 4, 3, 3],
    // Los premios de las divisiones B e inferiores se reducen al abonarlos.
    serieB: [5, 4.2, 3.6, 3.2, 2.9, 2.6, 2.4, 2.2, 2, 1.9, 1.8, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1, 0.9],
    serieC: [1.8, 1.5, 1.3, 1.15, 1, 0.9, 0.8, 0.7, 0.62, 0.55, 0.48, 0.42, 0.36, 0.3, 0.25, 0.2, 0.17, 0.14, 0.11, 0.08],
    serieD: [0.4, 0.35, 0.3, 0.27, 0.24, 0.21, 0.19, 0.17, 0.15, 0.13, 0.12, 0.11, 0.1, 0.09, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03],
    premier: [55, 48, 42, 36, 32, 28, 24, 21, 18, 16, 14, 12, 11, 10, 9, 8, 7, 6, 5, 5],
    // Championship (24 clubes): derechos de TV y premios muy por debajo de la Premier.
    championship: [12, 10, 9, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4.2, 4, 3.8, 3.6, 3.4, 3.2, 3, 2.8, 2.6, 2.4, 2.2, 2, 1.8],
    // League One (24 clubes): muy por debajo de la Championship.
    leagueOne: [3.6, 3.2, 2.9, 2.7, 2.5, 2.3, 2.1, 1.95, 1.8, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1, 0.95, 0.85, 0.75, 0.7, 0.6, 0.55, 0.5],
    leagueTwo: [2.4, 2.1, 1.8, 1.5, 1.3, 1.1, 0.95, 0.85, 0.75, 0.65, 0.55, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.2, 0.18, 0.15, 0.13, 0.11, 0.09, 0.07],
    // LaLiga Hypermotion (22 clubes): muy por debajo de LaLiga EA Sports (el último cobra ~1,5 M).
    // Primera Federación (20 clubes por grupo): premios muy por debajo de LaLiga Hypermotion (el último cobra ~0,3 M).
    primeraFed1: [2.6, 2.2, 1.9, 1.7, 1.5, 1.35, 1.2, 1.1, 1, 0.9, 0.85, 0.8, 0.7, 0.65, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3],
    primeraFed2: [2.6, 2.2, 1.9, 1.7, 1.5, 1.35, 1.2, 1.1, 1, 0.9, 0.85, 0.8, 0.7, 0.65, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3],
    rfef: [2.6, 2.2, 1.9, 1.7, 1.5, 1.35, 1.2, 1.1, 1, 0.9, 0.85, 0.8, 0.7, 0.65, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3],
    segunda: [10, 8.5, 7.5, 6.8, 6.2, 5.7, 5.2, 4.8, 4.4, 4.1, 3.8, 3.5, 3.3, 3.1, 2.9, 2.7, 2.5, 2.3, 2.1, 1.9, 1.7, 1.5],
    laliga: [48, 42, 36, 32, 28, 24, 20, 18, 16, 14, 12, 11, 10, 9, 8, 7, 6, 5, 4, 4],
    bundesliga: [44, 38, 32, 28, 24, 20, 17, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4, 4],
    // 2. Bundesliga (18 clubes): premios muy por debajo de la Bundesliga (el último cobra ~1 M).
    bundesliga2: [6, 5, 4.4, 3.9, 3.5, 3.2, 2.9, 2.7, 2.5, 2.3, 2.1, 1.9, 1.8, 1.6, 1.5, 1.3, 1.2, 1],
    // 3. Liga (20 clubes): premios muy por debajo de la 2. Bundesliga (el campeón cobra 1,6 M y el último ~0,5 M).
    bundesliga3: [1.6, 1.4, 1.25, 1.15, 1.05, 0.98, 0.92, 0.87, 0.82, 0.78, 0.74, 0.7, 0.66, 0.63, 0.6, 0.57, 0.54, 0.52, 0.5, 0.48],
    ligue1: [46, 40, 34, 30, 26, 22, 19, 16, 14, 12, 11, 10, 9, 8, 7, 6, 5, 5, 4, 4],
    // Ligue 2 (18 clubes): premios muy por debajo de la Ligue 1 (el último cobra ~1 M).
    ligue2: [5.5, 4.7, 4.1, 3.7, 3.3, 3, 2.7, 2.5, 2.3, 2.1, 1.9, 1.8, 1.6, 1.5, 1.4, 1.2, 1.1, 1],
    // Ligue 3 (18 clubes): premios inferiores a los de la Ligue 2.
    ligue3: [2.2, 1.9, 1.7, 1.5, 1.35, 1.2, 1.1, 1, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45],
    argentina: [22, 18, 15, 13, 11, 10, 9, 8, 7, 6, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 3, 2, 2, 2],
    // Primera Nacional (24 clubes): por debajo de la Liga Profesional (el último cobra ~0,8 M).
    primeraNacional: [6, 5, 4.5, 4, 3.6, 3.3, 3, 2.8, 2.6, 2.4, 2.2, 2, 1.9, 1.8, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1, 0.9, 0.8],
    primeraBMetro: [1.3, 1.15, 1.05, 0.95, 0.88, 0.82, 0.76, 0.7, 0.65, 0.6, 0.55, 0.5, 0.46, 0.42, 0.38, 0.35, 0.32, 0.3, 0.28, 0.26],
    argentinaCuarta: [0.3, 0.27, 0.24, 0.22, 0.2, 0.18, 0.16, 0.14, 0.12, 0.1, 0.09, 0.08, 0.07, 0.06, 0.05, 0.045, 0.04, 0.035, 0.03, 0.025],
    argentinaQuinta: [0.1, 0.08, 0.07, 0.06, 0.055, 0.05, 0.045, 0.04, 0.037, 0.034, 0.031, 0.028, 0.025, 0.022, 0.019, 0.016],
    promocionalAmateur: [0.06, 0.055, 0.05, 0.045, 0.04, 0.037, 0.034, 0.031, 0.028, 0.025, 0.023, 0.021, 0.019, 0.017, 0.015, 0.013, 0.012, 0.011, 0.01, 0.009, 0.008, 0.007, 0.006],
    // Série B brasileña (20 clubes): premios muy por debajo de la Série A (el último cobra ~1,1 M frente a los 3 M de la A).
    brasileiraoB: [6, 5, 4.4, 3.9, 3.5, 3.2, 2.9, 2.7, 2.5, 2.3, 2.1, 1.9, 1.8, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.1],
    brasileiraoC: [2.4, 2.1, 1.9, 1.7, 1.5, 1.35, 1.2, 1.05, 0.95, 0.85, 0.75, 0.68, 0.6, 0.52, 0.46, 0.4, 0.36, 0.33, 0.3, 0.27],
    brasileirao: [32, 27, 23, 19, 16, 14, 12, 10, 8, 7, 6, 5, 4.5, 4, 3.5, 3, 2.8, 2.5, 2.2, 2],
    // Primeira Liga (18 clubes): muy por debajo de las cinco grandes ligas (el campeón cobra 14 M y el último ~1,8 M).
    primeira: [14, 11.5, 10, 8.5, 7.2, 6.2, 5.4, 4.8, 4.3, 3.9, 3.5, 3.2, 2.9, 2.6, 2.4, 2.2, 2, 1.8],
    // Liga Portugal 2 (18 clubes): muy por debajo de la Primeira Liga (el campeón cobra 2,8 M y el último ~0,65 M).
    primeira2: [2.8, 2.4, 2.1, 1.9, 1.7, 1.55, 1.4, 1.3, 1.2, 1.1, 1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65],
    eredivisie: [20, 17, 14, 12, 10, 8.5, 7, 6, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.7],
    eersteDivisie: [3, 2.6, 2.3, 2.1, 1.9, 1.7, 1.55, 1.4, 1.3, 1.2, 1.1, 1, 0.9, 0.8, 0.75, 0.7, 0.65, 0.6],
    tweedeDivisie: [0.8, 0.7, 0.62, 0.55, 0.48, 0.42, 0.36, 0.3, 0.25, 0.21, 0.18, 0.15, 0.13, 0.11, 0.09, 0.07, 0.05, 0.03],
    mls: [20, 17, 14, 12, 10, 8.5, 7, 6, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.7],
    uslChampionship: [3, 2.6, 2.3, 2, 1.8, 1.6, 1.4, 1.25, 1.1, 1, 0.9, 0.8, 0.7, 0.6, 0.5],
    saudiProLeague: [35, 30, 26, 22, 19, 16, 14, 12, 10, 8, 7, 6, 5, 4, 3, 2],
    saudiFirstDivision: [5, 4.2, 3.6, 3.1, 2.7, 2.4, 2.1, 1.9, 1.7, 1.5, 1.3, 1.1, 0.9, 0.7, 0.5, 0.3],
    europe: [42, 36, 30, 26, 22, 18, 16, 14, 12, 10, 9, 8, 7, 6, 5, 5, 4, 4, 3, 3],
  };
  const table = tables[league] ?? [0.5];
  const rawPrize = table[place] ?? 0.5;
  const multiplier = LOWER_DIVISION_LEAGUES.has(league) ? LOWER_DIVISION_PRIZE_MULTIPLIER : 1;
  return Math.round(rawPrize * multiplier * 1_000_000);
}

export function awardTrophy(save: GameSave, kind: HonourKind, winnerId: string) {
  if (kind === "scudetto") save.lastChampions.scudetto = winnerId;
  if (kind === "coppa") save.lastChampions.coppa = winnerId;
  if (kind === "carabao") save.lastChampions.carabao = winnerId;
  if (kind === "supercoppa") save.lastChampions.supercoppa = winnerId;
  if (kind === "ucl") save.lastChampions.ucl = winnerId;
  if (kind === "uel") save.lastChampions.uel = winnerId;
  if (kind === "uecl") save.lastChampions.uecl = winnerId;
  if (kind === "libertadores") save.lastChampions.libertadores = winnerId;
  if (kind === "sudamericana") save.lastChampions.sudamericana = winnerId;
  if (kind === "mundial") save.lastChampions.mundial = winnerId;
  if (kind === "intercontinental") save.lastChampions.intercontinental = winnerId;
  if (kind === "transatlantica") save.lastChampions.transatlantica = winnerId;
  if (kind === "coppa") {
    const final = save.fixtures.find(
      (f) => f.competition === "coppa" && f.round === coppaFinalRound(clubById(save.clubId).league) && f.played,
    );
    if (final) save.lastChampions.coppaRunnerUp = winnerId === final.homeId ? final.awayId : final.homeId;
  }

  if (kind === "mundial" || kind === "intercontinental" || kind === "transatlantica") {
    const hist = save.worldHonours ?? [];
    if (!hist.some((h) => h.competition === kind && h.season === save.season)) {
      save.worldHonours = [...hist, { season: save.season, competition: kind, winnerId }];
    }
  }

  if (winnerId !== save.clubId) return;
  const already = save.careerTrophies.some((t) => t.kind === kind && t.season === save.season);
  if (already) return;
  const club = clubById(save.clubId);
  creditTitleIdolatry(save, trophyName(kind, club.league));
  const prize = trophyPrize(kind, club.league);
  const title = `Felicidades por ganar ${trophyName(kind, club.league)}`;
  const label = trophyLabel(kind, save.season, club.league);
  save.honours[kind] += 1;
  save.budget += prize;
  const sponsorBonus = sponsorTitleBonus(save);
  save.budget += sponsorBonus;
  const titleBonus = titleBonusTotal(save);
  if (titleBonus > 0) save.budget -= titleBonus;
  save.trophies.push(label);
  save.careerTrophies.push({
    id: uid("tr"),
    kind,
    season: save.season,
    label,
    prize,
    clubId: save.clubId,
  });
  const body = `${club.name} levanta ${label}. Premio: ${formatMoney(prize)}.${sponsorBonus > 0 ? ` Bonus de patrocinadores: ${formatMoney(sponsorBonus)}.` : ""}${titleBonus > 0 ? ` Bonus por título a la plantilla: ${formatMoney(titleBonus)}.` : ""}`;
  save.news.unshift({ id: uid("n"), week: save.week, tone: "good", title, body });
  save.popups.push({
    id: uid("pop"),
    kind: "trophy",
    tone: "good",
    title,
    body,
    prize,
  });
}

export function maybeAwardCup(save: GameSave, competition: Fixture["competition"], finalRound: number, kind: HonourKind) {
  const final = save.fixtures.find(
    (f) => f.competition === competition && f.round === finalRound && f.played,
  );
  if (!final) return;
  const w = resolveDrawWinner(final, save.seed);
  if (competition === "kingsCup") {
    save.lastChampions.kingsCup = w;
    save.lastChampions.kingsCupRunnerUp = w === final.homeId ? final.awayId : final.homeId;
  }
  if (competition === "saudiSuperCup") {
    save.lastChampions.saudiSuperCup = w;
    save.lastChampions.saudiSuperCupRunnerUp = w === final.homeId ? final.awayId : final.homeId;
  }
  awardTrophy(save, kind, w);
}

export function applyFixtureToWorld(save: GameSave, fixture: Fixture, hg: number, ag: number) {
  const league = competitionToLeague(fixture.competition);
  if (league) {
    // Partidas viejas (antes de la Serie B / 2. Bundesliga) no traen su tabla: se crea vacía en vez de romper.
    if (!save.leagueTables[league]) save.leagueTables[league] = domesticIds(league).map(emptyStanding);
    applyResultToTable(save.leagueTables[league], fixture.homeId, fixture.awayId, hg, ag);
    const userLeague = playableLeague(clubById(save.clubId).league);
    save.standings = save.leagueTables[userLeague];
  }
  if (fixture.competition === "ucl" && fixture.round <= UCL_LEAGUE_ROUNDS) {
    applyResultToTable(save.uclStandings, fixture.homeId, fixture.awayId, hg, ag);
  }
  if (fixture.competition === "uel" && fixture.round <= UEL_LEAGUE_ROUNDS) {
    applyResultToTable(save.uelStandings, fixture.homeId, fixture.awayId, hg, ag);
  }
  if (fixture.competition === "uecl" && fixture.round <= UECL_LEAGUE_ROUNDS) {
    applyResultToTable(save.ueclStandings, fixture.homeId, fixture.awayId, hg, ag);
  }
  if (fixture.competition === "libertadores" && fixture.round <= 6) {
    applyResultToTable(save.libStandings, fixture.homeId, fixture.awayId, hg, ag);
  }
  if (fixture.competition === "mundial" && fixture.round <= MUNDIAL_GROUP_ROUNDS) {
    applyResultToTable(save.mundialStandings ?? [], fixture.homeId, fixture.awayId, hg, ag);
  }
}

export { COMP_THEME, isDomesticCompetition };

/**
 * Partidas guardadas con la Champions vieja (32 equipos en 8 grupos): al cargarlas se pasa a la fase de liga de 36.
 * - Se descartan los partidos y fechas viejas de la Champions (lo ya jugado en ese formato no se puede conservar).
 * - Se completan los 36 participantes con equipos de relleno que no estén en otra copa.
 * - Las fechas de la Champions se reubican en las jornadas que todavía quedan; si ya no alcanzan, esa temporada
 *   se queda sin Champions y la próxima ya arranca con el formato nuevo.
 */
export function migrateUclToLeaguePhase(save: GameSave) {
  if (!save.fixtures?.length || !save.calendar?.length) return;
  const groups = save.uclGroups ?? [];
  const flat = groups.flat();
  if (groups.length === 1 && flat.length === UCL_TEAMS) return;

  const cur = save.calendar[save.cursor];
  const nowDate = cur?.date ?? "";
  const rng = new Rng(save.seed + 4242);
  const elsewhere = new Set<string>([
    ...(save.uelTeams ?? []),
    ...(save.ueclTeams ?? []),
    ...(save.libGroups ?? []).flat(),
    ...(save.sudTeams ?? []),
  ]);
  const base = flat.filter((id) => !elsewhere.has(id));
  const pool = rankedByPrestige([...EUROPE_GHOST_IDS, ...CLUBS.filter((c) => c.league === "europe").map((c) => c.id)]);
  const teams = fillExclusive(base, pool, UCL_TEAMS, new Set([...elsewhere, ...base]));

  save.fixtures = save.fixtures.filter((f) => f.competition !== "ucl");
  save.calendar = save.calendar.filter((s) => s.competition !== "ucl");
  const resetCursor = () => {
    const i = save.calendar.findIndex((s) => (s.date ?? "") >= nowDate);
    save.cursor = i >= 0 ? i : save.calendar.length;
  };

  const leagueComp = domesticCompetition(clubById(save.clubId).league);
  const leagueSlots = save.calendar.filter((s) => s.competition === leagueComp);
  const maxMd = leagueSlots.length;
  const firstCand = leagueSlots.find((s) => !nowDate || addDays(s.date ?? "", 3) > nowDate)?.round ?? maxMd + 1;
  const desired = [3, 5, 7, 9, 11, 13, 15, 17, 19, 20, 22, 23, 26, 27, 30, 31, 36];
  const mds: number[] = [];
  let prev = firstCand - 1;
  for (const d of desired) {
    prev = Math.max(d, prev + 1, firstCand);
    mds.push(prev);
  }
  const fits = teams.length === UCL_TEAMS && mds[mds.length - 1]! <= maxMd;

  // Objetivos de la dirigencia sobre la Champions: las rondas se corren (7→10, 8→11, 9→12).
  if (save.board) {
    for (const g of save.board.goals) {
      if (g.comp !== "ucl" || g.target < 7 || g.target > 9) continue;
      g.target += 3;
      g.label =
        g.target === 10
          ? "Superar la fase de liga y llegar a octavos (Champions League)"
          : g.target === 11
            ? "Llegar a los cuartos de final (Champions League)"
            : "Llegar a las semifinales (Champions League)";
    }
  }

  if (!fits) {
    save.uclGroups = [];
    save.uclStandings = [];
    resetCursor();
    return;
  }

  const dateOf = (md: number) => addDays(leagueSlots.find((s) => s.round === md)?.date ?? nowDate, 3);
  const slots: CalendarSlot[] = [];
  const push = (round: number, leg: 1 | 2 | undefined, ids: string[], md: number) => {
    slots.push({
      id: `ucl-${round}-${leg ?? 0}-m${slots.length}`,
      competition: "ucl",
      round,
      title: knockoutRoundLabel("ucl", round, leg),
      fixtures: ids,
      date: dateOf(md),
      leg,
    });
  };
  buildUclLeaguePhase(teams, rng).forEach((matches, i) => {
    const ids = matches.map(([h, a]) => addFixture(save.fixtures, "ucl", i + 1, h, a));
    push(i + 1, undefined, ids, mds[i]!);
  });
  const ko: Array<[number, 1 | 2 | undefined]> = [
    [UCL_PLAYOFF_ROUND, 1],
    [UCL_PLAYOFF_ROUND, 2],
    [UCL_R16_ROUND, 1],
    [UCL_R16_ROUND, 2],
    [UCL_R16_ROUND + 1, 1],
    [UCL_R16_ROUND + 1, 2],
    [UCL_R16_ROUND + 2, 1],
    [UCL_R16_ROUND + 2, 2],
    [UCL_FINAL_ROUND, undefined],
  ];
  ko.forEach(([round, leg], i) => push(round, leg, [], mds[UCL_LEAGUE_ROUNDS + i]!));
  save.calendar.push(...slots);
  save.calendar.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || a.id.localeCompare(b.id));
  save.uclGroups = [teams];
  save.uclStandings = teams.map(emptyStanding);
  resetCursor();
}

/**
 * Partidas guardadas con la Europa League vieja (16 equipos, solo eliminatorias): al cargarlas pasan a la fase de
 * liga de 36 equipos con el mismo criterio que la migración de la Champions.
 * - Se descartan los partidos y fechas viejas de la Europa League.
 * - Se completan los 36 participantes con equipos de relleno que no estén en otra copa.
 * - Las fechas se reubican en las jornadas que todavía quedan; si ya no alcanzan, esa temporada se queda sin
 *   Europa League y la próxima ya arranca con el formato nuevo.
 */
export function migrateUelToLeaguePhase(save: GameSave) {
  if (!save.fixtures?.length || !save.calendar?.length) return;
  const current = save.uelTeams ?? [];
  if (current.length === UEL_TEAMS) return;

  const cur = save.calendar[save.cursor];
  const nowDate = cur?.date ?? "";
  const rng = new Rng(save.seed + 7002);
  const elsewhere = new Set<string>([
    ...(save.uclGroups ?? []).flat(),
    ...(save.ueclTeams ?? []),
    ...(save.libGroups ?? []).flat(),
    ...(save.sudTeams ?? []),
  ]);
  const base = current.filter((id) => !elsewhere.has(id));
  const pool = rankedByPrestige([...EUROPE_GHOST_IDS, ...CLUBS.filter((c) => c.league === "europe").map((c) => c.id)]);
  const teams = fillExclusive(base, pool, UEL_TEAMS, new Set([...elsewhere, ...base]));

  save.fixtures = save.fixtures.filter((f) => f.competition !== "uel");
  save.calendar = save.calendar.filter((s) => s.competition !== "uel");
  const resetCursor = () => {
    const i = save.calendar.findIndex((s) => (s.date ?? "") >= nowDate);
    save.cursor = i >= 0 ? i : save.calendar.length;
  };

  const leagueComp = domesticCompetition(clubById(save.clubId).league);
  const leagueSlots = save.calendar.filter((s) => s.competition === leagueComp);
  const maxMd = leagueSlots.length;
  const firstCand = leagueSlots.find((s) => !nowDate || addDays(s.date ?? "", 5) > nowDate)?.round ?? maxMd + 1;
  const desired = [3, 5, 7, 9, 11, 13, 15, 17, 19, 20, 22, 23, 26, 27, 30, 31, 35];
  const mds: number[] = [];
  let prev = firstCand - 1;
  for (const d of desired) {
    prev = Math.max(d, prev + 1, firstCand);
    mds.push(prev);
  }
  const fits = teams.length === UEL_TEAMS && mds[mds.length - 1]! <= maxMd;

  // Objetivos de la dirigencia sobre la Europa League: las rondas viejas (2 = cuartos, 3 = semifinales) se corren.
  if (save.board) {
    for (const g of save.board.goals) {
      if (g.comp !== "uel" || g.target < 2 || g.target > 3) continue;
      g.target += 9;
      g.label =
        g.target === 11 ? "Llegar a los cuartos de final (Europa League)" : "Llegar a las semifinales (Europa League)";
    }
  }

  if (!fits) {
    save.uelTeams = [];
    save.uelStandings = [];
    resetCursor();
    return;
  }

  const dateOf = (md: number) => addDays(leagueSlots.find((s) => s.round === md)?.date ?? nowDate, 5);
  const slots: CalendarSlot[] = [];
  const push = (round: number, leg: 1 | 2 | undefined, ids: string[], md: number) => {
    slots.push({
      id: `uel-${round}-${leg ?? 0}-m${slots.length}`,
      competition: "uel",
      round,
      title: knockoutRoundLabel("uel", round, leg),
      fixtures: ids,
      date: dateOf(md),
      leg,
    });
  };
  buildUelLeaguePhase(teams, rng).forEach((matches, i) => {
    const ids = matches.map(([h, a]) => addFixture(save.fixtures, "uel", i + 1, h, a));
    push(i + 1, undefined, ids, mds[i]!);
  });
  const ko: Array<[number, 1 | 2 | undefined]> = [
    [UEL_PLAYOFF_ROUND, 1],
    [UEL_PLAYOFF_ROUND, 2],
    [UEL_R16_ROUND, 1],
    [UEL_R16_ROUND, 2],
    [UEL_R16_ROUND + 1, 1],
    [UEL_R16_ROUND + 1, 2],
    [UEL_R16_ROUND + 2, 1],
    [UEL_R16_ROUND + 2, 2],
    [UEL_FINAL_ROUND, undefined],
  ];
  ko.forEach(([round, leg], i) => push(round, leg, [], mds[UEL_LEAGUE_ROUNDS + i]!));
  save.calendar.push(...slots);
  save.calendar.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || a.id.localeCompare(b.id));
  save.uelTeams = teams;
  save.uelStandings = teams.map(emptyStanding);
  resetCursor();
}

/**
 * Partidas guardadas con la Conference League vieja (16 equipos, solo eliminatorias): al cargarlas pasan a la fase de
 * liga de 36 equipos con 6 bombos, con el mismo criterio que la migración de la Europa League.
 * - Se descartan los partidos y fechas viejas de la Conference.
 * - Se completan los 36 participantes con equipos de relleno que no estén en otra copa.
 * - Las fechas se reubican en las jornadas que todavía quedan; si ya no alcanzan, esa temporada se queda sin
 *   Conference y la próxima ya arranca con el formato nuevo.
 */
export function migrateUeclToLeaguePhase(save: GameSave) {
  if (!save.fixtures?.length || !save.calendar?.length) return;
  const current = save.ueclTeams ?? [];
  if (current.length === UECL_TEAMS) return;

  const cur = save.calendar[save.cursor];
  const nowDate = cur?.date ?? "";
  const rng = new Rng(save.seed + 7102);
  const elsewhere = new Set<string>([
    ...(save.uclGroups ?? []).flat(),
    ...(save.uelTeams ?? []),
    ...(save.libGroups ?? []).flat(),
    ...(save.sudTeams ?? []),
  ]);
  const base = current.filter((id) => !elsewhere.has(id));
  const pool = rankedByPrestige([...EUROPE_GHOST_IDS, ...CLUBS.filter((c) => c.league === "europe").map((c) => c.id)]);
  const teams = fillExclusive(base, pool, UECL_TEAMS, new Set([...elsewhere, ...base]));

  save.fixtures = save.fixtures.filter((f) => f.competition !== "uecl");
  save.calendar = save.calendar.filter((s) => s.competition !== "uecl");
  const resetCursor = () => {
    const i = save.calendar.findIndex((s) => (s.date ?? "") >= nowDate);
    save.cursor = i >= 0 ? i : save.calendar.length;
  };

  const leagueComp = domesticCompetition(clubById(save.clubId).league);
  const leagueSlots = save.calendar.filter((s) => s.competition === leagueComp);
  const maxMd = leagueSlots.length;
  const firstCand = leagueSlots.find((s) => !nowDate || addDays(s.date ?? "", 5) > nowDate)?.round ?? maxMd + 1;
  const desired = [4, 6, 8, 10, 12, 14, 19, 20, 22, 23, 26, 27, 30, 31, 34];
  const mds: number[] = [];
  let prev = firstCand - 1;
  for (const d of desired) {
    prev = Math.max(d, prev + 1, firstCand);
    mds.push(prev);
  }
  const fits = teams.length === UECL_TEAMS && mds[mds.length - 1]! <= maxMd;

  // Objetivos de la dirigencia sobre la Conference: las rondas viejas (2 = cuartos, 3 = semifinales) se corren.
  if (save.board) {
    for (const g of save.board.goals) {
      if (g.comp !== "uecl" || g.target < 2 || g.target > 3) continue;
      g.target += 7;
      g.label =
        g.target === 9 ? "Llegar a los cuartos de final (Conference League)" : "Llegar a las semifinales (Conference League)";
    }
  }

  if (!fits) {
    save.ueclTeams = [];
    save.ueclStandings = [];
    resetCursor();
    return;
  }

  const dateOf = (md: number) => addDays(leagueSlots.find((s) => s.round === md)?.date ?? nowDate, 5);
  const slots: CalendarSlot[] = [];
  const push = (round: number, leg: 1 | 2 | undefined, ids: string[], md: number) => {
    slots.push({
      id: `uecl-${round}-${leg ?? 0}-m${slots.length}`,
      competition: "uecl",
      round,
      title: knockoutRoundLabel("uecl", round, leg),
      fixtures: ids,
      date: dateOf(md),
      leg,
    });
  };
  buildUeclLeaguePhase(teams, rng).forEach((matches, i) => {
    const ids = matches.map(([h, a]) => addFixture(save.fixtures, "uecl", i + 1, h, a));
    push(i + 1, undefined, ids, mds[i]!);
  });
  const ko: Array<[number, 1 | 2 | undefined]> = [
    [UECL_PLAYOFF_ROUND, 1],
    [UECL_PLAYOFF_ROUND, 2],
    [UECL_R16_ROUND, 1],
    [UECL_R16_ROUND, 2],
    [UECL_R16_ROUND + 1, 1],
    [UECL_R16_ROUND + 1, 2],
    [UECL_R16_ROUND + 2, 1],
    [UECL_R16_ROUND + 2, 2],
    [UECL_FINAL_ROUND, undefined],
  ];
  ko.forEach(([round, leg], i) => push(round, leg, [], mds[UECL_LEAGUE_ROUNDS + i]!));
  save.calendar.push(...slots);
  save.calendar.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || a.id.localeCompare(b.id));
  save.ueclTeams = teams;
  save.ueclStandings = teams.map(emptyStanding);
  resetCursor();
}
