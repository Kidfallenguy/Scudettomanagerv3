import {
  FED_RESERVE_PARENT,
  FED_START_GROUP,
  applyDivisions,
  clubById,
  currentDivisions,
  domesticIds,
  type Division,
  type EnglishDivision,
} from "./clubs";
import { QUAL_SPOTS } from "./competitions";
import { formatMoney, uid } from "./format";
import { Rng } from "./rng";
import { autoLineup, clubQuality } from "./sim";
import { sortTable } from "./world";
import type { GameSave, PlayableLeagueId, Standing } from "./types";

/** Ayuda económica (paracaídas) que recibe el club del usuario al descender de la Premier. */
export const PARACHUTE = 12_000_000;
/** Premio económico por ascender a la Premier (derechos de TV, taquilla y patrocinios nuevos). */
export const PROMOTION_BONUS = 9_000_000;
/** Paracaídas y premio por ascenso en Argentina (la Liga Profesional maneja mucho menos dinero que la Premier). */
export const ARGENTINA_PARACHUTE = 4_000_000;
export const ARGENTINA_PROMOTION_BONUS = 3_000_000;
/** Lo mismo para el descenso y el ascenso entre Serie A y Serie B (ligas más modestas que la inglesa). */
export const PARACHUTE_ITALY = 8_000_000;
export const PROMOTION_BONUS_ITALY = 6_000_000;
/** Lo mismo para el descenso y el ascenso entre Bundesliga y 2. Bundesliga. */
export const PARACHUTE_GERMANY = 8_000_000;
export const PROMOTION_BONUS_GERMANY = 6_000_000;
/** Lo mismo para el descenso y el ascenso entre Ligue 1 y Ligue 2. */
export const PARACHUTE_FRANCE = 8_000_000;
export const PROMOTION_BONUS_FRANCE = 6_000_000;
/** Descenso de LaLiga Hypermotion a la Primera Federación y ascenso de la Primera Federación a LaLiga Hypermotion. */
export const PARACHUTE_FED = 1_500_000;
export const PROMOTION_BONUS_FED = 1_000_000;
/** Lo mismo para el descenso y el ascenso entre la Primeira Liga y la Liga Portugal 2. */
export const PARACHUTE_PORTUGAL = 4_000_000;
export const PROMOTION_BONUS_PORTUGAL = 3_000_000;
/** Lo mismo para el descenso y el ascenso entre la Série A y la Série B del Brasileirão. */
export const PARACHUTE_BRAZIL = 6_000_000;
export const PROMOTION_BONUS_BRAZIL = 4_000_000;

/** Ascensos y descensos entre la Championship y la League One (la League One maneja bastante menos dinero). */
export const PARACHUTE_LEAGUE_ONE = 3_000_000;
export const PROMOTION_BONUS_LEAGUE_ONE = 2_000_000;
/** Ayuda económica menor para la transición League One ↔ League Two. */
export const PARACHUTE_LEAGUE_TWO = 1_500_000;
export const PROMOTION_BONUS_LEAGUE_TWO = 1_000_000;

export interface PlayoffMatch {
  homeId: string;
  awayId: string;
  homeGoals: number;
  awayGoals: number;
  note?: string;
}

export interface PlayoffResult {
  /** Semifinales (ida y vuelta) y final, para contarlas en las noticias. */
  semis: Array<{ a: string; b: string; legs: [PlayoffMatch, PlayoffMatch]; winner: string }>;
  final: { a: string; b: string; match: PlayoffMatch; winner: string };
  winner: string;
}

/** Playoff de la Ligue 2 (4.º vs 5.º, el ganador contra el 3.º) y barrage contra el 16.º de la Ligue 1. */
export interface BarrageResult {
  /** 4.º vs 5.º (partido único en casa del 4.º). */
  first: { a: string; b: string; match: PlayoffMatch; winner: string };
  /** Ganador de la primera eliminatoria vs 3.º (partido único en casa del 3.º). */
  second: { a: string; b: string; match: PlayoffMatch; winner: string };
  /** Ganador del playoff de la Ligue 2 vs 16.º de la Ligue 1, a ida y vuelta (la ida en casa del club de Ligue 2). */
  barrage: { l2Id: string; l1Id: string; legs: [PlayoffMatch, PlayoffMatch]; winner: string } | null;
  /** Club que juega en la Ligue 1 la temporada siguiente por esta vía (el 16.º o el ganador del playoff). */
  winner: string;
}

/**
 * Playoff de ascenso/permanencia de Portugal: el 3.º de la Liga Portugal 2 contra el 16.º de la Primeira Liga, a ida y vuelta
 * (la ida en casa del club de la Liga Portugal 2). El ganador juega en la Primeira Liga la temporada siguiente.
 */
export interface TiePlayoffResult {
  l2Id: string;
  l1Id: string;
  legs: [PlayoffMatch, PlayoffMatch];
  winner: string;
}

export interface DivisionMoves {
  /** Descienden de la 1.ª división (3). */
  relegated: string[];
  /** Ascienden de la 2.ª: 2 directos + el ganador del playoff. */
  promoted: string[];
  direct: string[];
  playoff: PlayoffResult | null;
  /** Solo Francia: playoff de la Ligue 2 + barrage contra el 16.º de la Ligue 1. */
  barrage?: BarrageResult | null;
  /** Solo Portugal: playoff a dos partidos entre el 3.º de la Liga Portugal 2 y el 16.º de la Primeira Liga. */
  tiePlayoff?: TiePlayoffResult | null;
  /** Descienden de LaLiga Hypermotion a la Primera Federación (España: los 4 últimos + los filiales que no pueden seguir). */
  droppedToThird?: string[];
  /** Suben de la Primera Federación a LaLiga Hypermotion (los 2 campeones de grupo + los 2 ganadores del playoff) para mantener los 22 clubes. */
  raisedFromThird?: string[];
  /** Solo España: los dos campeones de grupo (ascenso directo) y el playoff de la Primera Federación. */
  fedDirect?: string[];
  fedPlayoff?: FedPlayoffResult | null;
}

/** Un par de divisiones enlazadas por ascensos y descensos. */
interface DivisionPair {
  top: PlayableLeagueId;
  second: PlayableLeagueId;
  topTitle: string;
  secondTitle: string;
  /** Dónde se juega la final del playoff (para la noticia). */
  finalVenue: string;
  cups: string;
  /** Cuántos de la 2.ª bajan a la 3.ª (0 = no existe 3.ª división jugable). */
  secondDrop: number;
  /** Cómo se llama la eliminatoria por el último ascenso (noticias y avisos). */
  playoffName: string;
  /** Cómo se nombra en una frase ("ganar el playoff", "ganar el Reducido"). */
  playoffWord: string;
  /** Ascenso económico y paracaídas del club del usuario (por defecto los de la Premier). */
  parachute: number;
  promotionBonus: number;
  /** Francia: 2 descensos directos (17.º y 18.º), el 16.º juega el barrage contra el ganador del playoff de la Ligue 2 (4.º vs 5.º, ganador vs 3.º). */
  barrage?: boolean;
  /** Portugal: 2 descensos directos (17.º y 18.º) y el 16.º de la Primeira juega contra el 3.º de la Liga Portugal 2, a ida y vuelta. */
  tiePlayoff?: boolean;
  /**
  * Nombre de la división que estaría debajo de la 2.ª si todavía no es jugable (National League): los últimos de la 2.ª no bajan
   * (el club conserva la plaza y el club del usuario recibe un aviso).
   */
  lowerTitle?: string;
  /** Argentina juega por año calendario: la temporada se rotula "2026" y no "2026/27". */
  calendarYear?: boolean;
  /** Solo se escriben noticias si el club del usuario es de este país (Italia y Alemania; las demás se escriben siempre, como antes). */
  newsOnlyForCountry?: boolean;
  /** Generador aleatorio propio del playoff (para no alterar los sorteos de las demás ligas): [multiplicador de temporada, constante]. */
  rngSalt?: [number, number];
}

