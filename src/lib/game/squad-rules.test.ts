// Pruebas de cedidos, límite de plantilla, ventas y posiciones válidas. Se corren con:
//   npx tsx --test src/lib/game/squad-rules.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { makeYouth, resolveScouts, youthToPlayer } from "./academy";
import { blankTerms } from "./contracts";
import { clubById } from "./clubs";
import {
  hasPlayerPhoto,
  regenFaceForPlayer,
  playerFaceUrl,
  portraitForGeneratedPlayer,
  wonderkidAtlasTile,
  wonderkidFaceUrl,
} from "./face-assets";
import { seedFreeAgents, signFreeAgent } from "./free-agents";
import { SQUAD_LIMIT, SQUAD_MIN } from "./format";
import {
  VALID_POSITIONS,
  coercePos,
  isValidPos,
  normalizePos,
  repairPositions,
} from "./positions";
import { Rng } from "./rng";
import { SERIE_D_STARS, SERIE_D_YOUTH_PROSPECTS } from "./names";
import { evolveSeason } from "./season";
import { ovrOf } from "./stats";
import { isWonderkid } from "./potential";
import { ORGANIZED_FACE_SQUADS } from "./organized-face-squads";
import {
  ownershipBlockReason,
  sellablePlayers,
  saleBlockReason,
  squadCount,
} from "./squad-rules";
import { buildSquad, generated, topUpThinSquads } from "./squads";
import { useGame } from "./store";
import {
  acceptOffer,
  completeSigning,
  exerciseLoanOption,
  processMarketWeek,
  resolveLoans,
  spawnWonderkids,
} from "./transfers";
import type { GameSave, Player, ScoutMission, YouthPlayer } from "./types";
import { createCareer } from "./world";

const USER = "int";
const LENDER = "mil";

const ownOf = (s: GameSave) =>
  s.players.filter((p) => p.clubId === s.clubId && !p.loanFrom);
const loanedInOf = (s: GameSave) =>
  s.players.filter((p) => p.clubId === s.clubId && p.loanFrom);

test("las fotos reales admiten apellidos de roster sin confundir homónimos ni generados", () => {
  assert.equal(
    playerFaceUrl({
      name: "Michael Olise",
      portraitUrl: undefined,
    }),
    "/player-faces/bajogrlfaces.png",
  );
  assert.equal(
    playerFaceUrl({
      name: "Thibaut Courtois",
      portraitUrl: undefined,
    }),
    "/player-faces/real/Thibaut%20Courtois.png",
  );
  assert.equal(
    playerFaceUrl({
      name: "Lautaro Martinez",
      portraitUrl: undefined,
    }),
    "/player-faces/bajogrlfaces.png",
  );
  assert.equal(
    playerFaceUrl({
      name: "Gonzalo Sanguinetti",
      portraitUrl: undefined,
    }),
    "/player-faces/real/Gonzalo%20Sanguinetti.png",
  );
  assert.equal(
    playerFaceUrl({
      id: "rm-0",
      name: "Andriy Lunin",
      portraitUrl: undefined,
    }),
    "/player-faces/real/lunin.png",
  );
  assert.equal(
    playerFaceUrl({
      id: "rm-g-0-1234",
      name: "Andriy Lunin",
      portraitUrl: undefined,
    }),
    "/player-faces/bajogrlfaces.png",
  );
  assert.equal(
    playerFaceUrl({
      name: "Ibrahima Konaté",
      portraitUrl: undefined,
    }),
    "/player-faces/real/konate.png",
  );
  assert.equal(
    playerFaceUrl({
      id: "ita_jng-936745",
      name: "Ismaël Konaté",
      portraitUrl: undefined,
    }),
    "/player-faces/bajogrlfaces.png",
  );
  assert.match(
    playerFaceUrl({
      name: "Generated Regen",
      portraitUrl: "/player-faces/regen/face-001.png",
    }),
    /^\/player-faces\/regen\/face-\d{3}\.png$/,
  );
  assert.match(
    regenFaceForPlayer("rg-example"),
    /^\/player-faces\/wonderkids\/atlas-\d{4}\.webp#\d+$/,
  );
  assert.equal(
    regenFaceForPlayer("rg-example"),
    regenFaceForPlayer("rg-example"),
  );
  assert.equal(
    wonderkidFaceUrl(1),
    "/player-faces/wonderkids/atlas-0000.webp#0",
  );
  assert.equal(
    wonderkidFaceUrl(64),
    "/player-faces/wonderkids/atlas-0000.webp#63",
  );
  assert.equal(
    wonderkidFaceUrl(65),
    "/player-faces/wonderkids/atlas-0001.webp#0",
  );
  assert.deepEqual(wonderkidAtlasTile(wonderkidFaceUrl(65)), {
    atlasUrl: "/player-faces/wonderkids/atlas-0001.webp",
    column: 0,
    row: 0,
  });
  assert.equal(
    wonderkidAtlasTile("/player-faces/wonderkids/atlas-0001.webp#64"),
    null,
  );
  assert.equal(
    wonderkidAtlasTile("/player-faces/catalog/face-0001.webp"),
    null,
  );
});

