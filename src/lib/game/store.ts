import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import { createSaveStorage } from "./save-storage";
import { MAX_SCOUTS, SCOUT_COUNTRIES, seedAcademy, youthToPlayer, scoutCost } from "./academy";
import { createBoard, normalizeBoard } from "./board";
import { aiTerms, applyTerms, ensureTerms, renewedContract } from "./contracts";
import { interestedBuyers } from "./ai-market";
import { baseTransferBudget, canAfford, creditClub, ensureFinance, logTransfer, payroll } from "./finance";
import { seedFreeAgents } from "./free-agents";
import { CLUBS, UCL_GROUPS, applyClubIdentity, applyDivisions, clubById, emptyLeagueTables, isKnownClub, isSelectableClub, playableLeague, startingBudget } from "./clubs";
import { POS_LABEL, capMarketValue, clamp, formatMoney, playerValue, uid } from "./format";
import { historicalFor } from "./honours";
import { normalizePotential } from "./potential";
import { managerOffers, managerReport } from "./manager";
import { Rng } from "./rng";
import {
  acceptSponsorOffer,
  normalizeClubSponsors,
  normalizeSponsorHistory,
  normalizeSponsorLock,
  normalizeSponsorOffers,
  searchSponsors,
} from "./sponsors";
import { hasCeremony } from "./award-ceremony";
import { ensureSeasonAwards, normalizeAwards } from "./awards";
import { archiveSeason, normalizeCareerHistory } from "./career";
import { createClubRescue, settleClubRescue } from "./club-rescue";
import { buyStadiumUpgrade, closeStadiumSeason, createStadiumState, defaultFacilitiesLevel, normalizeStadiums, stadiumFor, type StadiumUpgradeId } from "./stadium";
import { evolveSeason } from "./season";
import { attrsFor, assignShirtNumbers, buildSquad, resyncStats, topUpThinSquads } from "./squads";
import { startTrainingPlan, tierInfo, validateTrainingStart } from "./training";
import { BENCH_SIZE, FORMATIONS, canPlaySlot, dropFromLineup, isUnavailable, pickBench, pickXi, placeNewcomer, sanitizeBench, unavailableDetail, unavailableGames } from "./tactics";
import { cleanNameNumber, hasNameNumber, isGenericPlayerName, makeName } from "./names";
import { ensurePos, normalizePos } from "./positions";
import { SQUAD_FULL_MSG, hasSquadRoom, isOwnedAtClub, ownershipBlockReason, saleBlockReason, squadTotal } from "./squad-rules";
import { createEventState, normalizeEventState, resolveEventDecision } from "./events";
import {
  applyPressAnswer,
  createPressConference,
  normalizePressConference,
  normalizePressFrequency,
  normalizePressHistory,
  normalizePressPromises,
} from "./press";
import {
  appendPlayerChatNote,
  markPlayerChatRead,
  normalizeIdolatryHistory,
  normalizePlayerChats,
  normalizePlayerPromises,
  resolvePlayerChat,
} from "./player-relations";
import { advanceToUserMatch, lineupProblems, sanitizeMissingLineup, sanitizeUserLineup, simSlot } from "./tick";
import { normalizeNews } from "./news";
import {
  acceptOffer,
  completeRenewal,
  completeSigning,
  loanFee,
  marketPool,
  recallLoanedPlayer,
  rejectOffer,
  settleSellOn,
} from "./transfers";
import type {
  ClubId,
  ClubCustomization,
  Competition,
  ContractTerms,
  FormationId,
  GameSave,
  MatchResult,
  Mentality,
  NewsItem,
  NumberColor,
  Player,
  Pos,
  Screen,
  TrainingPlan,
  TrainingReport,
  TrainingTier,
} from "./types";
import { createCareer, migrateUclToLeaguePhase, migrateUeclToLeaguePhase, migrateUelToLeaguePhase, wageBill } from "./world";

const SAVE_VERSION = 9;
const STORAGE_KEY = "scudetto-save-v1";
export const SLOT_COUNT = 5;

function emptySlots(): Array<GameSave | null> {
  return Array.from({ length: SLOT_COUNT }, () => null);
}

type Actions = {
  hydrated: boolean;
  slots: Array<GameSave | null>;
  customClubs: ClubCustomization[];
  setHydrated: (v: boolean) => void;
  setScreen: (s: Screen) => void;
  openNews: () => void;
  markNewsRead: (newsId: string) => void;
  markNewsIssueRead: (season: number, week: number, gameDate?: string) => void;
  setPressFrequency: (frequency: GameSave["pressFrequency"]) => void;
  startPressConference: () => void;
  answerPressQuestion: (questionId: string, answerId: string) => void;
  finishPressConference: () => void;
  openSlots: () => void;
  prepareSlot: (index: number) => void;
  loadSlot: (index: number) => void;
  clearSlot: (index: number) => void;
  saveCustomClub: (club: ClubCustomization) => string | null;
  duplicateCustomClub: (id: string) => void;
  deleteCustomClub: (id: string) => void;
  newGame: (
    clubId: ClubId,
    identity?: ClubCustomization | null,
    rescueSeasons?: number | null,
    keepBaseStadium?: boolean,
  ) => void;
  buyStadiumUpgrade: (id: StadiumUpgradeId) => string | null;
  setStadiumTicketPrice: (price: number) => string | null;
  abandon: () => void;
  setFormation: (id: FormationId) => void;
  setMentality: (m: Mentality) => void;
  setNumberColor: (c: NumberColor) => void;
  setLineupSlot: (index: number, playerId: string) => string | null;
  autoFill: () => void;
  toggleBench: (playerId: string) => string | null;
  autoBench: () => void;
  recallLoan: (playerId: string) => string | null;
  searchSponsors: () => string | null;
  acceptSponsorOffer: (offerId: string, replaceId?: string) => string | null;
  substituteUnavailable: (permanent: boolean) => string | null;
  toggleNoOffers: (playerId: string) => void;
  goToNextMatch: () => void;
  simulateNextCalendarSlot: (date: string) => CalendarSimulationSummary | null;
  playPending: (watch: boolean) => void;
  /** Aplica al save el resultado de un partido jugado minuto a minuto y va a la pantalla de resultado. */
  finishLiveMatch: (result: MatchResult) => void;
  finishWatch: () => void;
  signPlayer: (playerId: string, terms: ContractTerms, payClause: boolean) => string | null;
  renewPlayer: (playerId: string, terms: ContractTerms) => string | null;
  sellPlayer: (playerId: string) => string | null;
  toggleListed: (playerId: string) => void;
  toggleLoanListed: (playerId: string) => void;
  takeOnLoan: (playerId: string, seasons: 1 | 2) => string | null;
  acceptIncoming: (offerId: string, keepPct?: number) => string | null;
  rejectIncoming: (offerId: string) => void;
  startScout: (countryId: string, tier: 1 | 2 | 3, pos: Pos | "ANY") => string | null;
  signYouth: (youthId: string) => string | null;
  releaseYouth: (youthId: string) => string | null;
  startTraining: (tier: TrainingTier, playerIds: string[]) => string | null;
  dismissTrainingReport: () => void;
  dismissPopup: () => void;
  resolveEventChoice: (popupId: string, choiceId: string) => string | null;
  markPlayerChatRead: (threadId: string) => void;
  resolvePlayerChatChoice: (threadId: string, choiceId: string) => ReturnType<typeof resolvePlayerChat>;
  addPlayerChatNote: (threadId: string, body: string) => void;
  startNextSeason: () => void;
  /** Cierra la temporada y sigue la carrera dirigiendo a otro club (oferta recibida por tu valoración de DT). */
  switchClub: (clubId: string) => string | null;
};

export type GameStore = GameSave & Actions;

export interface CalendarSimulationSummary {
  targetDate: string;
  startDate: string;
  currentDate: string;
  simulatedSlots: number;
  seasonOver: boolean;
  done: boolean;
  matches: Array<{
    id: string;
    date: string;
    title: string;
    competition: Competition;
    homeId: ClubId;
    awayId: ClubId;
    homeGoals: number;
    awayGoals: number;
  }>;
}

function blankHonours() {
  return historicalFor("");
}

function blankChampions() {
  return {
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
  };
}

function idHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1_000_003;
  return h;
}

/** "Rossi no está disponible: Gripe (2 partidos más)". Es lo que ve el usuario si intenta alinear a un ausente. */
function unavailableMessage(p: Player): string {
  const games = unavailableGames(p);
  return `${p.name} no está disponible: ${unavailableDetail(p)} (${games} ${games === 1 ? "partido más" : "partidos más"}).`;
}

/** Valida los datos que agregan los sucesos (ausencia, relaciones, valor temporal) en partidas guardadas. */
function patchEventFields(p: Player): Pick<Player, "absence" | "bond" | "valueMod"> {
  const kinds = ["illness", "personal", "discipline", "other"];
  const a = p.absence;
  const absence =
    a && typeof a.games === "number" && Number.isFinite(a.games) && a.games > 0 && kinds.includes(a.kind)
      ? { games: Math.min(12, Math.round(a.games)), kind: a.kind, reason: typeof a.reason === "string" && a.reason ? a.reason : "Ausencia" }
      : undefined;
  const b = p.bond;
  const bond =
    b && typeof b.club === "number" && typeof b.squad === "number"
      ? { club: Math.max(0, Math.min(100, Math.round(b.club))), squad: Math.max(0, Math.min(100, Math.round(b.squad))) }
      : undefined;
  const v = p.valueMod;
  const valueMod =
    v && typeof v.pct === "number" && typeof v.games === "number" && v.games > 0
      ? { pct: Math.max(-40, Math.min(40, Math.round(v.pct))), games: Math.min(20, Math.round(v.games)) }
      : undefined;
  return { absence, bond, valueMod };
}