const PAIRS: DivisionPair[] = [
  {
    top: "primeraNacional",
    second: "primeraBMetro",
    topTitle: "la Primera Nacional",
    secondTitle: "la Primera B Metro / Federal A",
    finalVenue: "campo neutral",
    cups: "Este año también juegas la Copa Argentina.",
    secondDrop: 0,
    playoffName: "Reducido de la Tercera División Argentina",
    playoffWord: "Reducido",
    parachute: ARGENTINA_PARACHUTE,
    promotionBonus: ARGENTINA_PROMOTION_BONUS,
    calendarYear: true,
    newsOnlyForCountry: true,
    rngSalt: [173, 43],
  },
  {
    top: "primeraBMetro",
    second: "argentinaCuarta",
    topTitle: "la Tercera División Argentina",
    secondTitle: "la Cuarta División Argentina",
    finalVenue: "campo neutral",
    cups: "Este año también juegas la Copa Argentina.",
    secondDrop: 0,
    playoffName: "Playoff de ascenso",
    playoffWord: "playoff",
    parachute: 250_000,
    promotionBonus: 300_000,
    calendarYear: true,
    newsOnlyForCountry: true,
    rngSalt: [181, 53],
  },
  {
    top: "argentinaCuarta",
    second: "argentinaQuinta",
    topTitle: "la Cuarta División Argentina",
    secondTitle: "la Quinta División Argentina",
    finalVenue: "campo neutral",
    cups: "Este año también juegas la Copa Argentina.",
    secondDrop: 0,
    playoffName: "Playoff de ascenso",
    playoffWord: "playoff",
    parachute: 100_000,
    promotionBonus: 150_000,
    calendarYear: true,
    newsOnlyForCountry: true,
    rngSalt: [193, 59],
  },
  {
    top: "argentinaQuinta",
    second: "promocionalAmateur",
    topTitle: "la Quinta División Argentina",
    secondTitle: "el Torneo Promocional Amateur",
    finalVenue: "campo neutral",
    cups: "El Torneo Promocional Amateur no participa en la Copa Argentina.",
    secondDrop: 0,
    playoffName: "Playoff de ascenso",
    playoffWord: "playoff",
    parachute: 50_000,
    promotionBonus: 75_000,
    calendarYear: true,
    newsOnlyForCountry: true,
    rngSalt: [211, 67],
  },
  {
    top: "saudiProLeague",
    second: "saudiFirstDivision",
    topTitle: "la Saudi Pro League",
    secondTitle: "la Saudi First Division League",
    finalVenue: "campo neutral",
    cups: "No hay copas saudíes implementadas en esta versión.",
    secondDrop: 0,
    playoffName: "Playoff de ascenso",
    playoffWord: "playoff",
    parachute: 2_000_000,
    promotionBonus: 1_000_000,
    newsOnlyForCountry: true,
    rngSalt: [271, 61],
  },
  {
    // Reserve teams are excluded from Eredivisie promotion while their parent remains in the top tier.
    top: "eredivisie",
    second: "eersteDivisie",
    topTitle: "la Eredivisie",
    secondTitle: "la Eerste Divisie",
    finalVenue: "campo neutral",
    cups: "Este año compites en la liga neerlandesa.",
    secondDrop: 0,
    playoffName: "Playoff de ascenso",
    playoffWord: "playoff",
    parachute: 2_000_000,
    promotionBonus: 1_500_000,
    newsOnlyForCountry: true,
    rngSalt: [257, 53],
  },
  {
    // Promotion/relegation directly links the supplied Tweede Divisie clubs to Eerste; Jong sides stay ineligible to promote.
    top: "eersteDivisie",
    second: "tweedeDivisie",
    topTitle: "la Eerste Divisie",
    secondTitle: "la Tweede Divisie",
    finalVenue: "campo neutral",
    cups: "Este año compites en la Eerste Divisie.",
    secondDrop: 0,
    playoffName: "Playoff de ascenso",
    playoffWord: "playoff",
    parachute: 400_000,
    promotionBonus: 250_000,
    newsOnlyForCountry: true,
    rngSalt: [269, 59],
  },
  {
    top: "premier",
    second: "championship",
    topTitle: "la Premier League",
    secondTitle: "la Championship",
    finalVenue: "Wembley",
    cups: "Este año también juegas la FA Cup y la Carabao Cup como equipo de Premier.",
    secondDrop: 0,
    playoffName: "Playoff de ascenso",
    playoffWord: "playoff",
    parachute: PARACHUTE,
    promotionBonus: PROMOTION_BONUS,
  },
  {
    // Championship ↔ League One: 3 descensos y 3 ascensos (2 directos + playoff 3.º-6.º).
    top: "championship",
    second: "leagueOne",
    topTitle: "la Championship",
    secondTitle: "la League One",
    finalVenue: "Wembley",
    cups: "Este año también juegas la FA Cup y la Carabao Cup como equipo de Championship.",
    secondDrop: 0,
    playoffName: "Playoff de ascenso",
    playoffWord: "playoff",
    parachute: PARACHUTE_LEAGUE_ONE,
    promotionBonus: PROMOTION_BONUS_LEAGUE_ONE,
    newsOnlyForCountry: true,
    rngSalt: [251, 43],
  },
  {
    // League One ↔ League Two: 4 descensos desde League One y 3 ascensos directos más playoff 4.º-7.º.
    // EFL League Two solo desciende 2 clubes; se conservan aquí mientras National League no sea jugable.
    top: "leagueOne",
    second: "leagueTwo",
    topTitle: "la League One",
    secondTitle: "la League Two",
    finalVenue: "Wembley",
    cups: "Este año también juegas la FA Cup y la Carabao Cup.",
    secondDrop: 0,
    playoffName: "Playoff de ascenso",
    playoffWord: "playoff",
    parachute: PARACHUTE_LEAGUE_TWO,
    promotionBonus: PROMOTION_BONUS_LEAGUE_TWO,
    newsOnlyForCountry: true,
    rngSalt: [263, 47],
    lowerTitle: "la National League",
  },
  {
    top: "laliga",
    second: "segunda",
    topTitle: "LaLiga EA Sports",
    secondTitle: "LaLiga Hypermotion",
    finalVenue: "campo neutral",
    cups: "Este año también juegas la Copa del Rey como equipo de LaLiga EA Sports.",
    secondDrop: 4,
    playoffName: "Playoff de ascenso",
    playoffWord: "playoff",
    parachute: PARACHUTE,
    promotionBonus: PROMOTION_BONUS,
  },
  {
    // Liga Profesional ↔ Primera Nacional: bajan los 2 últimos de la Liga Profesional; sube el campeón de la Primera
    // Nacional y el ganador del Reducido (2.º a 5.º). Los dos últimos de Primera Nacional descienden en el par inferior.
    top: "argentina",
    second: "primeraNacional",
    topTitle: "la Liga Profesional",
    secondTitle: "la Primera Nacional",
    finalVenue: "campo neutral",
    cups: "Este año también juegas la Copa Argentina como equipo de la Liga Profesional.",
    secondDrop: 0,
    playoffName: "Reducido",
    playoffWord: "Reducido",
    parachute: ARGENTINA_PARACHUTE,
    promotionBonus: ARGENTINA_PROMOTION_BONUS,
    calendarYear: true,
  },
  {
    // Serie A ↔ Serie B: bajan los 3 últimos de la Serie A; suben los 2 primeros de la Serie B y el ganador del playoff.
    top: "serieA",
    second: "serieB",
    topTitle: "la Serie A",
    secondTitle: "la Serie B",
    finalVenue: "campo neutral",
    cups: "Este año también juegas la Coppa Italia, la Supercoppa y las copas europeas si te clasificas, como equipo de Serie A.",
    secondDrop: 0,
    playoffName: "Playoff de ascenso",
    playoffWord: "playoff",
    parachute: PARACHUTE_ITALY,
    promotionBonus: PROMOTION_BONUS_ITALY,
    newsOnlyForCountry: true,
    rngSalt: [211, 13],
  },
  {
    // Bundesliga ↔ 2. Bundesliga: misma mecánica (la 3. Liga no es jugable, así que nadie baja de la 2. Bundesliga).
    top: "bundesliga",
    second: "bundesliga2",
    topTitle: "la Bundesliga",
    secondTitle: "la 2. Bundesliga",
    finalVenue: "campo neutral",
    cups: "Este año también juegas la DFB-Pokal, la DFL-Supercup y las copas europeas si te clasificas, como equipo de Bundesliga.",
    secondDrop: 0,
    playoffName: "Playoff de ascenso",
    playoffWord: "playoff",
    parachute: PARACHUTE_GERMANY,
    promotionBonus: PROMOTION_BONUS_GERMANY,
    newsOnlyForCountry: true,
    rngSalt: [223, 29],
  },
  {
    // Ligue 1 ↔ Ligue 2 (18 clubes cada una): bajan los 2 últimos de la Ligue 1 y suben los 2 primeros de la Ligue 2. El 16.º de
    // la Ligue 1 juega el barrage contra el ganador del playoff de la Ligue 2 (4.º vs 5.º, el ganador contra el 3.º). La
    // Ligue 2 comparte sus plazas de descenso con la Ligue 3, conectada en el siguiente par de divisiones.
    top: "ligue1",
    second: "ligue2",
    topTitle: "la Ligue 1",
    secondTitle: "la Ligue 2",
    finalVenue: "campo neutral",
    cups: "Este año también juegas la Coupe de France y las copas europeas si te clasificas, como equipo de Ligue 1.",
    secondDrop: 0,
    playoffName: "Playoff de ascenso",
    playoffWord: "playoff",
    parachute: PARACHUTE_FRANCE,
    promotionBonus: PROMOTION_BONUS_FRANCE,
    newsOnlyForCountry: true,
    rngSalt: [233, 31],
    barrage: true,
  },
  {
    // La Ligue 2 ya marca tres descensos y la Ligue 3 incorpora esos clubes con tres ascensos directos.
    top: "ligue2",
    second: "ligue3",
    topTitle: "la Ligue 2",
    secondTitle: "la Ligue 3",
    finalVenue: "campo neutral",
    cups: "Esta temporada compites en la Ligue 3.",
    secondDrop: 0,
    playoffName: "Playoff de ascenso",
    playoffWord: "playoff",
    parachute: PARACHUTE_FRANCE,
    promotionBonus: PROMOTION_BONUS_FRANCE,
    newsOnlyForCountry: true,
    rngSalt: [239, 37],
  },
  {
    // Primeira Liga ↔ Liga Portugal 2 (18 clubes cada una): bajan los 2 últimos de la Primeira y suben los 2 primeros de la Liga
    // Portugal 2. El 16.º de la Primeira juega a ida y vuelta contra el 3.º de la Liga Portugal 2 y el ganador ocupa la plaza en
    // la Primeira. La Liga 3 no es jugable (secondDrop 0): nadie baja de la Liga Portugal 2.
    top: "primeira",
    second: "primeira2",
    topTitle: "la Primeira Liga",
    secondTitle: "la Liga Portugal 2",
    finalVenue: "campo neutral",
    cups: "Este año también juegas la Taça de Portugal, la Taça da Liga, la Supertaça si te toca y las copas europeas si te clasificas, como equipo de la Primeira Liga.",
    secondDrop: 0,
    playoffName: "Playoff de ascenso",
    playoffWord: "playoff",
    parachute: PARACHUTE_PORTUGAL,
    promotionBonus: PROMOTION_BONUS_PORTUGAL,
    newsOnlyForCountry: true,
    rngSalt: [241, 41],
    tiePlayoff: true,
  },
  {
    // Brasileirão Série A ↔ Série B: bajan los 4 últimos de la Série A y suben los 4 primeros de la Série B.
    top: "brasileirao",
    second: "brasileiraoB",
    topTitle: "el Brasileirão Série A",
    secondTitle: "la Série B",
    finalVenue: "campo neutral",
    cups: "Este año también juegas la Copa do Brasil, la Supercopa do Brasil y la Libertadores o la Sudamericana si te clasificas, como equipo de Série A.",
    secondDrop: 0,
    playoffName: "Playoff de ascenso",
    playoffWord: "playoff",
    parachute: PARACHUTE_BRAZIL,
    promotionBonus: PROMOTION_BONUS_BRAZIL,
    calendarYear: true,
    newsOnlyForCountry: true,
    rngSalt: [239, 37],
  },
  {
    // Série B ↔ Série C: cuatro movimientos directos en cada sentido; las dos ligas conservan 20 clubes.
    top: "brasileiraoB",
    second: "brasileiraoC",
    topTitle: "la Série B",
    secondTitle: "la Série C",
    finalVenue: "campo neutral",
    cups: "Esta temporada compites en la Copa do Brasil si tu club obtuvo uno de los cuatro cupos de la Série C.",
    secondDrop: 0,
    playoffName: "Playoff de ascenso",
    playoffWord: "playoff",
    parachute: PARACHUTE_BRAZIL,
    promotionBonus: PROMOTION_BONUS_BRAZIL,
    calendarYear: true,
    newsOnlyForCountry: true,
    rngSalt: [241, 43],
  },
];