test("los jugadores generados con mucho potencial reciben wonderkid", () => {
  assert.match(
    portraitForGeneratedPlayer("generated-high-pot", 77, 82) ?? "",
    /^\/player-faces\/wonderkids\/atlas-\d{4}\.webp#\d+$/,
  );
  assert.match(
    portraitForGeneratedPlayer("generated-high-ovr", 76, 79) ?? "",
    /^\/player-faces\/wonderkids\/atlas-\d{4}\.webp#\d+$/,
  );
  assert.equal(portraitForGeneratedPlayer("generated-mid", 72, 70), undefined);
});

test("los Wonderkids cumplen estrictamente edad menor de 23 y POT de 85 o más", () => {
  assert.equal(isWonderkid({ age: 22, ovr: 84, pot: 85 }), true);
  assert.equal(isWonderkid({ age: 22, ovr: 85, pot: 85 }), true);
  assert.equal(isWonderkid({ age: 23, ovr: 80, pot: 99 }), false);
  assert.equal(isWonderkid({ age: 18, ovr: 70, pot: 84 }), false);
});

test("las caras organizadas se resuelven por club y nombre normalizado", () => {
  assert.equal(
    playerFaceUrl({
      id: "tm-espn-1",
      clubId: "get",
      name: "Djené Dakonam",
      portraitUrl: undefined,
    }),
    "/player-faces/real/Liga%20espa%C3%B1ola/Getafe/Djene.png",
  );
  assert.equal(
    hasPlayerPhoto({
      id: "tm-espn-1",
      clubId: "get",
      name: "Djené Dakonam",
      portraitUrl: undefined,
    }),
    true,
  );
  assert.equal(
    playerFaceUrl({
      id: "tm-espn-2",
      clubId: "riv",
      name: "Santiago Beltrán",
      portraitUrl: undefined,
    }),
    "/player-faces/real/Liga%20argentina/River%20Plate/Santiago_Beltr%C3%A1n.png",
  );
  assert.equal(
    playerFaceUrl({
      id: "tm-espn-3",
      clubId: "ath",
      name: "Iñigo Ruiz de Galarreta",
      portraitUrl: undefined,
    }),
    "/player-faces/real/Liga%20espa%C3%B1ola/Athletic_Club/Ruiz%20de%20Galarreta%20Etxeberria%20I%C3%B1igo.png",
  );
  assert.equal(
    playerFaceUrl({
      id: "tm-espn-4",
      clubId: "ath",
      name: "Iñaki Williams",
      portraitUrl: undefined,
    }),
    "/player-faces/real/Liga%20espa%C3%B1ola/Athletic_Club/Williams%20Arthuer%20I%C3%B1aki.png",
  );
  assert.equal(
    playerFaceUrl({
      id: "tm-espn-5",
      clubId: "osa",
      name: "Raúl Moro",
      portraitUrl: undefined,
    }),
    "/player-faces/real/Liga%20espa%C3%B1ola/Osasuna/Moro.png",
  );
  assert.equal(
    playerFaceUrl({
      id: "ath-g-1",
      clubId: "ath",
      name: "Iñaki Williams",
      portraitUrl: undefined,
    }),
    "/player-faces/bajogrlfaces.png",
  );
});

test("las plantillas organizadas contienen jugadores con foto o Wonderkids manuales", () => {
  for (const [clubId, players] of Object.entries(ORGANIZED_FACE_SQUADS)) {
    assert.ok(players.length > 0, `${clubId} has no roster seeds`);
    for (const player of players) {
      const currentAge = player.age;
      const potential = player.pot ?? player.ovr;
      assert.ok(
        hasPlayerPhoto({
          id: player.sourceId ? `tm-${player.sourceId}` : undefined,
          clubId,
          name: player.name,
          portraitUrl: undefined,
        }) ||
          (currentAge < 23 && potential >= 85),
        `${player.name} in ${clubId} has no real face and does not meet the Wonderkid rule`,
      );
    }
  }
});

test("los Wonderkids nuevos reciben fotos aleatorias distintas de su carpeta", () => {
  const save = createCareer(USER, 71);
  const existingIds = new Set(save.players.map((player) => player.id));
  spawnWonderkids(
    save,
    new Rng(73),
    new Set(save.players.map((player) => player.name)),
  );
  const wonderkids = save.players.filter(
    (player) => !existingIds.has(player.id) && player.hiddenGem,
  );
  const portraits = wonderkids.map((player) => player.portraitUrl);

  assert.ok(wonderkids.length > 0);
  assert.ok(wonderkids.every((player) => player.age < 23 && player.pot >= 85));
  assert.ok(
    portraits.every((portrait) =>
      /^\/player-faces\/catalog\/face-\d{4}\.webp$/.test(portrait ?? ""),
    ),
  );
  assert.equal(new Set(portraits).size, wonderkids.length);
});

