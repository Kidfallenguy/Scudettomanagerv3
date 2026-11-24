import type { CurrentFacePlayerSeed } from "./current-face-squads.ts";
import type { StarSeed } from "./names.ts";
import { realPlayerFaceForClub } from "./face-assets.ts";
import { normalizePlayerName } from "./player-name.ts";

function estimatedCurrentRosterOvr(
  prestige: number,
  player: CurrentFacePlayerSeed,
) {
  let variation = 0;
  for (const character of player.sourceId) {
    variation = (variation * 31 + character.charCodeAt(0)) >>> 0;
  }
  const ageAdjustment =
    player.age <= 20
      ? -3
      : player.age <= 23
        ? -1
        : player.age >= 33
          ? -3
          : player.age >= 30
            ? -1
            : 0;
  return Math.max(
    48,
    Math.min(
      91,
      Math.round(prestige * 0.78 + 12) + (variation % 9) - 4 + ageAdjustment,
    ),
  );
}

function estimatedCurrentRosterPotential(ovr: number, age: number) {
  const room =
    age <= 18 ? 15 : age <= 21 ? 12 : age <= 24 ? 8 : age <= 27 ? 4 : age <= 29 ? 2 : 0;
  const raw = Math.min(95, ovr + room);
  return raw > 88 ? 88 + Math.round((raw - 88) * 0.5) : raw;
}

export function composeCurrentFaceSquadSeeds(
  current: CurrentFacePlayerSeed[],
  previous: StarSeed[],
  prestige: number,
  currentPlayerNamesElsewhere = new Set<string>(),
  clubId?: string,
): StarSeed[] {
  const previousByName = new Map<string, StarSeed>();
  for (const seed of previous) {
    const key = normalizePlayerName(seed.name);
    if (!previousByName.has(key)) previousByName.set(key, seed);
  }

  const currentNames = new Set(current.map((player) => normalizePlayerName(player.name)));
  const refreshed = current.map((player) => {
    const old = previousByName.get(normalizePlayerName(player.name));
    const ovr = old?.ovr ?? estimatedCurrentRosterOvr(prestige, player);
    return {
      ...player,
      pos: old?.pos ?? player.pos,
      ovr,
      pot:
        old?.pot ??
        (old && old.ovr > 85
          ? old.ovr
          : estimatedCurrentRosterPotential(ovr, player.age)),
    };
  });
  const preservedRegens = previous.filter(
    (seed) =>
      ((seed.pot ?? seed.ovr) > 85 ||
        (clubId !== undefined && realPlayerFaceForClub(seed.name, clubId) !== null)) &&
      !currentNames.has(normalizePlayerName(seed.name)) &&
      !currentPlayerNamesElsewhere.has(normalizePlayerName(seed.name)),
  );
  return [...refreshed, ...preservedRegens];
}