const name = (id: string) => clubById(id).name;

/** Goles esperados de un equipo contra otro según la calidad de sus plantillas. */
function lambda(q: number, qOpp: number, home: boolean) {
  const l = 1.3 + (q - qOpp) * 0.045 + (home ? 0.18 : 0);
  return Math.min(2.8, Math.max(0.35, l));
}

function playMatch(
  save: GameSave,
  homeId: string,
  awayId: string,
  rng: Rng,
  neutral: boolean,
): { homeGoals: number; awayGoals: number } {
  const hq = clubQuality(save.players, homeId, autoLineup(save.players, homeId));
  const aq = clubQuality(save.players, awayId, autoLineup(save.players, awayId));
  return {
    homeGoals: rng.poisson(lambda(hq, aq, !neutral)),
    awayGoals: rng.poisson(lambda(aq, hq, false)),
  };
}

/** Penales: gana el de mayor calidad con una ligera ventaja (no es una moneda al aire). */
function shootout(save: GameSave, a: string, b: string, rng: Rng): string {
  const qa = clubQuality(save.players, a, autoLineup(save.players, a));
  const qb = clubQuality(save.players, b, autoLineup(save.players, b));
  const pA = 1 / (1 + Math.pow(10, (qb - qa) / 40));
  return rng.chance(pA) ? a : b;
}

