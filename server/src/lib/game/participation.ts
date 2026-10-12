import { clubById, domesticCompetition } from "./clubs";
import { UCL_DIRECT_SPOTS, UCL_PLAYOFF_SPOTS, UECL_DIRECT_SPOTS, UECL_PLAYOFF_SPOTS, UEL_DIRECT_SPOTS, UEL_PLAYOFF_SPOTS, leaguePhaseRounds } from "./competitions";
import type { Competition, GameSave } from "./types";
import { resolveDrawWinner, sortTable, tieWinner, trofeoPair } from "./world";

/**
 * "in"   → el club del usuario participa y sigue con vida.
 * "out"  → participó pero ya fue eliminado.
 * "none" → nunca clasificó a esa competición.
 */
export type CompStatus = "in" | "out" | "none";


function involvesUser(save: GameSave, homeId: string, awayId: string) {
  return homeId === save.clubId || awayId === save.clubId;
}

function isParticipant(save: GameSave, comp: Competition): boolean {
  switch (comp) {
    case "ucl":
      return (save.uclGroups ?? []).some((g) => g.includes(save.clubId));
    case "libertadores":
      return (save.libGroups ?? []).some((g) => g.includes(save.clubId));
    case "uel":
      return (save.uelTeams ?? []).includes(save.clubId);
    case "uecl":
      return (save.ueclTeams ?? []).includes(save.clubId);
    case "sudamericana":
      return (save.sudTeams ?? []).includes(save.clubId);
    case "trofeo": {
      if (save.fixtures.some((f) => f.competition === "trofeo")) {
        return save.fixtures.some((f) => f.competition === "trofeo" && involvesUser(save, f.homeId, f.awayId));
      }
      // Todavía sin cruce: el usuario participa si es campeón de alguna rueda (solo se sabe al terminar la liga).
      return (trofeoPair(save) ?? ([] as string[])).includes(save.clubId);
    }
    default:
      return save.fixtures.some((f) => f.competition === comp && involvesUser(save, f.homeId, f.awayId));
  }
}

/** Grupos (o tabla única) y clasificación de las competiciones con fase de liga/grupos. */
function phaseTables(save: GameSave, comp: Competition) {
  if (comp === "ucl") return { groups: save.uclGroups, standings: save.uclStandings };
  if (comp === "uel") return { groups: [save.uelTeams ?? []], standings: save.uelStandings };
  if (comp === "uecl") return { groups: [save.ueclTeams ?? []], standings: save.ueclStandings };
  return { groups: save.libGroups, standings: save.libStandings };
}

/** ¿Ya se jugaron todos los partidos de la fase de liga/grupos del usuario? (Champions, Europa League y Libertadores) */
export function groupStageFinished(save: GameSave, comp: Competition): boolean {
  const groupRounds = leaguePhaseRounds(comp);
  if (!groupRounds) return false;
  const { groups, standings } = phaseTables(save, comp);
  const group = (groups ?? []).find((g) => g.includes(save.clubId));
  if (!group) return false;
  const rows = (standings ?? []).filter((r) => group.includes(r.clubId));
  return rows.length > 0 && rows.every((r) => r.played >= groupRounds);
}

/** ¿Quedó fuera en la fase de grupos? (Champions y Europa League: fase de liga; Libertadores: grupos) */
function eliminatedInGroups(save: GameSave, comp: Competition): boolean {
  const groupRounds = leaguePhaseRounds(comp);
  if (!groupRounds) return false;
  const { groups, standings } = phaseTables(save, comp);
  const group = (groups ?? []).find((g) => g.includes(save.clubId));
  if (!group) return false;
  const rows = (standings ?? []).filter((r) => group.includes(r.clubId));
  if (rows.length === 0 || rows.some((r) => r.played < groupRounds)) return false;
  const place = sortTable(rows).findIndex((r) => r.clubId === save.clubId);
  // Champions y Europa League (fase de liga): del 25.º al 36.º quedan eliminados; del 9.º al 24.º juegan el playoff.
  if (comp === "ucl") return place >= UCL_PLAYOFF_SPOTS;
  if (comp === "uel") return place >= UEL_PLAYOFF_SPOTS;
  if (comp === "uecl") return place >= UECL_PLAYOFF_SPOTS;
  return place >= 2;
}

