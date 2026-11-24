import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PLAYER_FACE_CLUBS } from "./player-face-roster-config.mjs";
import { normalizePlayerName } from "./normalize-player-name.mjs";

const root = process.cwd();
const pendingRoot = path.join(root, "FACES", "poner");
const realRoot = path.join(root, "FACES", "Realplayersfaces");
const outputPath = path.join(root, "src", "lib", "game", "current-face-squads.ts");
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const alreadyMovedLeagues = new Set([
  "Bundesliga",
  "Ligue 1",
  "Premier League",
  "SERIE A",
]);
const countryCodes = new Map(
  [
    ["Albania", "ALB"],
    ["Algeria", "ALG"],
    ["Andorra", "AND"],
    ["Angola", "ANG"],
    ["Argentina", "ARG"],
    ["Armenia", "ARM"],
    ["Australia", "AUS"],
    ["Austria", "AUT"],
    ["Azerbaijan", "AZE"],
    ["Belarus", "BLR"],
    ["Belgium", "BEL"],
    ["Benin", "BEN"],
    ["Bolivia", "BOL"],
    ["Bosnia-Herzegovina", "BIH"],
    ["Bosnia and Herzegovina", "BIH"],
    ["Brazil", "BRA"],
    ["Bulgaria", "BUL"],
    ["Burkina Faso", "BFA"],
    ["Cameroon", "CMR"],
    ["Canada", "CAN"],
    ["Cape Verde", "CPV"],
    ["Chile", "CHI"],
    ["China", "CHN"],
    ["China PR", "CHN"],
    ["Colombia", "COL"],
    ["Congo", "CGO"],
    ["Congo DR", "COD"],
    ["DR Congo", "COD"],
    ["Congo, Democratic Republic of the", "COD"],
    ["Costa Rica", "CRC"],
    ["Croatia", "CRO"],
    ["Cyprus", "CYP"],
    ["Czech Republic", "CZE"],
    ["Czechia", "CZE"],
    ["Denmark", "DEN"],
    ["Democratic Republic of the Congo", "COD"],
    ["Ecuador", "ECU"],
    ["Egypt", "EGY"],
    ["England", "ENG"],
    ["Estonia", "EST"],
    ["Finland", "FIN"],
    ["France", "FRA"],
    ["French Guiana", "GUF"],
    ["Gabon", "GAB"],
    ["Gambia", "GAM"],
    ["Georgia", "GEO"],
    ["Germany", "GER"],
    ["Ghana", "GHA"],
    ["Greece", "GRE"],
    ["Guinea", "GUI"],
    ["Guinea-Bissau", "GNB"],
    ["Hungary", "HUN"],
    ["Iceland", "ISL"],
    ["Iran", "IRN"],
    ["Iraq", "IRQ"],
    ["Ireland", "IRL"],
    ["Israel", "ISR"],
    ["Italy", "ITA"],
    ["Ivory Coast", "CIV"],
    ["Cote d'Ivoire", "CIV"],
    ["Jamaica", "JAM"],
    ["Japan", "JPN"],
    ["Kazakhstan", "KAZ"],
    ["Kenya", "KEN"],
    ["Kosovo", "KOS"],
    ["Latvia", "LVA"],
    ["Lithuania", "LTU"],
    ["Luxembourg", "LUX"],
    ["Mali", "MLI"],
    ["Malta", "MLT"],
    ["Mexico", "MEX"],
    ["Moldova", "MDA"],
    ["Montenegro", "MNE"],
    ["Morocco", "MAR"],
    ["Netherlands", "NED"],
    ["New Caledonia", "NCD"],
    ["New Zealand", "NZL"],
    ["Nigeria", "NGA"],
    ["North Macedonia", "MKD"],
    ["Northern Ireland", "NIR"],
    ["Norway", "NOR"],
    ["Panama", "PAN"],
    ["Paraguay", "PAR"],
    ["Peru", "PER"],
    ["Poland", "POL"],
    ["Portugal", "POR"],
    ["Republic of the Congo", "CGO"],
    ["Romania", "ROU"],
    ["Russia", "RUS"],
    ["Saudi Arabia", "KSA"],
    ["Scotland", "SCO"],
    ["Senegal", "SEN"],
    ["Serbia", "SRB"],
    ["Slovakia", "SVK"],
    ["Slovenia", "SVN"],
    ["South Africa", "RSA"],
    ["South Korea", "KOR"],
    ["Spain", "ESP"],
    ["Sweden", "SWE"],
    ["Switzerland", "SUI"],
    ["Togo", "TOG"],
    ["Tunisia", "TUN"],
    ["Turkey", "TUR"],
    ["Türkiye", "TUR"],
    ["Ukraine", "UKR"],
    ["United States", "USA"],
    ["United States of America", "USA"],
    ["Uruguay", "URU"],
    ["Venezuela", "VEN"],
    ["Wales", "WAL"],
    ["Zambia", "ZAM"],
    ["Afghanistan", "AFG"],
    ["Antigua and Barbuda", "ATG"],
    ["Bahamas", "BAH"],
    ["Bahrain", "BHR"],
    ["Bangladesh", "BAN"],
    ["Barbados", "BRB"],
    ["Belize", "BLZ"],
    ["Bermuda", "BER"],
    ["Bhutan", "BHU"],
    ["Brunei", "BRU"],
    ["Burundi", "BDI"],
    ["Cambodia", "CAM"],
    ["Central African Republic", "CTA"],
    ["Chad", "CHA"],
    ["Comoros", "COM"],
    ["Cuba", "CUB"],
    ["Curacao", "CUW"],
    ["Dominica", "DMA"],
    ["Dominican Republic", "DOM"],
    ["Djibouti", "DJI"],
    ["El Salvador", "SLV"],
    ["Equatorial Guinea", "EQG"],
    ["Eritrea", "ERI"],
    ["Ethiopia", "ETH"],
    ["Grenada", "GRN"],
    ["Guatemala", "GUA"],
    ["Guyana", "GUY"],
    ["Haiti", "HAI"],
    ["Honduras", "HON"],
    ["India", "IND"],
    ["Indonesia", "IDN"],
    ["Jordan", "JOR"],
    ["Kuwait", "KUW"],
    ["Kyrgyzstan", "KGZ"],
    ["Laos", "LAO"],
    ["Lebanon", "LBN"],
    ["Liberia", "LBR"],
    ["Libya", "LBY"],
    ["Madagascar", "MAD"],
    ["Malawi", "MWI"],
    ["Malaysia", "MAS"],
    ["Maldives", "MDV"],
    ["Mauritania", "MTN"],
    ["Mauritius", "MRI"],
    ["Mongolia", "MNG"],
    ["Montserrat", "MSR"],
    ["Mozambique", "MOZ"],
    ["Myanmar", "MYA"],
    ["Namibia", "NAM"],
    ["Nepal", "NEP"],
    ["Nicaragua", "NCA"],
    ["Niger", "NIG"],
    ["North Korea", "PRK"],
    ["Oman", "OMA"],
    ["Pakistan", "PAK"],
    ["Philippines", "PHI"],
    ["Puerto Rico", "PUR"],
    ["Qatar", "QAT"],
    ["Rwanda", "RWA"],
    ["Saint Kitts and Nevis", "SKN"],
    ["Saint Lucia", "LCA"],
    ["Saint Vincent and the Grenadines", "VIN"],
    ["Sao Tome and Principe", "STP"],
    ["Seychelles", "SEY"],
    ["Sierra Leone", "SLE"],
    ["Singapore", "SIN"],
    ["Somalia", "SOM"],
    ["South Sudan", "SSD"],
    ["Sri Lanka", "SRI"],
    ["Sudan", "SDN"],
    ["Suriname", "SUR"],
    ["Syria", "SYR"],
    ["Tajikistan", "TJK"],
    ["Tanzania", "TAN"],
    ["Thailand", "THA"],
    ["Trinidad and Tobago", "TRI"],
    ["Turkmenistan", "TKM"],
    ["Turks and Caicos Islands", "TCA"],
    ["Uganda", "UGA"],
    ["United Arab Emirates", "UAE"],
    ["Uzbekistan", "UZB"],
    ["Vietnam", "VIE"],
    ["Zimbabwe", "ZIM"],
  ].map(([name, code]) => [normalizePlayerName(name), code]),
);
const nationalityAliases = new Map([
  ["CRM", "CMR"],
  ["KORS", "KOR"],
  ["LIB", "LBN"],
  ["PAL", "PLE"],
  ["MARQ", "MAR"],
  ["MOR", "MAR"],
  ["MTG", "MNE"],
  ["RDC", "COD"],
  ["ROM", "ROU"],
  ["SBA", "SRB"],
  ["XKX", "KOS"],
]);