/**
 * Playoff de ascenso a la Premier: 3.º vs 6.º y 4.º vs 5.º a ida y vuelta (el de peor puesto abre en casa) y final a
 * partido único en campo neutral. Se juega "entre temporadas": no ocupa el calendario del usuario.
 */
export function simulatePlayoff(save: GameSave, seeds: string[], rng: Rng): PlayoffResult {
  const [s3, s4, s5, s6] = seeds as [string, string, string, string];
  const tie = (hi: string, lo: string) => {
    const l1 = playMatch(save, lo, hi, rng, false);
    const l2 = playMatch(save, hi, lo, rng, false);
    const agg = { hi: l1.awayGoals + l2.homeGoals, lo: l1.homeGoals + l2.awayGoals };
    let winner: string;
    let note: string | undefined;
    if (agg.hi !== agg.lo) winner = agg.hi > agg.lo ? hi : lo;
    else {
      winner = shootout(save, hi, lo, rng);
      note = "definido por penales";
    }
    const legs: [PlayoffMatch, PlayoffMatch] = [
      { homeId: lo, awayId: hi, homeGoals: l1.homeGoals, awayGoals: l1.awayGoals },
      { homeId: hi, awayId: lo, homeGoals: l2.homeGoals, awayGoals: l2.awayGoals, note },
    ];
    return { a: hi, b: lo, legs, winner };
  };
  const semiA = tie(s3, s6);
  const semiB = tie(s4, s5);
  const fin = playMatch(save, semiA.winner, semiB.winner, rng, true);
  let finalWinner: string;
  let note: string | undefined;
  if (fin.homeGoals !== fin.awayGoals) finalWinner = fin.homeGoals > fin.awayGoals ? semiA.winner : semiB.winner;
  else {
    finalWinner = shootout(save, semiA.winner, semiB.winner, rng);
    note = "definido por penales";
  }
  return {
    semis: [semiA, semiB],
    final: {
      a: semiA.winner,
      b: semiB.winner,
      match: { homeId: semiA.winner, awayId: semiB.winner, homeGoals: fin.homeGoals, awayGoals: fin.awayGoals, note },
      winner: finalWinner,
    },
    winner: finalWinner,
  };
}

/**
 * Playoff de la Ligue 2 y barrage de ascenso/descenso. 4.º vs 5.º y el ganador contra el 3.º son partidos únicos en casa del
 * mejor clasificado; el ganador juega contra el 16.º de la Ligue 1 a ida y vuelta (la ida en casa del club de Ligue 2). Se
 * juega "entre temporadas": no ocupa el calendario del usuario.
 */
export function simulateBarrage(save: GameSave, seeds: string[], l1Sixteenth: string | null, rng: Rng): BarrageResult {
  const [s3, s4, s5] = seeds as [string, string, string];
  const single = (home: string, away: string) => {
    const m = playMatch(save, home, away, rng, false);
    let winner: string;
    let note: string | undefined;
    if (m.homeGoals !== m.awayGoals) winner = m.homeGoals > m.awayGoals ? home : away;
    else {
      winner = shootout(save, home, away, rng);
      note = "definido por penales";
    }
    return { a: home, b: away, match: { homeId: home, awayId: away, homeGoals: m.homeGoals, awayGoals: m.awayGoals, note } as PlayoffMatch, winner };
  };
  const first = single(s4, s5);
  const second = single(s3, first.winner);
  let barrage: BarrageResult["barrage"] = null;
  let winner = second.winner;
  if (l1Sixteenth) {
    const l2Id = second.winner;
    const l1 = playMatch(save, l2Id, l1Sixteenth, rng, false);
    const l2 = playMatch(save, l1Sixteenth, l2Id, rng, false);
    const aggL2 = l1.homeGoals + l2.awayGoals;
    const aggL1 = l1.awayGoals + l2.homeGoals;
    let bWinner: string;
    let note: string | undefined;
    if (aggL2 !== aggL1) bWinner = aggL2 > aggL1 ? l2Id : l1Sixteenth;
    else {
      bWinner = shootout(save, l2Id, l1Sixteenth, rng);
      note = "definido por penales";
    }
    barrage = {
      l2Id,
      l1Id: l1Sixteenth,
      legs: [
        { homeId: l2Id, awayId: l1Sixteenth, homeGoals: l1.homeGoals, awayGoals: l1.awayGoals },
        { homeId: l1Sixteenth, awayId: l2Id, homeGoals: l2.homeGoals, awayGoals: l2.awayGoals, note },
      ],
      winner: bWinner,
    };
    winner = bWinner;
  }
  return { first, second, barrage, winner };
}

/**
 * Playoff de Portugal: el 3.º de la Liga Portugal 2 contra el 16.º de la Primeira Liga a ida y vuelta (la ida en casa del club
 * de la Liga Portugal 2). Si el global queda igualado se define por penales. Se juega "entre temporadas": no ocupa el calendario
 * del usuario.
 */
export function simulateTiePlayoff(save: GameSave, l2Id: string, l1Id: string, rng: Rng): TiePlayoffResult {
  const leg1 = playMatch(save, l2Id, l1Id, rng, false);
  const leg2 = playMatch(save, l1Id, l2Id, rng, false);
  const aggL2 = leg1.homeGoals + leg2.awayGoals;
  const aggL1 = leg1.awayGoals + leg2.homeGoals;
  let winner: string;
  let note: string | undefined;
  if (aggL2 !== aggL1) winner = aggL2 > aggL1 ? l2Id : l1Id;
  else {
    winner = shootout(save, l2Id, l1Id, rng);
    note = "definido por penales";
  }
  return {
    l2Id,
    l1Id,
    legs: [
      { homeId: l2Id, awayId: l1Id, homeGoals: leg1.homeGoals, awayGoals: leg1.awayGoals },
      { homeId: l1Id, awayId: l2Id, homeGoals: leg2.homeGoals, awayGoals: leg2.awayGoals, note },
    ],
    winner,
  };
}


/** Eliminatoria del playoff de la Primera Federación (ida y vuelta; la vuelta en casa del mejor clasificado). */
export interface FedTie {
  /** Mejor clasificado y peor clasificado. */
  hi: string;
  lo: string;
  legs: [PlayoffMatch, PlayoffMatch];
  winner: string;
}
/** Playoff de ascenso de la Primera Federación: 2.º-5.º de los dos grupos, semifinales cruzadas y final entre los 4 ganadores. */
export interface FedPlayoffResult {
  semis: FedTie[];
  finals: FedTie[];
  /** Los dos clubes que ascienden por el playoff. */
  winners: string[];
}

