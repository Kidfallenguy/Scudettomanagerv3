import { clubById, domesticIds } from "./clubs";
import {
  AFC_GHOST_IDS,
  CAF_GHOST_IDS,
  CONCACAF_GHOST_IDS,
  CONMEBOL_GHOST_IDS,
  OFC_GHOST_IDS,
} from "./fictional";
import { Rng } from "./rng";
import type { ClubId, Competition, GameSave, PlayableLeagueId, SeasonChampions } from "./types";

/** Mundial de Clubes FIFA: 32 equipos, 8 grupos de 4, ida simple, octavos a final a partido único. */
export const MUNDIAL_TEAMS = 32;
/** El Mundial de Clubes se juega cada 4 temporadas: la primera en MUNDIAL_FIRST_SEASON (2026, 2030, 2034…). */
export const MUNDIAL_FIRST_SEASON = 2026;
export const MUNDIAL_EVERY_SEASONS = 4;
export function isMundialSeason(season: number): boolean {
  const d = season - MUNDIAL_FIRST_SEASON;
  return d >= 0 && d % MUNDIAL_EVERY_SEASONS === 0;
}
export const MUNDIAL_GROUPS = 8;
export const MUNDIAL_GROUP_SIZE = 4;
export const MUNDIAL_POTS = 4;
export const MUNDIAL_POT_SIZE = 8;
export const MUNDIAL_GROUP_ROUNDS = 3;
export const MUNDIAL_R16_ROUND = 4;
export const MUNDIAL_QF_ROUND = 5;
export const MUNDIAL_SF_ROUND = 6;
export const MUNDIAL_FINAL_ROUND = 7;

export const MUNDIAL_SLOTS = {
  uefa: 12,
  conmebol: 6,
  afc: 4,
  caf: 4,
  concacaf: 4,
  ofc: 1,
  host: 1,
} as const;

/** Anfitrión del torneo (cupo propio, no cuenta como plaza CONCACAF). */
export const MUNDIAL_HOST_ID = "us_mia";

export type MundialConfed = "uefa" | "conmebol" | "afc" | "caf" | "concacaf" | "ofc";

function rankedIdsByPrestige(ids: string[]): string[] {
  return [...ids].sort((a, b) => clubById(b).prestige - clubById(a).prestige || a.localeCompare(b));
}

export function mundialConfed(id: string): MundialConfed {
  const c = clubById(id);
  if (c.league === "afc" || c.league === "saudiProLeague" || c.league === "saudiFirstDivision") return "afc";
  if (c.league === "caf") return "caf";
  if (c.league === "concacaf" || c.league === "mls" || c.league === "uslChampionship") return "concacaf";
  if (c.league === "ofc") return "ofc";
  if (c.league === "argentina" || c.league === "brasileirao" || c.league === "brasileiraoB" || c.league === "brasileiraoC" || c.league === "conmebol") return "conmebol";
  return "uefa";
}

function leagueOrder(save: GameSave | null, league: PlayableLeagueId): string[] {
  const currentIds = domesticIds(league);
  const savedIds = Object.entries(save?.divisions ?? {})
    .filter(([, division]) => division === league)
    .map(([id]) => id);
  const ids = savedIds.length === currentIds.length ? savedIds : currentIds;
  const rows = save?.leagueTables?.[league];
  if (!save?.seasonOver || !rows || rows.length !== ids.length || rows.every((row) => row.played === 0)) {
    return rankedIdsByPrestige(ids);
  }
  const participants = new Set(ids);
  const rankedRows = [...rows]
    .filter((row) => participants.has(row.clubId))
    .sort(
      (a, b) =>
        b.pts - a.pts ||
        (b.gf - b.ga) - (a.gf - a.ga) ||
        b.gf - a.gf ||
        clubById(b.clubId).prestige - clubById(a.clubId).prestige ||
        a.clubId.localeCompare(b.clubId),
    );
  return rankedRows.length === ids.length ? rankedRows.map((row) => row.clubId) : rankedIdsByPrestige(ids);
}

export function mundialCountry(id: string): string {
  const c = clubById(id);
  return (c.country || c.league || id).toUpperCase();
}

