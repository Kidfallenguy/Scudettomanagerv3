import assert from "node:assert/strict";
import { test } from "node:test";
import { clubById } from "./clubs";
import { buyStadiumUpgrade, closeStadiumSeason, createStadiumState, recordStadiumMatch, stadiumFor, stadiumUpgradeQuote } from "./stadium";
import { createCareer } from "./world";

test("taquilla usa la demanda real, respeta aforo y se registra una sola vez", () => {
  const save = createCareer("int", 41);
  const fixture = save.fixtures.find((match) => match.homeId === save.clubId)!;
  const state = createStadiumState(clubById(save.clubId), save.season);
  save.stadiums = { [save.clubId]: state };

  const record = recordStadiumMatch(save, fixture);

  assert.ok(record);
  assert.ok(record.attendance >= 0 && record.attendance <= state.capacity);
  assert.equal(record.revenue, Math.round(record.attendance * state.ticketPrice));
  assert.equal(recordStadiumMatch(save, fixture), null);
  assert.equal(stadiumFor(save).seasonHomeGames, 1);
  assert.equal(stadiumFor(save).seasonRevenue, record.revenue);
  assert.equal(recordStadiumMatch(save, { ...fixture, homeId: "other-club" }), null);

  const expensiveSave = {
    ...save,
    stadiums: { [save.clubId]: { ...state, ticketPrice: state.baseTicketPrice * 2 } },
  };
  const expensiveRecord = recordStadiumMatch(expensiveSave, fixture);
  assert.ok(expensiveRecord);
  assert.ok(expensiveRecord.attendance < record.attendance);
});

test("las obras cuestan, respetan el presupuesto y no superan el límite de aforo", () => {
  const save = createCareer("int", 42);
  const club = clubById(save.clubId);
  const stadium = createStadiumState(club, save.season);
  const quote = stadiumUpgradeQuote(stadium, club, "small");
  const denied = buyStadiumUpgrade(stadium, club, "small", quote.cost - 1);

  assert.equal(denied.ok, false);
  assert.equal(stadium.capacity, club.capacity);

  const approved = buyStadiumUpgrade(stadium, club, "small", quote.cost);
  if (!approved.ok) throw new Error("La ampliación financiada debería completarse.");
  assert.equal(approved.state.capacity, quote.finalCapacity);
  assert.equal(approved.cost, quote.cost);

  const full = { ...stadium, capacity: 200_000 };
  assert.equal(stadiumUpgradeQuote(full, club, "massive").maxed, true);
});

test("las mejoras elevan sus variables y el cierre conserva el resumen de temporada", () => {
  const save = createCareer("int", 43);
  const club = clubById(save.clubId);
  const stadium = createStadiumState(club, save.season);
  const improvement = buyStadiumUpgrade(stadium, club, "comfort", 10_000_000);

  if (!improvement.ok) throw new Error("La mejora financiada debería completarse.");
  assert.equal(improvement.state.comfort, 1);

  save.stadiums = { [save.clubId]: { ...improvement.state, seasonHomeGames: 2, seasonAttendance: 8000, seasonRevenue: 60_000 } };
  closeStadiumSeason(save, save.season + 1);

  const nextSeason = stadiumFor(save);
  assert.equal(nextSeason.season, save.season + 1);
  assert.equal(nextSeason.seasonHomeGames, 0);
  assert.equal(nextSeason.history.at(-1)?.attendance, 8000);
  assert.equal(nextSeason.history.at(-1)?.revenue, 60_000);
  assert.equal(nextSeason.comfort, 1);
});
