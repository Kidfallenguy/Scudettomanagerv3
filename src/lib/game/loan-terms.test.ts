import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isValidLoanOptionPrice,
  loanOptionAskPrice,
  loanOptionCounteroffer,
  maxLoanOptionPrice,
  parseMoneyInput,
} from "./loan-terms.ts";

test("loan option prices accept common shorthand and Spanish decimals", () => {
  assert.equal(parseMoneyInput("850k"), 850_000);
  assert.equal(parseMoneyInput("1.2m"), 1_200_000);
  assert.equal(parseMoneyInput("1,2 millones"), 1_200_000);
  assert.equal(parseMoneyInput("2mm"), 2_000_000);
  assert.equal(parseMoneyInput("1250000"), 1_250_000);
  assert.equal(parseMoneyInput("-5m"), null);
  assert.equal(parseMoneyInput("1.5x"), null);
  assert.equal(parseMoneyInput("999999999999999999m"), null);
});

test("loan option prices stay within 150 percent of player value", () => {
  assert.equal(maxLoanOptionPrice(10_000_000), 15_000_000);
  assert.equal(loanOptionAskPrice(10_000_000), 12_000_000);
  assert.equal(isValidLoanOptionPrice(15_000_000, 10_000_000), true);
  assert.equal(isValidLoanOptionPrice(15_000_001, 10_000_000), false);
  assert.equal(isValidLoanOptionPrice(0, 10_000_000), false);
});

test("clubs counteroffer at market value when the offer is below it", () => {
  assert.equal(loanOptionCounteroffer(10_000_000, 9_000_000), 10_000_000);
  assert.equal(loanOptionCounteroffer(10_000_000, 10_000_000), null);
});