export function mundialStageName(round: number): string {
  if (round <= MUNDIAL_GROUP_ROUNDS) return `Fase de grupos · J${round}`;
  return (
    (
      {
        [MUNDIAL_R16_ROUND]: "Octavos",
        [MUNDIAL_QF_ROUND]: "Cuartos",
        [MUNDIAL_SF_ROUND]: "Semifinales",
        [MUNDIAL_FINAL_ROUND]: "Final",
      } as Record<number, string>
    )[round] ?? `Ronda ${round}`
  );
}

function uniquePush(out: string[], id: string | null | undefined, used: Set<string>) {
  if (!id || used.has(id)) return;
  out.push(id);
  used.add(id);
}

function fillFrom(out: string[], pool: string[], need: number, used: Set<string>) {
  for (const id of pool) {
    if (out.length >= need) break;
    uniquePush(out, id, used);
  }
}

/** Progreso en una copa: campeón primero, luego ronda máxima jugada, luego prestigio. */
function cupScore(save: GameSave | null | undefined, clubId: string, comp: Competition, champId: string | null): number {
  if (champId === clubId) return 10_000;
  if (!save) return clubById(clubId).prestige;
  const mine = save.fixtures.filter(
    (f) => f.competition === comp && f.played && (f.homeId === clubId || f.awayId === clubId),
  );
  if (!mine.length) return -1;
  const maxRound = Math.max(...mine.map((f) => f.round));
  return maxRound * 20 + clubById(clubId).prestige;
}

function sortPool(
  ids: string[],
  save: GameSave | null | undefined,
  comp: Competition,
  champId: string | null,
): string[] {
  return [...new Set(ids)].sort((a, b) => {
    const d = cupScore(save, b, comp, champId) - cupScore(save, a, comp, champId);
    if (d) return d;
    return clubById(b).prestige - clubById(a).prestige || a.localeCompare(b);
  });
}

function noisyPrestige(ids: string[], rng: Rng): string[] {
  return [...ids].sort((a, b) => {
    const pa = clubById(a).prestige + rng.int(-4, 4);
    const pb = clubById(b).prestige + rng.int(-4, 4);
    return pb - pa || a.localeCompare(b);
  });
}