function patchPlayer(p: Player): Player {
  const n = typeof p.number === "number" && p.number >= 1 ? p.number : fallbackNumber(p);
  const ovr = clamp(Number.isFinite(p.ovr) ? p.ovr : 40, 40, 100);
  const legacyPotential =
    p.name.trim().toLocaleLowerCase() === "mauro schönfeld" && p.pot > 100 ? 73 : p.pot;
  const pot = normalizePotential(ovr, legacyPotential);
  // Partidas viejas: el portero gana sus estadísticas y todos quedan acordes a su GRL.
  const stats: Player = {
    ...p,
    ovr,
    pot,
    value: playerValue(ovr, p.age, pot, p),
    attrs: { ...p.attrs },
    gk: p.gk ? { ...p.gk } : undefined,
  };
  // Partidas viejas pueden traer jugadores sin posición válida (vacía, null, "LM"...): se repara al cargar.
  ensurePos(stats);
  resyncStats(stats, new Rng(idHash(p.id) + 91));
  return ensureTerms({
    ...stats,
    fanIdol: Math.max(0, Math.min(100, Math.round(p.fanIdol ?? 0))),
    careerGoals: p.careerGoals ?? 0,
    careerAssists: p.careerAssists ?? 0,
    careerApps: p.careerApps ?? 0,
    seasonStartOvr: p.seasonStartOvr ?? p.ovr,
    listedForLoan: Boolean(p.listedForLoan),
    loanFrom: p.loanFrom ?? null,
    loanSeasons: p.loanSeasons ?? 0,
    hiddenGem: Boolean(p.hiddenGem),
    listed: Boolean(p.listed),
    suspended: p.suspended ?? 0,
    number: n,
    locked: Boolean(p.locked),
    noOffers: Boolean(p.noOffers),
    ...patchEventFields(p),
  });
}

/** Quita los números que quedaron al final de nombres viejos ("Marco Rossi 7") sin duplicar nombres. */
function cleanPlayerNames<T extends { name: string }>(list: T[]): T[] {
  if (!list.some((x) => hasNameNumber(x.name) || isGenericPlayerName(x.name))) return list;
  const used = new Set(list.filter((x) => !hasNameNumber(x.name) && !isGenericPlayerName(x.name)).map((x) => x.name));
  return list.map((x) => {
    if (!hasNameNumber(x.name) && !isGenericPlayerName(x.name)) return x;
    if (isGenericPlayerName(x.name)) {
      const player = x as T & { id?: unknown; nat?: unknown };
      const seed = typeof player.id === "string" ? player.id : x.name;
      const rng = new Rng(idHash(seed));
      const nat = typeof player.nat === "string" ? player.nat : "NED";
      const name = makeName(rng, nat, used);
      used.add(name);
      return { ...x, name };
    }
    const name = cleanNameNumber(x.name, used);
    used.add(name);
    return { ...x, name };
  });
}

function fallbackNumber(p: Player): number {
  const digits = p.id.replace(/\D/g, "").slice(-2);
  const parsed = parseInt(digits || "0", 10);
  return Math.max(1, Math.min(99, (parsed % 98) + 1));
}

export function emptyShell(): GameSave {
  return {
    version: SAVE_VERSION,
    slot: 0,
    seed: 0,
    simulationMode: "custom",
    season: 2026,
    week: 0,
    cursor: 0,
    clubId: "",
    clubIdentity: null,
    stadiums: {},
    clubRescue: null,
    screen: "boot",
    players: [],
    standings: [],
    leagueTables: emptyLeagueTables(),
    uclStandings: [],
    uelStandings: [],
    ueclStandings: [],
    libStandings: [],
    mundialStandings: [],
    fixtures: [],
    calendar: [],
    tactics: { formation: "433", mentality: "balanced", lineup: [], bench: [], numberColor: "auto" },
    budget: 0,
    news: [],
    lastMatch: null,
    pressFrequency: "every",
    pendingPressConference: null,
    pressHistory: [],
    pressPromises: [],
    trophies: [],
    honours: blankHonours(),
    careerTrophies: [],
    careerHistory: [],
    awards: [],
    seasonOver: false,
    pendingFixtureId: null,
    trainingPlans: [],
    trainingReports: [],
    academy: [],
    scouts: [],
    academyLevel: 1,
    offers: [],
    loans: [],
    popups: [],
    uclGroups: UCL_GROUPS.map((g) => [...g]),
    uelTeams: [],
    ueclTeams: [],
    libGroups: [],
    sudTeams: [],
    mundialGroups: [],
    lastChampions: blankChampions(),
    worldHonours: [],
    tempLineupBackup: null,
    freeAgents: [],
    clubFinance: {},
    transferLog: [],
    board: null,
    clubSponsors: {},
    sponsorOffers: [],
    sponsorSearchSeason: null,
    sponsorLockUntil: null,
    sponsorHistory: [],
    events: createEventState(),
    playerChats: [],
    playerPromises: [],
    idolatryHistory: [],
  };
}

function normalizeRescue(raw: GameSave["clubRescue"]): GameSave["clubRescue"] {
  if (!raw || typeof raw !== "object") return null;
  const principal = Math.max(0, Math.round(Number(raw.principal) || 0));
  const balance = Math.max(0, Math.round(Number(raw.balance) || 0));
  const termSeasons = Math.round(clamp(Number(raw.termSeasons) || 4, 2, 6));
  const history = Array.isArray(raw.history)
    ? raw.history.slice(-50).flatMap((item) => {
        if (!item || !Number.isFinite(item.season) || !Number.isFinite(item.paid) || !Number.isFinite(item.balance)) return [];
        return [{
          season: Math.round(item.season),
          paid: Math.max(0, Math.round(item.paid)),
          balance: Math.max(0, Math.round(item.balance)),
          missed: Boolean(item.missed),
        }];
      })
    : [];
  return {
    principal,
    balance,
    installmentAmount: Math.max(0, Math.round(Number(raw.installmentAmount) || 0)),
    termSeasons,
    installmentsPaid: Math.max(0, Math.round(Number(raw.installmentsPaid) || 0)),
    missedPayments: Math.max(0, Math.round(Number(raw.missedPayments) || 0)),
    lastProcessedSeason: Number.isFinite(raw.lastProcessedSeason) ? Math.round(raw.lastProcessedSeason!) : null,
    status: raw.status === "completed" || balance === 0 ? "completed" : "active",
    history,
  };
}