/** Carrera con exactamente `own` propios y `loaned` cedidos de otro club jugando en el usuario. */
function setup(own: number, loaned: number, seed = 3): GameSave {
  const s = createCareer(USER, seed);
  s.budget = 5_000_000_000;
  const mine = s.players.filter((p) => p.clubId === s.clubId);
  // Si hacen falta más propios de los que trae el club, se agregan clonando jugadores generados.
  const rng = new Rng(seed + 1);
  const used = new Set(s.players.map((p) => p.name));
  while (mine.length < own) {
    const extra = generated(
      USER,
      VALID_POSITIONS[mine.length % VALID_POSITIONS.length]!,
      9000 + mine.length,
      80,
      rng,
      used,
    );
    s.players.push(extra);
    mine.push(extra);
  }
  const keep = new Set(mine.slice(0, own).map((p) => p.id));
  s.players = s.players.filter((p) => p.clubId !== s.clubId || keep.has(p.id));
  const donors = s.players.filter((p) => p.clubId === LENDER).slice(0, loaned);
  for (const d of donors) {
    d.clubId = s.clubId;
    d.loanFrom = LENDER;
    d.loanSeasons = 1;
    s.loans.push({
      playerId: d.id,
      fromClubId: LENDER,
      toClubId: s.clubId,
      seasonsLeft: 1,
      fee: 0,
    });
  }
  return s;
}

const load = (s: GameSave) => useGame.setState(s as never);
const state = () =>
  useGame.getState() as unknown as GameSave &
    ReturnType<typeof useGame.getState>;
const find = (id: string) => state().players.find((p) => p.id === id)!;

test("las plantillas MLS se completan con nombres normales y sin etiquetas numeradas", () => {
  const squad = buildSquad("us_mia", new Rng(42), new Set());
  assert.equal(squad.length, 25);
  assert.ok(squad.every((p) => !/^Jugador\s+\d+$/i.test(p.name)));
});

test("cinco promesas de Serie C aparecen en cinco clubes distintos", () => {
  const prospects = [
    ["ita_cit", "Ahmed Sanogo", 21],
    ["ita_ubr", "Patrick Nuamah", 20],
    ["ita_osp", "Samuele Sina", 19],
    ["ita_des", "Filippo Bono", 18],
    ["ita_jng", "Lorenzo Anghelè", 21],
  ] as const;

  for (const [clubId, name, age] of prospects) {
    const squad = buildSquad(clubId, new Rng(20261010), new Set());
    const prospect = squad.find((player) => player.name === name);
    assert.ok(prospect, `${name} should be in ${clubId}'s squad`);
    assert.equal(prospect.age, age);
    assert.ok(prospect.pot >= 75);
  }
});

test("actualiza la plantilla del Alavés y los destinos de sus jugadores", () => {
  const alaves = buildSquad("ala", new Rng(20261010), new Set());
  for (const name of [
    "Jesús Owono",
    "Aleksandar Sedlar",
    "Moussa Diarra",
    "Carlos Vicente",
    "Kike García",
  ]) {
    assert.equal(
      alaves.some((player) => player.name === name),
      false,
      `${name} salió del Alavés`,
    );
  }

  const additions = [
    ["Mariano Díaz", "ST", 33],
    ["Mikel Rodríguez", "CM", 24],
    ["Youssef Enríquez", "LB", 21],
    ["Selu Diallo", "CM", 23],
    ["Nicolás Valentini", "CB", 25],
    ["Miguel Rodríguez", "RW", 23],
  ] as const;
  for (const [name, position, age] of additions) {
    const player = alaves.find((candidate) => candidate.name === name);
    assert.ok(player, `${name} debe estar en el Alavés`);
    assert.equal(player.pos, position);
    assert.equal(player.age, age);
  }

  assert.ok(
    buildSquad("sd_and", new Rng(20261010), new Set()).some(
      (player) => player.name === "Jesús Owono",
    ),
  );
  assert.ok(
    buildSquad("ch_bir", new Rng(20261010), new Set()).some(
      (player) => player.name === "Carlos Vicente",
    ),
  );
  assert.ok(
    buildSquad("esp", new Rng(20261010), new Set()).some(
      (player) => player.name === "Kike García",
    ),
  );
  assert.ok(
    seedFreeAgents(new Rng(77), new Set()).some(
      (player) => player.name === "Aleksandar Sedlar",
    ),
  );
});

test("Bernardo, Diomande y Pitarch están en el Madrid con datos correctos", () => {
  const madrid = buildSquad("rma", new Rng(20261010), new Set());
  const bernardo = madrid.find((player) => player.name === "Bernardo Silva");
  assert.ok(bernardo);
  assert.equal(bernardo.ovr, 80);
  assert.equal(bernardo.clubId, "rma");

  const diomande = madrid.find((player) => player.name === "Ousmane Diomande");
  assert.ok(diomande);
  assert.equal(diomande.ovr, 82);
  assert.equal(diomande.pot, 95);
  assert.equal(diomande.clubId, "rma");

  const pitarch = madrid.find((player) => player.name === "Thiago Pitarch");
  assert.ok(pitarch);
  assert.equal(pitarch.pos, "CM");

  const city = buildSquad("mci", new Rng(20261010), new Set());
  const sporting = buildSquad("pt_spo", new Rng(20261010), new Set());
  const forest = buildSquad("nfo", new Rng(20261010), new Set());
  assert.equal(
    city.some((player) => player.name === "Bernardo Silva"),
    false,
  );
  assert.equal(
    sporting.some((player) => player.name === "Ousmane Diomande"),
    false,
  );
  assert.equal(
    forest.some((player) => player.name === "Ousmane Diomande"),
    false,
  );
});