export function qualifyMundial(args: {
  rng: Rng;
  uclTeams: string[];
  uelTeams: string[];
  ueclTeams: string[];
  libTeams: string[];
  sudTeams: string[];
  lastChampions?: SeasonChampions | null;
  save?: GameSave | null;
}): string[] {
  const used = new Set<string>();
  const champs = args.lastChampions ?? null;
  const save = args.save ?? null;
  const mlsOrder = leagueOrder(save, "mls");
  const saudiOrder = leagueOrder(save, "saudiProLeague");

  const uefa: string[] = [];
  uniquePush(uefa, champs?.ucl ?? null, used);
  fillFrom(uefa, sortPool(args.uclTeams, save, "ucl", champs?.ucl ?? null), MUNDIAL_SLOTS.uefa, used);
  uniquePush(uefa, champs?.uel ?? null, used);
  fillFrom(uefa, sortPool(args.uelTeams, save, "uel", champs?.uel ?? null), MUNDIAL_SLOTS.uefa, used);
  fillFrom(uefa, sortPool(args.ueclTeams, save, "uecl", champs?.uecl ?? null), MUNDIAL_SLOTS.uefa, used);
  fillFrom(
    uefa,
    rankedIdsByPrestige(
      [...args.uclTeams, ...args.uelTeams, ...args.ueclTeams].filter((id) => mundialConfed(id) === "uefa"),
    ),
    MUNDIAL_SLOTS.uefa,
    used,
  );

  const conmebol: string[] = [];
  uniquePush(conmebol, champs?.libertadores ?? null, used);
  fillFrom(
    conmebol,
    sortPool(args.libTeams, save, "libertadores", champs?.libertadores ?? null),
    MUNDIAL_SLOTS.conmebol,
    used,
  );
  fillFrom(conmebol, rankedIdsByPrestige(args.libTeams), MUNDIAL_SLOTS.conmebol, used);
  fillFrom(conmebol, rankedIdsByPrestige(CONMEBOL_GHOST_IDS), MUNDIAL_SLOTS.conmebol, used);

  const host: string[] = [];
  uniquePush(host, mlsOrder[0] ?? MUNDIAL_HOST_ID, used);

  const concacaf: string[] = [];
  fillFrom(concacaf, [...mlsOrder.slice(1), ...noisyPrestige(CONCACAF_GHOST_IDS, args.rng)], MUNDIAL_SLOTS.concacaf, used);

  const afc: string[] = [];
  uniquePush(afc, saudiOrder[0], used);
  fillFrom(afc, noisyPrestige(AFC_GHOST_IDS, args.rng), MUNDIAL_SLOTS.afc, used);

  const caf: string[] = [];
  fillFrom(caf, noisyPrestige(CAF_GHOST_IDS, args.rng), MUNDIAL_SLOTS.caf, used);

  const ofc: string[] = [];
  fillFrom(ofc, noisyPrestige(OFC_GHOST_IDS, args.rng), MUNDIAL_SLOTS.ofc, used);

  const teams = [
    ...uefa.slice(0, MUNDIAL_SLOTS.uefa),
    ...conmebol.slice(0, MUNDIAL_SLOTS.conmebol),
    ...afc.slice(0, MUNDIAL_SLOTS.afc),
    ...caf.slice(0, MUNDIAL_SLOTS.caf),
    ...host.slice(0, MUNDIAL_SLOTS.host),
    ...concacaf.slice(0, MUNDIAL_SLOTS.concacaf),
    ...ofc.slice(0, MUNDIAL_SLOTS.ofc),
  ];

  if (teams.length < MUNDIAL_TEAMS) {
    const emergency = rankedIdsByPrestige([
      ...AFC_GHOST_IDS,
      ...CAF_GHOST_IDS,
      ...CONCACAF_GHOST_IDS,
      ...OFC_GHOST_IDS,
      ...CONMEBOL_GHOST_IDS,
      ...mlsOrder,
      ...saudiOrder,
      ...args.uclTeams,
      ...args.libTeams,
    ]);
    fillFrom(teams, emergency, MUNDIAL_TEAMS, used);
  }

  return [...new Set(teams)].slice(0, MUNDIAL_TEAMS);
}

function canPlace(group: string[], id: string, relax: "none" | "country" | "all"): boolean {
  if (group.length >= MUNDIAL_GROUP_SIZE) return false;
  if (group.includes(id)) return false;
  const conf = mundialConfed(id);
  const country = mundialCountry(id);
  const confCount = group.filter((x) => mundialConfed(x) === conf).length;
  const maxConf = conf === "uefa" ? 2 : 1;
  if (relax !== "all" && confCount >= maxConf) return false;
  if (relax === "none" && group.some((x) => mundialCountry(x) === country)) return false;
  return true;
}

/**
 * Sorteo: 4 bombos de 8. El anfitrión va al bombo 1 y al grupo A.
 * Restricciones: misma asociación no se cruza; UEFA hasta 2 por grupo; resto de confederaciones, 1.
 */
