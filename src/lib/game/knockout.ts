import { clubById } from "./clubs";
import { UCL_LEAGUE_ROUNDS, UECL_LEAGUE_ROUNDS, UEL_LEAGUE_ROUNDS } from "./competitions";
import { MUNDIAL_GROUP_ROUNDS } from "./mundial";
import type { Rng } from "./rng";
import { computeRatings } from "./sim";
import type { Competition, Fixture, GameSave, MatchEvent, MatchResult, Player, Shootout } from "./types";

/**
 * Reglas de eliminatoria: en las fases de liga/grupos un empate se queda empate; en los cruces de
 * copa y de fase final se juega prórroga y, si sigue igualado, tanda de penales.
 */

export type Side = "home" | "away";

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

/** ¿Esta ronda es de eliminación directa (hay que sacar un ganador)? Las fases de liga y de grupos no. */
export function isKnockoutRound(competition: Competition, round: number): boolean {
  switch (competition) {
    case "coppa":
    case "carabao":
    case "supercoppa":
    case "kingsCup":
    case "saudiSuperCup":
    case "trofeo":
    case "intercontinental":
    case "transatlantica":
    case "sudamericana":
      return true;
    case "mundial":
      return round > MUNDIAL_GROUP_ROUNDS;
    case "ucl":
      return round > UCL_LEAGUE_ROUNDS;
    case "uel":
      return round > UEL_LEAGUE_ROUNDS;
    case "uecl":
      return round > UECL_LEAGUE_ROUNDS;
    case "libertadores":
      return round >= 7;
    default:
      return false;
  }
}

/**
 * Goles que cada lado (local / visitante de ESTE partido) ya trae de la ida.
 * `null` = este partido no tiene que dar ganador (liga, grupos o partido de ida).
 */
export function tieCarry(
  save: Pick<GameSave, "fixtures">,
  f: Fixture,
  firstLegByTie?: ReadonlyMap<string, Fixture>,
): { home: number; away: number } | null {
  if (!isKnockoutRound(f.competition, f.round)) return null;
  if (f.leg === 1) return null;
  if (f.leg === 2 && f.tieId) {
    const first = firstLegByTie?.get(f.tieId) ?? save.fixtures.find((x) => x.tieId === f.tieId && x.leg === 1);
    if (!first || first.homeGoals === undefined || first.awayGoals === undefined) return { home: 0, away: 0 };
    // El local de la vuelta fue el visitante de la ida.
    return { home: first.awayGoals, away: first.homeGoals };
  }
  return { home: 0, away: 0 };
}

/** Ganador por penales de un partido (null si no hubo tanda o no hay diferencia). */
export function penaltyWinner(f: Pick<Fixture, "homeId" | "awayId" | "penHome" | "penAway">): string | null {
  if (f.penHome === undefined || f.penAway === undefined || f.penHome === f.penAway) return null;
  return f.penHome > f.penAway ? f.homeId : f.awayId;
}

/** Texto corto del resultado con penales: "(4–3 pen.)" o "" si no hubo tanda. */
export function penaltySuffix(f: Pick<Fixture, "penHome" | "penAway">): string {
  return f.penHome !== undefined && f.penAway !== undefined ? ` (${f.penHome}–${f.penAway} pen.)` : "";
}

/** Quiénes siguen en cancha al final de los 90 (sin los expulsados ni los lesionados que no pudieron ser cambiados). */
export function onPitchAtEnd(result: MatchResult, side: Side): string[] {
  const given = side === "home" ? result.homeOnPitch : result.awayOnPitch;
  if (given?.length) return [...given];
  const clubId = side === "home" ? result.homeId : result.awayId;
  const set = new Set(side === "home" ? result.homeLineup : result.awayLineup);
  for (const e of [...result.events].sort((a, b) => a.minute - b.minute)) {
    if (e.clubId !== clubId) continue;
    if (e.type === "sub" && e.playerId && e.outPlayerId) {
      set.delete(e.outPlayerId);
      set.add(e.playerId);
    } else if ((e.type === "red" || e.type === "injury") && e.playerId) {
      if (e.type === "red" || !result.events.some((x) => x.type === "sub" && x.outPlayerId === e.playerId)) {
        set.delete(e.playerId);
      }
    }
  }
  return [...set];
}