async function directories(directory) {
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
    .map((entry) => entry.name);
}

async function imageNames(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return new Set(
    entries
      .filter(
        (entry) =>
          entry.isFile() &&
          imageExtensions.has(path.extname(entry.name).toLowerCase()),
      )
      .map((entry) => path.parse(entry.name).name),
  );
}

async function teamsFrom(sourceRoot, allowedLeagues) {
  const teams = [];
  for (const leagueName of await directories(sourceRoot)) {
    if (allowedLeagues && !allowedLeagues.has(leagueName)) continue;
    const leagueRoot = path.join(sourceRoot, leagueName);
    for (const teamName of await directories(leagueRoot)) {
      teams.push({
        folder: teamName,
        path: path.join(leagueRoot, teamName),
        source: `${leagueName}/${teamName}`,
      });
    }
  }
  return teams;
}

async function sourceTeams() {
  const pendingTeams = await teamsFrom(pendingRoot);
  const pendingTeamsWithPhotos = [];
  for (const team of pendingTeams) {
    if ((await imageNames(team.path)).size) pendingTeamsWithPhotos.push(team);
  }
  if (pendingTeamsWithPhotos.length) return pendingTeamsWithPhotos;
  return teamsFrom(realRoot, alreadyMovedLeagues);
}

function nameTokens(value) {
  return value
    .split(/[\s_]+/)
    .map(normalizePlayerName)
    .filter((token) => token.length > 1);
}

