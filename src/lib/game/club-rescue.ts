import type { ClubRescueState } from "./types";

export function createClubRescue(principal: number, termSeasons: number): ClubRescueState {
  const debt = Math.max(0, Math.round(principal));
  const term = Math.max(2, Math.min(6, Math.round(termSeasons)));
  return {
    principal: debt,
    balance: debt,
    installmentAmount: Math.ceil(debt / term),
    termSeasons: term,
    installmentsPaid: 0,
    missedPayments: 0,
    lastProcessedSeason: null,
    status: debt === 0 ? "completed" : "active",
    history: [],
  };
}

export function settleClubRescue(
  rescue: ClubRescueState | null | undefined,
  availableCash: number,
  season: number,
) {
  if (!rescue || rescue.status !== "active" || rescue.lastProcessedSeason === season) {
    return { rescue, remainingCash: availableCash, due: 0, paid: 0, missed: false, processed: false };
  }
  const next = structuredClone(rescue);
  next.lastProcessedSeason = season;
  const due = Math.min(next.balance, next.installmentAmount);
  const paid = Math.min(Math.max(0, availableCash), due);
  next.balance = Math.max(0, next.balance - paid);
  const missed = paid + 0.01 < due;
  if (missed) {
    next.missedPayments += 1;
    next.balance += Math.ceil((due - paid) * Math.min(0.2, 0.05 * next.missedPayments));
  } else {
    next.installmentsPaid += 1;
  }
  if (next.balance < 1) {
    next.balance = 0;
    next.status = "completed";
    next.installmentAmount = 0;
  } else if (!missed && next.installmentsPaid < next.termSeasons) {
    next.installmentAmount = Math.ceil(next.balance / (next.termSeasons - next.installmentsPaid));
  } else if (next.installmentsPaid >= next.termSeasons) {
    next.installmentAmount = next.balance;
  }
  next.history.push({ season, paid, balance: next.balance, missed });
  return {
    rescue: next,
    remainingCash: Math.max(0, availableCash - paid),
    due,
    paid,
    missed,
    processed: true,
  };
}