// ---------- Tanda de penales ----------

function keeperSkill(gk: Player | undefined): number {
  if (!gk) return 60;
  const eff = (v: number) => v + gk.form * 1.2 + (gk.fitness - 85) * 0.12;
  if (!gk.gk) return eff(gk.ovr * 0.75);
  return eff(((gk.gk.div + gk.gk.ref + gk.gk.pos) / 3) * 0.85 + gk.gk.han * 0.15);
}

/** Orden de ejecutores: los mejores pateadores primero; el arquero, al final. */
export function shootoutTakers(players: Player[], ids: string[]): Player[] {
  const list = ids.map((id) => players.find((p) => p.id === id)).filter((p): p is Player => Boolean(p));
  const score = (p: Player) => p.attrs.sho * 0.8 + p.attrs.dri * 0.2 + p.form * 1.5;
  const field = list.filter((p) => p.pos !== "GK").sort((a, b) => score(b) - score(a));
  return [...field, ...list.filter((p) => p.pos === "GK")];
}

/** Probabilidad de que un penal de tanda sea gol. */
export function penaltyScoreChance(taker: Player, keeper: Player | undefined): number {
  const skill = taker.attrs.sho * 0.8 + taker.attrs.dri * 0.2 + taker.form * 1.2 + (taker.fitness - 85) * 0.05;
  return clamp(0.75 + (skill - 72) * 0.004 - (keeperSkill(keeper) - 70) * 0.003, 0.5, 0.92);
}

/**
 * ¿Ya está definida la tanda? `taken` = penales ejecutados por lado, `score` = goles por lado.
 * Primero la serie de 5 (se corta cuando uno ya no puede alcanzar al otro) y después muerte súbita.
 */
export function shootoutWinner(
  taken: { home: number; away: number },
  score: { home: number; away: number },
): Side | null {
  if (taken.home >= 5 && taken.away >= 5) {
    if (taken.home === taken.away && score.home !== score.away) return score.home > score.away ? "home" : "away";
    return null;
  }
  const remHome = Math.max(0, 5 - taken.home);
  const remAway = Math.max(0, 5 - taken.away);
  if (score.home > score.away + remAway) return "home";
  if (score.away > score.home + remHome) return "away";
  return null;
}

/** Cómo termina un penal que no fue gol. */
export function missKind(rng: Rng): "saved" | "wide" | "post" {
  const r = rng.float();
  return r < 0.5 ? "saved" : r < 0.85 ? "wide" : "post";
}

export function kickText(
  index: number,
  taker: Player,
  clubShort: string,
  scored: boolean,
  miss: "saved" | "wide" | "post",
  keeper: Player | undefined,
): string {
  const gkName = keeper ? (keeper.name.trim().split(/\s+/).pop() ?? keeper.name) : "el arquero";
  if (scored) return `Penal ${index}: gol de ${taker.name} (${clubShort}).`;
  if (miss === "saved") return `Penal ${index}: ${gkName} ataja el remate de ${taker.name} (${clubShort}).`;
  if (miss === "post") return `Penal ${index}: ${taker.name} (${clubShort}) pega en el palo.`;
  return `Penal ${index}: ${taker.name} (${clubShort}) manda la pelota afuera.`;
}