function oneEditApart(left, right) {
  if (Math.abs(left.length - right.length) > 1) return false;
  let leftIndex = 0;
  let rightIndex = 0;
  let edits = 0;
  while (leftIndex < left.length && rightIndex < right.length) {
    if (left[leftIndex] === right[rightIndex]) {
      leftIndex += 1;
      rightIndex += 1;
    } else {
      edits += 1;
      if (edits > 1) return false;
      if (left.length > right.length) leftIndex += 1;
      else if (right.length > left.length) rightIndex += 1;
      else {
        leftIndex += 1;
        rightIndex += 1;
      }
    }
  }
  return edits + Number(leftIndex < left.length || rightIndex < right.length) <= 1;
}

function faceMatchScore(photoName, playerName) {
  const photoKey = normalizePlayerName(photoName);
  const playerKey = normalizePlayerName(playerName);
  if (photoKey === playerKey) return 4;
  if (photoKey.startsWith(playerKey)) return 3;

  const photoTokens = nameTokens(photoName);
  const playerTokens = nameTokens(playerName);
  const sameTokens =
    photoTokens.length > 1 &&
    photoTokens.length === playerTokens.length &&
    photoTokens.every((token) => playerTokens.includes(token));
  if (sameTokens) return 2;
  if (photoTokens.length === 1 && playerTokens.includes(photoTokens[0])) return 1;
  if (
    photoTokens.length >= 2 &&
    playerTokens.length >= 2 &&
    photoTokens.at(-1) === playerTokens.at(-1) &&
    oneEditApart(photoTokens[0], playerTokens[0])
  ) {
    return 1;
  }
  return 0;
}

