import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hasAwardClubEligibility,
  meetsAwardPerformanceThreshold,
} from "./award-selection-rules.ts";

test("Kopa and Golden Glove club eligibility requires a title in the top two tiers", () => {
  assert.equal(hasAwardClubEligibility("premier", 1), true);
  assert.equal(hasAwardClubEligibility("championship", 1), true);
  assert.equal(hasAwardClubEligibility("serieA", 1), true);
  assert.equal(hasAwardClubEligibility("serieB", 1), true);
  assert.equal(hasAwardClubEligibility("serieC", 1), false);
  assert.equal(hasAwardClubEligibility("leagueOne", 1), false);
  assert.equal(hasAwardClubEligibility("premier", 0), false);
});

test("award nominees need enough appearances and measurable season performance", () => {
  assert.equal(meetsAwardPerformanceThreshold(20, 10, 4), true);
  assert.equal(meetsAwardPerformanceThreshold(9, 10, 10), false);
  assert.equal(meetsAwardPerformanceThreshold(20, 10, 3.99), false);
  assert.equal(meetsAwardPerformanceThreshold(20, 10, Number.NaN), false);
});
