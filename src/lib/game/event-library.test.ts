import assert from "node:assert/strict";
import { test } from "node:test";
import { ACADEMY_MAX } from "./academy";
import { optionBlockedReason } from "./event-decisions";
import { EVENTS, listEventCandidates, type DecisionEventDef } from "./events";
import { academyHasRoom, isCaptain, isLegend, isYouth, squadHasRoom, userSquad } from "./event-kit";
import { Rng } from "./rng";
import { createCareer } from "./world";

test("la biblioteca es grande y no repite ids", () => {
  const ids = EVENTS.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, "hay ids repetidos");
  assert.ok(EVENTS.length >= 90, `solo ${EVENTS.length} sucesos`);
});

test("hay de todos los tipos pedidos: tono, decisión, juvenil, capitán, leyenda, raro", () => {
  const cats = new Set(EVENTS.map((e) => e.category));
  for (const c of ["positive", "negative", "neutral", "decision", "player"] as const) {
    assert.ok(cats.has(c), `falta categoría ${c}`);
  }
  assert.ok(EVENTS.some((e) => e.players && /captain|brazalete|capitán/i.test(e.id + (e.category === "decision" ? e.id : ""))));
  assert.ok(EVENTS.some((e) => e.id.includes("legend") || e.id.includes("leg-") || e.id.includes("leyend") || e.id.includes("legend-son") || e.id.includes("acd-legend")));
  assert.ok(EVENTS.some((e) => e.youths || e.id.startsWith("acd-")));
  assert.ok(EVENTS.filter((e) => e.category === "decision").length >= 15);
  assert.ok(EVENTS.some((e) => (e.cooldown ?? 0) >= 40));
});

test("el hijo de una leyenda solo se ofrece si hay lugar en al menos un destino", () => {
  const save = createCareer("int", 5);
  const son = EVENTS.filter((e) => e.id === "decision-legend-son");
  assert.equal(son.length, 1);
  const def = son[0] as DecisionEventDef;
  const father = userSquad(save).find(isLegend);
  assert.ok(father);
  assert.equal(def.eligible!(save), true);

  const prompt = def.prompt(save, new Rng(17), father);
  assert.ok(prompt.body.includes(father.name));
  assert.match(prompt.body, /POT 9[1-9]/);

  for (const id of ["in", "trial", "first-team"]) {
    const option = def.options.find((item) => item.id === id)!;
    const result = option.apply(save, new Rng(31), father);
    const addition = result.effects?.find((effect) => effect.kind === "addYouth" || effect.kind === "addPlayerFromYouth");
    assert.ok(addition, `${id} incorpora al hijo`);
    const youth = addition.youth;
    assert.ok(youth.pot >= 91 && youth.pot <= 99);
    assert.equal(youth.nat, father.nat);
    assert.equal(youth.fee, 0);
    assert.ok(youth.id.includes(father.id));
  }

  save.academy = Array.from({ length: ACADEMY_MAX }, (_, i) => ({
    id: `y-full-${i}`,
    name: `Pibe ${i}`,
    nat: "ITA",
    age: 17,
    pos: "CM",
    ovr: 60,
    pot: 75,
    weeksIn: 0,
    fee: 1_000_000,
  }));
  assert.equal(academyHasRoom(save), false);
  assert.equal(optionBlockedReason(def.options.find((item) => item.id === "in")!, save, father), "La cantera está completa.");
  assert.equal(optionBlockedReason(def.options.find((item) => item.id === "first-team")!, save, father), null);

  save.academy = [];
  const squad = userSquad(save);
  let index = 0;
  while (squadHasRoom(save)) {
    save.players.push({ ...squad[0]!, id: `pad-${index}`, name: `Pad ${index}` });
    index++;
  }
  assert.equal(squadHasRoom(save), false);
  assert.equal(optionBlockedReason(def.options.find((item) => item.id === "first-team")!, save, father), "La plantilla principal está completa.");
  assert.equal(def.eligible!(save), true);
  save.academy = Array.from({ length: ACADEMY_MAX }, (_, i) => ({
    id: `y-full-again-${i}`,
    name: `Cantera ${i}`,
    nat: "ITA",
    age: 17,
    pos: "CM",
    ovr: 60,
    pot: 75,
    weeksIn: 0,
    fee: 1_000_000,
  }));
  assert.equal(def.eligible!(save), false);
  save.events!.history[def.id] = 1;
  assert.equal(def.eligible!(save), false);
});

