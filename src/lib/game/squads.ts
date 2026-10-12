import { rollPotential } from "./potential";
import { CLUBS, clubById } from "./clubs";
import { NL_LOWER_LEAGUES_STARS } from "./nl-lower-stars";
import { MLS_USER_SQUADS } from "./mls-user-squads";
import { USL_USER_SQUADS } from "./usl-user-squads";
import { SAUDI_LEAGUES_STARS, SAUDI_LOWER_LEAGUES_STARS } from "./saudi-squads";
import { SPANISH_SQUAD_SEEDS } from "./spanish-squads";
import { ITALIAN_SQUAD_SEEDS } from "./italian-squads";
import { ENGLISH_LOWER_LEAGUE_SQUADS } from "./english-lower-squads";
import { normalizePos } from "./positions";
import { clamp, playerValue, playerWage } from "./format";
import {
  DUTCH_YOUTH_PROSPECTS,
  MANUAL_SQUADS,
  NORTH_AMERICAN_YOUTH_PROSPECTS,
  SERIE_C_YOUTH_PROSPECTS,
  SERIE_D_STARS,
  SERIE_D_YOUTH_PROSPECTS,
  SOUTH_AMERICAN_YOUTH_PROSPECTS,
  STARS,
  makeName,
  pickNat,
  normalizedUsedNames,
  rememberUsedName,
  type StarSeed,
} from "./names";
import { Rng } from "./rng";
import { alignOutfield, gkFor, syncStats } from "./stats";
import type { Attrs, GkAttrs, Player, Pos } from "./types";

const SQUAD_SHAPE: Array<{ pos: Pos; n: number }> = [
  { pos: "GK", n: 3 },
  { pos: "RB", n: 2 },
  { pos: "CB", n: 4 },
  { pos: "LB", n: 2 },
  { pos: "CDM", n: 2 },
  { pos: "CM", n: 3 },
  { pos: "CAM", n: 2 },
  { pos: "RW", n: 2 },
  { pos: "LW", n: 2 },
  { pos: "ST", n: 3 },
];

function extras(ovr: number): Pick<
  Player,
  | "careerGoals"
  | "careerAssists"
  | "careerApps"
  | "seasonStartOvr"
  | "listedForLoan"
  | "loanFrom"
  | "loanSeasons"
  | "hiddenGem"
  | "suspended"
  | "number"
> {
  return {
    careerGoals: 0,
    careerAssists: 0,
    careerApps: 0,
    seasonStartOvr: ovr,
    listedForLoan: false,
    loanFrom: null,
    loanSeasons: 0,
    hiddenGem: false,
    suspended: 0,
    number: 0,
  };
}

function rawAttrsFor(pos: Pos, ovr: number, rng: Rng): Attrs {
  const j = () => rng.int(-3, 3);
  const cap = (n: number) => clamp(Math.round(n), 42, 100);
  const base = ovr - 2;
  if (pos === "GK") {
    return {
      pac: cap(base - 28 + j()),
      sho: cap(base - 30 + j()),
      pas: cap(base - 12 + j()),
      dri: cap(base - 18 + j()),
      def: cap(base - 8 + j()),
      phy: cap(base - 4 + j()),
    };
  }
  if (pos === "CB") {
    return {
      pac: cap(base - 14 + j()),
      sho: cap(base - 22 + j()),
      pas: cap(base - 8 + j()),
      dri: cap(base - 12 + j()),
      def: cap(base + 4 + j()),
      phy: cap(base + 3 + j()),
    };
  }
  if (pos === "LB" || pos === "RB") {
    return {
      pac: cap(base + 2 + j()),
      sho: cap(base - 14 + j()),
      pas: cap(base - 4 + j()),
      dri: cap(base - 2 + j()),
      def: cap(base + 1 + j()),
      phy: cap(base - 2 + j()),
    };
  }
  if (pos === "CDM") {
    return {
      pac: cap(base - 6 + j()),
      sho: cap(base - 10 + j()),
      pas: cap(base + 2 + j()),
      dri: cap(base - 2 + j()),
      def: cap(base + 3 + j()),
      phy: cap(base + 2 + j()),
    };
  }
  if (pos === "CM") {
    return {
      pac: cap(base - 2 + j()),
      sho: cap(base - 4 + j()),
      pas: cap(base + 3 + j()),
      dri: cap(base + 1 + j()),
      def: cap(base - 4 + j()),
      phy: cap(base - 2 + j()),
    };
  }
  if (pos === "CAM") {
    return {
      pac: cap(base + 1 + j()),
      sho: cap(base + 1 + j()),
      pas: cap(base + 4 + j()),
      dri: cap(base + 3 + j()),
      def: cap(base - 16 + j()),
      phy: cap(base - 8 + j()),
    };
  }
  if (pos === "LW" || pos === "RW") {
    return {
      pac: cap(base + 5 + j()),
      sho: cap(base + 1 + j()),
      pas: cap(base - 2 + j()),
      dri: cap(base + 4 + j()),
      def: cap(base - 20 + j()),
      phy: cap(base - 8 + j()),
    };
  }
  return {
    pac: cap(base + 2 + j()),
    sho: cap(base + 5 + j()),
    pas: cap(base - 8 + j()),
    dri: cap(base + 1 + j()),
    def: cap(base - 22 + j()),
    phy: cap(base + 2 + j()),
  };
}