function fedTie(save: GameSave, hi: string, lo: string, rng: Rng): FedTie {
  const l1 = playMatch(save, lo, hi, rng, false);
  const l2 = playMatch(save, hi, lo, rng, false);
  const aggHi = l1.awayGoals + l2.homeGoals;
  const aggLo = l1.homeGoals + l2.awayGoals;
  let winner: string;
  let note: string | undefined;
  if (aggHi !== aggLo) winner = aggHi > aggLo ? hi : lo;
  else {
    winner = shootout(save, hi, lo, rng);
    note = "definido por penales";
  }
  return {
    hi,
    lo,
    legs: [
      { homeId: lo, awayId: hi, homeGoals: l1.homeGoals, awayGoals: l1.awayGoals },
      { homeId: hi, awayId: lo, homeGoals: l2.homeGoals, awayGoals: l2.awayGoals, note },
    ],
    winner,
  };
}

/**
 * Reglamento 2026/27 de la Primera Federación: del 2.º al 5.º de cada grupo juegan el playoff. En las semifinales se cruzan los
 * mejores con los peores de grupos distintos (2.º vs 5.º y 3.º vs 4.º del otro grupo) y la vuelta es en casa del mejor
 * clasificado; los 4 ganadores juegan la final con el mismo criterio (mejor vs peor, el otro cruce entre los intermedios) y los
 * dos vencedores ascienden. `seeds[g][i]` es el club que terminó en el puesto i + 2 del grupo g.
 */
export function simulateFedPlayoff(save: GameSave, seeds: [string[], string[]], rng: Rng): FedPlayoffResult | null {
  const [g1, g2] = seeds;
  if (g1.length < 4 || g2.length < 4) return null;
  const rank = new Map<string, number>();
  seeds.forEach((g) => g.forEach((id, i) => rank.set(id, i)));
  const better = (a: string, b: string): [string, string] => {
    const ra = rank.get(a) ?? 9;
    const rb = rank.get(b) ?? 9;
    if (ra !== rb) return ra < rb ? [a, b] : [b, a];
    return clubById(a).prestige >= clubById(b).prestige ? [a, b] : [b, a];
  };
  const pairs: Array<[string, string]> = [
    [g1[0]!, g2[3]!],
    [g2[0]!, g1[3]!],
    [g1[1]!, g2[2]!],
    [g2[1]!, g1[2]!],
  ];
  const semis = pairs.map(([a, b]) => {
    const [hi, lo] = better(a, b);
    return fedTie(save, hi, lo, rng);
  });
  const ordered = semis.map((t) => t.winner).sort((a, b) => (better(a, b)[0] === a ? -1 : 1));
  const finals = [fedTie(save, ...better(ordered[0]!, ordered[3]!), rng), fedTie(save, ...better(ordered[1]!, ordered[2]!), rng)];
  return { semis, finals, winners: finals.map((t) => t.winner) };
}

/** Grupo de la Primera Federación al que baja cada club de LaLiga Hypermotion (cercanía geográfica; se compensa si un grupo se llena). */
const SEGUNDA_FED_GROUP: Record<string, 1 | 2> = {
  gir: 2, mll: 2, ovi: 1, sd_lpa: 1, sd_alm: 2, sd_spo: 1, sd_vld: 1, sd_gra: 2, sd_leg: 2, sd_cad: 2, sd_eib: 1, sd_alb: 2,
  sd_cas: 2, sd_cor: 1, sd_bur: 1, sd_and: 2, sd_ceu: 2, sd_rsb: 1, sd_tfe: 1, sd_sab: 2, sd_eld: 2, sd_cef: 1,
};

/** Filiales que hoy compiten en LaLiga Hypermotion: su primer equipo no puede compartir categoría con ellos. */
const SEGUNDA_RESERVE_PARENT: Record<string, string> = { sd_rsb: "rso", sd_cef: "cel" };
const DUTCH_RESERVE_PARENT: Record<string, string> = {
  nl1_jaj: "nl_aja",
  nl1_jps: "nl_psv",
  nl1_jut: "nl_utr",
  nl1_jaz: "nl_az",
  nl2_jsp: "nl_spa",
  nl2_jal: "nl1_alm",
};
const RESERVE_PARENT: Record<string, string> = { ...FED_RESERVE_PARENT, ...SEGUNDA_RESERVE_PARENT, ...DUTCH_RESERVE_PARENT };

interface FedStep {
  dropped: string[];
  raised: string[];
  direct: string[];
  playoff: FedPlayoffResult | null;
  /** Grupo de destino de cada club que baja de Segunda. */
  groupOf: Record<string, 1 | 2>;
  /** Clubes que quedaron 2.º-5.º de su grupo (para avisar al usuario). */
  seedIds: string[];
  /** Filiales que bajan a la Primera Federación porque su primer equipo juega ahora en LaLiga Hypermotion. */
  forcedReserves: string[];
}

/**
 * Ascensos y descensos entre LaLiga Hypermotion y la Primera Federación (se resuelven DESPUÉS de los de LaLiga ↔ Hypermotion).
 * - Bajan los 4 últimos de Hypermotion (que no acaben de ascender) y cualquier filial cuyo primer equipo juega ahora en Hypermotion.
 * - Suben los dos campeones de grupo y los dos ganadores del playoff (2.º a 5.º de cada grupo), más un ascenso extra por cada
 *   filial que baja, para conservar los 22 clubes. Un filial no asciende a una categoría donde ya juega su primer equipo.
 * - Las dos divisiones siguen teniendo 22 y 20 + 20 clubes (los descendidos se reparten entre los grupos).
 * - No existe la Segunda Federación: nadie baja de la Primera Federación.
 */
function fedStep(save: GameSave, finished: GameSave, rng: Rng, topPromoted: string[], topRelegated: string[]): FedStep | null {
  const segRows = finished.leagueTables?.segunda;
  if (!segRows || segRows.length < 22 || !segRows.some((r) => r.played > 0)) return null;
  const fed1 = domesticIds("primeraFed1");
  const fed2 = domesticIds("primeraFed2");
  if (fed1.length + fed2.length < 8) return null;

  // Hypermotion de la próxima temporada, antes de bajar/subir de la Primera Federación.
  const segundaAfter = new Set([...domesticIds("segunda").filter((id) => !topPromoted.includes(id)), ...topRelegated]);
  const staying = sortTable(segRows)
    .map((r) => r.clubId)
    .filter((id) => segundaAfter.has(id) && !topRelegated.includes(id));
  const forcedReserves = [...segundaAfter].filter((id) => RESERVE_PARENT[id] && segundaAfter.has(RESERVE_PARENT[id]!));
  const worst = staying.filter((id) => !forcedReserves.includes(id)).slice(-4);
  const dropped = [...new Set([...forcedReserves, ...worst])];

  // Tablas de grupo: si un grupo no se jugó (partida vieja) se usa el orden por prestigio.
  const groupRank = (league: "primeraFed1" | "primeraFed2", ids: string[]) => {
    const rows = finished.leagueTables?.[league];
    const played = rows && rows.length === ids.length && rows.some((r) => r.played > 0);
    return played
      ? sortTable(rows!).map((r) => r.clubId)
      : ids.slice().sort((a, b) => clubById(b).prestige - clubById(a).prestige);
  };
  const eligible = (id: string) => !(RESERVE_PARENT[id] && segundaAfter.has(RESERVE_PARENT[id]!)) && !dropped.includes(id);
  const ranked: [string[], string[]] = [groupRank("primeraFed1", fed1).filter(eligible), groupRank("primeraFed2", fed2).filter(eligible)];
  const direct = ranked.map((g) => g[0]).filter((id): id is string => Boolean(id));
  const seeds: [string[], string[]] = [ranked[0].slice(1, 5), ranked[1].slice(1, 5)];
  const playoff = simulateFedPlayoff(finished, seeds, rng);
  const raised = [...direct, ...(playoff?.winners ?? [])];
  // Un ascenso extra por cada filial que baja (o por un playoff que no se pudo jugar): el mejor clasificado de los que quedan.
  const leftovers = [
    ...(playoff
      ? [...playoff.finals.map((t) => (t.winner === t.hi ? t.lo : t.hi)), ...playoff.semis.map((t) => (t.winner === t.hi ? t.lo : t.hi))]
      : [...seeds[0], ...seeds[1]]),
  ];
  while (raised.length < dropped.length) {
    const next = leftovers.find((id) => !raised.includes(id));
    if (!next) break;
    raised.push(next);
  }
  while (raised.length > dropped.length) raised.pop();

  // Reparto de los descendidos entre los grupos para que cada uno conserve 20 clubes.
  const g1Left = fed1.filter((id) => !raised.includes(id)).length;
  const g2Left = fed2.filter((id) => !raised.includes(id)).length;
  const cap: Record<1 | 2, number> = { 1: Math.max(0, 20 - g1Left), 2: Math.max(0, 20 - g2Left) };
  const groupOf: Record<string, 1 | 2> = {};
  const overflow: string[] = [];
  for (const id of dropped) {
    const pref = SEGUNDA_FED_GROUP[id] ?? FED_START_GROUP[id] ?? 1;
    if (cap[pref] > 0) {
      groupOf[id] = pref;
      cap[pref] -= 1;
    } else overflow.push(id);
  }
  for (const id of overflow) {
    const other: 1 | 2 = cap[1] > 0 ? 1 : 2;
    groupOf[id] = other;
    cap[other] -= 1;
  }
  return { dropped, raised, direct, playoff, groupOf, seedIds: [...seeds[0], ...seeds[1]], forcedReserves };
}

