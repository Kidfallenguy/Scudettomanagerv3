import {
  applyDivisions,
  clubById,
  currentDivisions,
  domesticIds,
  type EnglishDivision,
} from "./clubs";
import { QUAL_SPOTS } from "./competitions";
import { formatMoney, uid } from "./format";
import type { Rng } from "./rng";
import { autoLineup, clubQuality } from "./sim";
import { sortTable } from "./world";
import type { GameSave, Standing } from "./types";

/** Ayuda económica (paracaídas) que recibe el club del usuario al descender de la Premier. */
export const PARACHUTE = 12_000_000;
/** Premio económico por ascender a la Premier (derechos de TV, taquilla y patrocinios nuevos). */
export const PROMOTION_BONUS = 9_000_000;

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

export interface DivisionMoves {
  /** Descienden de la Premier (3). */
  relegated: string[];
  /** Ascienden de la Championship: 2 directos + el ganador del playoff. */
  promoted: string[];
  direct: string[];
  playoff: PlayoffResult | null;
}

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

function tableFull(rows: Standing[] | undefined, league: "premier" | "championship") {
  if (!rows || rows.length !== domesticIds(league).length) return false;
  return rows.some((r) => r.played > 0);
}

/**
 * Cierra la temporada inglesa: bajan los 3 últimos de la Premier y suben los 2 primeros de la Championship más el
 * ganador del playoff (3.º a 6.º). Actualiza la división de cada club (`club.league`), la guarda en la partida
 * (`save.divisions`) y deja noticias y avisos. Si la Championship no se jugó (partidas viejas) no mueve a nadie.
 */
export function applyPromotionRelegation(save: GameSave, finished: GameSave, rng: Rng): DivisionMoves | null {
  const premier = finished.leagueTables?.premier;
  const champ = finished.leagueTables?.championship;
  if (!tableFull(premier, "premier") || !tableFull(champ, "championship")) return null;

  const pTable = sortTable(premier!);
  const cTable = sortTable(champ!);
  const releg = QUAL_SPOTS.premier.releg;
  const relegated = pTable.slice(-releg).map((r) => r.clubId);
  const direct = cTable.slice(0, QUAL_SPOTS.championship.promo ?? 2).map((r) => r.clubId);
  const seeds = cTable.slice(direct.length, direct.length + (QUAL_SPOTS.championship.playoff ?? 4)).map((r) => r.clubId);
  const playoff = seeds.length === 4 ? simulatePlayoff(finished, seeds, rng) : null;
  const promoted = [...direct, ...(playoff ? [playoff.winner] : seeds.slice(0, 1))];
  // Siempre bajan y suben la misma cantidad de clubes.
  while (promoted.length > relegated.length) promoted.pop();

  const next = currentDivisions();
  for (const id of relegated) next[id] = "championship";
  for (const id of promoted) next[id] = "premier";
  applyDivisions(next);
  save.divisions = currentDivisions();

  const user = save.clubId;
  const moves: DivisionMoves = { relegated, promoted, direct, playoff };
  const season = `${finished.season}/${String(finished.season + 1).slice(2)}`;

  if (playoff) {
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
      title: `Playoff de ascenso ${season}: sube ${name(playoff.winner)}`,
      body: `Semifinales: ${sf}. Final en Wembley: ${name(f.homeId)} ${f.homeGoals}–${f.awayGoals} ${name(f.awayId)}${f.note ? ` (${f.note})` : ""}.`,
    });
  }
  save.news.push({
    id: uid("n"),
    week: 0,
    tone: "neutral",
    title: `Ascensos y descensos ${season}`,
    body: `Suben a la Premier League: ${promoted.map(name).join(", ")}. Descienden a la Championship: ${relegated.map(name).join(", ")}.`,
  });

  if (promoted.includes(user)) {
    save.budget += PROMOTION_BONUS;
    const how = direct.includes(user) ? "de forma directa" : "tras ganar el playoff";
    const body = `${name(user)} asciende a la Premier League ${how}. Ingresos extra por el ascenso: ${formatMoney(PROMOTION_BONUS)}. Este año también juegas la FA Cup y la Carabao Cup como equipo de Premier.`;
    save.news.unshift({ id: uid("n"), week: 0, tone: "good", title: "¡Ascenso a la Premier League!", body });
    save.popups.push({ id: uid("pop"), kind: "info", tone: "good", title: "¡Ascenso a la Premier League!", body });
  } else if (relegated.includes(user)) {
    save.budget += PARACHUTE;
    const body = `${name(user)} desciende a la Championship. El club recibe ${formatMoney(PARACHUTE)} de paracaídas. El objetivo ahora es volver a ascender.`;
    save.news.unshift({ id: uid("n"), week: 0, tone: "bad", title: "Descenso a la Championship", body });
    save.popups.push({ id: uid("pop"), kind: "info", tone: "bad", title: "Descenso a la Championship", body });
  } else if (seeds.includes(user)) {
    const body = `${name(user)} terminó entre los seis primeros pero no ganó el playoff: la próxima temporada seguirá en la Championship.`;
    save.popups.push({ id: uid("pop"), kind: "info", tone: "neutral", title: "Sin ascenso", body });
  }
  return moves;
}

export type { EnglishDivision };