/**
 * Estadísticas coherentes con el GRL: el perfil típico de la posición, ajustado para que las
 * estadísticas den exactamente esa media (un 86 nunca aparece con stats de 45).
 */
export function attrsFor(pos: Pos, ovr: number, rng: Rng): Attrs {
  const raw = rawAttrsFor(pos, ovr, rng);
  return pos === "GK" ? raw : alignOutfield(pos, raw, ovr);
}

/** Atributos de campo + estadísticas de portero (solo si juega de PO). */
export function statsFor(pos: Pos, ovr: number, rng: Rng): { attrs: Attrs; gk?: GkAttrs } {
  const attrs = attrsFor(pos, ovr, rng);
  return pos === "GK" ? { attrs, gk: gkFor(ovr, rng) } : { attrs };
}

/** Reajusta las estadísticas de un jugador a su GRL actual (si hay mucha diferencia, las rehace). */
export function resyncStats(p: Player, rng: Rng) {
  syncStats(p, (pos, ovr) => attrsFor(pos, ovr, rng));
}

function fromStar(clubId: string, seed: StarSeed, i: number, rng: Rng): Player {
  const club = clubById(clubId);
  const seededPotential = seed.pot ?? rollPotential(seed.ovr, seed.age, rng);
  const pot =
    club.league === "eredivisie" && seed.age < 22
      ? clamp(seededPotential, 85, 92)
      : seededPotential;
  const ovr = seed.ovr;
  // Posición siempre válida: alias viejos (LM/RM...) se traducen y si no se reconoce cae en CM.
  const pos = normalizePos(seed.pos, "CM");
  return {
    id: seed.sourceId ? `tm-${seed.sourceId}` : `${clubId}-${i}`,
    name: seed.name,
    nat: seed.nat,
    age: seed.age,
    pos,
    ovr,
    pot,
    clubId,
    value: playerValue(ovr, seed.age, pot),
    wage: playerWage(ovr, club.prestige),
    contract: seed.contract ?? rng.int(1, 4),
    form: rng.int(-1, 2),
    fitness: rng.int(88, 100),
    morale: rng.int(68, 92),
    goals: 0,
    assists: 0,
    apps: 0,
    injured: 0,
    yellows: 0,
    listed: false,
    ...statsFor(pos, ovr, rng),
    ...extras(ovr),
    loanFrom: seed.loanFrom ?? null,
    loanSeasons: seed.loanFrom ? 1 : 0,
    locked: Boolean(club.ghost),
  };
}

