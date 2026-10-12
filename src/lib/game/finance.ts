import { CLUBS, clubById, clubRating, isSecondDivisionClub } from "./clubs";
import { hash01 } from "./contracts";
import { clamp } from "./format";
import type { ClubFinance, ClubId, GameSave, Player, TransferRecord } from "./types";

/** Id reservado para jugadores sin club (se repite aquí para no depender de free-agents). */
export const NO_CLUB = "FA";

const LOG_CAP = 600;

/** Versión del reajuste económico de las ligas B (ver ensureFinance). */
const FIN_VERSION = 2;

/** Presupuesto base de fichajes: los grandes manejan mucho más que los modestos. */
export function baseTransferBudget(clubId: ClubId): number {
  const c = clubById(clubId);
  const jitter = 0.85 + hash01(`${clubId}:fin`) * 0.3;
  const raw = 4_000_000 * Math.pow(1.125, c.prestige - 60) * jitter;
  // Ligas B: sus jugadores se valoran casi como los de Primera (valor medio de 7-16 M) y el presupuesto de antes (1-3 M)
  // no alcanzaba para fichar a nadie, así que ningún club de segunda compraba. Ahora un club de liga B puede pagar un
  // titular de su nivel, y siguen quedando muy por debajo de los clubes de Primera (el último de la Premier ronda los 10 M).
  if (c.league === "championship" || c.league === "segunda" || c.league === "rfef" || c.league === "primeraNacional") {
    return Math.round(clamp(raw * 1.4, 3_000_000, 14_000_000));
  }
  if (c.league === "primeraBMetro") return Math.round(clamp(raw * 1.3, 300_000, 1_800_000));
  if (c.league === "argentinaCuarta") return Math.round(clamp(raw * 1.15, 100_000, 700_000));
  if (c.league === "argentinaQuinta") return Math.round(clamp(raw, 35_000, 180_000));
  if (c.league === "promocionalAmateur") return Math.round(clamp(raw * 0.8, 20_000, 120_000));
  // Primera Federación (3.ª división española, semiprofesional): presupuestos de fichajes modestos (0,25-1,8 M por club).
  if (c.league === "primeraFed1" || c.league === "primeraFed2") {
    return Math.round(clamp(raw * 1.3, 250_000, 1_800_000));
  }
  if (c.league === "ligue3") {
    return Math.round(clamp(raw * 1.3, 250_000, 1_800_000));
  }
  if (c.league === "serieB" || c.league === "bundesliga2" || c.league === "ligue2" || c.league === "brasileiraoB" || c.league === "brasileiraoC") {
    return Math.round(clamp(raw * 1.4, 2_500_000, 9_000_000));
  }
  // Liga Portugal 2: la segunda portuguesa maneja menos de la mitad que la Primeira Liga (1-5 M por club).
  // League One: la 3.ª división inglesa maneja bastante menos que la Championship (0,6-3,5 M por club).
  if (c.league === "leagueOne") {
    return Math.round(clamp(raw * 1.3, 600_000, 3_500_000));
  }
  if (c.league === "leagueTwo") {
    return Math.round(clamp(raw * 1.15, 300_000, 1_800_000));
  }
  if (c.league === "primeira2") {
    return Math.round(clamp(raw * 1.3, 1_000_000, 5_000_000));
  }
  // 3. Liga (3.ª división alemana, semiprofesional): presupuestos de fichajes modestos (0,5-2,5 M por club).
  if (c.league === "bundesliga3") {
    return Math.round(clamp(raw * 1.3, 500_000, 2_500_000));
  }
  // Primeira Liga: los clubes portugueses mueven bastante menos dinero que los de las cinco grandes ligas (los 3 grandes ~40 M, los modestos 1,5-5 M).
  if (c.league === "primeira") {
    return Math.round(clamp(raw * 0.7, 1_500_000, 45_000_000));
  }
  if (c.league === "eredivisie") {
    return Math.round(clamp(raw * 0.75, 1_500_000, 42_000_000));
  }
  if (c.league === "eersteDivisie") {
    return Math.round(clamp(raw * 1.1, 750_000, 12_000_000));
  }
  if (c.league === "tweedeDivisie") {
    return Math.round(clamp(raw * 0.8, 150_000, 2_000_000));
  }
  if (c.league === "mls") {
    return Math.round(clamp(raw * 0.8, 1_500_000, 42_000_000));
  }
  if (c.league === "uslChampionship") {
    return Math.round(clamp(raw * 1.1, 300_000, 7_000_000));
  }
  if (c.league === "saudiProLeague") {
    return Math.round(clamp(raw * 1.2, 3_000_000, 90_000_000));
  }
  if (c.league === "saudiFirstDivision") {
    return Math.round(clamp(raw * 0.8, 500_000, 15_000_000));
  }
  return Math.round(raw);
}