function isFedClub(id: string): boolean {
  const l = clubById(id).league;
  return l === "primeraFed1" || l === "primeraFed2";
}

function tableFull(rows: Standing[] | undefined, league: PlayableLeagueId) {
  if (!rows || rows.length !== domesticIds(league).length) return false;
  return rows.some((r) => r.played > 0);
}

/**
 * Cierra la temporada de un par de divisiones: bajan los 3 últimos de la 1.ª y suben los 2 primeros de la 2.ª más el
 * ganador del playoff (3.º a 6.º). En España además bajan los 4 últimos de la Segunda a la Primera Federación (y los filiales que no
 * pueden seguir) y otros tantos suben desde sus dos grupos, así que la Segunda siempre conserva sus 22 clubes. Actualiza `club.league`, guarda la división de cada club
 * en la partida y deja noticias y avisos. Si la 2.ª no se jugó (partidas viejas) no mueve a nadie.
 */
function applyPair(save: GameSave, finished: GameSave, rng: Rng, pair: DivisionPair): DivisionMoves | null {
  const topRows = finished.leagueTables?.[pair.top];
  const secondRows = finished.leagueTables?.[pair.second];
  if (!tableFull(topRows, pair.top) || !tableFull(secondRows, pair.second)) return null;

  const user = save.clubId;
  const topTable = sortTable(topRows!);
  const secondTable = sortTable(secondRows!);
  // Francia: descienden directo solo los últimos (releg - 1); el 16.º de la Ligue 1 juega el barrage.
  const directDrop = pair.barrage ? QUAL_SPOTS[pair.top].releg - 1 : QUAL_SPOTS[pair.top].releg;
  const relegationTable = pair.top === "eredivisie" || pair.top === "eersteDivisie"
    ? topTable.filter((row) => !Object.entries(DUTCH_RESERVE_PARENT).some(([reserveId, parentId]) => parentId === row.clubId && clubById(reserveId).league === pair.second))
    : topTable;
  const relegated = relegationTable.slice(-directDrop).map((r) => r.clubId);
  const l1Sixteenth =
    pair.barrage || pair.tiePlayoff ? (topTable[topTable.length - directDrop - 1]?.clubId ?? null) : null;
  const promotionTable = pair.top === "eredivisie" || pair.top === "eersteDivisie"
    ? secondTable.filter((row) => {
        const parentId = DUTCH_RESERVE_PARENT[row.clubId];
        return !parentId || clubById(parentId).league !== pair.top;
      })
    : secondTable;
  const direct = promotionTable.slice(0, QUAL_SPOTS[pair.second].promo ?? 2).map((r) => r.clubId);
  const seeds = promotionTable
    .slice(direct.length, direct.length + (QUAL_SPOTS[pair.second].playoff ?? 4))
    .map((r) => r.clubId);
  const playoff = !pair.barrage && seeds.length === 4 ? simulatePlayoff(finished, seeds, rng) : null;
  const barrage = pair.barrage && seeds.length === 3 ? simulateBarrage(finished, seeds, l1Sixteenth, rng) : null;
  // Portugal: el 3.º de la 2.ª juega contra el 16.º de la 1.ª (si falta alguno de los dos, nadie cambia por esta vía).
  const tie =
    pair.tiePlayoff && seeds.length === 1 && l1Sixteenth ? simulateTiePlayoff(finished, seeds[0]!, l1Sixteenth, rng) : null;
  const promoted = [
    ...direct,
    ...(playoff ? [playoff.winner] : barrage || pair.tiePlayoff ? [] : seeds.slice(0, 1)),
  ];
  if (tie && tie.winner === tie.l2Id) {
    // Si gana el club de la Liga Portugal 2 sube y el 16.º baja (el mismo número de clubes); si no, todo sigue igual.
    promoted.push(tie.l2Id);
    relegated.push(tie.l1Id);
  }
  if (barrage?.barrage) {
    // Barrage: si gana el club de Ligue 2 sube y el 16.º baja (el mismo número de clubes); si no, todo sigue igual.
    if (barrage.barrage.winner === barrage.barrage.l2Id) {
      promoted.push(barrage.barrage.l2Id);
      relegated.push(barrage.barrage.l1Id);
    }
  }
  // Un club solo puede estar en UNA división: solo suben los que hoy están en la 2.ª y solo bajan los que hoy están en la 1.ª.
  for (let i = promoted.length - 1; i >= 0; i--) if (clubById(promoted[i]!).league !== pair.second) promoted.splice(i, 1);
  for (let i = relegated.length - 1; i >= 0; i--) if (clubById(relegated[i]!).league !== pair.top) relegated.splice(i, 1);
  // Siempre bajan y suben la misma cantidad de clubes (así cada división conserva sus clubes).
  while (promoted.length > relegated.length) promoted.pop();
  while (relegated.length > promoted.length) relegated.pop();

  // Descenso de LaLiga Hypermotion a la Primera Federación y ascenso desde sus dos grupos (solo España).
  let droppedToThird: string[] = [];
  let raisedFromThird: string[] = [];
  let fed: FedStep | null = null;
  if (pair.secondDrop > 0) {
    fed = fedStep(save, finished, new Rng(finished.seed + finished.season * 263 + 47), promoted, relegated);
    if (fed) {
      droppedToThird = fed.dropped;
      raisedFromThird = fed.raised;
    }
  }

  const next = currentDivisions();
  for (const id of relegated) next[id] = pair.second as Division;
  for (const id of promoted) next[id] = pair.top as Division;
  for (const id of droppedToThird) next[id] = fed!.groupOf[id] === 2 ? "primeraFed2" : "primeraFed1";
  for (const id of raisedFromThird) next[id] = pair.second as Division;
  applyDivisions(next);
  save.divisions = currentDivisions();

  const moves: DivisionMoves = {
    relegated,
    promoted,
    direct,
    playoff,
    barrage,
    tiePlayoff: tie,
    droppedToThird,
    raisedFromThird,
    fedDirect: fed?.direct,
    fedPlayoff: fed?.playoff ?? null,
  };
  const userLeague = clubById(user).league;
  const userInCountry =
    userLeague === pair.top ||
    userLeague === pair.second ||
    relegated.includes(user) ||
    promoted.includes(user) ||
    (pair.secondDrop > 0 && (isFedClub(user) || droppedToThird.includes(user) || raisedFromThird.includes(user)));
  const writeNews = !pair.newsOnlyForCountry || userInCountry;
  const season = pair.calendarYear ? String(finished.season) : `${finished.season}/${String(finished.season + 1).slice(2)}`;

  if (playoff && writeNews) {
    const sf = playoff.semis
      .map((s) => {
        const [l1, l2] = s.legs;
        return `${name(s.a)}–${name(s.b)}: ${l1.homeGoals}-${l1.awayGoals} y ${l2.homeGoals}-${l2.awayGoals}${l2.note ? ` (${l2.note})` : ""}`;
      })
      .join(" · ");
    const f = playoff.final.match;
    save.news.push({
      id: uid("n"),
      week: 0,
      tone: seeds.includes(user) ? (playoff.winner === user ? "good" : "bad") : "neutral",
      title: `${pair.playoffName} ${season}: sube ${name(playoff.winner)}`,
      body: `Semifinales: ${sf}. Final en ${pair.finalVenue}: ${name(f.homeId)} ${f.homeGoals}–${f.awayGoals} ${name(f.awayId)}${f.note ? ` (${f.note})` : ""}.`,
    });
  }
  if (barrage && writeNews) {
    const m1 = barrage.first.match;
    const m2 = barrage.second.match;
    const note = (m: PlayoffMatch) => (m.note ? ` (${m.note})` : "");
    save.news.push({
      id: uid("n"),
      week: 0,
      tone: seeds.includes(user) ? (barrage.winner === user ? "good" : "bad") : "neutral",
      title: `Playoff de ${pair.secondTitle} ${season}: gana ${name(barrage.second.winner)}`,
      body: `4.º vs 5.º: ${name(m1.homeId)} ${m1.homeGoals}–${m1.awayGoals} ${name(m1.awayId)}${note(m1)}. Final contra el 3.º: ${name(m2.homeId)} ${m2.homeGoals}–${m2.awayGoals} ${name(m2.awayId)}${note(m2)}.`,
    });
    const b = barrage.barrage;
    if (b) {
      const [l1, l2] = b.legs;
      save.news.push({
        id: uid("n"),
        week: 0,
        tone: b.l1Id === user ? (b.winner === user ? "good" : "bad") : b.l2Id === user ? (b.winner === user ? "good" : "bad") : "neutral",
        title: `Barrage ${season}: ${name(b.winner)} jugará en ${pair.topTitle}`,
        body: `${name(b.l2Id)} (${pair.secondTitle}) vs ${name(b.l1Id)} (16.º de ${pair.topTitle}): ${l1.homeGoals}-${l1.awayGoals} y ${l2.homeGoals}-${l2.awayGoals}${l2.note ? ` (${l2.note})` : ""}.`,
      });
    }
  }
  if (tie && writeNews) {
    const [l1, l2] = tie.legs;
    save.news.push({
      id: uid("n"),
      week: 0,
      tone: tie.l1Id === user || tie.l2Id === user ? (tie.winner === user ? "good" : "bad") : "neutral",
      title: `Playoff ${season}: ${name(tie.winner)} jugará en ${pair.topTitle}`,
      body: `${name(tie.l2Id)} (3.º de ${pair.secondTitle}) vs ${name(tie.l1Id)} (16.º de ${pair.topTitle}): ${l1.homeGoals}-${l1.awayGoals} y ${l2.homeGoals}-${l2.awayGoals}${l2.note ? ` (${l2.note})` : ""}.`,
    });
  }
  const dropText = droppedToThird.length
    ? ` Descienden a Primera Federación: ${droppedToThird.map(name).join(", ")}. Suben desde Primera Federación: ${raisedFromThird.map(name).join(", ")}.`
    : "";
  // Primera Federación: playoff de ascenso entre los dos grupos (2.º a 5.º de cada uno).
  if (fed?.playoff && (writeNews || isFedClub(user))) {
    const po = fed.playoff;
    const leg = (t: FedTie) => {
      const [l1, l2] = t.legs;
      return `${name(t.hi)}–${name(t.lo)}: ${l1.homeGoals}-${l1.awayGoals} y ${l2.homeGoals}-${l2.awayGoals}${l2.note ? ` (${l2.note})` : ""}`;
    };
    save.news.push({
      id: uid("n"),
      week: 0,
      tone: fed.seedIds.includes(user) ? (po.winners.includes(user) ? "good" : "bad") : "neutral",
      title: `Playoff de la Primera Federación ${season}: suben ${po.winners.map(name).join(" y ")}`,
      body: `Campeones de grupo (ascenso directo): ${fed.direct.map(name).join(" y ")}. Semifinales: ${po.semis.map(leg).join(" · ")}. Finales: ${po.finals.map(leg).join(" · ")}.`,
    });
  }
  if (fed?.forcedReserves.length && writeNews) {
    save.news.push({
      id: uid("n"),
      week: 0,
      tone: "neutral",
      title: "Filiales: no pueden coincidir con su primer equipo",
      body: `${fed.forcedReserves.map(name).join(", ")} baja${fed.forcedReserves.length > 1 ? "n" : ""} a la Primera Federación porque su primer equipo juega en LaLiga Hypermotion. Un filial no puede competir en la misma categoría que su primer equipo.`,
    });
  }
  if (writeNews) {
    save.news.push({
      id: uid("n"),
      week: 0,
      tone: "neutral",
      title: `Ascensos y descensos ${season}`,
      body: `Suben a ${pair.topTitle}: ${promoted.map(name).join(", ")}. Descienden a ${pair.secondTitle}: ${relegated.map(name).join(", ")}.${dropText}`,
    });
  }

  if (promoted.includes(user)) {
    save.budget += pair.promotionBonus;
    const how = direct.includes(user)
      ? "de forma directa"
      : barrage
        ? `tras ganar el ${pair.playoffWord} y el barrage`
        : tie
            ? `tras ganar el ${pair.playoffWord} contra ${name(tie.l1Id)}`
          : `tras ganar el ${pair.playoffWord}`;
    const body = `${name(user)} asciende a ${pair.topTitle} ${how}. Ingresos extra por el ascenso: ${formatMoney(pair.promotionBonus)}. ${pair.cups}`;
    save.news.unshift({ id: uid("n"), week: 0, tone: "good", title: `¡Ascenso a ${pair.topTitle}!`, body });
    save.popups.push({ id: uid("pop"), kind: "info", tone: "good", title: `¡Ascenso a ${pair.topTitle}!`, body });
  } else if (relegated.includes(user)) {
    save.budget += pair.parachute;
    const viaBarrage =
      barrage?.barrage?.l1Id === user
        ? " tras perder el barrage"
        : tie?.l1Id === user
          ? " tras perder el playoff"
          : "";
    const body = `${name(user)} desciende a ${pair.secondTitle}${viaBarrage}. El club recibe ${formatMoney(pair.parachute)} de paracaídas. El objetivo ahora es volver a ascender.`;
    save.news.unshift({ id: uid("n"), week: 0, tone: "bad", title: `Descenso a ${pair.secondTitle}`, body });
    save.popups.push({ id: uid("pop"), kind: "info", tone: "bad", title: `Descenso a ${pair.secondTitle}`, body });
  } else if (barrage?.barrage && barrage.barrage.l1Id === user) {
    const body = `${name(user)} terminó 16.º en ${pair.topTitle}, ganó el barrage contra ${name(barrage.barrage.l2Id)} y conserva la categoría.`;
    save.news.unshift({ id: uid("n"), week: 0, tone: "good", title: "¡Salvado en el barrage!", body });
    save.popups.push({ id: uid("pop"), kind: "info", tone: "good", title: "¡Salvado en el barrage!", body });
  } else if (tie && tie.l1Id === user) {
    const body = `${name(user)} terminó 16.º en ${pair.topTitle}, ganó el playoff contra ${name(tie.l2Id)} y conserva la categoría.`;
    save.news.unshift({ id: uid("n"), week: 0, tone: "good", title: "¡Salvado en el playoff!", body });
    save.popups.push({ id: uid("pop"), kind: "info", tone: "good", title: "¡Salvado en el playoff!", body });
  } else if (tie && tie.l2Id === user) {
    const body = `${name(user)} terminó 3.º, pero perdió el playoff contra ${name(tie.l1Id)}: la próxima temporada seguirá en ${pair.secondTitle}.`;
    save.popups.push({ id: uid("pop"), kind: "info", tone: "neutral", title: "Sin ascenso", body });
  } else if (barrage && seeds.includes(user)) {
    const lostBarrage = barrage.barrage?.l2Id === user;
    const body = lostBarrage
      ? `${name(user)} ganó el playoff pero perdió el barrage contra ${name(barrage.barrage!.l1Id)}: la próxima temporada seguirá en ${pair.secondTitle}.`
      : `${name(user)} terminó entre los cinco primeros pero no ganó el ${pair.playoffWord}: la próxima temporada seguirá en ${pair.secondTitle}.`;
    save.popups.push({ id: uid("pop"), kind: "info", tone: "neutral", title: "Sin ascenso", body });
  } else if (droppedToThird.includes(user)) {
    save.budget += PARACHUTE_FED;
    const group = fed!.groupOf[user] === 2 ? "Grupo 2" : "Grupo 1";
    const body = `${name(user)} desciende a la Primera Federación (${group}). El club recibe ${formatMoney(PARACHUTE_FED)} de ayuda. El objetivo ahora es volver a ascender.`;
    save.news.unshift({ id: uid("n"), week: 0, tone: "bad", title: "Descenso a la Primera Federación", body });
    save.popups.push({ id: uid("pop"), kind: "info", tone: "bad", title: "Descenso a la Primera Federación", body });
  } else if (raisedFromThird.includes(user)) {
    save.budget += PROMOTION_BONUS_FED;
    const how = fed!.direct.includes(user) ? "como campeón de su grupo" : "tras ganar el playoff de ascenso";
    const body = `${name(user)} asciende a LaLiga Hypermotion ${how}. Ingresos extra por el ascenso: ${formatMoney(PROMOTION_BONUS_FED)}.`;
    save.news.unshift({ id: uid("n"), week: 0, tone: "good", title: "¡Ascenso a LaLiga Hypermotion!", body });
    save.popups.push({ id: uid("pop"), kind: "info", tone: "good", title: "¡Ascenso a LaLiga Hypermotion!", body });
  } else if (fed && isFedClub(user) && fed.seedIds.includes(user)) {
    const body = `${name(user)} terminó entre los cinco primeros de su grupo pero no ganó el playoff: la próxima temporada seguirá en la Primera Federación.`;
    save.popups.push({ id: uid("pop"), kind: "info", tone: "neutral", title: "Sin ascenso", body });
  } else if (seeds.includes(user)) {
    const top = direct.length + seeds.length;
    const topWord = ({ 5: "cinco", 6: "seis" } as Record<number, string>)[top] ?? String(top);
    const body = `${name(user)} terminó entre los ${topWord} primeros pero no ganó el ${pair.playoffWord}: la próxima temporada seguirá en ${pair.secondTitle}.`;
    save.popups.push({ id: uid("pop"), kind: "info", tone: "neutral", title: "Sin ascenso", body });
  }
  // Zona de descenso de la 2.ª hacia una división que todavía no existe (League Two): el club conserva la plaza.
  if (pair.lowerTitle && !promoted.includes(user)) {
    const dropZone = QUAL_SPOTS[pair.second].releg;
    const place = secondTable.findIndex((r) => r.clubId === user);
    if (dropZone > 0 && place >= 0 && place >= secondTable.length - dropZone) {
      const body = `${name(user)} terminó en zona de descenso a ${pair.lowerTitle}, pero esa categoría todavía no es jugable: el club conserva la plaza en ${pair.secondTitle}. Hay que salir de ahí.`;
      save.news.unshift({ id: uid("n"), week: 0, tone: "bad", title: "Descenso evitado", body });
      save.popups.push({ id: uid("pop"), kind: "info", tone: "bad", title: "Descenso evitado", body });
    }
  }
  return moves;
}

