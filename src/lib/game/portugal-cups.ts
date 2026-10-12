import { clubById } from "./clubs";
import { PORTUGUESE_LEAGUE_CUP_LABEL, carabaoFinalRound, coppaFinalRound, isPortugueseLeague, supercoppaFinalRound } from "./competitions";
import { penaltySuffix } from "./knockout";
import type { Competition, GameSave } from "./types";
import { resolveDrawWinner, sortTable } from "./world";

/**
 * Resumen de campeones de Portugal para el cierre de temporada y el historial: Primeira Liga, Liga Portugal 2,
 * Taça de Portugal, Taça da Liga y Supertaça (campeón, finalista y resultado de la final). Solo se arma cuando el club
 * del usuario es portugués; los premios económicos del usuario quedan en `careerTrophies`.
 */
export interface PortugueseSeasonResult {
  id: string;
  kind: "league" | "cup";
  label: string;
  championId: string;
  runnerUpId: string | null;
  /** Resultado de la final, ej. "BEN 2–1 SCP (4–3 pen.)" (solo en las copas). */
  score: string | null;
}

function cupResult(save: GameSave, id: string, label: string, comp: Competition, round: number): PortugueseSeasonResult | null {
  const f = save.fixtures.find((x) => x.competition === comp && x.round === round && x.played);
  if (!f) return null;
  const championId = resolveDrawWinner(f, save.seed);
  const runnerUpId = championId === f.homeId ? f.awayId : f.homeId;
  const score = `${clubById(f.homeId).short} ${f.homeGoals ?? 0}–${f.awayGoals ?? 0} ${clubById(f.awayId).short}${penaltySuffix(f)}`;
  return { id, kind: "cup", label, championId, runnerUpId, score };
}

export function portugueseSeasonSummary(save: GameSave): PortugueseSeasonResult[] {
  const league = clubById(save.clubId).league;
  if (!isPortugueseLeague(league)) return [];
  const out: PortugueseSeasonResult[] = [];
  const tables: Array<[string, string, "primeira" | "primeira2"]> = [
    ["primeira", "Primeira Liga", "primeira"],
    ["primeira2", "Liga Portugal 2", "primeira2"],
  ];
  for (const [id, label, key] of tables) {
    const t = sortTable(save.leagueTables?.[key] ?? []);
    if (t[0] && t[0].played > 0) {
      out.push({ id, kind: "league", label, championId: t[0].clubId, runnerUpId: t[1]?.clubId ?? null, score: null });
    }
  }
  const cups = [
    cupResult(save, "coppa", "Taça de Portugal", "coppa", coppaFinalRound(league)),
    cupResult(save, "carabao", PORTUGUESE_LEAGUE_CUP_LABEL, "carabao", carabaoFinalRound()),
    cupResult(save, "supercoppa", "Supertaça Cândido de Oliveira", "supercoppa", supercoppaFinalRound(league)),
  ];
  for (const c of cups) if (c) out.push(c);
  return out;
}