export function generated(
  clubId: string,
  pos: Pos,
  i: number,
  prestige: number,
  rng: Rng,
  used: Set<string>,
): Player {
  const club = clubById(clubId);
  // Nunca se genera un jugador sin posición válida (si llega vacía/inválida cae en CM).
  const position = normalizePos(pos, "CM");
  const nat = pickNat(rng, clubId, club.league, club.country);
  const name = makeName(rng, nat, used);
  const isReserve = club.name.startsWith("Jong ");
  const age = isReserve ? rng.int(17, 23) : rng.int(18, 34);
  let ovr: number;
  if (club.league === "primeraFed1" || club.league === "primeraFed2") {
    // 3.ª división española (Primera Federación): sus titulares rondan 50-62 de GRL (LaLiga Hypermotion va de ~58 a ~74). Escala con el
    // prestigio del club: ~51 de media en el más modesto (prestigio 38) y ~58 en un descendido de Segunda (prestigio 60).
    const mean = 51 + (prestige - 38) * 0.32;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 44, 64);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 44, 64);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 42, 62);
  } else if (club.league === "argentinaCuarta") {
    const mean = 47 + (prestige - 29) * 0.35;
    ovr = clamp(Math.round(mean + rng.int(-4, 4)), 40, 56);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 38, 56);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 5), 36, 54);
  } else if (club.league === "argentinaQuinta") {
    const mean = 42 + (prestige - 20) * 0.3;
    ovr = clamp(Math.round(mean + rng.int(-4, 4)), 35, 51);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 33, 51);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 5), 31, 49);
  } else if (club.league === "promocionalAmateur") {
    const mean = 37 + (prestige - 18) * 0.3;
    ovr = clamp(Math.round(mean + rng.int(-4, 4)), 30, 46);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 28, 46);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 5), 26, 44);
  } else if (club.league === "championship" || club.league === "segunda" || club.league === "rfef" || club.league === "primeraNacional" || club.league === "primeraBMetro") {
    // 2ª división (Championship / LaLiga Hypermotion): sus titulares rondan 62-73 de GRL (la Premier va de ~77 a ~92 en su once). Escala con el prestigio
    // del club: ~60 de media en el más modesto (prestigio 52) y ~70 en un recién descendido (prestigio 76).
    const mean = 60 + (prestige - 52) * 0.42;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 55, 74);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 55, 74);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 52, 72);
  } else if (club.league === "leagueOne") {
    // League One (3.ª división inglesa): sus titulares rondan 52-66 de GRL (la Championship va de ~60 a ~74). Escala con el prestigio
    // del club: ~52 de media en el más modesto (prestigio 38) y ~59 en un recién descendido (prestigio 58).
    const mean = 52 + (prestige - 38) * 0.35;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 44, 66);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 44, 66);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 42, 64);
  } else if (club.league === "leagueTwo") {
    // League Two (4.ª división inglesa): plantillas generadas por debajo de League One; los datos de jugadores 2026/27 no se presentan como oficiales.
    const mean = 47 + (prestige - 30) * 0.34;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 40, 61);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 40, 61);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 38, 59);
  } else if (club.league === "bundesliga2") {
    // 2ª división alemana: sus titulares rondan 55-66 de GRL (la Bundesliga va de ~66 a ~88 en su once). Escala con el
    // prestigio del club: ~55 de media en el más modesto (prestigio 54) y ~61 en un recién descendido (prestigio 66).
    const mean = 55 + (prestige - 54) * 0.5;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 50, 67);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 50, 67);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 48, 65);
  } else if (club.league === "bundesliga3") {
    // 3.ª división alemana (3. Liga, semiprofesional): sus titulares rondan 46-60 de GRL (la 2. Bundesliga va de ~50 a ~67). Escala con el
    // prestigio del club: ~49 de media en el más modesto (prestigio 40) y ~56 en el más grande (prestigio 55).
    const mean = 49 + (prestige - 40) * 0.45;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 44, 63);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 44, 63);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 42, 61);
  } else if (club.league === "ligue2") {
    // 2ª división francesa: sus titulares rondan 55-68 de GRL (la Ligue 1 va de ~64 a ~88 en su once). Escala con el
    // prestigio del club: ~56 de media en el más modesto (prestigio 48) y ~63 en un recién descendido (prestigio 72).
    const mean = 56 + (prestige - 48) * 0.3;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 50, 69);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 50, 69);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 48, 67);
  } else if (club.league === "ligue3") {
    const mean = 49 + (prestige - 40) * 0.35;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 42, 62);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 42, 62);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 40, 60);
  } else if (club.league === "brasileiraoB") {
    // 2ª división brasileña: sus titulares rondan 56-68 de GRL (la Série A va de ~62 a ~82 en su once). Escala con el
    // prestigio del club: ~56 de media en el más modesto (prestigio 50) y ~62 en el más grande (prestigio 67).
    const mean = 56 + (prestige - 50) * 0.35;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 50, 69);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 50, 69);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 48, 67);
  } else if (club.league === "brasileiraoC") {
    const mean = 51 + (prestige - 45) * 0.3;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 45, 64);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 45, 64);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 43, 62);
  } else if (club.league === "primeira") {
    // Primeira Liga (1ª división portuguesa): sus plantillas rondan 52-78 de GRL. Escala con el prestigio del club: ~56 de
    // media en el más modesto (prestigio 54), ~65 en un club de mitad de tabla (70) y ~73 en los tres grandes (83); el jugador
    // real cargado a mano de cada club (ver STARS) pone el techo de cada plantilla.
    const mean = 56 + (prestige - 55) * 0.6;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 52, 78);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 52, 78);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 50, 74);
  } else if (club.league === "eredivisie") {
    const mean = 54 + (prestige - 55) * 0.62;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 49, 79);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 49, 79);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 47, 75);
  } else if (club.league === "eersteDivisie") {
    const mean = 54 + (prestige - 45) * 0.45;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 48, 70);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 48, 70);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 46, 68);
  } else if (club.league === "tweedeDivisie") {
    const mean = 46 + (prestige - 39) * 0.35;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 40, 58);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 40, 58);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 38, 56);
  } else if (club.league === "mls") {
    const mean = 62 + (prestige - 65) * 0.52;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 57, 78);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 54, 76);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 52, 73);
  } else if (club.league === "uslChampionship") {
    const mean = 51 + (prestige - 47) * 0.4;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 45, 67);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 43, 65);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 41, 63);
  } else if (club.league === "saudiProLeague") {
    const mean = 57 + (prestige - 50) * 0.55;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 50, 84);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 48, 82);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 46, 79);
  } else if (club.league === "saudiFirstDivision") {
    const mean = 52 + (prestige - 39) * 0.42;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 44, 68);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 42, 66);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 40, 64);
  } else if (club.league === "primeira2") {
    // Liga Portugal 2 (2ª división portuguesa): sus titulares rondan 52-64 de GRL (la Primeira Liga va de ~54 a ~78 en su plantilla).
    // Escala con el prestigio del club: ~54 de media en el más modesto (prestigio 46) y ~60 en un recién descendido (prestigio 58).
    const mean = 54 + (prestige - 46) * 0.5;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 46, 66);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 46, 66);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 44, 64);
  } else if (club.league === "serieB") {
    // 2ª división italiana: sus titulares rondan 58-70 de GRL (la Serie A va de ~70 a ~88 en su once). Escala con el
    // prestigio del club: ~58 de media en el más modesto (prestigio 54) y ~64 en un recién descendido (prestigio 65).
    const mean = 58 + (prestige - 54) * 0.5;
    ovr = clamp(Math.round(mean + rng.int(-4, 5)), 52, 71);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 52, 71);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 50, 69);
  } else {
    const cap = Math.min(prestige - 6, club.league === "serieA" || club.league === "brasileirao" ? 82 : club.league === "argentina" ? 80 : 86);
    ovr = clamp(prestige - 12 + rng.int(-5, 4), 58, cap);
    if (age >= 32) ovr = clamp(ovr - rng.int(1, 4), 58, 84);
    if (age <= 21) ovr = clamp(ovr - rng.int(2, 6), 58, 80);
  }
  const pot =
    club.league === "eredivisie" && age < 22
      ? rng.int(85, 92)
      : rollPotential(ovr, age, rng);
  return {
    id: `${clubId}-g-${i}-${rng.int(1000, 9999)}`,
    name,
    nat,
    age,
    pos: position,
    ovr,
    pot,
    clubId,
    value: playerValue(ovr, age, pot),
    wage: playerWage(ovr, club.prestige),
    contract: rng.int(1, 5),
    form: rng.int(-2, 2),
    fitness: rng.int(84, 100),
    morale: rng.int(62, 88),
    goals: 0,
    assists: 0,
    apps: 0,
    injured: 0,
    yellows: 0,
    listed: false,
    ...statsFor(position, ovr, rng),
    ...extras(ovr),
    locked: Boolean(club.ghost),
  };
}

