import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { composeCurrentFaceSquadSeeds } from "./current-face-squad-seeds.ts";
import { CURRENT_FACE_SQUADS } from "./current-face-squads.ts";
import { NAT_LABEL } from "./format.ts";
import { normalizePlayerName } from "./player-name.ts";
import { REAL_PLAYER_FACES_BY_CLUB } from "./real-player-face-index.ts";

describe("current face squad refresh", () => {
  it("normalizes names with non-decomposing European characters", () => {
    assert.equal(normalizePlayerName("Frederik Rønnow"), "frederikronnow");
    assert.equal(normalizePlayerName("Łukasz Poręba"), "lukaszporeba");
  });

  it("includes each supplied club with valid roster details", () => {
    assert.equal(Object.keys(CURRENT_FACE_SQUADS).length, 371);

    for (const [clubId, players] of Object.entries(CURRENT_FACE_SQUADS)) {
      assert.ok(players.length > 0, `${clubId} has no roster`);
      for (const player of players) {
        assert.ok(NAT_LABEL[player.nat], `${player.name} has unknown nationality ${player.nat}`);
        assert.ok(player.age >= 15 && player.age <= 50, `${player.name} has invalid age`);
      }
    }
  });

  it("uses the Chelsea photo-folder assignment for Martínez and Emegha", () => {
    const chelsea = CURRENT_FACE_SQUADS.che ?? [];
    assert.ok(chelsea.some((player) => player.name === "Emiliano Martínez"));
    assert.ok(chelsea.some((player) => player.name === "Emmanuel Emegha"));
    assert.ok(REAL_PLAYER_FACES_BY_CLUB.che?.[normalizePlayerName("Emiliano Martínez")]);
    assert.ok(REAL_PLAYER_FACES_BY_CLUB.che?.[normalizePlayerName("Emanuel Emegha")]);
  });

  it("includes Federico Chiesa in Liverpool's current roster", () => {
    assert.ok(
      CURRENT_FACE_SQUADS.liv?.some((player) => player.name === "Federico Chiesa"),
    );
    assert.ok(
      REAL_PLAYER_FACES_BY_CLUB.liv?.[normalizePlayerName("Federico Chiesa")],
    );
  });

  it("refreshes current player details and retains high-potential legacy seeds", () => {
    const refreshed = composeCurrentFaceSquadSeeds(
      [
        {
          sourceId: "espn-1",
          name: "Current Player",
          pos: "CB",
          age: 20,
          nat: "ARG",
        },
        {
          sourceId: "espn-2",
          name: "New Prospect",
          pos: "CM",
          age: 18,
          nat: "ENG",
        },
      ],
      [
        {
          name: "Current Player",
          pos: "ST",
          ovr: 74,
          age: 22,
          nat: "ESP",
          pot: 88,
        },
        {
          name: "Potential Regen",
          pos: "RW",
          ovr: 68,
          age: 19,
          nat: "ENG",
          pot: 86,
        },
        {
          name: "Old Squad Player",
          pos: "CM",
          ovr: 66,
          age: 27,
          nat: "FRA",
          pot: 85,
        },
      ],
      80,
    );

    assert.deepEqual(
      refreshed.map((seed) => seed.name),
      ["Current Player", "New Prospect", "Potential Regen"],
    );
    assert.equal(refreshed[0]?.age, 20);
    assert.equal(refreshed[0]?.nat, "ARG");
    assert.equal(refreshed[0]?.pos, "ST");
    assert.equal(refreshed[0]?.pot, 88);
    assert.equal(refreshed[2]?.pot, 86);
  });

  it("estimates ratings for new roster players", () => {
    const [player] = composeCurrentFaceSquadSeeds(
      [
        {
          sourceId: "espn-3",
          name: "New Prospect",
          pos: "CM",
          age: 18,
          nat: "ENG",
        },
      ],
      [],
      80,
    );

    assert.ok(player);
    assert.ok(player.ovr >= 48 && player.ovr <= 91);
    assert.ok(player.pot! > player.ovr);
  });

  it("does not preserve an old high-potential seed after it moves to another refreshed club", () => {
    const refreshed = composeCurrentFaceSquadSeeds(
      [],
      [
        {
          name: "Transferred Player",
          pos: "ST",
          ovr: 75,
          age: 24,
          nat: "ARG",
          pot: 90,
        },
      ],
      80,
      new Set(["transferredplayer"]),
    );

    assert.deepEqual(refreshed, []);
  });

  it("preserves legacy players pictured in their assigned club for new careers", () => {
    const refreshed = composeCurrentFaceSquadSeeds(
      [],
      [
        {
          name: "Aji Alese",
          pos: "CB",
          ovr: 73,
          age: 25,
          nat: "ENG",
        },
        {
          name: "Riccardo Sottil",
          pos: "LW",
          ovr: 77,
          age: 27,
          nat: "ITA",
        },
      ],
      80,
      new Set(),
      "sun",
    );

    assert.deepEqual(refreshed.map((seed) => seed.name), ["Aji Alese"]);

    const fiorentina = composeCurrentFaceSquadSeeds(
      [],
      [
        {
          name: "Riccardo Sottil",
          pos: "LW",
          ovr: 77,
          age: 27,
          nat: "ITA",
        },
      ],
      80,
      new Set(),
      "fio",
    );

    assert.deepEqual(fiorentina.map((seed) => seed.name), ["Riccardo Sottil"]);
  });
});
