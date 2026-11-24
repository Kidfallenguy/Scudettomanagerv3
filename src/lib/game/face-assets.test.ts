import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cachePlayerPortrait,
  playerFaceUrl,
  regenFaceUrl,
  realPlayerFace,
  wonderkidAtlasTile,
  wonderkidFaceForPlayer,
  wonderkidFaceUrl,
} from "./face-assets.ts";
import { WONDERKID_FACE_COUNT } from "./wonderkid-face-config.ts";

test("Wonderkid faces map to the right tile in each atlas", () => {
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
  const lastFace = WONDERKID_FACE_COUNT - 1;
  const lastAtlas = String(Math.floor(lastFace / 64)).padStart(4, "0");
  assert.equal(
    regenFaceUrl(WONDERKID_FACE_COUNT),
    `/player-faces/wonderkids/atlas-${lastAtlas}.webp#${lastFace % 64}`,
  );
  assert.equal(regenFaceUrl(0), wonderkidFaceUrl(1));
});

test("Wonderkid player faces are stable and invalid atlas tiles are rejected", () => {
  const face = wonderkidFaceForPlayer("regen-123");
  assert.equal(wonderkidFaceForPlayer("regen-123"), face);
  assert.ok(wonderkidAtlasTile(face));
  assert.equal(
    wonderkidAtlasTile("/player-faces/wonderkids/atlas-0001.webp#64"),
    null,
  );
});

test("player portraits remain tied to their original club after a transfer", () => {
  const player = {
    id: "b2_fcn-1",
    name: "Adam Markhiev",
    clubId: "b2_fcn",
    portraitUrl: undefined,
  };
  const originalFace = playerFaceUrl(player);

  cachePlayerPortrait(player);
  player.clubId = "b2_dsc";

  assert.notEqual(originalFace, "/player-faces/bajogrlfaces.png");
  assert.equal(playerFaceUrl(player), originalFace);
});

test("New Gen prospects resolve their submitted face assets, including Daniel Curti's photo", () => {
  assert.equal(
    realPlayerFace("Bruno Gonzales"),
    "/player-faces/real/Bruno%20Gonzales.png",
  );
  assert.equal(
    realPlayerFace("Lucas Callahyen"),
    "/player-faces/real/Lucas%20Callahyen.png",
  );
  assert.equal(
    realPlayerFace("Joel Videla"),
    "/player-faces/real/Joel%20Videla.png",
  );
  assert.equal(
    realPlayerFace("Santiago Curti"),
    "/player-faces/real/Santiago%20Curti.png",
  );
  assert.equal(
    realPlayerFace("Daniel Curti"),
    "/player-faces/real/Santiago%20Curti.png",
  );
  assert.equal(
    realPlayerFace("Santiago Bienati"),
    "/player-faces/real/Santiago%20Bienati.png",
  );
  assert.equal(
    realPlayerFace("Tiziano Bolaños"),
    "/player-faces/real/Tiziano%20Bola%C3%B1os.png",
  );
});