export function assignShirtNumbers(players: Player[]) {
  const taken = new Set<number>();
  const prefer: Record<Pos, number[]> = {
    GK: [1, 16, 30, 40, 50],
    RB: [2, 22, 12, 24],
    CB: [4, 5, 3, 6, 15, 23],
    LB: [3, 12, 19, 21],
    CDM: [6, 8, 21, 18],
    CM: [8, 10, 14, 28],
    CAM: [10, 7, 20, 11],
    RW: [7, 11, 17, 27],
    LW: [11, 7, 19, 29],
    ST: [9, 11, 19, 18, 99],
  };
  for (const p of players) {
    if (p.number >= 1 && p.number <= 99 && !taken.has(p.number)) {
      taken.add(p.number);
      continue;
    }
    const prefs = prefer[p.pos] ?? [10];
    let n = prefs.find((x) => !taken.has(x));
    if (!n) {
      n = 1;
      while (taken.has(n) && n < 99) n += 1;
    }
    p.number = n;
    taken.add(n);
  }
}

export function buildSquad(clubId: string, rng: Rng, usedNames: Set<string>): Player[] {
  const club = clubById(clubId);
  // The 2026/27 English lower-league rosters replace their legacy STARS entries.
  const seeds: StarSeed[] = [];
  const seenNames = new Set<string>();
  const seenSourceIds = new Set<string>();
  const seedPool: StarSeed[] =
    club.league === "leagueOne" || club.league === "leagueTwo"
      ? (ENGLISH_LOWER_LEAGUE_SQUADS[clubId] ?? [])
      : ITALIAN_SQUAD_SEEDS[clubId] ?? [
          ...(MANUAL_SQUADS[clubId] ?? []),
          ...(SPANISH_SQUAD_SEEDS[clubId] ?? []),
          ...(MLS_USER_SQUADS[clubId] ?? []),
          ...(USL_USER_SQUADS[clubId] ?? []),
          ...(SAUDI_LEAGUES_STARS[clubId] ?? []),
          ...(SAUDI_LOWER_LEAGUES_STARS[clubId] ?? []),
          ...(NL_LOWER_LEAGUES_STARS[clubId] ?? []),
          ...(DUTCH_YOUTH_PROSPECTS[clubId] ?? []),
          ...(NORTH_AMERICAN_YOUTH_PROSPECTS[clubId] ?? []),
          ...(SERIE_C_YOUTH_PROSPECTS[clubId] ?? []),
          ...(SERIE_D_STARS[clubId] ?? []),
          ...(SERIE_D_YOUTH_PROSPECTS[clubId] ?? []),
          ...(SOUTH_AMERICAN_YOUTH_PROSPECTS[clubId] ?? []),
          ...(STARS[clubId] ?? []),
        ];
  const usedNameKeys = seedPool.length > 0 ? normalizedUsedNames(usedNames) : null;
  for (const seed of seedPool) {
    const nameKey = seed.name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase();
    if (seed.sourceId) {
      if (seenSourceIds.has(seed.sourceId) || usedNames.has(`tm:${seed.sourceId}`)) continue;
      seenSourceIds.add(seed.sourceId);
      usedNames.add(`tm:${seed.sourceId}`);
    } else if (seenNames.has(nameKey) || usedNameKeys?.has(nameKey)) {
      continue;
    }
    seenNames.add(nameKey);
    usedNameKeys?.add(nameKey);
    seeds.push(seed);
  }
  const players: Player[] = [];
  const counts: Partial<Record<Pos, number>> = {};
  let i = 0;

  for (const seed of seeds) {
    const p = fromStar(clubId, seed, i++, rng);
    rememberUsedName(usedNames, p.name);
    players.push(p);
    counts[p.pos] = (counts[p.pos] ?? 0) + 1;
  }

  // Se completa hasta la plantilla estándar con jugadores generados al nivel del club/división.
  // Si el club no tiene ningún jugador cargado, la plantilla entera sale generada (nunca queda con 1).
  for (const slot of SQUAD_SHAPE) {
    const have = counts[slot.pos] ?? 0;
    for (let k = have; k < slot.n; k++) {
      const p = generated(clubId, slot.pos, i++, club.prestige, rng, usedNames);
      players.push(p);
      counts[slot.pos] = (counts[slot.pos] ?? 0) + 1;
    }
  }

  // Red de seguridad: ningún jugador de plantilla sale con un nombre genérico ("Jugador 7").
  for (const p of players) {
    if (/^jugador\s*\d*$/i.test(p.name.trim())) p.name = makeName(rng, p.nat, usedNames);
  }
  assignShirtNumbers(players);
  return players;
}