/** Simula una tanda completa entre los que quedaron en cancha. */
export function simulateShootout(
  players: Player[],
  homeIds: string[],
  awayIds: string[],
  homeId: string,
  awayId: string,
  rng: Rng,
): { shootout: Shootout; events: MatchEvent[] } {
  const takers = { home: shootoutTakers(players, homeIds), away: shootoutTakers(players, awayIds) };
  const keeper = {
    home: players.find((p) => homeIds.includes(p.id) && p.pos === "GK"),
    away: players.find((p) => awayIds.includes(p.id) && p.pos === "GK"),
  };
  const first: Side = rng.chance(0.5) ? "home" : "away";
  const order: Side[] = first === "home" ? ["home", "away"] : ["away", "home"];
  const taken = { home: 0, away: 0 };
  const score = { home: 0, away: 0 };
  const kicks: Shootout["kicks"] = [];
  const events: MatchEvent[] = [
    {
      minute: 120,
      type: "pen",
      text: `Tanda de penales. Patea primero ${clubById(first === "home" ? homeId : awayId).short}.`,
    },
  ];
  let n = 0;
  // Tope de seguridad: con plantillas vacías la tanda no puede colgarse.
  while (n < 80) {
    for (const side of order) {
      const list = takers[side];
      const other: Side = side === "home" ? "away" : "home";
      const taker = list.length ? list[taken[side] % list.length]! : undefined;
      let scored: boolean;
      let miss: "saved" | "wide" | "post" = "wide";
      if (taker) {
        scored = rng.chance(penaltyScoreChance(taker, keeper[other]));
        if (!scored) miss = missKind(rng);
      } else {
        scored = rng.chance(0.75);
      }
      n += 1;
      taken[side] += 1;
      if (scored) score[side] += 1;
      const clubId = side === "home" ? homeId : awayId;
      if (taker) {
        kicks.push({ side, playerId: taker.id, scored });
        events.push({
          minute: 120,
          type: "pen",
          clubId,
          playerId: taker.id,
          scored,
          text: kickText(taken[side], taker, clubById(clubId).short, scored, miss, keeper[other]),
        });
      }
      if (shootoutWinner(taken, score)) break;
    }
    if (shootoutWinner(taken, score)) break;
  }
  // Si por el tope no se definió, desempata la última diferencia o el azar.
  if (!shootoutWinner(taken, score) && score.home === score.away) {
    if (rng.chance(0.5)) score.home += 1;
    else score.away += 1;
  }
  return { shootout: { home: score.home, away: score.away, kicks, first }, events };
}

// ---------- Prórroga ----------

function avgOvr(players: Player[], ids: string[]): number {
  const list = ids.map((id) => players.find((p) => p.id === id)).filter((p): p is Player => Boolean(p));
  return list.length ? list.reduce((s, p) => s + p.ovr, 0) / list.length : 60;
}

function pickScorer(players: Player[], ids: string[], rng: Rng): Player | undefined {
  const xi = ids.map((id) => players.find((p) => p.id === id)).filter((p): p is Player => Boolean(p));
  const atk = xi.filter((p) => p.pos === "ST" || p.pos === "LW" || p.pos === "RW" || p.pos === "CAM");
  const pool = atk.length ? atk : xi.filter((p) => p.pos !== "GK");
  if (!pool.length) return undefined;
  const weights = pool.map((p) => Math.max(8, p.attrs.sho + p.form * 2));
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = rng.float() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return pool[i];
  }
  return pool[0];
}

