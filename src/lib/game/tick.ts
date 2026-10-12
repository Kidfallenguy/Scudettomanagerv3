import { hasCeremony } from "./award-ceremony";
import { selectSeasonAwards } from "./award-selection";
import { applyBoardMatch, closeBoardSeason } from "./board";
import { sponsorMatchBonus, sponsorObjectiveBonus } from "./sponsors";
import { clubById, isDomesticCompetition, playableLeague } from "./clubs";
import { resolveScouts } from "./academy";
import { UCL_FINAL_ROUND, UECL_FINAL_ROUND, UEL_FINAL_ROUND, carabaoFinalRound, coppaFinalRound, finalRoundOf, isContinental, isEnglishLeague, isPortugueseLeague, supercoppaFinalRound } from "./competitions";
import { payMatchBonuses } from "./contracts";
import { userMatchBoost } from "./event-effects";
import { closeEventWindow, rollBetweenMatchEvent, rollPreMatchEvent } from "./events";
import { clamp, formatMoney, refreshValues, uid } from "./format";
import { applyLoanGrowth, applyMatchGrowth } from "./potential";
import { Rng } from "./rng";
import { applyLiveMatchEffects } from "./live-match";
import { settleLevelTie, tieCarry } from "./knockout";
import { autoLineup, indexMatchPlayers, simulateMatch } from "./sim";
import { shouldUseDetailedSimulation, simulateQuickMatch } from "./simulation";
import { syncStats } from "./stats";
import { advanceTraining, daysBetween } from "./training";
import { pickXi, dropFromLineup, isUnavailable, sanitizeBench, unavailableDetail, unavailableGames, unavailableReason } from "./tactics";
import { processMarketWeek } from "./transfers";
import { processPlayerMatch } from "./player-relations";
import { settlePressPromises } from "./press";
import { recordStadiumMatch } from "./stadium";
import { publishMatchNews, publishNews, publishTransferNews, trimNewsItems } from "./news";
import {
  applyFixtureToWorld,
  awardTrophy,
  maybeAwardCup,
  populateKnockout,
  prizeForPlace,
  sortTable,
  tieWinner,
} from "./world";
import type { Fixture, GameSave, MatchResult, Player } from "./types";

type FixtureIndex = {
  byId: Map<string, Fixture>;
  firstLegByTie: Map<string, Fixture>;
  source: Fixture[];
  indexedCount: number;
};

function createFixtureIndex(save: GameSave): FixtureIndex {
  return {
    byId: new Map(save.fixtures.map((fixture) => [fixture.id, fixture])),
    firstLegByTie: new Map(
      save.fixtures.flatMap((fixture) =>
        fixture.leg === 1 && fixture.tieId ? [[fixture.tieId, fixture] as const] : [],
      ),
    ),
    source: save.fixtures,
    indexedCount: save.fixtures.length,
  };
}

function syncFixtureIndex(save: GameSave, index: FixtureIndex) {
  if (index.source !== save.fixtures) {
    index.byId.clear();
    index.firstLegByTie.clear();
    index.source = save.fixtures;
    index.indexedCount = 0;
  }
  while (index.indexedCount < save.fixtures.length) {
    const fixture = save.fixtures[index.indexedCount]!;
    index.byId.set(fixture.id, fixture);
    if (fixture.leg === 1 && fixture.tieId) index.firstLegByTie.set(fixture.tieId, fixture);
    index.indexedCount += 1;
  }
}

function newsId() {
  return uid("n");
}