/** Clubes con promesas cargadas a mano (potencial pedido): la "joya oculta" aleatoria no las toca. */
const HAND_PICKED_CLUBS = new Set(["tpa_glew", "tpa_el_chasqui"]);

export function plantHiddenGems(players: Player[], rng: Rng) {
  const young = players.filter(
    (p) => !p.id.startsWith("tm-") && !HAND_PICKED_CLUBS.has(p.clubId) && p.age <= 21 && p.pot <= 78 && p.ovr <= 74,
  );
  const picks = rng.shuffle(young).slice(0, 7);
  for (const p of picks) {
    p.pot = rng.chance(0.18) ? rng.int(94, 99) : rng.int(88, 96);
    p.hiddenGem = true;
    p.value = playerValue(p.ovr, p.age, p.pot, p);
  }
  return picks;
}

/** Plantilla estándar utilizada para completar clubes incompletos. */
const SQUAD_SIZE = SQUAD_SHAPE.reduce((total, slot) => total + slot.n, 0);
const USER_SQUAD_MINIMUM = 12;

/**
 * Completa las plantillas incompletas: un club real que se quedó con menos de {@link SQUAD_SIZE} jugadores (por ejemplo, una
 * partida guardada de cuando los clubes de las ligas B tenían una plantilla provisional de 1 jugador) recibe jugadores
 * generados al nivel de su división hasta una plantilla estándar de 25, cubriendo primero los puestos que le faltan.
 * Un club sin ningún jugador se arma entero con {@link buildSquad}. Devuelve solo los jugadores NUEVOS (vacío si no
 * hacía falta nada); `userClubId` pone al club del usuario con un umbral mucho más bajo. No modifica la lista recibida salvo la numeración de camisetas de los clubes completados.
 */
