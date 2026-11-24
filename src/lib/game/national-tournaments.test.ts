import assert from "node:assert/strict";
import test from "node:test";
import {
  NATIONAL_TEAM_BY_ID,
  nationalApplicationChance,
  nationalOffers,
  nationalTournamentsForSeason,
} from "./national.ts";

test("2027 creates complete African, Asian and Gold Cup group formats", () => {
  const tournaments = nationalTournamentsForSeason(2027, 42, []);

  assert.deepEqual(
    tournaments.map((tournament) => tournament.id).sort(),
    ["afcon", "asianCup", "goldCup", "nationsLeague"],
  );
  for (const tournament of tournaments) {
    assert.equal(tournament.teams.length, 16 + tournament.bestThirds * 2);
    assert.equal(tournament.groups.length, tournament.teams.length / 4);
    assert.ok(tournament.groups.every((group) => group.length === 4));
    assert.equal(new Set(tournament.teams).size, tournament.teams.length);
    assert.ok(tournament.teams.every((id) => NATIONAL_TEAM_BY_ID.has(id)));
  }
});

test("2028 uses 24-team Euro and 16-team Copa America formats", () => {
  const tournaments = nationalTournamentsForSeason(2028, 42, []);
  const euro = tournaments.find((tournament) => tournament.id === "euro");
  const america = tournaments.find(
    (tournament) => tournament.id === "copaAmerica",
  );

  assert.equal(euro?.teams.length, 24);
  assert.equal(euro?.groups.length, 6);
  assert.equal(
    (euro?.groups.length ?? 0) * (euro?.qualifiersPerGroup ?? 0) +
      (euro?.bestThirds ?? 0),
    16,
  );
  assert.equal(america?.teams.length, 16);
  assert.equal(america?.groups.length, 4);
  assert.equal(
    new Set(america?.teams.map((id) => NATIONAL_TEAM_BY_ID.get(id)?.confederation))
      .size,
    2,
  );
});

test("national tournament draws remain deterministic for a save seed", () => {
  const first = nationalTournamentsForSeason(2028, 73, []);
  const second = nationalTournamentsForSeason(2028, 73, []);

  assert.deepEqual(first, second);
});

test("national job offers are capped by manager rating", () => {
  const developing = nationalOffers(25, 2027);
  const elite = nationalOffers(95, 2027);

  assert.ok(developing.length > 0);
  assert.ok(elite.length > 0);
  assert.ok(
    developing.every(
      (offer) => offer.rating <= Math.max(55, 35 + 25 * 0.62) + 4,
    ),
  );
  assert.ok(
    elite.every(
      (offer) => offer.rating <= Math.min(94, 35 + 95 * 0.62) + 4,
    ),
  );
  assert.ok(
    Math.max(...elite.map((offer) => offer.rating)) >
      Math.max(...developing.map((offer) => offer.rating)),
  );
});

test("federation acceptance chances improve with manager rating", () => {
  const weakerManager = nationalApplicationChance(45, 80);
  const strongerManager = nationalApplicationChance(80, 80);

  assert.ok(weakerManager > 0);
  assert.ok(weakerManager < strongerManager);
  assert.ok(strongerManager < 1);
});