/** Posición final del usuario en la fase de liga de la Champions (1-based) o null si todavía no terminó. */
export function uclLeaguePlace(save: GameSave): number | null {
  if (!groupStageFinished(save, "ucl")) return null;
  const group = (save.uclGroups ?? []).find((g) => g.includes(save.clubId));
  if (!group) return null;
  const i = sortTable((save.uclStandings ?? []).filter((r) => group.includes(r.clubId))).findIndex(
    (r) => r.clubId === save.clubId,
  );
  return i >= 0 ? i + 1 : null;
}

/** ¿Clasificó directo a Octavos (top 8 de la fase de liga)? */
export function uclDirectToR16(save: GameSave): boolean {
  const p = uclLeaguePlace(save);
  return p !== null && p <= UCL_DIRECT_SPOTS;
}

/** Posición final del usuario en la fase de liga de la Europa League (1-based) o null si todavía no terminó. */
export function uelLeaguePlace(save: GameSave): number | null {
  if (!groupStageFinished(save, "uel")) return null;
  const teams = save.uelTeams ?? [];
  if (!teams.includes(save.clubId)) return null;
  const i = sortTable((save.uelStandings ?? []).filter((r) => teams.includes(r.clubId))).findIndex(
    (r) => r.clubId === save.clubId,
  );
  return i >= 0 ? i + 1 : null;
}

/** ¿Clasificó directo a Octavos de la Europa League (top 8 de la fase de liga)? */
export function uelDirectToR16(save: GameSave): boolean {
  const p = uelLeaguePlace(save);
  return p !== null && p <= UEL_DIRECT_SPOTS;
}

/** Posición final del usuario en la fase de liga de la Conference League (1-based) o null si todavía no terminó. */
export function ueclLeaguePlace(save: GameSave): number | null {
  if (!groupStageFinished(save, "uecl")) return null;
  const teams = save.ueclTeams ?? [];
  if (!teams.includes(save.clubId)) return null;
  const i = sortTable((save.ueclStandings ?? []).filter((r) => teams.includes(r.clubId))).findIndex(
    (r) => r.clubId === save.clubId,
  );
  return i >= 0 ? i + 1 : null;
}

/** ¿Clasificó directo a Octavos de la Conference League (top 8 de la fase de liga)? */
export function ueclDirectToR16(save: GameSave): boolean {
  const p = ueclLeaguePlace(save);
  return p !== null && p <= UECL_DIRECT_SPOTS;
}

/** ¿Perdió algún cruce de eliminación directa ya definido? */
function eliminatedInKnockout(save: GameSave, comp: Competition): boolean {
  const groupRounds = leaguePhaseRounds(comp);
  const mine = save.fixtures.filter(
    (f) => f.competition === comp && f.played && f.round > groupRounds && involvesUser(save, f.homeId, f.awayId),
  );
  for (const f of mine) {
    if (f.tieId) {
      const w = tieWinner(save, f.tieId);
      if (w && w !== save.clubId) return true;
    } else if (resolveDrawWinner(f, save.seed) !== save.clubId) {
      return true;
    }
  }
  return false;
}

export function userCompStatus(save: GameSave, comp: Competition): CompStatus {
  // La liga local siempre se juega; las ligas de otros países nunca.
  if (comp === domesticCompetition(clubById(save.clubId).league)) return "in";
  if (!isParticipant(save, comp)) return "none";
  if (eliminatedInGroups(save, comp) || eliminatedInKnockout(save, comp)) return "out";
  return "in";
}

/** Atajo: ¿puede el usuario todavía jugar partidos de esta competición? */
export function userStillIn(save: GameSave, comp: Competition): boolean {
  return userCompStatus(save, comp) === "in";
}