export function topUpThinSquads(players: Player[], seed: number, userClubId?: string): Player[] {
  const byClub = new Map<string, Player[]>();
  for (const p of players) {
    const l = byClub.get(p.clubId);
    if (l) l.push(p);
    else byClub.set(p.clubId, [p]);
  }
  // El club del usuario solo se repara si está claramente roto (heredado de la plantilla de 1 jugador): sus bajas por
  // contratos o ventas son decisión suya y no se rellenan solas.
  const thin = CLUBS.filter(
    (c) =>
      !c.ghost &&
      (byClub.get(c.id)?.length ?? 0) <
        (c.id === userClubId ? USER_SQUAD_MINIMUM : SQUAD_SIZE),
  );
  if (!thin.length) return [];

  const rng = new Rng(seed * 31 + 7);
  const used = new Set(players.map((p) => p.name));
  const ids = new Set(players.map((p) => p.id));
  const added: Player[] = [];
  const done = new Set<string>();
  for (const club of thin) {
    if (done.has(club.id)) continue;
    done.add(club.id);
    const own = byClub.get(club.id) ?? [];
    let fresh: Player[];
    if (!own.length) {
      fresh = buildSquad(club.id, rng, used);
    } else {
      fresh = [];
      let i = own.length + 100;
      for (const slot of SQUAD_SHAPE) {
        const have = own.filter((p) => p.pos === slot.pos).length;
        for (let k = have; k < slot.n && own.length + fresh.length < SQUAD_SIZE; k++) {
          fresh.push(generated(club.id, slot.pos, i++, club.prestige, rng, used));
        }
      }
      for (let slotIndex = 0; own.length + fresh.length < SQUAD_SIZE; slotIndex++) {
        const slot = SQUAD_SHAPE[slotIndex % SQUAD_SHAPE.length]!;
        fresh.push(generated(club.id, slot.pos, i++, club.prestige, rng, used));
      }
    }
    for (const p of fresh) {
      // El id lleva un sufijo aleatorio: si choca con uno existente se reintenta con otro.
      while (ids.has(p.id)) p.id = `${p.id}x${rng.int(10, 99)}`;
      ids.add(p.id);
    }
    assignShirtNumbers([...own, ...fresh]);
    added.push(...fresh);
  }
  return added;
}