export function payroll(save: GameSave, clubId: ClubId): number {
  let total = 0;
  for (const p of save.players) if (p.clubId === clubId) total += p.wage;
  return total;
}

function wageCapFor(save: GameSave, clubId: ClubId, currentPayroll = payroll(save, clubId)): number {
  const c = clubById(clubId);
  // Ligas B: más margen salarial (≈8-13 %), porque con el 3 % de antes ni un solo fichaje de su nivel les cabía.
  const slack = isSecondDivisionClub(c)
    ? 1.08 + clamp((clubRating(c) - 60) / 25, 0, 1) * 0.05
    : 1.03 + clamp((c.prestige - 64) / 23, 0, 1) * 0.08;
  return Math.round(currentPayroll * slack);
}

/** Crea (si falta) la ficha financiera de cada club de la IA. */
export function ensureFinance(save: GameSave) {
  if (!save.clubFinance) save.clubFinance = {};
  let payrollByClub: Map<ClubId, number> | undefined;
  const currentPayroll = (clubId: ClubId) => {
    if (!payrollByClub) {
      payrollByClub = new Map();
      for (const player of save.players) {
        payrollByClub.set(
          player.clubId,
          (payrollByClub.get(player.clubId) ?? 0) + player.wage,
        );
      }
    }
    return payrollByClub.get(clubId) ?? 0;
  };
  for (const c of CLUBS) {
    if (c.ghost || c.id === save.clubId) continue;
    if (!save.clubFinance[c.id]) {
      save.clubFinance[c.id] = {
        budget: baseTransferBudget(c.id),
        wageCap: wageCapFor(save, c.id, currentPayroll(c.id)),
      };
    }
  }
  // Partidas anteriores al arreglo de las ligas B: sus clubes tenían caja y margen salarial minúsculos y la IA de
  // mercado no podía mover a nadie. Se repone una sola vez (sin tocar a los clubes de Primera ni al del usuario).
  if ((save.finVersion ?? 0) < FIN_VERSION) {
    for (const c of CLUBS) {
      if (c.ghost || c.id === save.clubId || !isSecondDivisionClub(c)) continue;
      const f = save.clubFinance[c.id];
      if (!f) continue;
      f.budget = Math.max(f.budget, Math.round(baseTransferBudget(c.id) * 0.7));
      f.wageCap = Math.max(f.wageCap, wageCapFor(save, c.id, currentPayroll(c.id)));
    }
    save.finVersion = FIN_VERSION;
  }
}

export function financeOf(save: GameSave, clubId: ClubId): ClubFinance {
  if (!save.clubFinance) save.clubFinance = {};
  let f = save.clubFinance[clubId];
  if (!f) {
    f = { budget: baseTransferBudget(clubId), wageCap: wageCapFor(save, clubId) };
    save.clubFinance[clubId] = f;
  }
  return f;
}

/** Cuánto salario semanal extra puede asumir el club. */
export function wageRoom(save: GameSave, clubId: ClubId): number {
  return financeOf(save, clubId).wageCap - payroll(save, clubId);
}

/** Mueve dinero entre clubes. El usuario usa `save.budget`; la IA, su ficha financiera. */
export function creditClub(save: GameSave, clubId: ClubId, amount: number) {
  if (clubId === save.clubId) save.budget += amount;
  else if (clubId !== NO_CLUB && !clubById(clubId).ghost) financeOf(save, clubId).budget += amount;
}

export function canAfford(save: GameSave, clubId: ClubId, amount: number): boolean {
  if (clubId === save.clubId) return save.budget >= amount;
  if (clubById(clubId).ghost) return true;
  return financeOf(save, clubId).budget >= amount;
}

export function logTransfer(
  save: GameSave,
  p: Pick<Player, "id" | "name" | "pos" | "ovr">,
  fromId: ClubId,
  toId: ClubId,
  kind: TransferRecord["kind"],
  fee: number,
) {
  if (!save.transferLog) save.transferLog = [];
  save.transferLog.unshift({
    id: `t-${Math.random().toString(36).slice(2, 9)}`,
    season: save.season,
    week: save.week,
    playerId: p.id,
    name: p.name,
    pos: p.pos,
    ovr: p.ovr,
    fromId,
    toId,
    kind,
    fee,
    user: fromId === save.clubId || toId === save.clubId || undefined,
  });
  if (save.transferLog.length > LOG_CAP) save.transferLog.length = LOG_CAP;
}

/** Al empezar la temporada: ingresos nuevos y masa salarial recalculada. */
export function rolloverFinance(save: GameSave) {
  ensureFinance(save);
  for (const c of CLUBS) {
    if (c.ghost || c.id === save.clubId) continue;
    const base = baseTransferBudget(c.id);
    const f = financeOf(save, c.id);
    f.budget = Math.round(clamp(f.budget + base * 0.35, base * 0.3, base * 1.6));
    f.wageCap = Math.max(wageCapFor(save, c.id), Math.round(f.wageCap * 0.98));
  }
}