function pickData(s: GameSave, normalizePlayers = true): GameSave {
  // La división (Premier/Championship, LaLiga/Segunda/Primera RFEF) de cada club vive en la partida: se aplica al cargarla.
  if (normalizePlayers) applyDivisions(s.divisions);
  const r: GameSave = {
    divisions: s.divisions,
    version: SAVE_VERSION,
    slot: s.slot,
    seed: s.seed,
    simulationMode: "custom",
    detailedLeagues: [],
    season: s.season,
    week: s.week,
    cursor: s.cursor,
    clubId: s.clubId,
    clubIdentity: s.clubIdentity ? normalizeCustomClubs([s.clubIdentity])[0] ?? null : null,
    stadiums: normalizeStadiums(s.stadiums, s.clubId, s.season, s.clubIdentity),
    clubRescue: normalizeRescue(s.clubRescue),
    screen: s.screen,
    players: normalizePlayers
      ? cleanPlayerNames((s.players ?? []).map(patchPlayer)).map((player) =>
          player.name.trim().toLocaleLowerCase() === "gustavo curti"
            ? { ...player, pos: "ST" }
            : player,
        )
      : (s.players ?? []),
    standings: s.standings ?? [],
    leagueTables: { ...emptyLeagueTables(), ...(s.leagueTables ?? {}) },
    uclStandings: s.uclStandings ?? [],
    uelStandings: s.uelStandings ?? [],
    ueclStandings: s.ueclStandings ?? [],
    libStandings: s.libStandings ?? [],
    mundialStandings: s.mundialStandings ?? [],
    fixtures: s.fixtures ?? [],
    calendar: s.calendar ?? [],
    tactics: {
      formation: s.tactics?.formation ?? "433",
      mentality: s.tactics?.mentality ?? "balanced",
      lineup: s.tactics?.lineup ?? [],
      // Partidas viejas no tienen banquillo: se arma solo más abajo.
      bench: Array.isArray(s.tactics?.bench) ? s.tactics.bench : [],
      numberColor: s.tactics?.numberColor ?? "auto",
    },
    budget: s.budget ?? 0,
    news: normalizeNews(s.news, s.season, s.calendar),
    lastMatch: s.lastMatch
      ? {
          ...s.lastMatch,
          homeGrl: s.lastMatch.homeGrl ?? 0,
          awayGrl: s.lastMatch.awayGrl ?? 0,
        }
      : null,
    pressFrequency: normalizePressFrequency(s.pressFrequency),
    pendingPressConference: normalizePressConference(s.pendingPressConference),
    pressHistory: normalizePressHistory(s.pressHistory),
    pressPromises: normalizePressPromises(s.pressPromises),
    trophies: s.trophies ?? [],
    honours: {
      ...historicalFor(s.clubId ?? ""),
      ...(s.honours ?? {}),
    },
    careerTrophies: (s.careerTrophies ?? []).map((t) => ({
      ...t,
      prize: typeof t.prize === "number" ? t.prize : 0,
    })),
    careerHistory: normalizeCareerHistory(s.careerHistory),
    awards: normalizeAwards(s.awards),
    seasonOver: Boolean(s.seasonOver),
    pendingFixtureId: s.pendingFixtureId ?? null,
    trainingPlans: normalizeTrainingPlans(s),
    trainingReports: normalizeTrainingReports(s),
    academy: cleanPlayerNames(
      (s.academy ?? []).map((y) => ({
        ...y,
        pos: normalizePos(y.pos, "CM"),
        fee: y.fee && y.fee > 0 ? y.fee : Math.max(5_000_000, Math.round((5 + Math.max(0, y.pot - 72) * 0.9) * 1_000_000)),
      })),
    ),
    scouts: s.scouts ?? [],
    academyLevel: s.academyLevel ?? 1,
    offers: s.offers ?? [],
    loans: s.loans ?? [],
    // Las ofertas ya no salen como popup: viven en Mercado → Ofertas.
    popups: (s.popups ?? []).filter((p) => p.kind !== "offer"),
    uclGroups: s.uclGroups?.length ? s.uclGroups : UCL_GROUPS.map((g) => [...g]),
    uelTeams: s.uelTeams ?? [],
    ueclTeams: s.ueclTeams ?? [],
    libGroups: s.libGroups ?? [],
    sudTeams: s.sudTeams ?? [],
    mundialGroups: s.mundialGroups ?? [],
    worldHonours: s.worldHonours ?? [],
    lastChampions: {
      ...blankChampions(),
      ...(s.lastChampions ?? {}),
    },
    tempLineupBackup: Array.isArray(s.tempLineupBackup) ? s.tempLineupBackup : null,
    freeAgents: (s.freeAgents ?? []).map(patchPlayer),
    clubFinance: s.clubFinance ?? {},
    finVersion: typeof s.finVersion === "number" ? s.finVersion : undefined,
    transferLog: Array.isArray(s.transferLog) ? s.transferLog : [],
    board: normalizeBoard(s.board),
    clubSponsors: normalizeClubSponsors(s.clubSponsors),
    sponsorOffers: normalizeSponsorOffers(s.sponsorOffers),
    sponsorSearchSeason: typeof s.sponsorSearchSeason === "number" ? s.sponsorSearchSeason : null,
    sponsorLockUntil: normalizeSponsorLock(s.sponsorLockUntil),
    sponsorHistory: normalizeSponsorHistory(s.sponsorHistory),
    events: normalizeEventState(s.events),
    playerChats: normalizePlayerChats(s.playerChats),
    playerPromises: normalizePlayerPromises(s.playerPromises),
    idolatryHistory: normalizeIdolatryHistory(s.idolatryHistory),
  };
  if (normalizePlayers) {
    // Brasileirão: sus clubes eran rellenos (`ghost`) de la Libertadores y ahora son clubes reales. Se liberan sus jugadores
    // (`locked` = club fantasma) y se descartan los de clubes que ya no existen (Fortaleza descendió: dejó de ser relleno).
    if (r.players.length) {
      r.players = r.players.filter((p) => isKnownClub(p.clubId));
      for (const p of r.players) {
        const ghost = Boolean(clubById(p.clubId).ghost);
        if (Boolean(p.locked) !== ghost) p.locked = ghost;
      }
    }
    // Partidas con clubes de plantilla provisional (1 jugador): se completan con jugadores generados al nivel de su división.
    if (r.players.length) {
      const extra = topUpThinSquads(r.players, r.seed || 1, r.clubId);
      if (extra.length) r.players = [...r.players, ...extra.map(ensureTerms)];
    }
    // Partidas anteriores a los premios: se arman los de la temporada en curso (vacíos).
    if (r.players.length) ensureSeasonAwards(r);
    // Ofertas viejas por jugadores que el usuario no puede vender (cedidos): se descartan al cargar.
    if (r.players.length) {
      r.offers = r.offers.filter((o) => {
        if (o.toClubId !== r.clubId) return true;
        const target = r.players.find((x) => x.id === o.playerId);
        return Boolean(target) && isOwnedAtClub(target!, r.clubId);
      });
    }
    // Partidas con la Champions vieja (32 equipos en grupos): pasan a la fase de liga de 36.
    if (r.players.length) migrateUclToLeaguePhase(r);
    // Partidas con la Europa League vieja (16 equipos): pasan a la fase de liga de 36.
    if (r.players.length) migrateUelToLeaguePhase(r);
    // Partidas con la Conference League vieja (16 equipos): pasan a la fase de liga de 36 con 6 bombos.
    if (r.players.length) migrateUeclToLeaguePhase(r);
    // Partidas anteriores a la dirigencia: se arman objetivos y confianza con la temporada en curso.
    if (!r.board && r.players.length && r.fixtures.length && isKnownClub(r.clubId)) {
      r.board = createBoard(r);
    }
    if (r.players.length && !Array.isArray(s.tactics?.bench)) {
      const squad = r.players.filter((p) => p.clubId === r.clubId);
      r.tactics.bench = pickBench(squad, r.tactics.lineup);
    } else {
      r.tactics.bench = sanitizeBench(
        r.tactics.bench,
        r.tactics.lineup,
        r.players.filter((p) => p.clubId === r.clubId),
      );
    }
    // Partidas anteriores a los contratos: sembrar agentes libres para que el mercado no arranque vacío.
    if (!s.freeAgents && r.players.length && s.seed) {
      const used = new Set(r.players.map((p) => p.name));
      r.freeAgents = seedFreeAgents(new Rng(s.seed + 11), used).map(patchPlayer);
    }
    return migrateConmebolClubs(r);
  }
  return r;
}


const OLD_GHOST_ID = /^(br|cl|co|bo|ec|uy|py|pe|ve|ar)\d{2}$/;
const OLD_GHOST_COUNTRY: Record<string, string> = {
  br: "BRA", cl: "CHI", co: "COL", bo: "BOL", ec: "ECU", uy: "URU", py: "PAR", pe: "PER", ve: "VEN",
};

/**
 * Partidas guardadas con los clubes sudamericanos ficticios viejos (br01, cl02…): pasan a los clubes reales
 * del mismo país (mismas plantillas de relleno), y cualquier club sudamericano real sin plantilla recibe una.
 */
function migrateConmebolClubs(r: GameSave): GameSave {
  if (!r.players.length) return r;
  let out = r;
  if (r.players.some((p) => OLD_GHOST_ID.test(p.clubId))) {
    const realByCountry = new Map<string, string[]>();
    for (const c of CLUBS) {
      if (c.league !== "conmebol" || !c.country) continue;
      realByCountry.set(c.country, [...(realByCountry.get(c.country) ?? []), c.id]);
    }
    const map = new Map<string, string>();
    for (const id of new Set(r.players.map((p) => p.clubId).filter((id) => OLD_GHOST_ID.test(id))).values()) {
      const prefix = id.slice(0, 2);
      const country = OLD_GHOST_COUNTRY[prefix];
      if (!country) continue; // ar01-ar08 nunca jugaron nada: se descartan
      const n = Number(id.slice(2)) - 1;
      const list = realByCountry.get(country) ?? [];
      const target = list[Math.min(n, list.length - 1)];
      if (target) map.set(id, target);
    }
    const kept = { ...r, players: r.players.filter((p) => !OLD_GHOST_ID.test(p.clubId) || map.has(p.clubId)) };
    const json = JSON.stringify(kept).replace(/"(?:br|cl|co|bo|ec|uy|py|pe|ve)\d{2}"/g, (m) => {
      const id = m.slice(1, -1);
      return `"${map.get(id) ?? id}"`;
    });
    out = JSON.parse(json) as GameSave;
  }
  const have = new Set(out.players.map((p) => p.clubId));
  // Clubes de relleno sin plantilla (sudamericanos y europeos nuevos de la Europa League de 36 equipos).
  const missing = CLUBS.filter((c) => c.ghost && (c.league === "conmebol" || c.league === "europe" || c.league === "rfef") && !have.has(c.id));
  if (missing.length) {
    const used = new Set(out.players.map((p) => p.name));
    const rng = new Rng((out.seed || 1) + 4242);
    const extra = missing.flatMap((c) => buildSquad(c.id, rng, used).map((p) => ({ ...p, locked: true })));
    out = { ...out, players: [...out.players, ...extra] };
  }
  return out;
}

const TRAINING_TIER_IDS: TrainingTier[] = ["progressive", "intensive", "elite"];