function assignPlayersToFaceFolders(rosters) {
  const players = rosters.flatMap((roster) =>
    roster.players.map((player) => ({ player, roster })),
  );
  const requests = new Map();
  let unmatchedPhotos = 0;

  for (const roster of rosters) {
    for (const photoName of roster.faceNames) {
      const scored = players
        .map((entry) => ({
          ...entry,
          score: faceMatchScore(photoName, entry.player.name),
        }))
        .filter((entry) => entry.score > 0);
      if (!scored.length) {
        unmatchedPhotos += 1;
        continue;
      }

      const topScore = Math.max(...scored.map((entry) => entry.score));
      const topMatches = scored.filter((entry) => entry.score === topScore);
      const localMatches = topMatches.filter(
        (entry) => entry.roster.clubId === roster.clubId,
      );
      const match =
        localMatches.length === 1
          ? localMatches[0]
          : topMatches.length === 1
            ? topMatches[0]
            : null;
      if (!match) {
        unmatchedPhotos += 1;
        continue;
      }

      const destinations = requests.get(match.player.sourceId) ?? new Set();
      destinations.add(roster.clubId);
      requests.set(match.player.sourceId, destinations);
    }
  }

  const originalLocations = new Map(
    players.map(({ player, roster }) => [player.sourceId, roster]),
  );
  let movedPlayers = 0;
  for (const [sourceId, destinations] of requests) {
    const sourceRoster = originalLocations.get(sourceId);
    if (!sourceRoster) continue;

    const destinationId = destinations.has(sourceRoster.clubId)
      ? sourceRoster.clubId
      : destinations.size === 1
        ? [...destinations][0]
        : null;
    if (!destinationId || destinationId === sourceRoster.clubId) continue;

    const destinationRoster = rosters.find(
      (roster) => roster.clubId === destinationId,
    );
    const player = sourceRoster.players.find(
      (candidate) => candidate.sourceId === sourceId,
    );
    if (!destinationRoster || !player) continue;
    sourceRoster.players = sourceRoster.players.filter(
      (candidate) => candidate.sourceId !== sourceId,
    );
    destinationRoster.players.push(player);
    movedPlayers += 1;
  }

  return { movedPlayers, unmatchedPhotos };
}

function deduplicateRosterPlayers(rosters) {
  const entriesById = new Map();
  for (const roster of rosters) {
    for (const player of roster.players) {
      const entries = entriesById.get(player.sourceId) ?? [];
      entries.push({ player, roster });
      entriesById.set(player.sourceId, entries);
    }
  }

  let removed = 0;
  for (const entries of entriesById.values()) {
    if (entries.length < 2) continue;
    const pictured = entries.filter(({ player, roster }) =>
      [...roster.faceNames].some(
        (photoName) =>
          normalizePlayerName(photoName) === normalizePlayerName(player.name),
      ),
    );
    const selected = pictured.length ? pictured[0] : entries[0];
    for (const { roster } of entries) {
      roster.players = roster.players.filter(
        (player) =>
          player.sourceId !== selected.player.sourceId ||
          player === selected.player,
      );
    }
    removed += entries.length - 1;
  }
  return removed;
}

function mapPosition(athlete) {
  const abbreviation = athlete.position?.abbreviation?.toUpperCase();
  if (abbreviation === "G" || abbreviation === "GK") return "GK";
  if (abbreviation === "D" || abbreviation === "DEF") return "CB";
  if (abbreviation === "M" || abbreviation === "MID") return "CM";
  if (abbreviation === "F" || abbreviation === "FW") return "ST";

  const label = athlete.position?.displayName?.toLowerCase() ?? "";
  if (label.includes("goalkeeper")) return "GK";
  if (label.includes("defend")) return "CB";
  if (label.includes("midfield")) return "CM";
  if (label.includes("forward") || label.includes("attack")) return "ST";
  return null;
}

async function countryCode(countryName) {
  const known = countryCodes.get(normalizePlayerName(countryName));
  if (known) return known;

  throw new Error(`No game nationality code for ${countryName}`);
}

