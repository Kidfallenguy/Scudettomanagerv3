import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createPressConference, normalizePressConference, settlePressPromises } from "./press.ts";
import type { MatchResult } from "./types.ts";

function context(
  pressFrequency: "every" | "important" | "off" = "every",
  title = "Jornada 4",
  competition: "premier" | "coppa" = "premier",
): Parameters<typeof createPressConference>[0] {
  return {
    clubId: "mci",
    season: 2026,
    week: 3,
    pressFrequency,
    fixtures: [{
      id: "match-1",
      competition,
      round: 4,
      homeId: "mci",
      awayId: "ars",
      played: true,
      homeGoals: 2,
      awayGoals: 1,
    }],
    calendar: [{
      id: "slot-1",
      competition,
      round: 4,
      title,
      fixtures: ["match-1"],
    }],
    players: [],
    pressHistory: [],
  };
}

function result(homeGoals: number, awayGoals: number): MatchResult {
  return {
    fixtureId: "match-1",
    homeId: "mci",
    awayId: "ars",
    homeGoals,
    awayGoals,
    events: [],
    homeStats: { shots: 8, onTarget: 4, possession: 52, corners: 3, fouls: 8, yellows: 1, reds: 0 },
    awayStats: { shots: 7, onTarget: 3, possession: 48, corners: 2, fouls: 10, yellows: 2, reds: 0 },
    homeLineup: [],
    awayLineup: [],
    homeGrl: 85,
    awayGrl: 82,
    ratings: {},
  };
}

describe("post-match press conferences", () => {
  it("creates three to five questions with distinct, selectable answers", () => {
    const conference = createPressConference(context(), result(2, 1));
    assert.ok(conference);
    assert.ok(conference.questions.length >= 3 && conference.questions.length <= 5);
    assert.equal(conference.questions[0]?.id, "result-win");
    for (const prompt of conference.questions) {
      assert.ok(prompt.answers.length >= 3 && prompt.answers.length <= 4);
      assert.equal(new Set(prompt.answers.map((answer) => answer.id)).size, prompt.answers.length);
      assert.equal(new Set(prompt.answers.map((answer) => answer.text)).size, prompt.answers.length);
    }
    assert.deepEqual(normalizePressConference(conference), conference);
  });

  it("adapts the opening question to draws and defeats", () => {
    assert.equal(createPressConference(context(), result(1, 1))?.questions[0]?.id, "result-draw");
    assert.equal(createPressConference(context(), result(0, 2))?.questions[0]?.id, "result-loss");
  });

  it("avoids repeating recent questions when the match context stays the same", () => {
    const history: NonNullable<Parameters<typeof createPressConference>[0]["pressHistory"]> = [];
    for (let index = 0; index < 5; index++) {
      const save = { ...context(), pressHistory: history };
      const conference = createPressConference(save, result(2, 1));
      assert.ok(conference);
      const recentQuestionIds = new Set(history.slice(0, 3).flatMap((item) => item.questions.map((prompt) => prompt.id)));
      assert.ok(conference.questions.every((prompt) => !recentQuestionIds.has(prompt.id)));
      conference.questionIndex = conference.questions.length;
      history.unshift(conference);
    }
  });

  it("supports important-match and disabled frequency settings", () => {
    assert.equal(createPressConference(context("important"), result(1, 0)), null);
    assert.equal(createPressConference(context("off"), result(2, 1)), null);
    const final = createPressConference(context("important", "Final", "coppa"), result(2, 1));
    assert.ok(final?.important);
    assert.ok(final.questions.length >= 3 && final.questions.length <= 5);
    assert.ok(final.questions.some((prompt) => prompt.id === "season-defining-match"));
  });

  it("records an unresolved minutes promise if its player leaves the club", () => {
    const conference = createPressConference(context(), result(2, 1));
    assert.ok(conference);
    const prompt = conference.questions[0]!;
    conference.questionIndex = conference.questions.length;
    conference.responses.push({
      questionId: prompt.id,
      journalist: prompt.journalist,
      question: prompt.question,
      answerId: "promise-minutes",
      answer: "Voy a darle más oportunidades.",
      reaction: "La prensa toma nota.",
      effects: ["Compromiso registrado: darle más oportunidades a Jugador"],
      playerId: "player-1",
    });
    const save: Parameters<typeof settlePressPromises>[0] = {
      players: [],
      season: 2026,
      week: 10,
      clubId: "mci",
      news: [],
      pressPromises: [{
        id: "promise-1",
        playerId: "player-1",
        season: 2026,
        deadlineWeek: 8,
        baselineApps: 0,
        targetApps: 2,
      }],
      pressHistory: [conference],
    };

    settlePressPromises(save);

    assert.equal(save.pressPromises?.length, 0);
    assert.ok(save.pressHistory?.[0]?.responses[0]?.effects.some((effect) => effect.includes("jugador dejó el club")));
  });
});