function fixtureHash(id: string) {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash = Math.imul(hash ^ id.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

function recordFixtureScorers(save: GameSave, fixture: Fixture, result: MatchResult) {
  const scorers = result.events.flatMap((event) =>
    event.type === "goal" && event.playerId ? [{ playerId: event.playerId, clubId: event.clubId }] : [],
  );
  fixture.assistIds = result.events.flatMap((event) =>
    event.type === "goal" && event.assistPlayerId ? [event.assistPlayerId] : [],
  );
  const rng = new Rng(save.seed + save.cursor * 997 + fixture.round + fixtureHash(fixture.id));
  for (const clubId of [fixture.homeId, fixture.awayId]) {
    const goals = clubId === fixture.homeId ? result.homeGoals : result.awayGoals;
    const attributed = scorers.filter((scorer) => scorer.clubId === clubId).length;
    const squad = save.players.filter((player) => player.clubId === clubId && player.pos !== "GK");
    const candidates = squad.length ? squad : save.players.filter((player) => player.clubId === clubId);
    for (let count = attributed; count < goals && candidates.length; count += 1) {
      const scorer = rng.pick(candidates);
      if (scorer) scorers.push({ playerId: scorer.id, clubId });
    }
  }
  fixture.scorerIds = scorers.map((scorer) => scorer.playerId);
}

/** Motivo corto de una baja para los avisos ("lesionado", "expulsado", "Gripe"...). */
function outLabel(reason: string, detail: string): string {
  if (reason === "injury") return "lesionado";
  if (reason === "suspension") return "expulsado";
  return detail ? detail.toLowerCase() : "no disponible";
}

export function lineupProblems(save: GameSave): Player[] {
  return save.tactics.lineup
    .map((id) => save.players.find((p) => p.id === id))
    .filter((p): p is Player => p !== undefined && isUnavailable(p));
}

/** Jugadores del once que no pueden jugar, con el motivo (para el cartel y la alineación). */
export function lineupProblemsDetailed(save: GameSave) {
  return lineupProblems(save).map((p) => ({
    player: p,
    reason: unavailableReason(p) ?? "injury",
    games: unavailableGames(p),
    detail: unavailableDetail(p),
  }));
}

/** Deja el banquillo del usuario coherente con la plantilla y el once actuales. */
export function fixBench(save: GameSave) {
  const squad = save.players.filter((p) => p.clubId === save.clubId);
  save.tactics.bench = sanitizeBench(save.tactics.bench, save.tactics.lineup, squad);
}

/**
 * Solo reemplaza a quien ya no está en el club (vendido, retirado...).
 * Mantiene a los lesionados/expulsados en el once para que se vean en la alineación.
 */
export function sanitizeMissingLineup(save: GameSave) {
  const squad = save.players.filter((p) => p.clubId === save.clubId);
  let lineup = [...save.tactics.lineup];
  for (const id of [...lineup]) {
    const p = save.players.find((x) => x.id === id);
    if (!p || p.clubId !== save.clubId) {
      lineup = dropFromLineup(lineup, save.tactics.formation, id, squad);
    }
  }
  save.tactics.lineup =
    lineup.filter(Boolean).length === 11 ? lineup : pickXi(squad, save.tactics.formation);
  fixBench(save);
}

/** Devuelve el once guardado antes de un "cambio automático solo para este partido". */
export function restoreTempLineup(save: GameSave) {
  const backup = save.tempLineupBackup;
  if (!backup) return;
  save.tempLineupBackup = null;
  const inClub = new Set(save.players.filter((p) => p.clubId === save.clubId).map((p) => p.id));
  const current = save.tactics.lineup;
  const restored = backup.map((id, i) => (inClub.has(id) ? id : (current[i] ?? id)));
  if (restored.length === 11 && new Set(restored).size === 11 && restored.every((id) => inClub.has(id))) {
    save.tactics.lineup = restored;
  }
}

export function sanitizeUserLineup(save: GameSave) {
  const squad = save.players.filter((p) => p.clubId === save.clubId);
  let lineup = [...save.tactics.lineup];
  for (const id of [...lineup]) {
    const p = save.players.find((x) => x.id === id);
    if (!p || isUnavailable(p)) {
      lineup = dropFromLineup(lineup, save.tactics.formation, id, squad);
    }
  }
  save.tactics.lineup =
    lineup.filter(Boolean).length === 11 ? lineup : pickXi(squad, save.tactics.formation);
  fixBench(save);
}

/** Avisos del partido para el usuario: rojas, lesiones y jugadores que quedaron a una amarilla de la sanción. */
function pushDisciplineNews(save: GameSave, result: MatchResult) {
  const mine = (id?: string) => (id ? save.players.find((p) => p.id === id && p.clubId === save.clubId) : undefined);
  for (const e of result.events) {
    if (e.clubId !== save.clubId) continue;
    const p = mine(e.playerId);
    if (!p) continue;
    if (e.type === "red") {
      const n = e.games ?? p.suspended;
      publishNews(save, {
        tone: "bad",
        title: `Roja para ${p.name}`,
        body: `${e.secondYellow ? "Doble amarilla" : "Expulsión directa"}: ${n} partido${n > 1 ? "s" : ""} de sanción.`,
        category: "player",
        importance: n >= 3 ? "high" : "medium",
        clubIds: [save.clubId],
        playerIds: [p.id],
        action: "squad",
        sourceKey: `discipline:red:${save.season}:${save.week}:${p.id}`,
      });
    } else if (e.type === "injury") {
      const n = e.games ?? p.injured;
      publishNews(save, {
        tone: "bad",
        title: `Lesión de ${p.name}`,
        body: `Baja ${n} partido${n > 1 ? "s" : ""}.`,
        category: "player",
        importance: n >= 4 ? "high" : "medium",
        clubIds: [save.clubId],
        playerIds: [p.id],
        action: "squad",
        sourceKey: `injury:${save.season}:${save.week}:${p.id}`,
      });
    }
  }
  const warned = new Set<string>();
  for (const e of result.events) {
    if (e.type !== "yellow" || e.clubId !== save.clubId) continue;
    const p = mine(e.playerId);
    if (!p || warned.has(p.id) || p.suspended > 0 || p.yellows !== 4) continue;
    warned.add(p.id);
    publishNews(save, {
      tone: "neutral",
      title: `${p.name} está apercibido`,
      body: "Suma 4 amarillas: con la próxima se pierde un partido por sanción.",
      category: "player",
      clubIds: [save.clubId],
      playerIds: [p.id],
      action: "squad",
      sourceKey: `warning:${save.season}:${save.week}:${p.id}`,
    });
  }
}

/** `live`: resultado de un partido del usuario jugado minuto a minuto (Ver partido); sin él, todo se simula. */
export function simSlot(save: GameSave, live?: MatchResult, fixtureIndex?: FixtureIndex) {
  const slot = save.calendar[save.cursor];
  if (!slot) return;
  const fixtures = fixtureIndex ?? createFixtureIndex(save);
  populateKnockout(save, slot);
  syncFixtureIndex(save, fixtures);
  if (slot.fixtures.length === 0) {
    save.cursor += 1;
    return;
  }
  let playerIndex: ReturnType<typeof indexMatchPlayers> | undefined;
  const getPlayerIndex = () => (playerIndex ??= indexMatchPlayers(save.players));
  const managedLeague = playableLeague(clubById(save.clubId).league);

  // Goles y asistencias previos en un solo número por jugador (sin crear un objeto por cada uno de los miles de jugadores).
  const SNAP = 4096;
  const snapshot = new Map<string, number>();
  for (const p of save.players) snapshot.set(p.id, p.goals * SNAP + p.assists);
  // Quien se lesiona o ve la roja en ESTE partido no descuenta jornada hoy:
  // solo descuentan los que ya estaban fuera antes del partido.
  const hadStatus = new Set(
    save.players.filter((p) => p.injured > 0 || p.suspended > 0).map((p) => p.id),
  );
  // Una sanción se cumple en partidos del club: solo descuenta si el club juega en esta fecha.
  const playingClubs = new Set<string>();
  for (const fid of slot.fixtures) {
    const f = fixtures.byId.get(fid);
    if (f && !f.played) {
      playingClubs.add(f.homeId);
      playingClubs.add(f.awayId);
    }
  }
  // Red de seguridad: nadie lesionado, sancionado o ausente por un suceso puede jugar, llegue como llegue el once.
  // (Con la pantalla normal esto no se dispara: el partido no arranca con bajas en el once.)
  if (slot.fixtures.some((fid) => {
    const f = fixtures.byId.get(fid);
    return f && !f.played && (f.homeId === save.clubId || f.awayId === save.clubId);
  })) {
    if (lineupProblems(save).length) sanitizeUserLineup(save);
    else fixBench(save);
  }
  // Preparación del equipo (sucesos recientes) y ambiente del plantel: suman o restan puntos de GRL de equipo.
  const userBoost = userMatchBoost(save);

  let userPlayed = false;
  // Suplentes del usuario que entraron: cuentan como que jugaron (bonus, crecimiento).
  const userSubs = new Set<string>();
  for (const fid of slot.fixtures) {
    const fixture = fixtures.byId.get(fid);
    if (!fixture || fixture.played) continue;
    const isUser = fixture.homeId === save.clubId || fixture.awayId === save.clubId;
    const useLive = isUser && live !== undefined && live.fixtureId === fixture.id;
    let quickSimulated = false;
    let result: MatchResult;
    if (useLive) {
      applyLiveMatchEffects(save.players, live, new Rng(save.seed + save.cursor * 31 + fid.length));
      result = live;
    } else if (shouldUseDetailedSimulation(save, fixture, managedLeague)) {
      const indexedPlayers = getPlayerIndex();
      const homeLineup =
        fixture.homeId === save.clubId
          ? save.tactics.lineup
          : autoLineup(save.players, fixture.homeId, indexedPlayers.byClub);
      const awayLineup =
        fixture.awayId === save.clubId
          ? save.tactics.lineup
          : autoLineup(save.players, fixture.awayId, indexedPlayers.byClub);
      result = simulateMatch(fixture, save.players, {
        seed: save.seed + save.cursor * 997 + fid.length * 13 + fixture.round,
        homeLineup,
        awayLineup,
        homeBench: fixture.homeId === save.clubId ? save.tactics.bench : undefined,
        awayBench: fixture.awayId === save.clubId ? save.tactics.bench : undefined,
        homeMentality: fixture.homeId === save.clubId ? save.tactics.mentality : "balanced",
        awayMentality: fixture.awayId === save.clubId ? save.tactics.mentality : "balanced",
        homeBoost: fixture.homeId === save.clubId ? userBoost : 0,
        awayBoost: fixture.awayId === save.clubId ? userBoost : 0,
        playerIndex: indexedPlayers,
      });
    } else {
      quickSimulated = true;
      result = simulateQuickMatch(
        fixture,
        save.seed + save.cursor * 997 + fid.length * 13 + fixture.round,
      );
    }
    // Eliminatoria igualada (en la vuelta, el global): prórroga y, si sigue igual, tanda de penales.
    // En liga, grupos y fase de liga europea el empate se queda como empate.
    const carry = tieCarry(save, fixture, fixtures.firstLegByTie);
    if (carry) settleLevelTie(save.players, result, carry, new Rng(save.seed + save.cursor * 131 + fid.length * 17 + fixture.round));
    fixture.played = true;
    fixture.homeGoals = result.homeGoals;
    fixture.awayGoals = result.awayGoals;
    recordFixtureScorers(save, fixture, result);
    if (result.extraTime) fixture.extraTime = true;
    if (result.penalties) {
      fixture.penHome = result.penalties.home;
      fixture.penAway = result.penalties.away;
    }
    applyFixtureToWorld(save, fixture, result.homeGoals, result.awayGoals);
    if (isUser) {
      userPlayed = true;
      save.lastMatch = result;
      const mySubs = fixture.homeId === save.clubId ? result.homeSubsIn : result.awaySubsIn;
      for (const id of mySubs ?? []) userSubs.add(id);
      const hg = result.homeGoals;
      const ag = result.awayGoals;
      const userHome = fixture.homeId === save.clubId;
      const userGoals = userHome ? hg : ag;
      const oppGoals = userHome ? ag : hg;
      let extra = "";
      if (result.extraTime) extra += "Prórroga";
      if (result.penalties) {
        const mine = userHome ? result.penalties.home : result.penalties.away;
        const theirs = userHome ? result.penalties.away : result.penalties.home;
        extra += `${extra ? " · " : ""}Penales ${mine}–${theirs}`;
      }
      if (fixture.leg === 2 && fixture.tieId) {
        const w = tieWinner(save, fixture.tieId);
        if (w) extra += `${extra ? " · " : ""}${w === save.clubId ? "Pasa de ronda" : "Eliminado"}`;
      }
      const sponsorBase = userGoals > oppGoals ? 450_000 : userGoals === oppGoals ? 180_000 : 70_000;
      const stadiumRecord = userHome ? recordStadiumMatch(save, fixture) : null;
      if (stadiumRecord) {
        extra += `${extra ? " · " : ""}${stadiumRecord.attendance.toLocaleString("es-ES")} espectadores · Taquilla ${formatMoney(stadiumRecord.revenue)}`;
      }
      publishMatchNews(save, fixture, result, slot.title, true, extra);
      pushDisciplineNews(save, result);
      // El ingreso base por resultado se conserva solo como referencia del bonus comercial del sponsor.
      // La taquilla efectiva, registrada una vez y solo como local, sustituye al antiguo pago fijo.
      save.budget += (stadiumRecord?.revenue ?? 0) + sponsorMatchBonus(save, sponsorBase);
      applyBoardMatch(save, fixture, userGoals, oppGoals);
    } else if (!quickSimulated) {
      publishMatchNews(save, fixture, result, slot.title, false);
    }
  }

  const contrib = new Map<string, { goals: number; assists: number }>();
  const playedNow = new Set<string>();
  for (const p of save.players) {
    const before = snapshot.get(p.id);
    if (before === undefined) continue;
    const dg = p.goals - Math.floor(before / SNAP);
    const da = p.assists - (before % SNAP);
    if (dg || da) {
      contrib.set(p.id, { goals: dg, assists: da });
      playedNow.add(p.id);
    }
  }
  if (userPlayed) {
    const paid = payMatchBonuses(save, contrib, new Set([...save.tactics.lineup, ...userSubs]));
    if (paid > 0) {
      save.news.unshift({
        id: newsId(),
        week: save.week,
        tone: "neutral",
        title: "Bonus pagados",
        body: `Goles, asistencias y partidos de la plantilla: ${formatMoney(paid)}.`,
      });
    }
  }
  const rng = new Rng(save.seed + save.week * 31 + save.cursor);
  for (const id of save.tactics.lineup) playedNow.add(id);
  for (const id of userSubs) playedNow.add(id);
  applyMatchGrowth(save.players, playedNow, contrib, rng);
  for (const p of applyLoanGrowth(save.players, save.clubId, rng)) {
    save.news.unshift({
      id: newsId(),
      week: save.week,
      tone: "good",
      title: `${p.name} progresa a préstamo`,
      body: `Cedido en ${clubById(p.clubId).name}: sube a GRL ${p.ovr}.`,
    });
  }
  const league = clubById(save.clubId).league;
  maybeAwardCup(save, "coppa", coppaFinalRound(league), "coppa");
  if (isEnglishLeague(league) || isPortugueseLeague(league)) maybeAwardCup(save, "carabao", carabaoFinalRound(league), "carabao");
  maybeAwardCup(save, "ucl", UCL_FINAL_ROUND, "ucl");
  maybeAwardCup(save, "uel", UEL_FINAL_ROUND, "uel");
  maybeAwardCup(save, "uecl", UECL_FINAL_ROUND, "uecl");
  maybeAwardCup(save, "libertadores", 10, "libertadores");
  maybeAwardCup(save, "sudamericana", 4, "sudamericana");
  maybeAwardCup(save, "supercoppa", supercoppaFinalRound(league), "supercoppa");
  if (league === "saudiProLeague" || league === "saudiFirstDivision") {
    const kingsCupFinal = finalRoundOf("kingsCup", league);
    if (kingsCupFinal !== null) maybeAwardCup(save, "kingsCup", kingsCupFinal, "coppa");
    maybeAwardCup(save, "saudiSuperCup", 2, "supercoppa");
  }
  maybeAwardCup(save, "trofeo", 1, "trofeo");
  maybeAwardCup(save, "mundial", 1, "mundial");

  for (const p of save.players) {
    if (hadStatus.has(p.id)) {
      if (p.injured > 0) p.injured -= 1;
      if (p.suspended > 0 && playingClubs.has(p.clubId)) p.suspended -= 1;
    }
    if (p.fitness < 100) p.fitness = clamp(p.fitness + 6, 40, 100);
  }

  // Si hubo "cambio automático solo para este partido", volvemos al once original.
  restoreTempLineup(save);

  // Las bajas se quedan marcadas en la alineación (ya no se sustituyen solas).
  const stillOut = lineupProblemsDetailed(save);
  if (stillOut.length) {
    const names = stillOut
      .slice(0, 4)
      .map((x) => `${x.player.name} (${outLabel(x.reason, x.detail)}, ${x.games} j)`)
      .join(", ");
    save.popups.push({
      id: uid("pop"),
      kind: "info",
      tone: "bad",
      title: "Bajas en el once",
      body: `${names}. Seguirán marcados en tu alineación: cambialos o usá el cambio automático antes del próximo partido.`,
    });
  }

  // El set con todos los nombres solo se arma si hay ojeadores que puedan encontrar a alguien.
  const used = save.scouts.length ? new Set(save.players.map((p) => p.name)) : new Set<string>();
  const scouted = resolveScouts(save.scouts, save.academy, save.academyLevel, save.clubId, rng, used);
  save.scouts = scouted.scouts;
  save.academy = scouted.academy;
  for (const y of scouted.found) {
    save.news.unshift({
      id: newsId(),
      week: save.week,
      tone: "good",
      title: `Promesa: ${y.name}`,
      body: `${y.nat} · ${y.pos} · GRL ${y.ovr} / POT ${y.pot}. Ficha de ${formatMoney(y.fee)}.`,
    });
  }

  const knownTransfers = new Set(save.transferLog.map((transfer) => transfer.id));
  processMarketWeek(save, rng);
  for (const transfer of save.transferLog) {
    if (!knownTransfers.has(transfer.id)) publishTransferNews(save, transfer);
  }
  if (userPlayed && save.lastMatch) processPlayerMatch(save, save.lastMatch);
  // Sucesos inesperados: los de la previa salen en advanceToUserMatch (antes de jugar).
  // Acá solo: al jugar el usuario se cierra la ventana de ese partido; en jornadas ajenas puede haber uno "entre partidos".
  if (userPlayed) closeEventWindow(save);
  else rollBetweenMatchEvent(save);
  refreshValues(save.players);
  // Si la media cambió por partidos, edad o cesiones, las estadísticas la acompañan.
  for (const p of save.players) syncStats(p);
  const slotDate = slot.date;
  save.week += 1;
  if (userPlayed) settlePressPromises(save);
  save.cursor += 1;
  save.pendingFixtureId = null;
  // Corre el reloj del entrenamiento (6 meses de tiempo de juego).
  advanceTraining(
    save,
    daysBetween(slotDate, save.calendar[save.cursor]?.date),
    new Rng(save.seed + save.week * 53 + 7),
  );
  if (save.cursor >= save.calendar.length) {
    endSeason(save);
  }
  save.news = trimNewsItems(save.news);
}

function userFixtureInSlot(save: GameSave, slotIndex: number, fixtures: FixtureIndex) {
  const slot = save.calendar[slotIndex];
  if (!slot) return null;
  populateKnockout(save, slot);
  syncFixtureIndex(save, fixtures);
  for (const fid of slot.fixtures) {
    const f = fixtures.byId.get(fid);
    if (!f || f.played) continue;
    if (f.homeId === save.clubId || f.awayId === save.clubId) return f;
  }
  return null;
}

export function advanceToUserMatch(save: GameSave) {
  const fixtures = createFixtureIndex(save);
  while (save.cursor < save.calendar.length && !save.seasonOver) {
    const userFix = userFixtureInSlot(save, save.cursor, fixtures);
    if (userFix) {
      save.pendingFixtureId = userFix.id;
      save.screen = "preview";
      // Previa del partido: único momento principal para un suceso inesperado (máx. 1 por partido).
      rollPreMatchEvent(save);
      return;
    }
    simSlot(save, undefined, fixtures);
  }
  if (!save.seasonOver && save.cursor >= save.calendar.length) endSeason(save);
}

export function endSeason(save: GameSave) {
  save.seasonOver = true;
  save.screen = "season-end";
  const userLeague = playableLeague(clubById(save.clubId).league);
  const table = sortTable(save.leagueTables[userLeague] ?? save.standings);
  const place = table.findIndex((r) => r.clubId === save.clubId);
  const prize = prizeForPlace(place, clubById(save.clubId).league);
  save.budget += prize;
  const champion = table[0]?.clubId;
  if (champion) awardTrophy(save, "scudetto", champion);
  const lg = clubById(save.clubId).league;
  maybeAwardCup(save, "coppa", coppaFinalRound(lg), "coppa");
  if (isEnglishLeague(lg) || isPortugueseLeague(lg)) maybeAwardCup(save, "carabao", carabaoFinalRound(lg), "carabao");
  maybeAwardCup(save, "ucl", UCL_FINAL_ROUND, "ucl");
  maybeAwardCup(save, "uel", UEL_FINAL_ROUND, "uel");
  maybeAwardCup(save, "uecl", UECL_FINAL_ROUND, "uecl");
  maybeAwardCup(save, "libertadores", 10, "libertadores");
  maybeAwardCup(save, "sudamericana", 4, "sudamericana");
  maybeAwardCup(save, "supercoppa", supercoppaFinalRound(lg), "supercoppa");
  if (lg === "saudiProLeague" || lg === "saudiFirstDivision") {
    const kingsCupFinal = finalRoundOf("kingsCup", lg);
    if (kingsCupFinal !== null) maybeAwardCup(save, "kingsCup", kingsCupFinal, "coppa");
    maybeAwardCup(save, "saudiSuperCup", 2, "supercoppa");
  }
  maybeAwardCup(save, "trofeo", 1, "trofeo");
  // Con la tabla final y las copas definidas, la dirigencia hace su balance.
  const boardWasClosed = Boolean(save.board?.closed);
  closeBoardSeason(save);
  // Bonus de patrocinadores por objetivos cumplidos (una sola vez por temporada).
  if (!boardWasClosed && save.board && !save.board.sacked) {
    const objectives = sponsorObjectiveBonus(save);
    if (objectives > 0) {
      save.budget += objectives;
      save.news.unshift({
        id: newsId(),
        week: save.week,
        tone: "good",
        title: "Bonus de patrocinadores por objetivos",
        body: `Tus patrocinadores pagan ${formatMoney(objectives)} por los objetivos cumplidos.`,
      });
    }
  }
  // Con todo cerrado (tabla, copas y objetivos), se eligen nominados y ganadores de los premios individuales.
  selectSeasonAwards(save);
  // Con los premios ya sorteados, el cierre de temporada pasa primero por la ceremonia de premios.
  if (hasCeremony(save)) save.screen = "awards";
}

void isDomesticCompetition;
void isContinental;
void finalRoundOf;
