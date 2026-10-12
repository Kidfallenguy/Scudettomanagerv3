import assert from "node:assert/strict";
import { test } from "node:test";
import { creditTitleIdolatry, processPlayerMatch, resolvePlayerChat } from "./player-relations";
import { createCareer } from "./world";
import type { MatchResult, PlayerChatThread } from "./types";

function match(save: ReturnType<typeof createCareer>): MatchResult {
  const stats = { shots: 0, onTarget: 0, possession: 50, corners: 0, fouls: 0, yellows: 0, reds: 0 };
  return {
    fixtureId: "test",
    homeId: save.clubId,
    awayId: "opponent",
    homeGoals: 0,
    awayGoals: 0,
    events: [],
    homeStats: stats,
    awayStats: stats,
    homeLineup: [],
    awayLineup: [],
    homeGrl: 0,
    awayGrl: 0,
  };
}

test("responder en Chat guarda la promesa de minutos sin alterar idolatría ni GRL", () => {
  const save = createCareer("int", 7);
  const player = save.players.find((item) => item.clubId === save.clubId && !item.loanFrom)!;
  const fanIdol = player.fanIdol;
  const ovr = player.ovr;
  const thread: PlayerChatThread = {
    id: "chat-test",
    playerId: player.id,
    topic: "minutes",
    season: save.season,
    week: save.week,
    unread: true,
    resolved: false,
    choices: [{ id: "promise", label: "Te daré más oportunidades", action: "promise-minutes" }],
    messages: [],
  };
  save.playerChats = [thread];

  const response = resolvePlayerChat(save, thread.id, "promise");

  assert.equal(response.error, null);
  assert.equal(thread.resolved, true);
  assert.equal(thread.unread, false);
  assert.equal(player.fanIdol, fanIdol);
  assert.equal(player.ovr, ovr);
  assert.equal(save.playerPromises?.[0]?.targetApps, player.apps + 2);
  assert.equal(save.playerPromises?.[0]?.deadlineMatch, (save.events?.matchIndex ?? save.week) + 5);

  player.apps += 2;
  processPlayerMatch(save, match(save));

  assert.equal(save.playerPromises?.length, 0);
  assert.ok(thread.messages.some((item) => item.body.startsWith("Promesa cumplida")));
});

test("un partido destacado puede generar una conversación con respuesta disponible", () => {
  const save = createCareer("int", 11);
  const squad = save.players.filter((item) => item.clubId === save.clubId && !item.loanFrom);
  const result = match(save);
  result.homeLineup = squad.map((player) => player.id);
  result.ratings = Object.fromEntries(squad.map((player) => [player.id, 10]));

  processPlayerMatch(save, result);

  assert.equal(save.playerChats?.length, 1);
  assert.ok(save.playerChats[0]!.unread);
  assert.ok(save.playerChats[0]!.choices.length > 0);
  assert.ok(save.news.some((item) => item.title.startsWith("Mensaje de ")));
});

test("ganar un título incrementa idolatría de forma independiente", () => {
  const save = createCareer("int", 9);
  const players = save.players.filter((item) => item.clubId === save.clubId && !item.loanFrom).slice(0, 2);
  for (const player of players) player.apps = 1;
  const before = players.map((player) => ({
    id: player.id,
    fanIdol: player.fanIdol ?? 0,
    morale: player.morale,
    ovr: player.ovr,
  }));

  creditTitleIdolatry(save, "la liga");

  for (const snapshot of before) {
    const player = save.players.find((item) => item.id === snapshot.id)!;
    assert.ok((player.fanIdol ?? 0) > snapshot.fanIdol);
    assert.equal(player.morale, snapshot.morale);
    assert.equal(player.ovr, snapshot.ovr);
  }
  assert.equal(save.idolatryHistory?.length, players.length);
});
