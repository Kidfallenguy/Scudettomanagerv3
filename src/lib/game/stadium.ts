import { clubById } from "./clubs";
import { clamp } from "./format";
import { crowdSeed, matchAtmosphere } from "./crowd";
import { baseFans, fansOf } from "./sponsors";
import type { Club, Fixture, GameSave, StadiumMatchRecord, StadiumSeasonRecord, StadiumState } from "./types";

export type StadiumExpansionId = "small" | "medium" | "large" | "massive";
export type StadiumImprovementId = "comfort" | "security" | "services" | "vip";
export type StadiumUpgradeId = StadiumExpansionId | StadiumImprovementId;
type StadiumPurchaseResult =
  | { ok: true; state: StadiumState; cost: number }
  | { ok: false; error: string };

const MAX_CAPACITY = 200_000;
const MAX_IMPROVEMENT = 3;

const EXPANSIONS: Record<"small" | "medium" | "large" | "massive", { share: number; minimum: number; costPerSeat: number }> = {
  small: { share: 0.08, minimum: 500, costPerSeat: 520 },
  medium: { share: 0.2, minimum: 2_000, costPerSeat: 760 },
  large: { share: 0.4, minimum: 5_000, costPerSeat: 1_050 },
  massive: { share: 0.75, minimum: 10_000, costPerSeat: 1_450 },
};

const IMPROVEMENT_LABELS: Record<"comfort" | "security" | "services" | "vip", string> = {
  comfort: "Comodidad",
  security: "Seguridad",
  services: "Servicios",
  vip: "Zona VIP",
};

function isExpansion(id: StadiumUpgradeId): id is StadiumExpansionId {
  return id === "small" || id === "medium" || id === "large" || id === "massive";
}

function leagueDemand(league: Club["league"]) {
  if (league === "argentina") return 1.15;
  if (league === "primeraNacional" || league === "serieB" || league === "brasileiraoB" || league === "championship") return 1;
  if (league === "primeraBMetro" || league === "serieC" || league === "brasileiraoC" || league === "leagueOne") return 0.82;
  if (league === "argentinaCuarta" || league === "serieD" || league === "argentinaQuinta" || league === "promocionalAmateur") return 0.62;
  if (league === "leagueTwo" || league === "bundesliga3" || league === "ligue3" || league === "primeraFed1" || league === "primeraFed2") return 0.78;
  if (league === "saudiFirstDivision" || league === "uslChampionship" || league === "tweedeDivisie") return 0.76;
  if (league === "primeira2" || league === "eersteDivisie" || league === "rfef" || league === "segunda") return 0.88;
  return 1.1;
}

function defaultTicketPrice(club: Club) {
  const tier = leagueDemand(club.league);
  return Math.round(clamp(7 + club.prestige * 0.2 + (tier - 0.8) * 8, 6, 42));
}

export function defaultFacilitiesLevel(club: Club) {
  const divisionOffset =
    club.league === "argentinaCuarta" || club.league === "argentinaQuinta" || club.league === "promocionalAmateur" ? -1 : 0;
  return Math.round(clamp(1 + club.prestige / 25 + divisionOffset, 1, 5));
}

export function createStadiumState(club: Club, season: number, capacityOverride?: number, facilitiesOverride?: number): StadiumState {
  const capacity = Math.round(clamp(capacityOverride || club.capacity || club.prestige * 450, 500, MAX_CAPACITY));
  const facilitiesLevel = Math.round(clamp(facilitiesOverride ?? defaultFacilitiesLevel(club), 1, 5));
  const baseTicketPrice = defaultTicketPrice(club);
  return {
    name: club.stadium || `Estadio de ${club.name}`,
    capacity,
    facilitiesLevel,
    comfort: 0,
    security: 0,
    services: 0,
    vip: 0,
    ticketPrice: baseTicketPrice,
    baseTicketPrice,
    season,
    seasonAttendance: 0,
    seasonHomeGames: 0,
    seasonRevenue: 0,
    matches: [],
    history: [],
  };
}