test("el incidente del auto permite elegir apoyo y solo aparece una vez por carrera", () => {
  const save = createCareer("int", 6);
  const def = EVENTS.find((event): event is DecisionEventDef => event.id === "player-car-fire" && event.category === "decision")!;
  const player = userSquad(save).find((item) => item.age < 40)!;

  assert.equal(def.options.length, 4);
  assert.equal(def.eligible!(save), true);
  for (const option of def.options) {
    const result = option.apply(save, new Rng(41), player);
    assert.ok(!(result.effects ?? []).some((effect) => effect.kind === "injury"));
  }

  save.events!.history[def.id] = 1;
  assert.equal(def.eligible!(save), false);
});

test("un suceso de capitán solo elige al capitán, uno de juvenil solo a juveniles", () => {
  const save = createCareer("int", 4);
  const capDef = EVENTS.find((e) => e.id === "pos-captain-speech")!;
  const youthDef = EVENTS.find((e) => e.id === "pos-youth-training-leap")!;
  const squad = userSquad(save);
  const caps = squad.filter((p) => capDef.players!(p, save));
  assert.equal(caps.length, 1);
  assert.equal(isCaptain(caps[0]!, save), true);
  const kids = squad.filter((p) => youthDef.players!(p, save));
  assert.ok(kids.length >= 1);
  assert.ok(kids.every(isYouth));
});

test("los sucesos graves son raros (poco peso, mucho enfriamiento)", () => {
  for (const id of ["decision-betting", "decision-grave-legal", "player-gender-transition"]) {
    const def = EVENTS.find((e) => e.id === id)!;
    assert.ok(def.weight <= 1, id);
    assert.ok((def.cooldown ?? 0) >= 40, id);
  }
});

test("no hay sucesos que describan abuso de menores", () => {
  const blob = JSON.stringify(EVENTS.map((e) => e.id));
  assert.equal(/porn|csam|infantil|pedofil/i.test(blob), false);
});

test("el suceso especial de transición sigue en ~1% de su categoría", () => {
  const save = createCareer("int", 2);
  const list = listEventCandidates(save, "pre");
  const rare = list.find((c) => c.id === "player-gender-transition")!;
  const playerCat = list.filter((c) => c.category === "player");
  const others = playerCat.filter((c) => c.id !== "player-gender-transition").reduce((s, c) => s + c.weight, 0);
  const ref = others > 0 ? others : list.filter((c) => c.id !== "player-gender-transition").reduce((s, c) => s + c.weight, 0);
  const share = rare.weight / (rare.weight + ref);
  assert.ok(Math.abs(share - 0.01) < 1e-6, `${share}`);
});

test("una leyenda viva existe en planteles típicos (para el hijo y las visitas)", () => {
  for (const club of ["int", "cag", "rma"] as const) {
    const save = createCareer(club, 5);
    assert.ok(userSquad(save).some(isLegend), club);
  }
});

test("las decisiones nuevas tienen 2-4 opciones con pista", () => {
  const decisions = EVENTS.filter((e): e is DecisionEventDef => e.category === "decision");
  assert.ok(decisions.length >= 15);
  for (const d of decisions) {
    assert.ok(d.options.length >= 2 && d.options.length <= 4, d.id);
    for (const o of d.options) assert.ok(o.hint?.trim(), `${d.id}:${o.id}`);
  }
});
