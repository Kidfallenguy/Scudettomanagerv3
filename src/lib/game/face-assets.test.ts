import assert from "node:assert/strict";
import { test } from "node:test";
import {
  regenFaceUrl,
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