export function normalizeStadiumState(
  raw: Partial<StadiumState> | null | undefined,
  club: Club,
  season: number,
  capacityOverride?: number,
  facilitiesOverride?: number,
): StadiumState {
  const base = createStadiumState(club, season, capacityOverride, facilitiesOverride);
  if (!raw || typeof raw !== "object") return base;
  const level = (key: "comfort" | "security" | "services" | "vip") =>
    Math.round(clamp(Number(raw[key]) || 0, 0, MAX_IMPROVEMENT));
  const matches: StadiumMatchRecord[] = Array.isArray(raw.matches)
    ? raw.matches.slice(-100).flatMap((match) => {
        if (!match || typeof match.fixtureId !== "string" || typeof match.opponentId !== "string") return [];
        return [{
          fixtureId: match.fixtureId.slice(0, 120),
          season: Math.round(Number(match.season) || season),
          week: Math.max(0, Math.round(Number(match.week) || 0)),
          opponentId: match.opponentId,
          competition: match.competition,
          attendance: Math.round(clamp(Number(match.attendance) || 0, 0, MAX_CAPACITY)),
          revenue: Math.max(0, Math.round(Number(match.revenue) || 0)),
        }];
      })
    : [];
  const history: StadiumSeasonRecord[] = Array.isArray(raw.history)
    ? raw.history.slice(-20).flatMap((record) => {
        if (!record || !Number.isFinite(record.season)) return [];
        return [{
          season: Math.round(record.season),
          homeGames: Math.max(0, Math.round(Number(record.homeGames) || 0)),
          attendance: Math.max(0, Math.round(Number(record.attendance) || 0)),
          revenue: Math.max(0, Math.round(Number(record.revenue) || 0)),
        }];
      })
    : [];
  const baseTicketPrice = Math.round(clamp(Number(raw.baseTicketPrice) || base.baseTicketPrice, 1, 100));
  return {
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, 60) : base.name,
    capacity: Math.round(clamp(Number(raw.capacity) || base.capacity, 500, MAX_CAPACITY)),
    facilitiesLevel: Math.round(clamp(Number(raw.facilitiesLevel) || base.facilitiesLevel, 1, 5)),
    comfort: level("comfort"),
    security: level("security"),
    services: level("services"),
    vip: level("vip"),
    ticketPrice: Math.round(clamp(Number(raw.ticketPrice) || baseTicketPrice, 3, 100)),
    baseTicketPrice,
    season: Math.max(1, Math.round(Number(raw.season) || season)),
    seasonAttendance: Math.max(0, Math.round(Number(raw.seasonAttendance) || 0)),
    seasonHomeGames: Math.max(0, Math.round(Number(raw.seasonHomeGames) || 0)),
    seasonRevenue: Math.max(0, Math.round(Number(raw.seasonRevenue) || 0)),
    matches,
    history,
  };
}

export function stadiumFor(save: Pick<GameSave, "clubId" | "season" | "stadiums">, clubId = save.clubId): StadiumState {
  return save.stadiums?.[clubId] ?? createStadiumState(clubById(clubId), save.season);
}

export function stadiumUpgradeQuote(stadium: StadiumState, club: Club, id: StadiumExpansionId): {
  id: StadiumExpansionId;
  label: string;
  currentCapacity: number;
  finalCapacity: number;
  addedCapacity: number;
  cost: number;
  maxed: boolean;
};
export function stadiumUpgradeQuote(stadium: StadiumState, club: Club, id: StadiumImprovementId): {
  id: StadiumImprovementId;
  label: string;
  currentLevel: number;
  finalLevel: number;
  cost: number;
  maxed: boolean;
};
export function stadiumUpgradeQuote(stadium: StadiumState, club: Club, id: StadiumUpgradeId) {
  const economicFactor = clamp(0.7 + club.prestige / 80 + stadium.capacity / 200_000, 0.8, 2.2);
  if (isExpansion(id)) {
    const expansion = EXPANSIONS[id];
    const added = Math.min(MAX_CAPACITY - stadium.capacity, Math.max(expansion.minimum, Math.round(stadium.capacity * expansion.share)));
    return {
      id,
      label: id === "small" ? "Pequeña" : id === "medium" ? "Media" : id === "large" ? "Grande" : "Masiva",
      currentCapacity: stadium.capacity,
      finalCapacity: stadium.capacity + Math.max(0, added),
      addedCapacity: Math.max(0, added),
      cost: Math.round(added * expansion.costPerSeat * economicFactor),
      maxed: added <= 0,
    };
  }
  const improvement = id as keyof typeof IMPROVEMENT_LABELS;
  const currentLevel = stadium[improvement];
  return {
    id,
    label: IMPROVEMENT_LABELS[improvement],
    currentLevel,
    finalLevel: Math.min(MAX_IMPROVEMENT, currentLevel + 1),
    cost: Math.round((75_000 + stadium.capacity * 0.65) * economicFactor * (currentLevel + 1)),
    maxed: currentLevel >= MAX_IMPROVEMENT,
  };
}

export function buyStadiumUpgrade(
  stadium: StadiumState,
  club: Club,
  id: StadiumUpgradeId,
  budget: number,
): StadiumPurchaseResult {
  const next = { ...stadium };
  if (isExpansion(id)) {
    const quote = stadiumUpgradeQuote(stadium, club, id);
    if (quote.maxed) return { ok: false, error: "El estadio ya alcanzó el máximo de esta mejora." };
    if (budget < quote.cost) return { ok: false, error: "No hay presupuesto suficiente para esta obra." };
    next.capacity = quote.finalCapacity;
    return { ok: true, state: next, cost: quote.cost };
  } else {
    const quote = stadiumUpgradeQuote(stadium, club, id);
    if (quote.maxed) return { ok: false, error: "El estadio ya alcanzó el máximo de esta mejora." };
    if (budget < quote.cost) return { ok: false, error: "No hay presupuesto suficiente para esta obra." };
    switch (id) {
      case "comfort": next.comfort = quote.finalLevel; break;
      case "security": next.security = quote.finalLevel; break;
      case "services": next.services = quote.finalLevel; break;
      case "vip": next.vip = quote.finalLevel; break;
    }
    next.facilitiesLevel = Math.min(
      5,
      Math.max(next.facilitiesLevel, 1 + Math.floor((next.comfort + next.security + next.services + next.vip) / 3)),
    );
    return { ok: true, state: next, cost: quote.cost };
  }
}

