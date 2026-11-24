import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { statSync } from "node:fs";
import path from "node:path";
import { PLAYER_FACE_CLUBS } from "./player-face-roster-config.mjs";
import { normalizePlayerName } from "./normalize-player-name.mjs";

const root = process.cwd();
const pendingSource = path.join(root, "FACES", "poner");
const realSource = path.join(root, "FACES", "Realplayersfaces");
const realDestination = path.join(root, "public", "player-faces", "real");
const faceIndexDestination = path.join(
  root,
  "src",
  "lib",
  "game",
  "real-player-face-index.ts",
);

const clubIdsByTeam = new Map(
  Object.entries(PLAYER_FACE_CLUBS).map(([team, club]) => [team, club.clubId]),
);
const photoExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);

async function pngFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return pngFiles(entryPath);
      return entry.isFile() && photoExtensions.has(path.extname(entry.name).toLowerCase())
        ? [entryPath]
        : [];
    }),
  );
  return files.flat();
}

async function entriesIfPresent(directory) {
  try {
    return await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

async function copyPendingFaces() {
  const copies = [];
  let alreadyPresent = 0;
  const leagues = (await entriesIfPresent(pendingSource)).filter((entry) =>
    entry.isDirectory() && !entry.name.startsWith("_"),
  );

  for (const league of leagues) {
    const sourceLeague = path.join(pendingSource, league.name);
    const teams = await entriesIfPresent(sourceLeague);
    for (const team of teams.filter(
      (entry) => entry.isDirectory() && !entry.name.startsWith("_"),
    )) {
      if (!clubIdsByTeam.has(normalizePlayerName(team.name))) {
        throw new Error(`Unknown club folder in FACES/poner: ${team.name}`);
      }

      const sourceTeam = path.join(sourceLeague, team.name);
      const destinationTeam = path.join(realSource, league.name, team.name);
      const destinationNames = new Set(
        (await entriesIfPresent(destinationTeam)).map((entry) => entry.name),
      );

      for (const entry of await readdir(sourceTeam, { withFileTypes: true })) {
        if (
          !entry.isFile() ||
          !photoExtensions.has(path.extname(entry.name).toLowerCase())
        ) {
          continue;
        }

        if (destinationNames.has(entry.name)) {
          const sourcePath = path.join(sourceTeam, entry.name);
          const destinationPath = path.join(destinationTeam, entry.name);
          const [sourceContents, destinationContents] = await Promise.all([
            readFile(sourcePath),
            readFile(destinationPath),
          ]);
          if (!sourceContents.equals(destinationContents)) {
            throw new Error(
              `Face already exists with different content; refusing to overwrite: ${destinationPath}`,
            );
          }
          alreadyPresent++;
          continue;
        }

        copies.push({
          source: path.join(sourceTeam, entry.name),
          destination: path.join(destinationTeam, entry.name),
        });
      }
    }
  }

  playerFaceIndex(
    [...(await pngFiles(realSource)), ...copies.map((copy) => copy.destination)],
    new Map(copies.map((copy) => [copy.destination, copy.source])),
  );

  for (const copy of copies) {
    await mkdir(path.dirname(copy.destination), { recursive: true });
    await copyFile(copy.source, copy.destination);
  }

  return { copied: copies.length, alreadyPresent };
}

async function copyOtherFaces() {
  const sourceDirectory = path.join(pendingSource, "Otros");
  const entries = (await entriesIfPresent(sourceDirectory)).filter(
    (entry) =>
      entry.isFile() &&
      photoExtensions.has(path.extname(entry.name).toLowerCase()),
  );
  const destinationNames = new Set(
    (await entriesIfPresent(realDestination)).map((entry) => entry.name),
  );
  let copied = 0;
  let alreadyPresent = 0;

  for (const entry of entries) {
    const sourcePath = path.join(sourceDirectory, entry.name);
    const destinationPath = path.join(realDestination, entry.name);
    if (destinationNames.has(entry.name)) {
      const [sourceContents, destinationContents] = await Promise.all([
        readFile(sourcePath),
        readFile(destinationPath),
      ]);
      if (!sourceContents.equals(destinationContents)) {
        throw new Error(
          `Face already exists with different content; refusing to overwrite: ${destinationPath}`,
        );
      }
      alreadyPresent++;
      continue;
    }

    await copyFile(sourcePath, destinationPath);
    copied++;
  }

  return { copied, alreadyPresent };
}

function playerFaceIndex(files, sourcePaths = new Map()) {
  const index = {};
  const indexedFiles = {};

  for (const file of files) {
    const relative = path.relative(realSource, file);
    const segments = relative.split(path.sep);
    if (segments.length < 3 || segments[1].startsWith("_")) continue;

    const clubId = clubIdsByTeam.get(normalizePlayerName(segments[1]));
    if (!clubId) {
      throw new Error(`Unknown club folder in FACES/Realplayersfaces: ${segments[1]}`);
    }

    const name = normalizePlayerName(path.parse(segments.at(-1)).name);
    const clubFaces = (index[clubId] ??= {});
    const indexedClubFaces = (indexedFiles[clubId] ??= {});
    const sourcePath = sourcePaths.get(file) ?? file;
    if (clubFaces[name]) {
      if (statSync(sourcePath).size > statSync(indexedClubFaces[name]).size) {
        const url = segments.map(encodeURIComponent).join("/");
        clubFaces[name] = `/player-faces/real/${url}`;
        indexedClubFaces[name] = sourcePath;
      }
      continue;
    }

    const url = segments
      .map(encodeURIComponent)
      .join("/");
    clubFaces[name] = `/player-faces/real/${url}`;
    indexedClubFaces[name] = sourcePath;
  }

  return index;
}

await mkdir(realDestination, { recursive: true });

const { copied: copiedFaces, alreadyPresent } = await copyPendingFaces();
const {
  copied: copiedOtherFaces,
  alreadyPresent: alreadyPresentOtherFaces,
} = await copyOtherFaces();
const realFiles = await pngFiles(realSource);
for (const file of realFiles) {
  const relative = path.relative(realSource, file);
  const destination = path.join(realDestination, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(file, destination);
}

const faceIndex = playerFaceIndex(realFiles);
await writeFile(
  faceIndexDestination,
  `export const REAL_PLAYER_FACES_BY_CLUB: Record<string, Record<string, string>> = ${JSON.stringify(faceIndex, null, 2)};\n`,
);

console.log(
  `Copied ${copiedFaces} pending faces and ${copiedOtherFaces} other faces, preserved ${alreadyPresent + alreadyPresentOtherFaces} existing copies, and synced ${realFiles.length + copiedOtherFaces} real photos.`,
);