test("Harry Kane refleja su GRL 92 y atributos de delantero de élite", () => {
  const bayern = buildSquad("bay", new Rng(20261010), new Set());
  const kane = bayern.find((player) => player.name === "Harry Kane");
  assert.ok(kane);
  assert.equal(kane.ovr, 92);
  assert.equal(kane.pot, 92);
  assert.equal(ovrOf(kane), 92);
  assert.ok(kane.attrs.sho >= 90);
  assert.ok(kane.attrs.pas >= 80);
});

test("las plantillas de Serie D incluyen los 15 jugadores y promesas juveniles asignados", () => {
  assert.equal(Object.keys(SERIE_D_STARS).length, 18);
  assert.equal(Object.keys(SERIE_D_YOUTH_PROSPECTS).length, 5);

  for (const [clubId, seeds] of Object.entries(SERIE_D_STARS)) {
    assert.equal(
      seeds.length,
      15,
      `${clubId} debe tener 15 jugadores cargados`,
    );
    const squad = buildSquad(clubId, new Rng(20261010), new Set());
    for (const seed of seeds) {
      assert.ok(
        squad.some((player) => player.name === seed.name),
        `${seed.name} debe estar en ${clubId}`,
      );
    }
  }

  for (const [clubId, seeds] of Object.entries(SERIE_D_YOUTH_PROSPECTS)) {
    const squad = buildSquad(clubId, new Rng(20261010), new Set());
    for (const seed of seeds) {
      assert.ok(
        squad.some((player) => player.name === seed.name),
        `${seed.name} debe estar en ${clubId}`,
      );
      assert.ok(
        seed.age <= 18 && (seed.pot ?? 0) >= 86,
        `${seed.name} debe cumplir perfil de promesa`,
      );
    }
  }
});

test("las plantillas incompletas de clubes se completan hasta 25 jugadores", () => {
  const save = createCareer(USER, 84);
  const squad = save.players.filter((p) => p.clubId === "us_mia").slice(0, 15);
  const others = save.players.filter((p) => p.clubId !== "us_mia");
  const added = topUpThinSquads([...others, ...squad], save.seed).filter(
    (p) => p.clubId === "us_mia",
  );
  assert.equal(squad.length + added.length, 25);
  assert.ok(added.every((p) => !/^Jugador\s+\d+$/i.test(p.name)));
});

test("las divisiones argentinas generan nombres normales y respetan las plantillas especiales", () => {
  for (const clubId of [
    "tpa_glew",
    "tpa_el_chasqui",
    "ar4_puerto_nuevo",
    "ar4_yupanqui",
    "arg_3_abr",
  ]) {
    const squad = buildSquad(clubId, new Rng(2026), new Set());
    assert.equal(squad.length, 25);
    assert.ok(
      squad.every((player) => !/^Jugador\s+\d+$/i.test(player.name)),
      `${clubId} no debe usar nombres genéricos`,
    );
  }

  const glewSquad = buildSquad("tpa_glew", new Rng(2026), new Set());
  const curti = glewSquad.find((player) => player.name === "Gustavo Curti");
  assert.ok(curti);
  assert.equal(curti.pos, "ST");
  assert.equal(curti.age, 19);
  assert.equal(curti.pot, 96);

  const chasquiSquad = buildSquad("tpa_el_chasqui", new Rng(2026), new Set());
  const requestedPlayers = [
    ["Ramiro Gómez", 17, "ST"],
    ["Mateo", 17, "CM"],
    ["Mateo Meitrich", 18, "CB"],
    ["Alejo Saliba", 21, "CB"],
    ["Augusto Aguirre", 22, "LB"],
    ["Tomas Labraga", 22, "RB"],
    ["Nacho Contreras", 23, "CM"],
    ["Facundo Marotta", 23, "CM"],
    ["Fabrizzio Matizelli", 21, "CAM"],
    ["Joaco Cuello", 22, "ST"],
    ["Agustin Villalba", 28, "RW"],
    ["Pedro Abalos", 23, "LW"],
  ] as const;

  for (const [name, age, pos] of requestedPlayers) {
    const player = chasquiSquad.find((item) => item.name === name);
    assert.ok(player, `${name} debe estar en El Chasqui`);
    assert.equal(player.age, age);
    assert.equal(player.pos, pos);
  }

  // Los seis juveniles pedidos: potencial entre 70 y 85 y GRL de Promocional Amateur.
  for (const name of [
    "Ramiro Gómez",
    "Mateo",
    "Mateo Meitrich",
    "Alejo Saliba",
    "Augusto Aguirre",
    "Tomas Labraga",
  ]) {
    const player = chasquiSquad.find((item) => item.name === name)!;
    assert.ok(
      player.pot >= 70 && player.pot <= 85,
      `${name} debe tener POT entre 70 y 85 (tiene ${player.pot})`,
    );
    assert.ok(
      player.ovr >= 33 && player.ovr <= 42,
      `${name} debe tener GRL de 6.ª división (tiene ${player.ovr})`,
    );
  }

  for (const name of [
    "Fabrizzio Matizelli",
    "Joaco Cuello",
    "Agustin Villalba",
    "Pedro Abalos",
  ]) {
    const player = chasquiSquad.find((item) => item.name === name)!;
    assert.ok(
      player.pot >= 76 && player.pot <= 84,
      `${name} debe tener POT entre 76 y 84 (tiene ${player.pot})`,
    );
    assert.ok(
      player.ovr >= 33 && player.ovr <= 42,
      `${name} debe tener GRL de Promocional Amateur (tiene ${player.ovr})`,
    );
  }
});