export function recordStadiumMatch(save: GameSave, fixture: Fixture): StadiumMatchRecord | null {
  if (fixture.homeId !== save.clubId) return null;
  const current = stadiumFor(save);
  if (current.matches.some((match) => match.fixtureId === fixture.id)) return null;
  const club = clubById(save.clubId);
  const opposition = clubById(fixture.awayId);
  const prestige = clamp(club.prestige + (save.events?.prestige ?? 0), 1, 100);
  const form = save.standings.find((row) => row.clubId === save.clubId);
  const pointsPerGame = form && form.played > 0 ? form.pts / form.played : 1.35;
  const performance = clamp(0.88 + (pointsPerGame - 1.35) * 0.09, 0.78, 1.12);
  const atmosphere = matchAtmosphere(fixture, club.league);
  const importance = atmosphere.level === 2 ? 1.45 : atmosphere.level === 1 ? 1.18 : 1;
  const priceElasticity = clamp(Math.pow(current.baseTicketPrice / current.ticketPrice, 0.35), 0.68, 1.35);
  const facilityDemand = 1 + Math.max(0, current.facilitiesLevel - 1) * 0.025 + current.comfort * 0.07 + current.security * 0.025 + current.vip * 0.025;
  const opponentInterest = clamp(0.9 + opposition.prestige / 500, 0.92, 1.16);
  const fanInterest = clamp(0.85 + (fansOf(save, club.id) / Math.max(1, baseFans(club.id))) * 0.15, 0.85, 1.2);
  const jitter = 0.95 + (crowdSeed(fixture.id, fixture.homeId, fixture.awayId) % 101) / 1000;
  const demand = Math.round(
    (800 + prestige ** 2 * 2.8) *
      leagueDemand(club.league) *
      performance *
      importance *
      priceElasticity *
      facilityDemand *
      opponentInterest *
      fanInterest *
      jitter,
  );
  const attendance = Math.min(current.capacity, Math.max(0, demand));
  const revenueMultiplier = 1 + current.services * 0.035 + current.vip * 0.075;
  const revenue = Math.round(attendance * current.ticketPrice * revenueMultiplier);
  const record: StadiumMatchRecord = {
    fixtureId: fixture.id,
    season: save.season,
    week: save.week,
    opponentId: fixture.awayId,
    competition: fixture.competition,
    attendance,
    revenue,
  };
  save.stadiums = { ...(save.stadiums ?? {}), [save.clubId]: {
    ...current,
    seasonAttendance: current.seasonAttendance + attendance,
    seasonHomeGames: current.seasonHomeGames + 1,
    seasonRevenue: current.seasonRevenue + revenue,
    matches: [...current.matches, record].slice(-100),
  } };
  return record;
}

export function closeStadiumSeason(save: GameSave, nextSeason = save.season + 1, clubId = save.clubId) {
  const current = stadiumFor(save, clubId);
  if (current.season >= nextSeason) return;
  const history = current.seasonHomeGames > 0
    ? [...current.history, {
        season: current.season,
        homeGames: current.seasonHomeGames,
        attendance: current.seasonAttendance,
        revenue: current.seasonRevenue,
      }].slice(-20)
    : current.history;
  save.stadiums = { ...(save.stadiums ?? {}), [clubId]: {
    ...current,
    season: nextSeason,
    seasonAttendance: 0,
    seasonHomeGames: 0,
    seasonRevenue: 0,
    matches: [],
    history,
  } };
}

export function normalizeStadiums(
  raw: GameSave["stadiums"],
  clubId: string,
  season: number,
  identity?: GameSave["clubIdentity"],
): GameSave["stadiums"] {
  if (!clubId) return raw ?? {};
  const club = clubById(clubId);
  const capacity = identity?.capacity || club.capacity;
  const fallback = normalizeStadiumState(
    raw?.[clubId],
    club,
    season,
    capacity,
    identity?.stadiumFacilities,
  );
  const normalized = Object.fromEntries(
    Object.entries(raw ?? {}).filter(([id]) => id !== clubId).map(([id, state]) => [
      id,
      normalizeStadiumState(state, clubById(id), state.season || season),
    ]),
  );
  return { ...normalized, [clubId]: fallback };
}