export function drawMundialGroups(teams: string[], rng: Rng): string[][] {
  const list = [...new Set(teams)].slice(0, MUNDIAL_TEAMS);
  if (list.length !== MUNDIAL_TEAMS) return [];

  const attempt = (relax: "none" | "country" | "all"): string[][] | null => {
    const host = list.find((id) => clubById(id).league === "mls") ?? (list.includes(MUNDIAL_HOST_ID) ? MUNDIAL_HOST_ID : list[0]!);
    const ranked = rankedIdsByPrestige(list.filter((id) => id !== host));
    const ordered = [host, ...ranked];
    const pots: string[][] = [];
    for (let i = 0; i < MUNDIAL_POTS; i++) {
      pots.push(rng.shuffle(ordered.slice(i * MUNDIAL_POT_SIZE, (i + 1) * MUNDIAL_POT_SIZE)));
    }
    const groups: string[][] = Array.from({ length: MUNDIAL_GROUPS }, () => []);
    groups[0]!.push(host);
    const pot1 = pots[0]!.filter((id) => id !== host);
    for (const id of pot1) {
      const open = [];
      for (let g = 1; g < MUNDIAL_GROUPS; g++) {
        if (groups[g]!.length === 0 && canPlace(groups[g]!, id, relax)) open.push(g);
      }
      const pick = open.length ? rng.pick(open) : groups.findIndex((g, i) => i > 0 && g.length === 0);
      if (pick < 0) return null;
      groups[pick]!.push(id);
    }
    for (let p = 1; p < MUNDIAL_POTS; p++) {
      for (const id of pots[p]!) {
        const open: number[] = [];
        for (let g = 0; g < MUNDIAL_GROUPS; g++) {
          if (canPlace(groups[g]!, id, relax)) open.push(g);
        }
        if (!open.length) return null;
        groups[rng.pick(open)]!.push(id);
      }
    }
    if (groups.some((g) => g.length !== MUNDIAL_GROUP_SIZE)) return null;
    return groups;
  };

  for (const relax of ["none", "country", "all"] as const) {
    for (let i = 0; i < 48; i++) {
      const groups = attempt(relax);
      if (groups) return groups;
    }
  }

  const shuffled = rng.shuffle(list);
  const groups: string[][] = [];
  for (let i = 0; i < MUNDIAL_GROUPS; i++) groups.push(shuffled.slice(i * 4, i * 4 + 4));
  return groups;
}

export function assembleMundial(args: {
  rng: Rng;
  uclTeams: string[];
  uelTeams: string[];
  ueclTeams: string[];
  libTeams: string[];
  sudTeams: string[];
  lastChampions?: SeasonChampions | null;
  save?: GameSave | null;
}): { teams: string[]; groups: string[][] } {
  const teams = qualifyMundial(args);
  const groups = drawMundialGroups(teams, args.rng);
  return { teams: groups.flat(), groups };
}

/** Emparejamientos de octavos: 1A-2B, 1C-2D, 1E-2F, 1G-2H, 1B-2A, 1D-2C, 1F-2E, 1H-2G. */
export function mundialR16Pairs(
  groups: string[][],
  standings: { clubId: string; pts: number; gf: number; ga: number }[],
): Array<[string, string]> {
  const firsts: string[] = [];
  const seconds: string[] = [];
  for (const group of groups) {
    const rows = [...standings]
      .filter((r) => group.includes(r.clubId))
      .sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        const gd = b.gf - b.ga - (a.gf - a.ga);
        if (gd) return gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.clubId.localeCompare(b.clubId);
      });
    if (rows[0]) firsts.push(rows[0].clubId);
    if (rows[1]) seconds.push(rows[1].clubId);
  }
  if (firsts.length !== 8 || seconds.length !== 8) return [];
  const order: Array<[number, number]> = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [1, 0],
    [3, 2],
    [5, 4],
    [7, 6],
  ];
  const pairs: Array<[string, string]> = [];
  for (const [a, b] of order) {
    const h = firsts[a];
    const t = seconds[b];
    if (h && t) pairs.push([h, t]);
  }
  return pairs;
}

export function intercontinentalPair(
  champs: SeasonChampions | null | undefined,
  fallback?: { ucl: string[]; lib: string[] },
): [string, string] | null {
  const ucl = champs?.ucl ?? fallback?.ucl[0] ?? null;
  const lib = champs?.libertadores ?? fallback?.lib[0] ?? null;
  if (ucl && lib && ucl !== lib) return [ucl, lib];
  return null;
}

export function transatlanticaPair(
  champs: SeasonChampions | null | undefined,
  fallback?: { uel: string[]; sud: string[] },
  avoid?: [string, string] | null,
): [string, string] | null {
  const uel = champs?.uel ?? fallback?.uel[0] ?? null;
  const sud = champs?.sudamericana ?? fallback?.sud[0] ?? null;
  if (!uel || !sud || uel === sud) return null;
  if (avoid && ((uel === avoid[0] && sud === avoid[1]) || (uel === avoid[1] && sud === avoid[0]))) return null;
  return [uel, sud];
}

export function mundialFinalRound(save: { mundialGroups?: string[][] } | null | undefined): number {
  return (save?.mundialGroups?.length ?? 0) === MUNDIAL_GROUPS ? MUNDIAL_FINAL_ROUND : 1;
}

export type { ClubId };
