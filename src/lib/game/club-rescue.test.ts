import assert from "node:assert/strict";
import test from "node:test";
import { createClubRescue, settleClubRescue } from "./club-rescue.ts";

test("a rescue installment is paid once per season and reaches completion", () => {
  let rescue = createClubRescue(1_200, 3);
  for (const season of [2026, 2027, 2028]) {
    const payment = settleClubRescue(rescue, 500, season);
    assert.equal(payment.processed, true);
    rescue = payment.rescue!;
    assert.equal(payment.paid, 400);
  }
  assert.equal(rescue.balance, 0);
  assert.equal(rescue.status, "completed");
  assert.equal(rescue.history.length, 3);

  const repeated = settleClubRescue(rescue, 500, 2028);
  assert.equal(repeated.processed, false);
  assert.equal(repeated.rescue?.history.length, 3);
});

test("missed rescue installments accrue progressive fees without consuming unavailable cash", () => {
  let rescue = createClubRescue(1_200, 3);
  const first = settleClubRescue(rescue, 0, 2026);
  assert.equal(first.paid, 0);
  assert.equal(first.remainingCash, 0);
  assert.equal(first.missed, true);
  assert.equal(first.rescue?.balance, 1_220);

  rescue = first.rescue!;
  const second = settleClubRescue(rescue, 0, 2027);
  assert.equal(second.rescue?.missedPayments, 2);
  assert.ok(second.rescue!.balance > first.rescue!.balance);
});