/**
 * Cierra la temporada de todas las ligas con ascensos y descensos: Premier ↔ Championship, Championship ↔ League One y LaLiga EA Sports ↔
 * LaLiga Hypermotion ↔ Primera Federación (2 grupos), Liga Profesional ↔ Primera Nacional, Serie A ↔ Serie B,
 * Bundesliga ↔ 2. Bundesliga, Ligue 1 ↔ Ligue 2 ↔ Ligue 3, Primeira Liga ↔ Liga Portugal 2 y Brasileirão Série A ↔ Série B. Devuelve las novedades de la liga que se movió (o null si
 * ninguna se había jugado entera, p. ej. partidas viejas).
 */
export function applyPromotionRelegation(save: GameSave, finished: GameSave, rng: Rng): DivisionMoves | null {
  // Devuelve los movimientos del país del club del usuario; si no es de ninguno de estos países, los primeros que se movieron.
  const userLeague = clubById(save.clubId).league;
  let result: DivisionMoves | null = null;
  let userResult: DivisionMoves | null = null;
  for (const pair of PAIRS) {
    const pairRng = pair.rngSalt ? new Rng(finished.seed + finished.season * pair.rngSalt[0] + pair.rngSalt[1]) : rng;
    const moves = applyPair(save, finished, pairRng, pair);
    if (!moves) continue;
    if (!result) result = moves;
    if (!userResult && (moves.promoted.includes(save.clubId) || moves.relegated.includes(save.clubId) || userLeague === pair.top || userLeague === pair.second || moves.droppedToThird?.includes(save.clubId) || moves.raisedFromThird?.includes(save.clubId) || (pair.secondDrop > 0 && (userLeague === "primeraFed1" || userLeague === "primeraFed2")))) {
      userResult = moves;
    }
  }
  return userResult ?? result;
}

export type { Division, EnglishDivision };