/** Treinta minutos de prórroga: pocos goles, con los once (o menos) que quedaron en cancha. */
export function playExtraTime(players: Player[], result: MatchResult, rng: Rng) {
  const homeOn = onPitchAtEnd(result, "home");
  const awayOn = onPitchAtEnd(result, "away");
  const ratio = (avgOvr(players, homeOn) + 1.2) / Math.max(52, avgOvr(players, awayOn));
  const lamHome = clamp(0.3 * Math.pow(ratio, 3) * Math.pow(Math.max(1, homeOn.length) / 11, 1.5), 0.06, 1.1);
  const lamAway = clamp(0.27 * Math.pow(1 / ratio, 3) * Math.pow(Math.max(1, awayOn.length) / 11, 1.5), 0.05, 1);
  const count = (lam: number) => (rng.chance(lam) ? 1 : 0) + (rng.chance(lam * 0.12) ? 1 : 0);
  const goals: Array<{ minute: number; side: Side }> = [];
  for (let i = 0; i < count(lamHome); i++) goals.push({ minute: rng.int(91, 120), side: "home" });
  for (let i = 0; i < count(lamAway); i++) goals.push({ minute: rng.int(91, 120), side: "away" });
  goals.sort((a, b) => a.minute - b.minute);

  result.events.push({
    minute: 90,
    type: "et",
    text: "90' · Termina el tiempo reglamentario. Hay prórroga.",
  });
  for (const g of goals) {
    const clubId = g.side === "home" ? result.homeId : result.awayId;
    const scorer = pickScorer(players, g.side === "home" ? homeOn : awayOn, rng);
    const short = clubById(clubId).short;
    if (scorer) scorer.goals += 1;
    if (g.side === "home") result.homeGoals += 1;
    else result.awayGoals += 1;
    result.events.push({
      minute: g.minute,
      type: "goal",
      clubId,
      playerId: scorer?.id,
      text: `${g.minute}' · Gol de ${scorer ? scorer.name : short} (${short}) en la prórroga.`,
    });
  }
  for (const id of [...homeOn, ...awayOn]) {
    const p = players.find((x) => x.id === id);
    if (p) p.fitness = clamp(p.fitness - rng.int(3, 6), 40, 100);
  }
  result.extraTime = true;
}

/** Texto del cierre del partido ("Final: A 1–1 B (tras prórroga) · A gana 4–3 en los penales"). */
export function finalLine(result: MatchResult): string {
  const home = clubById(result.homeId).short;
  const away = clubById(result.awayId).short;
  let text = `Final: ${home} ${result.homeGoals}–${result.awayGoals} ${away}`;
  if (result.extraTime) text += " (tras prórroga)";
  text += ".";
  if (result.penalties) {
    const p = result.penalties;
    const winner = p.home > p.away ? home : away;
    text += ` ${winner} gana ${Math.max(p.home, p.away)}–${Math.min(p.home, p.away)} en los penales.`;
  }
  return text;
}

/** Reescribe la línea de cierre del resultado. */
export function refreshFinalEvent(result: MatchResult) {
  const ft = result.events.find((e) => e.type === "ft");
  if (ft) {
    ft.minute = result.penalties ? 120 : result.extraTime ? 120 : 90;
    ft.text = finalLine(result);
  }
}

/**
 * Si la eliminatoria sigue igualada (global, en la vuelta), juega la prórroga y, de ser necesario,
 * la tanda de penales. Modifica el resultado. No hace nada si ya hay ganador o si ya se jugó en vivo.
 */
export function settleLevelTie(
  players: Player[],
  result: MatchResult,
  carry: { home: number; away: number },
  rng: Rng,
) {
  const level = () => result.homeGoals + carry.home === result.awayGoals + carry.away;
  if (!level()) return;
  if (!result.extraTime) playExtraTime(players, result, rng);
  if (level() && !result.penalties) {
    const sim = simulateShootout(
      players,
      onPitchAtEnd(result, "home"),
      onPitchAtEnd(result, "away"),
      result.homeId,
      result.awayId,
      rng,
    );
    result.penalties = sim.shootout;
    result.events.push(...sim.events);
  }
  refreshFinalEvent(result);
  result.events.sort((a, b) => a.minute - b.minute || (a.type === "kickoff" ? -1 : 0));
  // La línea de cierre va siempre al final (después de la prórroga y de los penales).
  const ftIdx = result.events.findIndex((e) => e.type === "ft");
  if (ftIdx >= 0) result.events.push(...result.events.splice(ftIdx, 1));
  if (result.ratings) {
    result.ratings = computeRatings({
      players,
      events: result.events,
      homeId: result.homeId,
      awayId: result.awayId,
      homeGoals: result.homeGoals,
      awayGoals: result.awayGoals,
      homeLineup: result.homeLineup,
      awayLineup: result.awayLineup,
      rng,
    });
  }
}
