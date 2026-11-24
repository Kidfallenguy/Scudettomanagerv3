export const LOAN_OPTION_MAX_VALUE_MULTIPLIER = 1.5;

const LOAN_OPTION_ASK_VALUE_MULTIPLIER = 1.2;

export function parseMoneyInput(input: string): number | null {
  const normalized = input.trim().toLowerCase().replace(/ó/g, "o");
  const match = /^(\d+(?:[.,]\d+)?)\s*(k|m|b|mil|mm|millon(?:es)?)?$/.exec(
    normalized,
  );
  if (!match) return null;

  const amount = Number(match[1]!.replace(",", "."));
  const multipliers: Record<string, number> = {
    "": 1,
    k: 1_000,
    mil: 1_000,
    m: 1_000_000,
    mm: 1_000_000,
    millon: 1_000_000,
    millones: 1_000_000,
    b: 1_000_000_000,
  };
  const multiplier = multipliers[match[2] ?? ""] ?? 1;
  const result = Math.round(amount * multiplier);
  return Number.isSafeInteger(result) ? result : null;
}

export function maxLoanOptionPrice(playerValue: number): number {
  if (!Number.isFinite(playerValue) || playerValue <= 0) return 0;
  return Math.round(playerValue * LOAN_OPTION_MAX_VALUE_MULTIPLIER);
}

export function loanOptionAskPrice(playerValue: number): number {
  if (!Number.isFinite(playerValue) || playerValue <= 0) return 0;
  return Math.min(
    maxLoanOptionPrice(playerValue),
    Math.round(playerValue * LOAN_OPTION_ASK_VALUE_MULTIPLIER),
  );
}

export function isValidLoanOptionPrice(
  price: number,
  playerValue: number,
): boolean {
  return (
    Number.isFinite(price) &&
    price > 0 &&
    price <= maxLoanOptionPrice(playerValue)
  );
}

export function loanOptionCounteroffer(
  playerValue: number,
  offer: number,
): number | null {
  return offer >= playerValue ? null : Math.round(playerValue);
}