/* ── 1. Club con 16 propios + 2 cedidos ─────────────────────────────── */

test("16 propios + 2 cedidos: la plantilla cuenta 18/18 pero solo hay 16 propios", () => {
  const s = setup(16, 2);
  const c = squadCount(s.players, s.clubId);
  assert.equal(c.own, 16);
  assert.equal(c.loanedIn, 2);
  assert.equal(c.total, 18, "los cedidos cuentan para el total de plantilla");
  assert.equal(sellablePlayers(s).length, 16, "los cedidos no son vendibles");
});

test("16 propios + 2 cedidos: no se puede vender ningún propio (mínimo 18 propios)", () => {
  load(setup(16, 2));
  const own = ownOf(state());
  const err = state().sellPlayer(own[0]!.id);
  assert.match(err ?? "", /18/);
  assert.equal(ownOf(state()).length, 16, "nadie salió");
});

/* ── 2 y 3. Vender / venta rápida de un cedido ─────────────────────── */

test("venta rápida de un cedido que llegó a mi club: rechazada y sin cambios (aun con plantilla grande)", () => {
  load(setup(24, 2));
  const guest = loanedInOf(state())[0]!;
  const budget = state().budget;
  const err = state().sellPlayer(guest.id);
  assert.ok(err, "debe devolver error");
  assert.match(err!, /cedido|propietario/i);
  const after = find(guest.id);
  assert.equal(after.clubId, USER);
  assert.equal(after.loanFrom, LENDER);
  assert.equal(state().budget, budget, "no entra dinero");
});

test("venta rápida de un propio que está prestado en otro club: rechazada", () => {
  const s = setup(24, 0);
  const lent = ownOf(s)[0]!;
  lent.clubId = LENDER;
  lent.loanFrom = USER;
  lent.loanSeasons = 1;
  s.loans.push({
    playerId: lent.id,
    fromClubId: USER,
    toClubId: LENDER,
    seasonsLeft: 1,
    fee: 0,
  });
  load(s);
  const err = state().sellPlayer(lent.id);
  assert.match(err ?? "", /cedido/i);
  assert.equal(find(lent.id).clubId, LENDER);
  assert.ok(
    !sellablePlayers(s).some((p) => p.id === lent.id),
    "no figura como vendible",
  );
});

test("aceptar una oferta de compra o de cesión por un cedido: rechazada y la oferta se retira", () => {
  const s = setup(24, 2);
  const guest = loanedInOf(s)[0]!;
  for (const kind of ["buy", "loan"] as const) {
    s.offers = [
      {
        id: `o-${kind}`,
        kind,
        playerId: guest.id,
        fromClubId: "juv",
        toClubId: USER,
        fee: 9_000_000,
        loanSeasons: kind === "loan" ? 1 : 0,
        week: s.week,
        unsolicited: true,
      },
    ];
    const err = acceptOffer(s, `o-${kind}`);
    assert.ok(err, `${kind}: debe rechazarse`);
    assert.equal(s.offers.length, 0, `${kind}: la oferta inválida se retira`);
    assert.equal(guest.clubId, USER);
    assert.equal(guest.loanFrom, LENDER);
  }
});

test("el mercado semanal nunca genera ofertas por cedidos, aunque estén listados o sean cracks", () => {
  const s = setup(22, 3);
  const guests = loanedInOf(s);
  for (const g of guests) {
    g.listed = true; // marca vieja/corrupta
    g.ovr = 92;
    g.pot = 95;
    g.age = 24;
  }
  const ids = new Set(guests.map((g) => g.id));
  const rng = new Rng(11);
  for (let w = 1; w <= 120; w++) {
    s.week = w;
    processMarketWeek(s, rng);
    assert.ok(
      !s.offers.some((o) => ids.has(o.playerId)),
      `semana ${w}: hay una oferta por un cedido`,
    );
  }
});

test("las ofertas viejas por cedidos se limpian solas", () => {
  const s = setup(22, 2);
  const guest = loanedInOf(s)[0]!;
  s.offers = [
    {
      id: "stale",
      kind: "buy",
      playerId: guest.id,
      fromClubId: "juv",
      toClubId: USER,
      fee: 5_000_000,
      loanSeasons: 0,
      week: 1,
      unsolicited: true,
    },
  ];
  processMarketWeek(s, new Rng(5));
  assert.ok(!s.offers.some((o) => o.id === "stale"));
});