/** Planes de entrenamiento: acepta el formato nuevo y migra el viejo (un solo plan, sin nivel ni costo). */
function normalizeTrainingPlans(raw: Partial<GameSave> & { trainingPlan?: unknown }): TrainingPlan[] {
  const out: TrainingPlan[] = [];
  const seenTiers = new Set<TrainingTier>();
  const seenPlayers = new Set<string>();
  const push = (pl: TrainingPlan) => {
    if (seenTiers.has(pl.tier)) return;
    const assignments = pl.assignments.filter((a) => a?.playerId && !seenPlayers.has(a.playerId));
    seenTiers.add(pl.tier);
    for (const a of assignments) seenPlayers.add(a.playerId);
    out.push({ ...pl, assignments: assignments.map((a) => ({ playerId: a.playerId })) });
  };
  if (Array.isArray(raw.trainingPlans)) {
    for (const pl of raw.trainingPlans) {
      if (!pl || !Array.isArray(pl.assignments) || !TRAINING_TIER_IDS.includes(pl.tier)) continue;
      push({
        id: pl.id ?? uid("trp"),
        tier: pl.tier,
        cost: Number(pl.cost) || 0,
        assignments: pl.assignments,
        startDate: pl.startDate ?? "",
        elapsedDays: Number(pl.elapsedDays) || 0,
        totalDays: Number(pl.totalDays) > 0 ? Number(pl.totalDays) : 182,
      });
    }
  }
  const legacy = raw.trainingPlan as
    | { assignments?: Array<{ playerId: string }>; startDate?: string; elapsedDays?: number; totalDays?: number }
    | null
    | undefined;
  if (legacy && Array.isArray(legacy.assignments)) {
    // Un ciclo viejo en marcha sigue como Intensivo, sin costo, con el tiempo que ya llevaba.
    push({
      id: uid("trp"),
      tier: "intensive",
      cost: 0,
      assignments: legacy.assignments.map((a) => ({ playerId: a.playerId })),
      startDate: legacy.startDate ?? "",
      elapsedDays: Number(legacy.elapsedDays) || 0,
      totalDays: Number(legacy.totalDays) > 0 ? Number(legacy.totalDays) : 182,
    });
  }
  return out;
}

function normalizeTrainingReports(raw: Partial<GameSave> & { trainingReport?: unknown }): TrainingReport[] {
  const out: TrainingReport[] = [];
  if (Array.isArray(raw.trainingReports)) {
    for (const r of raw.trainingReports) {
      if (r && Array.isArray(r.results)) {
        out.push({ ...r, tier: TRAINING_TIER_IDS.includes(r.tier) ? r.tier : "intensive", cost: Number(r.cost) || 0 });
      }
    }
  }
  const legacy = raw.trainingReport as TrainingReport | null | undefined;
  if (legacy && Array.isArray(legacy.results)) {
    out.push({ ...legacy, tier: "intensive", cost: 0 });
  }
  return out.slice(0, 6);
}

function normalizeSave(raw: Partial<GameSave> | null | undefined): GameSave {
  const base = emptyShell();
  if (!raw || typeof raw !== "object") return base;
  const merged = { ...base, ...raw };
  return pickData(merged);
}

function padSlots(list: Array<GameSave | null> | undefined): Array<GameSave | null> {
  const next: Array<GameSave | null> = emptySlots();
  if (!Array.isArray(list)) return next;
  for (let i = 0; i < SLOT_COUNT; i++) {
    const item = list[i];
    if (!item || typeof item !== "object") continue;
    const save = normalizeSave(item);
    // Solo se descarta lo que no tiene club conocido; borrar acá borraría la partida del disco.
    next[i] = isKnownClub(save.clubId) ? save : null;
  }
  return next;
}

function clampSlot(n: unknown): number {
  const v = typeof n === "number" && Number.isFinite(n) ? Math.trunc(n) : 0;
  return Math.max(0, Math.min(SLOT_COUNT - 1, v));
}

function playableScreen(screen: Screen | undefined): Screen {
  if (!screen || screen === "boot" || screen === "select" || screen === "slots") return "office";
  return screen;
}

function snapshotSlots(s: GameStore): Array<GameSave | null> {
  const slots = padSlots(s.slots);
  const idx = clampSlot(s.slot);
  if (s.clubId && isSelectableClub(s.clubId)) {
    slots[idx] = pickData({ ...s, slot: idx, screen: playableScreen(s.screen) });
  }
  return slots;
}

function cloneSave(s: GameSave): GameSave {
  return structuredClone(pickData(s, false));
}

function settleRescueInstallment(save: GameSave): GameSave["news"][number] | null {
  const settlement = settleClubRescue(save.clubRescue, save.budget, save.season);
  if (!settlement.processed || !settlement.rescue) return null;
  save.clubRescue = settlement.rescue;
  save.budget = settlement.remainingCash;
  const club = clubById(save.clubId);
  const paymentNews = {
    id: uid("n"),
    week: 0,
    tone: settlement.missed ? "bad" : "neutral",
    title: settlement.missed ? `Incumplimiento del rescate · ${club.name}` : `Cuota de rescate · ${club.name}`,
    body: settlement.missed
      ? `Se pagaron ${formatMoney(settlement.paid)} de ${formatMoney(settlement.due)}. La deuda pendiente recibió una penalización progresiva; ahora es ${formatMoney(settlement.rescue.balance)}.`
      : `Se pagó ${formatMoney(settlement.paid)}. Restan ${formatMoney(settlement.rescue.balance)} de deuda.`,
  } satisfies GameSave["news"][number];
  save.news.unshift(paymentNews);
  return paymentNews;
}

/**
 * Con el manager ya despedido, simula el resto de la temporada (el club sigue jugando sin él).
 * Los títulos que pueda ganar el club mientras tanto no cuentan para la carrera del DT.
 */
function finishSeasonAfterSacking(save: GameSave): GameSave {
  // Lo jugado hasta el despido es lo que cuenta para la carrera del DT.
  archiveSeason(save);
  const keep = {
    careerTrophies: structuredClone(save.careerTrophies),
    honours: { ...save.honours },
    trophies: [...save.trophies],
  };
  sanitizeMissingLineup(save);
  let guard = 0;
  while (!save.seasonOver && save.cursor < save.calendar.length && guard++ < 500) {
    const squad = save.players.filter((p) => p.clubId === save.clubId);
    // Sin DT que arme el once, el club juega con su mejor formación disponible.
    save.tactics.lineup = pickXi(squad, save.tactics.formation);
    save.tactics.bench = pickBench(squad, save.tactics.lineup);
    simSlot(save);
  }
  if (!save.seasonOver) save.seasonOver = true;
  save.careerTrophies = keep.careerTrophies;
  save.honours = keep.honours;
  save.trophies = keep.trophies;
  return save;
}

/** Plantilla para el tope de 40: propios + cedidos que llegaron (los cedidos SÍ ocupan lugar). */
function activeCount(s: GameSave) {
  return squadTotal(s.players, s.clubId);
}

type PersistShape = {
  slot: number;
  slots: Array<GameSave | null>;
  customClubs: ClubCustomization[];
};

function normalizeCustomClubs(raw: unknown): ClubCustomization[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.flatMap((item): ClubCustomization[] => {
    if (!item || typeof item !== "object") return [];
    const club = item as Partial<ClubCustomization>;
    const id = typeof club.id === "string" ? club.id.trim().slice(0, 80) : "";
    const name = typeof club.name === "string" ? club.name.trim().slice(0, 50) : "";
    if (!id || !name || seen.has(id)) return [];
    seen.add(id);
    const color = typeof club.color === "string" && /^#[0-9a-f]{6}$/i.test(club.color) ? club.color : "#1f6feb";
    const color2 = typeof club.color2 === "string" && /^#[0-9a-f]{6}$/i.test(club.color2) ? club.color2 : "#ffffff";
    const crest = typeof club.crest === "string" && /^(https?:\/\/|\/|data:image\/)/i.test(club.crest)
      ? club.crest.slice(0, 1_400_000)
      : "";
    return [{
      id,
      ...(typeof club.targetClubId === "string" ? { targetClubId: club.targetClubId } : {}),
      name,
      short: typeof club.short === "string" && club.short.trim() ? club.short.trim().slice(0, 8) : name.slice(0, 4).toUpperCase(),
      city: typeof club.city === "string" ? club.city.trim().slice(0, 50) : "",
      stadium: typeof club.stadium === "string" ? club.stadium.trim().slice(0, 60) : "",
      capacity: Math.round(clamp(Number(club.capacity) || 5000, 500, 200_000)),
      stadiumFacilities: Math.round(clamp(Number(club.stadiumFacilities) || 2, 1, 5)),
      color,
      color2,
      crest,
      crestBackgroundTransparent: club.crestBackgroundTransparent === true,
      prestige: Math.round(clamp(Number(club.prestige) || 50, 1, 100)),
      ...(Number.isFinite(club.startingBudget)
        ? { startingBudget: Math.round(clamp(club.startingBudget!, 0, 2_000_000_000)) }
        : {}),
    }];
  });
}

function migratePersisted(persisted: unknown, version: number): PersistShape {
  const empty: PersistShape = { slot: 0, slots: emptySlots(), customClubs: [] };
  if (!persisted || typeof persisted !== "object") return empty;

  const raw = persisted as Record<string, unknown>;

  if (version >= 2 && Array.isArray(raw.slots)) {
    const slots = padSlots(raw.slots as Array<GameSave | null>);
    const slot = clampSlot(raw.slot);
    return { slot, slots, customClubs: normalizeCustomClubs(raw.customClubs) };
  }

  const save = normalizeSave(raw as Partial<GameSave>);
  if (!isKnownClub(save.clubId) || !isSelectableClub(save.clubId)) return empty;
  save.slot = 0;
  save.screen = playableScreen(save.screen);
  const legacySlots = emptySlots();
  legacySlots[0] = save;
  return { slot: 0, slots: legacySlots, customClubs: normalizeCustomClubs(raw.customClubs) };
}

