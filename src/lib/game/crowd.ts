import { classicBetween } from "./board";
import { COMP_THEME, finalRoundOf, leaguePhaseRounds } from "./competitions";
import type { Competition, Fixture, LeagueKind } from "./types";

/**
 * Ambiente de la hinchada en "Ver partido".
 *  - 0: partido normal.
 *  - 1: partido importante (semifinal, cruce decisivo de copa, derbi local).
 *  - 2: clásico grande o final (bengalas, humo y tifos en las dos tribunas).
 */
export type AtmosphereLevel = 0 | 1 | 2;

export interface Atmosphere {
  level: AtmosphereLevel;
  /** Nombre del clásico, "Final", "Semifinal"… o null si es un partido normal. */
  tag: string | null;
}

const MINOR_CUPS: Competition[] = ["supercoppa", "carabao", "trofeo", "mundial", "intercontinental", "transatlantica"];
const GROUP_COMPS: Competition[] = ["ucl", "uel", "uecl", "libertadores"];

/** Eliminatoria directa: en las copas con fase de liga/grupos, solo después de esa fase. */
function isKnockoutRound(f: Fixture): boolean {
  if (GROUP_COMPS.includes(f.competition)) return f.round > leaguePhaseRounds(f.competition);
  return true;
}

/** Qué tan caliente está el partido: decide si la hinchada trae bengalas, humo y tifos. */
export function matchAtmosphere(fixture: Fixture | undefined, userLeague: LeagueKind): Atmosphere {
  if (!fixture) return { level: 0, tag: null };
  const classic = classicBetween(fixture.homeId, fixture.awayId);
  const final = finalRoundOf(fixture.competition, userLeague);
  const label = COMP_THEME[fixture.competition].short;

  // Finales: siempre el máximo ambiente (también las copas menores).
  if (final !== null && fixture.round === final) {
    return { level: 2, tag: classic ? `${classic.name} · Final` : `Final · ${label}` };
  }
  // Los clásicos grandes (Superclásico, Clásico, Derby della Madonnina…).
  if (classic && classic.tier === 2) return { level: 2, tag: classic.name };

  const minor = MINOR_CUPS.includes(fixture.competition);
  if (final !== null && !minor && fixture.round === final - 1 && isKnockoutRound(fixture)) {
    return { level: 1, tag: `Semifinal · ${label}` };
  }
  if (classic) return { level: 1, tag: classic.name };
  // Cuartos de final continentales: ya se juega a todo o nada.
  if (final !== null && GROUP_COMPS.includes(fixture.competition) && isKnockoutRound(fixture) && fixture.round >= final - 2) {
    return { level: 1, tag: `Cuartos · ${label}` };
  }
  return { level: 0, tag: null };
}

/** Semilla estable por partido: la misma hinchada se ve igual si se vuelve a renderizar la pantalla. */
export function crowdSeed(fixtureId: string, homeId: string, awayId: string): number {
  let h = 2166136261;
  for (const ch of `${fixtureId}|${homeId}|${awayId}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