test("no se puede poner en venta ni a cesión a un cedido", () => {
  load(setup(22, 2));
  const guest = loanedInOf(state())[0]!;
  state().toggleListed(guest.id);
  state().toggleLoanListed(guest.id);
  assert.equal(find(guest.id).listed, false);
  assert.equal(find(guest.id).listedForLoan, false);
  const own = ownOf(state())[0]!;
  state().toggleListed(own.id);
  assert.equal(find(own.id).listed, true, "un propio sí se puede listar");
});

/* ── 4. Menos de 18 propios y varios cedidos ──────────────────────── */

test("menos de 18 propios + varios cedidos: no se vende aunque la plantilla total pase de 18", () => {
  const s = setup(14, 6);
  assert.equal(squadCount(s.players, s.clubId).total, 20);
  load(s);
  const err = state().sellPlayer(ownOf(state())[0]!.id);
  assert.match(err ?? "", /18/);
  assert.equal(ownOf(state()).length, 14);
});

test("el mínimo es sobre propios: con 19 propios + cedidos se vende uno; con 18 ya no", () => {
  load(setup(19, 4));
  assert.equal(
    state().sellPlayer(ownOf(state())[0]!.id),
    null,
    "con 19 propios se puede",
  );
  assert.equal(ownOf(state()).length, 18);
  const err = state().sellPlayer(ownOf(state())[0]!.id);
  assert.match(err ?? "", /18/);
  assert.equal(ownOf(state()).length, 18);
  assert.equal(loanedInOf(state()).length, 4, "los cedidos siguen en el club");
});

test("la venta de un propio válido funciona y registra todo bien", () => {
  load(setup(24, 2));
  const target = ownOf(state())[0]!;
  const budget = state().budget;
  assert.equal(state().sellPlayer(target.id), null);
  const sold = find(target.id);
  assert.notEqual(sold.clubId, USER);
  assert.equal(sold.loanFrom, null);
  assert.ok(isValidPos(sold.pos));
  assert.ok(state().budget > budget);
});

/* ── Límite máximo: los cedidos ocupan lugar ──────────────────────── */

test("38 propios + 2 cedidos = 40: no se puede fichar ni subir un juvenil (los cedidos cuentan)", () => {
  const s = setup(SQUAD_LIMIT - 2, 2);
  assert.equal(squadCount(s.players, s.clubId).total, SQUAD_LIMIT);
  const fa = s.freeAgents[0]!;
  const err = completeSigning(s, fa.id, blankTerms(fa), false);
  assert.match(err ?? "", /llena/i);
  assert.ok(
    s.freeAgents.some((x) => x.id === fa.id),
    "el libre no fue fichado",
  );

  load(s);
  const y = makeYouth(new Rng(1), "ITA", new Set(), USER, 1);
  useGame.setState({ academy: [y] } as never);
  assert.match(state().signYouth(y.id) ?? "", /llena/i);
});

test("38 propios + 1 cedido = 39: todavía hay lugar para uno", () => {
  const s = setup(SQUAD_LIMIT - 2, 1);
  const fa = s.freeAgents[0]!;
  assert.equal(completeSigning(s, fa.id, blankTerms(fa), false), null);
  assert.equal(squadCount(s.players, s.clubId).total, SQUAD_LIMIT);
});

/* ── 5, 6 y 7. Posiciones: jugador nuevo, juvenil y fichaje ───────── */

const BAD = [undefined, null, "", "  ", "XX", "LM", "RM", 7, {}] as unknown[];

test("normalizePos / coercePos: nunca devuelven vacío ni inválido", () => {
  for (const bad of BAD) {
    const pos = normalizePos(bad);
    assert.ok(isValidPos(pos), `normalizePos(${String(bad)}) → ${pos}`);
  }
  assert.equal(coercePos("LM"), "LW");
  assert.equal(coercePos("rm"), "RW");
  assert.equal(coercePos("st"), "ST");
  assert.equal(coercePos(""), null);
});

test("5. jugador nuevo: generated() siempre queda con posición válida", () => {
  const rng = new Rng(9);
  const used = new Set<string>();
  for (const bad of BAD) {
    const p = generated(USER, bad as never, 1, 80, rng, used);
    assert.ok(isValidPos(p.pos), `generated(${String(bad)}) → ${p.pos}`);
    assert.ok(
      p.attrs && Object.values(p.attrs).every(Number.isFinite),
      "con atributos coherentes",
    );
  }
});