export const useGame = create<GameStore>()(
  persist<GameStore, [], [], PersistShape>(
    (set, get) => ({
      ...emptyShell(),
      hydrated: false,
      slots: emptySlots(),
      customClubs: [],
      setHydrated: (v) => set({ hydrated: v }),
      setScreen: (screen) => set({ screen }),
      openNews: () => {
        const currentNews = get().news;
        if (currentNews.some((item) => !item.seen)) {
          set({ screen: "news", news: currentNews.map((item) => item.seen ? item : { ...item, seen: true }) });
        } else {
          set({ screen: "news" });
        }
      },
      markNewsRead: (newsId) => {
        const currentNews = get().news;
        const selected = currentNews.find((item) => item.id === newsId);
        if (!selected || selected.read && selected.seen) return;
        set({
          news: currentNews.map((item) => item.id === newsId ? { ...item, read: true, seen: true } : item),
        });
      },
      markNewsIssueRead: (season, week, gameDate) => {
        const state = get();
        const isInIssue = (item: NewsItem) =>
          item.season === season &&
          (gameDate
            ? (item.gameDate ?? (item.season === state.season ? state.calendar[item.week]?.date : undefined)) === gameDate
            : item.week === week);
        if (!state.news.some((item) => isInIssue(item) && (!item.read || !item.seen))) return;
        set({
          news: state.news.map((item) =>
            isInIssue(item) ? { ...item, read: true, seen: true } : item,
          ),
        });
      },
      setPressFrequency: (frequency) => set({ pressFrequency: normalizePressFrequency(frequency) }),
      startPressConference: () => {
        const s = get();
        if (!s.pendingPressConference || s.pendingPressConference.questionIndex >= s.pendingPressConference.questions.length) return;
        set({ screen: "press" });
      },
      answerPressQuestion: (questionId, answerId) => {
        const s = cloneSave(get());
        const conference = s.pendingPressConference;
        if (!conference || conference.questionIndex >= conference.questions.length) return;
        const prompt = conference.questions[conference.questionIndex];
        const selected = prompt?.answers.find((item) => item.id === answerId);
        if (!prompt || prompt.id !== questionId || !selected || conference.responses.length !== conference.questionIndex) return;
        const effects = applyPressAnswer(s, selected);
        conference.responses.push({
          questionId: prompt.id,
          journalist: prompt.journalist,
          question: prompt.question,
          answerId: selected.id,
          answer: selected.text,
          reaction: selected.reaction,
          effects,
          ...(selected.playerId ? { playerId: selected.playerId } : {}),
        });
        conference.questionIndex += 1;
        s.screen = "press";
        set(s);
      },
      finishPressConference: () => {
        const s = cloneSave(get());
        const conference = s.pendingPressConference;
        if (!conference || conference.questionIndex < conference.questions.length) return;
        s.pressHistory = [conference, ...(s.pressHistory ?? []).filter((item) => item.id !== conference.id)].slice(0, 80);
        s.pendingPressConference = null;
        const club = clubById(conference.clubId);
        const opponent = clubById(conference.opponentId);
        s.news.unshift({
          id: uid("n"),
          week: conference.week,
          tone: "neutral",
          title: `Conferencia de prensa: ${club.short}`,
          body: `${conference.responses.length} respuestas tras el ${conference.score} ante ${opponent.short}.`,
        });
        s.screen = s.seasonOver ? (hasCeremony(s) ? "awards" : "season-end") : "office";
        set(s);
      },
      openSlots: () => {
        const slots = snapshotSlots(get());
        set({ slots, screen: "slots" });
      },
      prepareSlot: (index) => {
        applyClubIdentity(null);
        applyDivisions(null);
        const slots = snapshotSlots(get());
        const i = clampSlot(index);
        set({
          ...emptyShell(),
          hydrated: true,
          slots,
          slot: i,
          screen: "select",
        });
      },
      loadSlot: (index) => {
        const slots = snapshotSlots(get());
        const i = clampSlot(index);
        const save = slots[i];
        if (!save || !isSelectableClub(save.clubId)) return;
        applyClubIdentity(save.clubIdentity?.targetClubId ?? null, save.clubIdentity);
        applyDivisions(save.divisions);
        set({
          ...save,
          hydrated: true,
          slots,
          slot: i,
          screen: playableScreen(save.screen),
        });
      },
      clearSlot: (index) => {
        const slots = snapshotSlots(get());
        const i = clampSlot(index);
        slots[i] = null;
        if (get().slot === i) {
          set({ ...emptyShell(), hydrated: true, slots, slot: i, screen: "slots" });
        } else {
          set({ slots });
        }
      },
      saveCustomClub: (club) => {
        const normalized = normalizeCustomClubs([club])[0];
        if (!normalized) return "Completá el nombre del club y revisá los datos.";
        const library = get().customClubs ?? [];
        if (!library.some((item) => item.id === normalized.id) && library.length >= 100) {
          return "La biblioteca admite hasta 100 identidades personalizadas.";
        }
        set({ customClubs: library.some((item) => item.id === normalized.id)
          ? library.map((item) => item.id === normalized.id ? normalized : item)
          : [...library, normalized] });
        return null;
      },
      duplicateCustomClub: (id) => {
        const source = get().customClubs.find((item) => item.id === id);
        if (!source || get().customClubs.length >= 100) return;
        set({ customClubs: [...get().customClubs, { ...source, id: uid("club"), name: `${source.name} (copia)` }] });
      },
      deleteCustomClub: (id) => {
        set({ customClubs: get().customClubs.filter((item) => item.id !== id) });
      },
      newGame: (
        clubId,
        identity,
        rescueSeasons,
        keepBaseStadium = false,
      ) => {
        if (!isSelectableClub(clubId)) return;
        const slot = clampSlot(get().slot);
        const baseClub = clubById(clubId);
        const careerIdentity = identity
          ? {
              ...identity,
              stadium: identity.stadium.trim() || baseClub.stadium,
              ...(keepBaseStadium
                ? {
                    stadium: baseClub.stadium,
                    capacity: baseClub.capacity,
                    stadiumFacilities: defaultFacilitiesLevel(baseClub),
                  }
                : {}),
            }
          : null;
        applyClubIdentity(clubId, careerIdentity);
        const save = createCareer(clubId, Date.now() % 1_000_000_000, slot);
        save.simulationMode = "custom";
        save.detailedLeagues = [];
        save.clubIdentity = careerIdentity ? { ...careerIdentity, targetClubId: clubId } : null;
        save.stadiums = {
          ...(save.stadiums ?? {}),
          [clubId]: createStadiumState(
            clubById(clubId),
            save.season,
            careerIdentity?.capacity,
            careerIdentity?.stadiumFacilities,
          ),
        };
        if (identity?.startingBudget !== undefined) {
          save.budget = Math.round(clamp(identity.startingBudget, 0, 2_000_000_000));
        }
        if (rescueSeasons) {
          const termSeasons = Math.round(clamp(rescueSeasons, 2, 6));
          const baseBudget = identity?.startingBudget ?? startingBudget(clubById(clubId).prestige, clubById(clubId).league);
          const principal = Math.round(Math.max(baseBudget * 2, 1_000_000));
          save.budget += principal;
          save.clubRescue = createClubRescue(principal, termSeasons);
          save.news.unshift({
            id: uid("n"),
            week: 1,
            tone: "neutral",
            title: "Rescate financiero",
            body: `La dirigencia aporta ${formatMoney(principal)} para estabilizar el club, con un plan de ${termSeasons} cuotas anuales.`,
          });
        } else {
          save.clubRescue = null;
        }
        save.board = createBoard(save);
        const slots = snapshotSlots(get());
        slots[slot] = save;
        set({ ...save, slots, hydrated: true });
      },
      buyStadiumUpgrade: (id) => {
        const save = get();
        const current = stadiumFor(save);
        const purchase = buyStadiumUpgrade(current, clubById(save.clubId), id, save.budget);
        if (!purchase.ok) return purchase.error;
        set({
          budget: save.budget - purchase.cost,
          stadiums: { ...(save.stadiums ?? {}), [save.clubId]: purchase.state },
        });
        return null;
      },
      setStadiumTicketPrice: (price) => {
        if (!Number.isFinite(price)) return "Ingresá un precio válido.";
        const save = get();
        const current = stadiumFor(save);
        const ticketPrice = Math.round(clamp(price, 3, 100));
        set({
          stadiums: { ...(save.stadiums ?? {}), [save.clubId]: { ...current, ticketPrice } },
        });
        return ticketPrice === price ? null : `El precio se ajustó al rango permitido: ${formatMoney(ticketPrice)}.`;
      },
      abandon: () => {
        const slot = clampSlot(get().slot);
        const slots = snapshotSlots(get());
        slots[slot] = null;
        set({ ...emptyShell(), hydrated: true, slots, slot, screen: "slots" });
      },
      setFormation: (formation) => {
        const s = cloneSave(get());
        s.tactics.formation = formation;
        const squad = s.players.filter((p) => p.clubId === s.clubId);
        s.tactics.lineup = pickXi(squad, formation);
        s.tactics.bench = pickBench(squad, s.tactics.lineup);
        set({ tactics: s.tactics, tempLineupBackup: null });
      },
      setMentality: (mentality) => {
        set({ tactics: { ...get().tactics, mentality } });
      },
      setNumberColor: (numberColor) => {
        set({ tactics: { ...get().tactics, numberColor } });
      },
      setLineupSlot: (index, playerId) => {
        const s = get();
        const p = s.players.find((x) => x.id === playerId);
        if (!p) return "Jugador no encontrado.";
        if (isUnavailable(p)) {
          return unavailableMessage(p);
        }
        const slots = FORMATIONS[s.tactics.formation].slots;
        const slot = slots[index];
        if (!slot) return "Ese puesto no existe en esta formación.";
        // Regla: nadie fuera de posición.
        if (!canPlaySlot(p.pos, slot.pos)) {
          return `${p.name} no juega en esa posición (${POS_LABEL[p.pos]}). Aquí: ${slot.pos.map((x) => POS_LABEL[x]).join(" / ")}.`;
        }
        const tactics = { ...s.tactics, lineup: [...s.tactics.lineup] };
        const existing = tactics.lineup.indexOf(playerId);
        if (existing >= 0 && existing !== index) {
          // Intercambio: el titular que estaba en este puesto pasa al otro; también debe encajar.
          const otherId = tactics.lineup[index];
          const other = otherId ? s.players.find((x) => x.id === otherId) : undefined;
          const otherSlot = slots[existing];
          if (other && otherSlot && !canPlaySlot(other.pos, otherSlot.pos)) {
            return `${other.name} no juega en esa posición (${POS_LABEL[other.pos]}), no se puede cambiar de lugar con ${p.name}.`;
          }
          tactics.lineup[existing] = otherId ?? playerId;
        }
        const displaced = existing >= 0 ? undefined : tactics.lineup[index];
        tactics.lineup[index] = playerId;
        // Si venía del banquillo, el titular desplazado ocupa su lugar en el banco.
        const benchAt = tactics.bench.indexOf(playerId);
        tactics.bench = tactics.bench.filter((id) => id !== playerId);
        // Un titular que no puede jugar (lesión, sanción, ausencia) no pasa al banquillo: simplemente sale.
        const displacedPlayer = displaced ? s.players.find((x) => x.id === displaced) : undefined;
        if (benchAt >= 0 && displaced && displaced !== playerId && displacedPlayer && !isUnavailable(displacedPlayer)) {
          tactics.bench.splice(Math.min(benchAt, tactics.bench.length), 0, displaced);
        }
        set({ tactics, tempLineupBackup: null });
        return null;
      },
      autoFill: () => {
        const s = get();
        const squad = s.players.filter((p) => p.clubId === s.clubId);
        const lineup = pickXi(squad, s.tactics.formation);
        set({
          tactics: { ...s.tactics, lineup, bench: pickBench(squad, lineup) },
          tempLineupBackup: null,
        });
      },
      toggleBench: (playerId) => {
        const s = get();
        const p = s.players.find((x) => x.id === playerId);
        if (!p || p.clubId !== s.clubId) return "Ese jugador no está en tu plantilla.";
        if (s.tactics.lineup.includes(playerId)) return `${p.name} ya es titular.`;
        const bench = s.tactics.bench.filter((id) => id !== playerId);
        if (bench.length === s.tactics.bench.length) {
          if (isUnavailable(p)) {
            return unavailableMessage(p);
          }
          if (bench.length >= BENCH_SIZE) return `El banquillo es de ${BENCH_SIZE}. Sacá a alguien primero.`;
          bench.push(playerId);
        }
        set({ tactics: { ...s.tactics, bench } });
        return null;
      },
      autoBench: () => {
        const s = get();
        const squad = s.players.filter((p) => p.clubId === s.clubId);
        set({ tactics: { ...s.tactics, bench: pickBench(squad, s.tactics.lineup) } });
      },
      searchSponsors: () => {
        const s = cloneSave(get());
        const err = searchSponsors(s);
        if (err) return err;
        set({
          sponsorOffers: s.sponsorOffers,
          sponsorSearchSeason: s.sponsorSearchSeason,
          sponsorLockUntil: s.sponsorLockUntil,
        });
        return null;
      },
      acceptSponsorOffer: (offerId, replaceId) => {
        const s = cloneSave(get());
        const err = acceptSponsorOffer(s, offerId, replaceId);
        if (err) return err;
        set({
          budget: s.budget,
          news: s.news,
          clubSponsors: s.clubSponsors,
          sponsorOffers: s.sponsorOffers,
          sponsorLockUntil: s.sponsorLockUntil,
        });
        return null;
      },
      recallLoan: (playerId) => {
        const s = cloneSave(get());
        const err = recallLoanedPlayer(s, playerId);
        if (err) return err;
        set({
          players: s.players,
          budget: s.budget,
          news: s.news,
          loans: s.loans,
          clubFinance: s.clubFinance,
        });
        return null;
      },
      substituteUnavailable: (permanent) => {
        const s = cloneSave(get());
        const out = lineupProblems(s);
        if (!out.length) return null;
        const before = [...s.tactics.lineup];
        sanitizeUserLineup(s);
        const lines: string[] = [];
        before.forEach((id, i) => {
          const nextId = s.tactics.lineup[i];
          if (id === nextId) return;
          const a = s.players.find((x) => x.id === id);
          const b = s.players.find((x) => x.id === nextId);
          if (a && b) lines.push(`${b.name} entra por ${a.name}`);
        });
        s.tempLineupBackup = permanent ? null : before;
        set({ tactics: s.tactics, tempLineupBackup: s.tempLineupBackup });
        if (!lines.length) return "Cambio automático aplicado.";
        return `${permanent ? "Guardado en la formación" : "Solo para este partido"}: ${lines.join(" · ")}.`;
      },
      toggleNoOffers: (playerId) => {
        const s = get();
        const target = s.players.find((p) => p.id === playerId);
        if (!target) return;
        const next = !target.noOffers;
        const players = s.players.map((p) => (p.id === playerId ? { ...p, noOffers: next } : p));
        // Al bloquear, también se retiran las ofertas que ya estaban pendientes por ese jugador.
        const offers = next ? s.offers.filter((o) => o.playerId !== playerId) : s.offers;
        set({ players, offers });
      },
      goToNextMatch: () => {
        const s = cloneSave(get());
        if (s.seasonOver) {
          set({ screen: "season-end" });
          return;
        }
        // Solo reemplaza a quien ya no está en el club; las bajas se quedan visibles en la alineación.
        sanitizeMissingLineup(s);
        advanceToUserMatch(s);
        set(s);
      },
      simulateNextCalendarSlot: (date) => {
        const s = cloneSave(get());
        if (s.seasonOver || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !s.calendar.some((slot) => slot.date === date)) {
          return null;
        }
        const slot = s.calendar[s.cursor];
        if (!slot?.date || slot.date > date || s.board?.sacked) return null;
        const currentDate = slot.date;
        const startDate = currentDate;
        const fixturesById = new Map(s.fixtures.map((fixture) => [fixture.id, fixture]));
        const playedFixtureIds = new Set(
          slot.fixtures.filter((fixtureId) => fixturesById.get(fixtureId)?.played),
        );
        const matches: CalendarSimulationSummary["matches"] = [];
        simSlot(s);
        for (const fixture of s.fixtures) fixturesById.set(fixture.id, fixture);
        for (const fixtureId of slot.fixtures) {
          const fixture = fixturesById.get(fixtureId);
          if (
            !fixture?.played ||
            playedFixtureIds.has(fixture.id) ||
            (fixture.homeId !== s.clubId && fixture.awayId !== s.clubId)
          ) {
            continue;
          }
          playedFixtureIds.add(fixture.id);
          matches.push({
            id: fixture.id,
            date: currentDate,
            title: slot.title,
            competition: fixture.competition,
            homeId: fixture.homeId,
            awayId: fixture.awayId,
            homeGoals: fixture.homeGoals ?? 0,
            awayGoals: fixture.awayGoals ?? 0,
          });
        }
        if (!s.board?.sacked) s.screen = "calendar";
        const nextSlot = s.calendar[s.cursor];
        const done =
          s.seasonOver ||
          Boolean(s.board?.sacked) ||
          !nextSlot?.date ||
          nextSlot.date > date;
        set(s);
        return {
          targetDate: date,
          startDate,
          currentDate,
          simulatedSlots: 1,
          seasonOver: s.seasonOver,
          done,
          matches,
        };
      },
      playPending: (watch) => {
        const s = cloneSave(get());
        if (!s.pendingFixtureId) return;
        // Con bajas en el once no se juega: la pantalla del partido muestra el cartel con las opciones.
        if (lineupProblems(s).length) {
          set({ screen: "preview" });
          return;
        }
        sanitizeMissingLineup(s);
        if (watch) {
          // "Ver el partido": se juega minuto a minuto con minijuegos; el resultado se aplica al terminar.
          s.screen = "live";
          set(s);
          return;
        }
        const matchDate = { season: s.season, week: s.week };
        simSlot(s);
        if (s.lastMatch) s.pendingPressConference = createPressConference(s, s.lastMatch, matchDate);
        s.screen = "result";
        set(s);
      },
      finishLiveMatch: (result) => {
        const s = cloneSave(get());
        if (!s.pendingFixtureId) return;
        sanitizeMissingLineup(s);
        const matchDate = { season: s.season, week: s.week };
        simSlot(s, result.fixtureId === s.pendingFixtureId ? result : undefined);
        if (s.lastMatch) s.pendingPressConference = createPressConference(s, s.lastMatch, matchDate);
        s.screen = "result";
        set(s);
      },
      finishWatch: () => {
        const s = get();
        set({
          pendingPressConference: null,
          screen: s.seasonOver ? (hasCeremony(s) ? "awards" : "season-end") : "office",
        });
      },
      signPlayer: (playerId, terms, payClause) => {
        const s = cloneSave(get());
        if (s.clubRescue?.status === "active" && s.clubRescue.missedPayments >= 1) {
          return "La directiva congeló las nuevas contrataciones hasta regularizar las cuotas del rescate.";
        }
        const err = completeSigning(s, playerId, terms, payClause);
        if (err) return err;
        const signed = s.players.find((x) => x.id === playerId && x.clubId === s.clubId);
        if (signed) {
          const squad = s.players.filter((x) => x.clubId === s.clubId);
          const placed = placeNewcomer(s.tactics, squad, signed);
          s.tactics = { ...s.tactics, lineup: placed.lineup, bench: placed.bench };
        }
        set({
          tactics: s.tactics,
          players: s.players,
          freeAgents: s.freeAgents,
          budget: s.budget,
          news: s.news,
          popups: s.popups,
          offers: s.offers,
          clubFinance: s.clubFinance,
          transferLog: s.transferLog,
        });
        return null;
      },
      renewPlayer: (playerId, terms) => {
        const s = cloneSave(get());
        const err = completeRenewal(s, playerId, terms);
        if (err) return err;
        set({ players: s.players, budget: s.budget, news: s.news });
        return null;
      },
      sellPlayer: (playerId) => {
        const s = cloneSave(get());
        const p = s.players.find((x) => x.id === playerId);
        // Venta rápida: solo propios en el club (nunca cedidos) y respetando el mínimo de propios.
        const blocked = saleBlockReason(s, p);
        if (blocked || !p) return blocked ?? "Jugador no encontrado.";
        ensureFinance(s);
        const gross = capMarketValue(p.value * 0.88);
        const interested = interestedBuyers(s, p, gross);
        const fallback = CLUBS.filter((c) => c.id !== s.clubId && !c.ghost && canAfford(s, c.id, gross));
        const buyers = interested.length ? interested : fallback;
        if (!buyers.length) return "Ningún club puede pagar por él ahora mismo.";
        const buyer = buyers[Math.floor(Math.random() * buyers.length)]!;
        const fee = settleSellOn(s, p, gross, true);
        s.budget += fee;
        creditClub(s, buyer.id, -gross);
        logTransfer(s, p, s.clubId, buyer.id, "sale", gross);
        ensurePos(p);
        p.clubId = buyer.id;
        p.listed = false;
        p.listedForLoan = false;
        s.offers = s.offers.filter((o) => o.playerId !== p.id);
        const squad = s.players.filter((x) => x.clubId === s.clubId && !x.loanFrom);
        s.tactics.lineup = dropFromLineup(s.tactics.lineup, s.tactics.formation, p.id, squad);
        s.tactics.bench = sanitizeBench(s.tactics.bench, s.tactics.lineup, squad);
        s.news.unshift({
          id: uid("n"),
          week: s.week,
          tone: "neutral",
          title: `Venta: ${p.name}`,
          body: `${buyer.name} paga ${formatMoney(fee)}.`,
        });
        set({
          players: s.players,
          budget: s.budget,
          news: s.news,
          offers: s.offers,
          tactics: s.tactics,
          clubFinance: s.clubFinance,
          transferLog: s.transferLog,
        });
        return null;
      },
      toggleListed: (playerId) => {
        const clubId = get().clubId;
        const players = get().players.map((p) => {
          if (p.id !== playerId) return p;
          // Un cedido no se puede poner en venta: solo se permite quitar una marca que haya quedado.
          if (ownershipBlockReason(p, clubId)) return { ...p, listed: false, listedForLoan: false };
          return { ...p, listed: !p.listed, listedForLoan: p.listed ? p.listedForLoan : false };
        });
        set({ players });
      },
      toggleLoanListed: (playerId) => {
        const clubId = get().clubId;
        const players = get().players.map((p) => {
          if (p.id !== playerId) return p;
          if (ownershipBlockReason(p, clubId)) return { ...p, listed: false, listedForLoan: false };
          const next = !p.listedForLoan;
          return { ...p, listedForLoan: next, listed: next ? false : p.listed };
        });
        set({ players });
      },
      takeOnLoan: (playerId, seasons) => {
        const s = cloneSave(get());
        const p = s.players.find((x) => x.id === playerId);
        if (!p) return "Jugador no encontrado.";
        if (p.clubId === s.clubId) return "Ya está en tu plantilla.";
        if (p.loanFrom) return "Ya está cedido.";
        if (!hasSquadRoom(s.players, s.clubId)) return SQUAD_FULL_MSG;
        const fee = loanFee(p, seasons);
        if (s.budget < fee) return "No alcanza para la cesión.";
        const origin = p.clubId;
        s.budget -= fee;
        creditClub(s, origin, fee);
        logTransfer(s, p, origin, s.clubId, "loan", fee);
        p.loanFrom = origin;
        p.clubId = s.clubId;
        p.loanSeasons = seasons;
        p.listed = false;
        p.listedForLoan = false;
        s.loans.push({
          playerId: p.id,
          fromClubId: origin,
          toClubId: s.clubId,
          seasonsLeft: seasons,
          fee,
        });
        s.news.unshift({
          id: uid("n"),
          week: s.week,
          tone: "good",
          title: `Cesión: ${p.name}`,
          body: `Llega de ${clubById(origin).name} por ${seasons} temporada${seasons > 1 ? "s" : ""} · ${formatMoney(fee)}.`,
        });
        set({
          players: s.players,
          budget: s.budget,
          news: s.news,
          loans: s.loans,
          clubFinance: s.clubFinance,
          transferLog: s.transferLog,
        });
        return null;
      },
      acceptIncoming: (offerId, keepPct = 0) => {
        const s = cloneSave(get());
        const err = acceptOffer(s, offerId, keepPct);
        if (err) {
          // Si el comprador se cayó, la oferta ya fue retirada: refrescamos la lista.
          set({ offers: s.offers });
          return err;
        }
        set({
          players: s.players,
          budget: s.budget,
          news: s.news,
          offers: s.offers,
          loans: s.loans,
          tactics: s.tactics,
          popups: s.popups.filter((p) => p.offerId !== offerId),
          clubFinance: s.clubFinance,
          transferLog: s.transferLog,
        });
        return null;
      },
      rejectIncoming: (offerId) => {
        const s = cloneSave(get());
        rejectOffer(s, offerId);
        set({
          offers: s.offers,
          popups: s.popups.filter((p) => p.offerId !== offerId),
        });
      },
      startScout: (countryId, tier, pos) => {
        const s = cloneSave(get());
        if (s.scouts.length >= MAX_SCOUTS) return "Máximo 3 ojeadores a la vez.";
        const country = SCOUT_COUNTRIES.find((c) => c.id === countryId);
        if (!country) return "País no válido.";
        const cost = scoutCost(country, tier);
        if (s.budget < cost) return "No hay presupuesto para esa red.";
        s.budget -= cost;
        s.scouts.push({
          id: uid("sc"),
          countryId: country.id,
          countryName: country.name,
          nat: country.nat,
          weeksLeft: country.weeks + (tier === 3 ? 1 : 0),
          cost,
          preferredPos: pos,
          tier,
        });
        s.news.unshift({
          id: uid("n"),
          week: s.week,
          tone: "neutral",
          title: `Ojeo en ${country.name}`,
          body: `Red ${tier === 3 ? "élite" : tier === 2 ? "amplia" : "básica"} · ${formatMoney(cost)}.`,
        });
        set({ scouts: s.scouts, budget: s.budget, news: s.news });
        return null;
      },
      signYouth: (youthId) => {
        const s = cloneSave(get());
        const y = s.academy.find((x) => x.id === youthId);
        if (!y) return "Ya no está en la cantera.";
        if (!hasSquadRoom(s.players, s.clubId)) return SQUAD_FULL_MSG;
        if (s.budget < y.fee) return "No alcanza para firmarlo.";
        s.budget -= y.fee;
        const rng = new Rng(s.seed + y.name.length + s.week);
        const p = ensureTerms(youthToPlayer(y, s.clubId, rng));
        // Dorsal propio (venía en 0) y a la alineación ya, sin esperar al cierre de temporada.
        const taken = new Set(s.players.filter((x) => x.clubId === s.clubId).map((x) => x.number));
        let shirt = 21;
        while (taken.has(shirt) && shirt < 99) shirt += 1;
        p.number = shirt;
        s.players.push(p);
        const squad = s.players.filter((x) => x.clubId === s.clubId);
        const placed = placeNewcomer(s.tactics, squad, p);
        s.tactics = { ...s.tactics, lineup: placed.lineup, bench: placed.bench };
        s.academy = s.academy.filter((x) => x.id !== youthId);
        s.news.unshift({
          id: uid("n"),
          week: s.week,
          tone: "good",
          title: `Cantera: ${p.name}`,
          body: `Sube al primer equipo por ${formatMoney(y.fee)}. GRL ${p.ovr} / POT ${p.pot}.`,
        });
        set({ players: s.players, academy: s.academy, budget: s.budget, news: s.news, tactics: s.tactics, tempLineupBackup: null });
        return null;
      },
      releaseYouth: (youthId) => {
        const s = cloneSave(get());
        const y = s.academy.find((x) => x.id === youthId);
        if (!y) return "Ya no está en la cantera.";
        s.academy = s.academy.filter((x) => x.id !== youthId);
        s.news.unshift({
          id: uid("n"),
          week: s.week,
          tone: "neutral",
          title: `Cantera: se va ${y.name}`,
          body: `${y.pos} GRL ${y.ovr} / POT ${y.pot}. Lo cortan de la academia.`,
        });
        set({ academy: s.academy, news: s.news });
        return null;
      },
      startTraining: (tier, playerIds) => {
        const s = cloneSave(get());
        if (s.clubRescue?.status === "active" && s.clubRescue.missedPayments >= 2) {
          return "La directiva suspendió los planes de entrenamiento pagos por los incumplimientos del rescate.";
        }
        const err = validateTrainingStart(s, tier, playerIds);
        if (err) return err;
        const info = tierInfo(tier);
        startTrainingPlan(s, tier, playerIds);
        const names = playerIds
          .map((id) => s.players.find((x) => x.id === id)?.name)
          .filter(Boolean)
          .join(" y ");
        s.news.unshift({
          id: uid("n"),
          week: s.week,
          tone: "neutral",
          title: `Arranca el ${info.name}`,
          body: `${names} entrenan durante 6 meses (${formatMoney(info.cost)}). Te avisamos cuando terminen.`,
        });
        set({ trainingPlans: s.trainingPlans, budget: s.budget, news: s.news });
        return null;
      },
      dismissTrainingReport: () => {
        const reports = get().trainingReports;
        if (!reports.some((r) => !r.seen)) return;
        set({ trainingReports: reports.map((r) => (r.seen ? r : { ...r, seen: true })) });
      },
      dismissPopup: () => {
        const popups = get().popups.slice(1);
        set({ popups });
      },
      resolveEventChoice: (popupId, choiceId) => {
        const s = cloneSave(get());
        const error = resolveEventDecision(s, popupId, choiceId);
        // Si no se pudo (por ejemplo, falta caja) el aviso sigue abierto y no cambia nada.
        if (!error) set(s);
        return error;
      },
      markPlayerChatRead: (threadId) => {
        const s = cloneSave(get());
        markPlayerChatRead(s, threadId);
        set({ playerChats: s.playerChats });
      },
      addPlayerChatNote: (threadId, body) => {
        const s = cloneSave(get());
        appendPlayerChatNote(s, threadId, body);
        set({ playerChats: s.playerChats });
      },
      resolvePlayerChatChoice: (threadId, choiceId) => {
        const s = cloneSave(get());
        const result = resolvePlayerChat(s, threadId, choiceId);
        if (result.error) return result;
        set({
          players: s.players,
          playerChats: s.playerChats,
          playerPromises: s.playerPromises,
          idolatryHistory: s.idolatryHistory,
          news: s.news,
        });
        return result;
      },
      switchClub: (newClubId) => {
        const current = get();
        if (current.clubRescue?.status === "active") {
          return "Debes completar el rescate financiero antes de cambiar de club.";
        }
        const sacked = current.board?.sacked ?? null;
        if (!current.seasonOver && !sacked) return "Solo se puede cambiar de club al cerrar la temporada.";
        if (!isSelectableClub(newClubId) || newClubId === current.clubId) return "Ese club no está disponible.";
        const allowed = sacked ? sacked.offers.some((o) => o.clubId === newClubId) : managerOffers(current).some((o) => o.clubId === newClubId);
        if (!allowed) return "Ese club no te hizo una oferta.";
        // Despedido en plena temporada: lo que falta del año se juega solo antes de asumir en el club nuevo.
        const prev = current.seasonOver ? current : finishSeasonAfterSacking(cloneSave(current));
        const slot = clampSlot(prev.slot);
        const s = cloneSave(prev);
        // La temporada con el club que dejas queda archivada en el historial de carrera.
        archiveSeason(s);
        // Cambio de club: la dirigencia nueva arranca de cero, con sus propios objetivos.
        s.board = null;
        const oldId = s.clubId;
        const oldClub = clubById(oldId);
        const newClub = clubById(newClubId);
        ensureFinance(s);

        // El club que dejas pasa a manejarse solo, con la caja que le dejaste.
        s.clubFinance[oldId] = { budget: Math.max(0, s.budget), wageCap: Math.round(payroll(s, oldId) * 1.05) };
        // El club nuevo te entrega su propia caja de fichajes.
        const newBudget = s.clubFinance[newClubId]?.budget ?? baseTransferBudget(newClubId);
        delete s.clubFinance[newClubId];

        closeStadiumSeason(s, s.season + 1, newClubId);
        s.clubId = newClubId;
        s.clubIdentity = null;
        s.budget = newBudget;
        closeStadiumSeason(s, s.season + 1, oldId);
        s.stadiums = {
          ...(s.stadiums ?? {}),
          [newClubId]: stadiumFor(s, newClubId),
        };
        s.standings = s.leagueTables[playableLeague(newClub.league)] ?? s.standings;
        // Lo que dependía del club anterior no se lleva.
        s.offers = [];
        s.trainingPlans = [];
        s.trainingReports = [];
        s.scouts = [];
        s.tempLineupBackup = null;
        s.popups = [];
        const used = new Set(s.players.map((p) => p.name));
        s.academy = seedAcademy(newClubId, new Rng(s.seed + s.season * 7 + 3), used);
        // Los contratos que vencen en el club nuevo se arreglan antes del cambio de año: no heredas la sangría.
        for (const p of s.players) {
          if (p.clubId !== newClubId || p.loanFrom || p.contract > 1) continue;
          const t = aiTerms(s, p, newClubId, false, true);
          applyTerms(p, { ...t, wage: Math.max(t.wage, p.wage) });
          p.contract = renewedContract({ contract: 1 }, t.years);
        }
        const squad = s.players.filter((p) => p.clubId === newClubId);
        s.tactics.lineup = pickXi(squad, s.tactics.formation);
        s.tactics.bench = pickBench(squad, s.tactics.lineup);

        const next = evolveSeason(s);
        next.news.unshift({
          id: uid("n"),
          week: 0,
          tone: "good",
          title: `Nuevo desafío: ${newClub.name}`,
          body: `Dejas ${oldClub.name} y asumes en ${newClub.name}. Valoración de DT: ${managerReport(prev).rating}/100.`,
        });
        const slots = snapshotSlots(current);
        slots[slot] = next;
        set({ ...next, slots, hydrated: true });
        return null;
      },
      startNextSeason: () => {
        const prev = get();
        const slot = clampSlot(prev.slot);
        const closing = cloneSave(prev);
        closeStadiumSeason(closing, closing.season + 1);
        archiveSeason(closing);
        const rescuePaymentNews = settleRescueInstallment(closing);
        const next = evolveSeason(closing);
        if (rescuePaymentNews) next.news.unshift(rescuePaymentNews);
        const slots = snapshotSlots(prev);
        slots[slot] = next;
        set({ ...next, slots, hydrated: true });
      },
    }),
    {
      name: STORAGE_KEY,
      version: SAVE_VERSION,
      storage: createSaveStorage() as unknown as PersistStorage<PersistShape>,
      partialize: (s) => {
        const idx = clampSlot(s.slot);
        // Los slots inactivos se reusan tal cual (misma referencia) para que solo se reescriba el que cambió.
        const slots = emptySlots();
        for (let i = 0; i < SLOT_COUNT; i++) slots[i] = s.slots?.[i] ?? null;
        if (s.clubId && isSelectableClub(s.clubId)) {
          slots[idx] = pickData({ ...s, slot: idx, screen: playableScreen(s.screen) }, false);
        }
        return { slot: idx, slots, customClubs: normalizeCustomClubs(s.customClubs) };
      },
      migrate: (persisted, version) => migratePersisted(persisted, version),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PersistShape>;
        const slots = padSlots(p.slots);
        const slot = clampSlot(p.slot);
        const active = slots[slot];
        if (active && isSelectableClub(active.clubId)) {
          applyClubIdentity(active.clubIdentity?.targetClubId ?? null, active.clubIdentity);
          applyDivisions(active.divisions);
          return {
            ...current,
            ...active,
            slots,
            customClubs: normalizeCustomClubs(p.customClubs),
            slot,
            screen: playableScreen(active.screen),
          };
        }
        applyClubIdentity(null);
        const first = slots.findIndex((x) => x && isSelectableClub(x.clubId));
        return {
          ...current,
          ...emptyShell(),
          slots,
          customClubs: normalizeCustomClubs(p.customClubs),
          slot: first >= 0 ? first : slot,
          screen: "boot",
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function selectClubPlayers(s: GameSave, clubId = s.clubId) {
  return s.players.filter((p) => p.clubId === clubId);
}

export function weeklyWages(s: GameSave) {
  return wageBill(s.players, s.clubId);
}