async function transfermarktPlayerData(athlete, team) {
  const query = encodeURIComponent(athlete.fullName);
  const search = await fetch(
    `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${query}`,
    { headers: { "User-Agent": "Mozilla/5.0" } },
  );
  if (!search.ok) {
    throw new Error(`Transfermarkt search failed (${search.status}): ${athlete.fullName}`);
  }
  const searchHtml = await search.text();
  const profiles = [
    ...searchHtml.matchAll(/href="(\/[^"]+\/profil\/spieler\/\d+)"/g),
  ].map((match) => match[1]);
  const profilePath = profiles.find((candidate) => {
    const slug = candidate.split("/")[1];
    return normalizePlayerName(slug) === normalizePlayerName(athlete.fullName);
  });
  if (!profilePath) return null;

  const profile = await fetch(`https://www.transfermarkt.com${profilePath}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!profile.ok) {
    throw new Error(`Transfermarkt profile failed (${profile.status}): ${athlete.fullName}`);
  }
  const html = await profile.text();
  const ageMatch = html.match(
    /itemprop="birthDate"[^>]*>[\s\S]*?(\d{1,2})\/(\d{1,2})\/(\d{4})\s*\((\d{1,2})\)/,
  );
  const nationalityBlock = html.match(
    /itemprop="nationality"[^>]*>([\s\S]*?)<\/span>/,
  )?.[1];
  const nationality = nationalityBlock?.match(/(?:title|alt)="([^"]+)"/)?.[1];
  let nat;
  if (nationality) {
    try {
      nat = await countryCode(nationality);
    } catch (error) {
      if (!error.message.startsWith("No game nationality code for ")) throw error;
    }
  }
  const description =
    html.match(/<meta name="description" content="([^"]+)"/)?.[1] ?? "";
  const positionLabel = description.match(/➤\s*([^➤]+)\s*➤/)?.[1]?.trim();
  const position = positionLabel
    ? /goalkeeper/i.test(positionLabel)
      ? "GK"
      : /defen[cs]/i.test(positionLabel)
        ? "CB"
        : /midfield/i.test(positionLabel)
          ? "CM"
          : /attack|forward/i.test(positionLabel)
            ? "ST"
            : null
    : null;
  return {
    age: ageMatch ? Number(ageMatch[4]) : undefined,
    nat,
    position,
  };
}

function ageFromDateOfBirth(dateOfBirth) {
  const birthDate = new Date(dateOfBirth);
  if (!Number.isFinite(birthDate.getTime())) return Number.NaN;
  const today = new Date();
  return (
    today.getUTCFullYear() -
    birthDate.getUTCFullYear() -
    Number(
      today.getUTCMonth() < birthDate.getUTCMonth() ||
        (today.getUTCMonth() === birthDate.getUTCMonth() &&
          today.getUTCDate() < birthDate.getUTCDate()),
    )
  );
}

async function fetchRoster(team) {
  const config = PLAYER_FACE_CLUBS[normalizePlayerName(team.folder)];
  if (!config?.league || !config.teamId) {
    throw new Error(`No roster source configured for ${team.source}`);
  }

  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${config.league}/teams/${config.teamId}/roster`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ESPN roster request failed (${response.status}): ${team.source}`);
  }

  const payload = await response.json();
  if (
    String(payload.team?.id) !== config.teamId ||
    !Array.isArray(payload.athletes) ||
    !payload.athletes.length
  ) {
    throw new Error(`Unexpected ESPN roster response for ${team.source}`);
  }

  const faceNames = await imageNames(team.path);
  const faces = new Set(
    [...faceNames].map((name) => normalizePlayerName(name)),
  );
  let faceMatches = 0;
  const skippedPlayers = [];
  const players = (
    await mapWithConcurrency(payload.athletes, 4, async (athlete) => {
      let age = Number.isInteger(athlete.age)
        ? athlete.age
        : ageFromDateOfBirth(athlete.dateOfBirth);
      let nat = athlete.citizenshipCountry?.abbreviation;
      nat = nationalityAliases.get(nat) ?? nat;
      if (
        (!Number.isInteger(age) || !nat) &&
        !faces.has(normalizePlayerName(athlete.fullName))
      ) {
        skippedPlayers.push(
          `${athlete.fullName}: missing age or nationality; no exact photo match`,
        );
        return null;
      }
      let position = mapPosition(athlete);
      if (!Number.isInteger(age) || !nat || !position) {
        const supplemental = await transfermarktPlayerData(athlete, team);
        if (!supplemental) {
          skippedPlayers.push(
            `${athlete.fullName}: missing age, nationality, or position; no exact supplemental profile`,
          );
          return null;
        }
        age = Number.isInteger(age) ? age : supplemental.age ?? Number.NaN;
        nat ??= supplemental.nat;
        position ??= supplemental.position;
      }
      if (!athlete.id || !athlete.fullName) {
        throw new Error(
          `Missing ESPN player identity in ${team.source}: ${athlete.fullName ?? athlete.id}`,
        );
      }
      const missingDetails = [];
      if (!Number.isInteger(age) || age < 15 || age > 50) {
        missingDetails.push("age");
      }
      if (!nat) missingDetails.push("nationality");
      if (!position) missingDetails.push("position");
      if (missingDetails.length) {
        skippedPlayers.push(
          `${athlete.fullName}: missing verified ${missingDetails.join(", ")}`,
        );
        return null;
      }

      if (faces.has(normalizePlayerName(athlete.fullName))) faceMatches += 1;
      return {
        sourceId: `espn-${athlete.id}`,
        name: athlete.fullName,
        pos: position,
        age,
        nat,
      };
    })
  ).filter(Boolean);

  return {
    clubId: config.clubId,
    players,
    faceCount: faces.size,
    faceMatches,
    skippedPlayers,
    faceNames: [...faceNames],
    source: team.source,
  };
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await mapper(items[index]);
      }
    }),
  );
  return results;
}

const teams = await sourceTeams();
if (!teams.length) throw new Error("No organized face folders found.");

const rosters = await mapWithConcurrency(teams, 5, fetchRoster);
const duplicatePlayersRemoved = deduplicateRosterPlayers(rosters);
const faceAssignments = assignPlayersToFaceFolders(rosters);
const byClub = {};
const sourceIds = new Set();
for (const roster of rosters) {
  if (byClub[roster.clubId]) {
    throw new Error(`Multiple face folders map to game club ${roster.clubId}`);
  }
  for (const player of roster.players) {
    if (sourceIds.has(player.sourceId)) {
      throw new Error(`Duplicate ESPN player id: ${player.sourceId}`);
    }
    sourceIds.add(player.sourceId);
  }
  byClub[roster.clubId] = roster.players;
}

let previousByClub = {};
try {
  const previousSource = await readFile(outputPath, "utf8");
  const objectStart = previousSource.indexOf(
    "{",
    previousSource.indexOf("export const CURRENT_FACE_SQUADS:"),
  );
  const objectEnd = previousSource.lastIndexOf("};");
  if (objectStart < 0 || objectEnd < objectStart) {
    throw new Error(`Could not parse existing generated squads at ${outputPath}`);
  }
  previousByClub = JSON.parse(previousSource.slice(objectStart, objectEnd + 1));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const refreshedClubIds = new Set(rosters.map((roster) => roster.clubId));
const refreshedSourceIds = new Set(
  rosters.flatMap((roster) => roster.players.map((player) => player.sourceId)),
);
const combinedByClub = { ...previousByClub };
for (const [clubId, players] of Object.entries(previousByClub)) {
  if (refreshedClubIds.has(clubId)) continue;
  combinedByClub[clubId] = players.filter(
    (player) => !refreshedSourceIds.has(player.sourceId),
  );
}
Object.assign(combinedByClub, byClub);

const generated = [
  'import type { Pos } from "./types";',
  "",
  "export type CurrentFacePlayerSeed = {",
  "  sourceId: string;",
  "  name: string;",
  "  pos: Pos;",
  "  age: number;",
  "  nat: string;",
  "};",
  "",
  `/** Generated from ESPN 2026/27 squad pages on ${new Date().toISOString().slice(0, 10)}. */`,
  "export const CURRENT_FACE_SQUADS: Record<string, CurrentFacePlayerSeed[]> = ",
  `${JSON.stringify(combinedByClub, null, 2)};`,
  "",
].join("\n");

await writeFile(outputPath, generated);

const totalPlayers = rosters.reduce((total, roster) => total + roster.players.length, 0);
const totalPhotos = rosters.reduce((total, roster) => total + roster.faceCount, 0);
const matchedPhotos = rosters.reduce((total, roster) => total + roster.faceMatches, 0);
const skippedPlayers = rosters.flatMap((roster) =>
  roster.skippedPlayers.map((player) => `${roster.source}: ${player}`),
);
console.log(
  `Updated ${totalPlayers} players for ${rosters.length} clubs; removed ${duplicatePlayersRemoved} duplicate roster entries; preserved ${Object.keys(previousByClub).filter((clubId) => !refreshedClubIds.has(clubId)).length} other club rosters; ${matchedPhotos}/${totalPhotos} photo names match exactly; reassigned ${faceAssignments.movedPlayers} players to their photo folders; ${faceAssignments.unmatchedPhotos} photos did not match a current roster; skipped ${skippedPlayers.length} records with incomplete age or nationality.`,
);
if (skippedPlayers.length) console.log(`Skipped records:\n${skippedPlayers.join("\n")}`);
for (const roster of rosters) {
  console.log(
    `${roster.source}: ${roster.players.length} players, ${roster.faceMatches}/${roster.faceCount} exact photo matches`,
  );
}