test("6. juvenil: makeYouth / resolveScouts / youthToPlayer siempre con posición válida", () => {
  const rng = new Rng(4);
  for (const bad of BAD) {
    const y = makeYouth(rng, "ARG", new Set(), USER, 1, { pos: bad as never });
    assert.ok(isValidPos(y.pos), `makeYouth(${String(bad)}) → ${y.pos}`);
  }
  for (const bad of [...BAD, "ANY"]) {
    const mission: ScoutMission = {
      id: "sc",
      countryId: "arg",
      countryName: "Argentina",
      nat: "ARG",
      weeksLeft: 1,
      cost: 1,
      preferredPos: bad as never,
      tier: 2,
    };
    const { found } = resolveScouts([mission], [], 1, USER, rng, new Set());
    assert.ok(found.length > 0);
    for (const y of found)
      assert.ok(isValidPos(y.pos), `scout(${String(bad)}) → ${y.pos}`);
  }
  for (const bad of BAD) {
    const y = {
      ...makeYouth(rng, "ITA", new Set(), USER, 1),
      pos: bad,
    } as unknown as YouthPlayer;
    const p = youthToPlayer(y, USER, rng);
    assert.ok(isValidPos(p.pos), `youthToPlayer(${String(bad)}) → ${p.pos}`);
  }
});

test("6b. subir un juvenil guardado sin posición (partida vieja) deja un jugador con posición", () => {
  load(setup(20, 0));
  const y = {
    ...makeYouth(new Rng(2), "ITA", new Set(), USER, 1),
    pos: undefined,
  } as unknown as YouthPlayer;
  useGame.setState({ academy: [y] } as never);
  assert.equal(state().signYouth(y.id), null);
  const signed = state().players.find((p) => p.id === `p-${y.id}`)!;
  assert.ok(isValidPos(signed.pos));
});

test("7. fichaje: libres y jugadores de otros clubes entran con posición válida", () => {
  const s = setup(20, 0);
  // agente libre con posición corrupta
  const fa = s.freeAgents[0]!;
  (fa as { pos: unknown }).pos = undefined;
  assert.equal(completeSigning(s, fa.id, blankTerms(fa), false), null);
  assert.ok(isValidPos(fa.pos));
  assert.equal(fa.clubId, USER);

  // jugador de otro club con posición corrupta
  const other = s.players.find((p) => p.clubId === "juv" && !p.loanFrom)!;
  (other as { pos: unknown }).pos = "";
  assert.equal(completeSigning(s, other.id, blankTerms(other), false), null);
  assert.ok(isValidPos(other.pos));
  assert.equal(other.loanFrom, null);

  // fichaje de la IA
  const ai = s.freeAgents[1]!;
  (ai as { pos: unknown }).pos = null;
  signFreeAgent(s, ai, "bar");
  assert.ok(isValidPos(ai.pos));
});

test("un fichaje conserva la foto asignada por el club de origen", () => {
  const s = createCareer(USER, 13);
  s.budget = 5_000_000_000;
  const player = s.players.find((p) => p.name === "Federico Chiesa");
  assert.ok(player);
  const originalPortrait = playerFaceUrl(player);
  assert.equal(
    originalPortrait,
    "/player-faces/real/Premier%20League/liverpool/Federico%20Chiesa.png",
  );

  assert.equal(completeSigning(s, player.id, blankTerms(player), false), null);
  assert.equal(player.clubId, USER);
  assert.equal(player.portraitUrl, originalPortrait);
  assert.equal(playerFaceUrl(player), originalPortrait);
});

test("la carrera nueva y una temporada completa no dejan a nadie sin posición", () => {
  const s = createCareer(USER, 7);
  const check = (
    label: string,
    list: Array<{ name: string; pos: unknown }>,
  ) => {
    const bad = list.filter((p) => !isValidPos(p.pos));
    assert.equal(
      bad.length,
      0,
      `${label}: ${bad.map((p) => `${p.name}=${String(p.pos)}`).join(", ")}`,
    );
  };
  check("jugadores", s.players);
  check("libres", s.freeAgents);
  check("cantera", s.academy);
  // los antiguos LM/RM de names.ts ahora son extremos
  for (const nm of ["Joaquín Gho", "Juan Velázquez", "Facundo Waller"]) {
    const p = s.players.find((x) => x.name === nm);
    if (p) assert.ok(p.pos === "LW" || p.pos === "RW", `${nm} → ${p.pos}`);
  }
  const rng = new Rng(21);
  for (let w = 1; w <= 40; w++) {
    s.week = w;
    processMarketWeek(s, rng);
  }
  check("jugadores tras 40 semanas de mercado", s.players);
  check("libres tras 40 semanas de mercado", s.freeAgents);
  const next = evolveSeason(s);
  check("jugadores tras el cierre de temporada", next.players);
  check("libres tras el cierre de temporada", next.freeAgents);
});

test("el cierre de temporada repara posiciones dañadas y regenera retirados con posición", () => {
  const s = createCareer(USER, 8);
  const old = s.players.filter((p) => p.clubId !== USER).slice(0, 5);
  const retirementChecks = old.map((p) => ({
    id: p.id,
    nat: p.nat,
    pos: normalizePos(p.pos, undefined, p),
    clubId: p.clubId,
  }));
  for (const p of old) {
    (p as { pos: unknown }).pos = undefined;
    p.age = 40; // se retira → regen
  }
  const broken = s.players.filter((p) => p.clubId !== USER).slice(10, 14);
  for (const p of broken) (p as { pos: unknown }).pos = "";
  const next = evolveSeason(s);
  assert.equal(next.players.filter((p) => !isValidPos(p.pos)).length, 0);
  for (const retired of retirementChecks) {
    assert.equal(
      next.players.some((p) => p.id === retired.id),
      false,
      "un jugador de IA de 40 años debe retirarse",
    );
    assert.ok(
      next.players.some(
        (p) =>
          !s.players.some((previous) => previous.id === p.id) &&
          p.age >= 16 &&
          p.age <= 18 &&
          p.portraitUrl?.startsWith("/player-faces/wonderkids/atlas-") &&
          p.nat === retired.nat &&
          p.pos === retired.pos &&
          clubById(p.clubId).league === clubById(retired.clubId).league,
      ),
      "el jugador de IA retirado debe tener un regen en la misma liga",
    );
  }
  assert.equal(repairPositions([{ pos: "" }, { pos: "CB" }, {}]), 2);
});

