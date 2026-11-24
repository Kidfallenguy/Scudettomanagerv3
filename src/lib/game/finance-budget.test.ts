import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { startingBudget } from "./clubs.ts";
import { seasonBudgetGrant } from "./finance.ts";
import { prizeForPlace } from "./world.ts";

describe("presupuestos de ligas inferiores", () => {
  it("reduce el presupuesto inicial progresivamente según baja la categoría", () => {
    const prestige = 60;

    assert.ok(startingBudget(prestige, "championship") < startingBudget(prestige, "premier"));
    assert.ok(startingBudget(prestige, "leagueOne") < startingBudget(prestige, "championship"));
    assert.ok(startingBudget(prestige, "leagueTwo") < startingBudget(prestige, "leagueOne"));
    assert.ok(startingBudget(prestige, "serieB") < startingBudget(prestige, "serieA"));
    assert.ok(startingBudget(prestige, "serieC") < startingBudget(prestige, "serieB"));
    assert.ok(startingBudget(prestige, "serieD") < startingBudget(prestige, "serieC"));
  });

  it("limita la ayuda fija anual de las divisiones B e inferiores", () => {
    assert.equal(seasonBudgetGrant("championship"), 1_250_000);
    assert.equal(seasonBudgetGrant("leagueOne"), 500_000);
    assert.equal(seasonBudgetGrant("leagueTwo"), 200_000);
    assert.equal(seasonBudgetGrant("serieB"), 750_000);
    assert.equal(seasonBudgetGrant("serieC"), 250_000);
    assert.equal(seasonBudgetGrant("serieD"), 75_000);
    assert.equal(seasonBudgetGrant("promocionalAmateur"), 10_000);
  });

  it("paga premios de cada división inferior en vez de usar la tabla de Serie A", () => {
    assert.equal(prizeForPlace(0, "serieC"), 900_000);
    assert.equal(prizeForPlace(19, "serieC"), 40_000);
    assert.equal(prizeForPlace(0, "serieD"), 200_000);
    assert.equal(prizeForPlace(0, "leagueTwo"), 1_200_000);
    assert.equal(prizeForPlace(23, "leagueTwo"), 35_000);
    assert.ok(prizeForPlace(0, "serieC") < prizeForPlace(0, "serieB"));
    assert.ok(prizeForPlace(0, "serieD") < prizeForPlace(0, "serieC"));
  });
});