/* ── Ownership helper ─────────────────────────────────────────────── */

test("ownershipBlockReason distingue propio, cedido que llegó y cedido prestado fuera", () => {
  const s = setup(20, 1);
  const own = ownOf(s)[0]!;
  const guest = loanedInOf(s)[0]!;
  const lent = ownOf(s)[1]!;
  lent.clubId = LENDER;
  lent.loanFrom = USER;
  assert.equal(ownershipBlockReason(own, USER), null);
  assert.match(ownershipBlockReason(guest, USER)!, /propietario/);
  assert.match(ownershipBlockReason(lent, USER)!, /cedido/);
  assert.equal(saleBlockReason(s, own as Player), null);
});

test("un agente libre fichado no se puede vender hasta la próxima temporada", () => {
  const s = setup(SQUAD_MIN + 1, 0);
  const freeAgent = s.freeAgents[0]!;
  assert.equal(
    completeSigning(s, freeAgent.id, blankTerms(freeAgent), false),
    null,
  );
  const own = s.players.find((player) => player.id === freeAgent.id)!;

  assert.equal(own.freeAgentSignedSeason, s.season);
  assert.match(saleBlockReason(s, own)!, /próxima temporada/);
  assert.equal(saleBlockReason({ ...s, season: s.season + 1 }, own), null);
});

test("una oferta de cesión aceptada conserva el precio pactado de compra", () => {
  const s = setup(SQUAD_MIN + 1, 0);
  const player = ownOf(s)[0]!;
  const fee = 2_500_000;
  s.offers.push({
    id: "loan-option-offer",
    kind: "loan",
    playerId: player.id,
    fromClubId: LENDER,
    toClubId: s.clubId,
    fee: 250_000,
    loanSeasons: 2,
    loanOptionFee: fee,
    week: s.week,
    unsolicited: false,
  });

  assert.equal(acceptOffer(s, "loan-option-offer"), null);
  const loan = s.loans.find((item) => item.playerId === player.id)!;
  assert.equal(loan.buyOptionFee, fee);
  assert.equal(player.loanFrom, s.clubId);
});

test("ejercer la opción de compra transfiere la propiedad y cobra el precio acordado", () => {
  const s = setup(0, 0);
  const player = s.players.find(
    (candidate) => candidate.clubId === LENDER && !candidate.loanFrom,
  )!;
  const fee = 2_500_000;
  player.clubId = s.clubId;
  player.loanFrom = LENDER;
  player.loanSeasons = 2;
  s.loans.push({
    playerId: player.id,
    fromClubId: LENDER,
    toClubId: s.clubId,
    seasonsLeft: 2,
    fee: 250_000,
    buyOptionFee: fee,
  });
  const budgetBefore = s.budget;

  assert.equal(exerciseLoanOption(s, player.id), null);
  assert.equal(s.budget, budgetBefore - fee);
  assert.equal(player.loanFrom, null);
  assert.equal(player.loanSeasons, 0);
  assert.equal(
    s.loans.some((item) => item.playerId === player.id),
    false,
  );
  assert.equal(s.transferLog.at(-1)?.fee, fee);
});

test("la opción de compra caduca si el jugador vuelve al acabar la cesión", () => {
  const s = setup(0, 1);
  const player = loanedInOf(s)[0]!;
  const loan = s.loans.find((item) => item.playerId === player.id)!;
  loan.buyOptionFee = 3_000_000;
  loan.seasonsLeft = 1;

  resolveLoans(s);

  assert.equal(player.loanFrom, null);
  assert.equal(
    s.loans.some((item) => item.playerId === player.id),
    false,
  );
});

test("un club receptor ejerce automáticamente una opción favorable si puede pagarla", () => {
  const s = setup(SQUAD_MIN + 1, 0);
  const player = ownOf(s)[0]!;
  const fee = 1_000;
  player.clubId = LENDER;
  player.loanFrom = s.clubId;
  player.loanSeasons = 1;
  const budgetBefore = s.budget;
  s.loans.push({
    playerId: player.id,
    fromClubId: s.clubId,
    toClubId: LENDER,
    seasonsLeft: 1,
    fee: 100_000,
    buyOptionFee: fee,
  });

  resolveLoans(s);

  assert.equal(player.clubId, LENDER);
  assert.equal(player.loanFrom, null);
  assert.equal(s.budget, budgetBefore + fee);
  assert.equal(s.transferLog[0]?.fee, fee);
});
