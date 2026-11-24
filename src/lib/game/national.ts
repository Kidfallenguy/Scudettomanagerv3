import { makeName } from "./names.ts";
import { Rng } from "./rng.ts";
import { regenFaceForPlayer } from "./face-assets.ts";
import type {
  NationalSquadPlayer,
  NationalTournamentId,
  NationalTournamentState,
  Player,
  Pos,
  Standing,
} from "./types.ts";

export type Confederation = "UEFA" | "CAF" | "AFC" | "CONCACAF" | "CONMEBOL" | "OFC";

export interface NationalTeam {
  id: string;
  code: string;
  name: string;
  flag: string;
  confederation: Confederation;
  strength: number;
}

export interface NationalOffer {
  teamId: string;
  rating: number;
  expiresSeason: number;
}

export interface NationalApplication {
  teamId: string;
  season: number;
  managerRating: number;
  accepted: boolean;
}

export interface NationalTitle {
  season: number;
  teamId: string;
  tournamentId?: NationalTournamentId | "worldCup";
}

function generatedPortrait(id: string) {
  return regenFaceForPlayer(id);
}

const row = (
  code: string,
  name: string,
  flag: string,
  confederation: Confederation,
  strength: number,
): NationalTeam => ({
  id: `nat_${code.toLowerCase()}`,
  code,
  name,
  flag,
  confederation,
  strength,
});

const ASSOCIATION_CODES: Record<Confederation, string> = {
  UEFA: "AL AD AM AZ BY BA BG CY EE FO FI GI KZ XK LV LI LT LU MK MT MD ME RU SM SK SI",
  CAF: "AO BJ BW BI CV CF KM CG DJ GQ ER SZ ET GA GM GN GW KE LS LR LY MG MW MR MU MZ NA NE RW ST SC SL SO SS SD TD TG TZ UG ZM ZW",
  AFC: "AF BD BT BN KH CN KP HK IN ID JO KW KG LA LB MO MY MV MN MM NP OM PK PH PS SG LK SY TJ TH TL TM VN YE BH TW GU",
  CONCACAF: "BZ SV GT NI HT TT BS BB DM GD KN LC VC AG AW CW KY TC VG VI PR AI BM CU DO GY MS SR",
  CONMEBOL: "BO",
  OFC: "FJ PG SB VU WS TO NC PF CK AS",
};

const EXISTING_ISO_CODES = new Set(
  "FR ES GB PT NL DE IT BE HR CH DK AT TR RS PL SE NO UA GR RO CZ HU US MX CA CR PA JM HN AR BR UY CO EC CL PY PE VE BO MA SN NG CI EG GH CM DZ TN JP KR IR AU SA QA IQ UZ NZ AE ZA CD ML BF GE IS".split(" "),
);

function additionalNationalTeams(): NationalTeam[] {
  const displayNames = new Intl.DisplayNames(["es"], { type: "region" });
  return (Object.keys(ASSOCIATION_CODES) as Confederation[]).flatMap((confederation) =>
    ASSOCIATION_CODES[confederation]
      .split(" ")
      .filter((code) => !EXISTING_ISO_CODES.has(code))
      .map((code) => {
        const name = code === "XK" ? "Kosovo" : displayNames.of(code) ?? code;
        const flag = String.fromCodePoint(
          ...[...code].map((letter) => 127397 + letter.charCodeAt(0)),
        );
        return row(code, name, flag, confederation, 56 + ((code.charCodeAt(0) + code.charCodeAt(1)) % 15));
      }),
  );
}

export const NATIONAL_TEAMS: NationalTeam[] = [
  row("FRA", "Francia", "🇫🇷", "UEFA", 94),
  row("ESP", "España", "🇪🇸", "UEFA", 94),
  row("ENG", "Inglaterra", "🏴", "UEFA", 93),
  row("POR", "Portugal", "🇵🇹", "UEFA", 92),
  row("NED", "Países Bajos", "🇳🇱", "UEFA", 90),
  row("GER", "Alemania", "🇩🇪", "UEFA", 90),
  row("ITA", "Italia", "🇮🇹", "UEFA", 89),
  row("BEL", "Bélgica", "🇧🇪", "UEFA", 87),
  row("CRO", "Croacia", "🇭🇷", "UEFA", 86),
  row("SUI", "Suiza", "🇨🇭", "UEFA", 85),
  row("DEN", "Dinamarca", "🇩🇰", "UEFA", 84),
  row("AUT", "Austria", "🇦🇹", "UEFA", 83),
  row("TUR", "Turquía", "🇹🇷", "UEFA", 82),
  row("SRB", "Serbia", "🇷🇸", "UEFA", 81),
  row("POL", "Polonia", "🇵🇱", "UEFA", 80),
  row("SWE", "Suecia", "🇸🇪", "UEFA", 79),
  row("NOR", "Noruega", "🇳🇴", "UEFA", 82),
  row("UKR", "Ucrania", "🇺🇦", "UEFA", 80),
  row("GRE", "Grecia", "🇬🇷", "UEFA", 78),
  row("IRL", "Irlanda", "🇮🇪", "UEFA", 76),
  row("ISR", "Israel", "🇮🇱", "UEFA", 77),
  row("NIR", "Irlanda del Norte", "🇬🇧", "UEFA", 73),
  row("SCO", "Escocia", "🏴", "UEFA", 77),
  row("WAL", "Gales", "🏴", "UEFA", 75),
  row("ROU", "Rumania", "🇷🇴", "UEFA", 74),
  row("CZE", "Chequia", "🇨🇿", "UEFA", 76),
  row("HUN", "Hungría", "🇭🇺", "UEFA", 75),
  row("USA", "Estados Unidos", "🇺🇸", "CONCACAF", 84),
  row("MEX", "México", "🇲🇽", "CONCACAF", 82),
  row("CAN", "Canadá", "🇨🇦", "CONCACAF", 80),
  row("CRC", "Costa Rica", "🇨🇷", "CONCACAF", 74),
  row("PAN", "Panamá", "🇵🇦", "CONCACAF", 73),
  row("JAM", "Jamaica", "🇯🇲", "CONCACAF", 72),
  row("HON", "Honduras", "🇭🇳", "CONCACAF", 68),
  row("ARG", "Argentina", "🇦🇷", "CONMEBOL", 96),
  row("BOL", "Bolivia", "🇧🇴", "CONMEBOL", 72),
  row("BRA", "Brasil", "🇧🇷", "CONMEBOL", 95),
  row("URU", "Uruguay", "🇺🇾", "CONMEBOL", 88),
  row("COL", "Colombia", "🇨🇴", "CONMEBOL", 87),
  row("ECU", "Ecuador", "🇪🇨", "CONMEBOL", 82),
  row("CHI", "Chile", "🇨🇱", "CONMEBOL", 76),
  row("PAR", "Paraguay", "🇵🇾", "CONMEBOL", 77),
  row("PER", "Perú", "🇵🇪", "CONMEBOL", 74),
  row("VEN", "Venezuela", "🇻🇪", "CONMEBOL", 75),
  row("MAR", "Marruecos", "🇲🇦", "CAF", 87),
  row("SEN", "Senegal", "🇸🇳", "CAF", 85),
  row("NGA", "Nigeria", "🇳🇬", "CAF", 83),
  row("CIV", "Costa de Marfil", "🇨🇮", "CAF", 82),
  row("EGY", "Egipto", "🇪🇬", "CAF", 80),
  row("GHA", "Ghana", "🇬🇭", "CAF", 77),
  row("CMR", "Camerún", "🇨🇲", "CAF", 78),
  row("ALG", "Argelia", "🇩🇿", "CAF", 79),
  row("TUN", "Túnez", "🇹🇳", "CAF", 76),
  row("JPN", "Japón", "🇯🇵", "AFC", 85),
  row("KOR", "Corea del Sur", "🇰🇷", "AFC", 82),
  row("IRN", "Irán", "🇮🇷", "AFC", 79),
  row("AUS", "Australia", "🇦🇺", "AFC", 80),
  row("KSA", "Arabia Saudita", "🇸🇦", "AFC", 76),
  row("QAT", "Catar", "🇶🇦", "AFC", 74),
  row("IRQ", "Irak", "🇮🇶", "AFC", 72),
  row("UZB", "Uzbekistán", "🇺🇿", "AFC", 73),
  row("NZL", "Nueva Zelanda", "🇳🇿", "OFC", 70),
  row("UAE", "Emiratos Árabes Unidos", "🇦🇪", "AFC", 71),
  row("RSA", "Sudáfrica", "🇿🇦", "CAF", 75),
  row("COD", "RD del Congo", "🇨🇩", "CAF", 76),
  row("MLI", "Malí", "🇲🇱", "CAF", 74),
  row("BFA", "Burkina Faso", "🇧🇫", "CAF", 73),
  row("GEO", "Georgia", "🇬🇪", "UEFA", 73),
  row("ISL", "Islandia", "🇮🇸", "UEFA", 71),
  ...additionalNationalTeams(),
];

export const NATIONAL_TEAM_BY_ID = new Map(
  NATIONAL_TEAMS.map((team) => [team.id, team]),
);

export const NATIONAL_TOURNAMENTS: Array<{
  id: NationalTournamentId;
  name: string;
  format: string;
  confederation: Confederation;
}> = [
  { id: "euro", name: "Eurocopa", format: "24 selecciones · 6 grupos · octavos y eliminación directa", confederation: "UEFA" },
  { id: "copaAmerica", name: "Copa América", format: "16 selecciones · 4 grupos · cuartos y eliminación directa", confederation: "CONMEBOL" },
  { id: "goldCup", name: "Copa Oro", format: "16 selecciones · 4 grupos · cuartos y eliminación directa", confederation: "CONCACAF" },
  { id: "afcon", name: "Copa Africana de Naciones", format: "24 selecciones · 6 grupos · octavos y eliminación directa", confederation: "CAF" },
  { id: "asianCup", name: "Copa Asiática", format: "24 selecciones · 6 grupos · octavos y eliminación directa", confederation: "AFC" },
  { id: "nationsLeague", name: "UEFA Nations League", format: "16 selecciones · 4 grupos · semifinales y final", confederation: "UEFA" },
];

function emptyNationalStanding(clubId: string): Standing {
  return {
    clubId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    pts: 0,
    form: [],
  };
}

export function nationalTournamentsForSeason(
  season: number,
  seed: number,
  players: Player[],
): NationalTournamentState[] {
  const schedule: Array<{
    id: NationalTournamentId;
    teamCount: number;
    confederations: Confederation[];
    qualifiersPerGroup: number;
    bestThirds: number;
    startDate: string;
  }> = [];
  const yearPhase = ((season % 4) + 4) % 4;

  if (yearPhase === 0) {
    schedule.push(
      { id: "euro", teamCount: 24, confederations: ["UEFA"], qualifiersPerGroup: 2, bestThirds: 4, startDate: `${season}-06-11` },
      { id: "copaAmerica", teamCount: 16, confederations: ["CONMEBOL", "CONCACAF"], qualifiersPerGroup: 2, bestThirds: 0, startDate: `${season}-07-01` },
    );
  } else if (yearPhase === 3) {
    schedule.push(
      { id: "afcon", teamCount: 24, confederations: ["CAF"], qualifiersPerGroup: 2, bestThirds: 4, startDate: `${season}-06-11` },
      { id: "asianCup", teamCount: 24, confederations: ["AFC"], qualifiersPerGroup: 2, bestThirds: 4, startDate: `${season}-07-01` },
      { id: "goldCup", teamCount: 16, confederations: ["CONCACAF"], qualifiersPerGroup: 2, bestThirds: 0, startDate: `${season}-06-11` },
      { id: "nationsLeague", teamCount: 16, confederations: ["UEFA"], qualifiersPerGroup: 1, bestThirds: 0, startDate: `${season}-06-11` },
    );
  }

  const strengths = nationalTeamStrengths(players);
  return schedule.map((entry, index) => {
    const candidates = NATIONAL_TEAMS
      .filter((team) => entry.confederations.includes(team.confederation))
      .sort(
        (a, b) =>
          (strengths[b.id] ?? b.strength) - (strengths[a.id] ?? a.strength) ||
          a.id.localeCompare(b.id),
      );
    const invitees =
      entry.id === "copaAmerica"
        ? [
            ...candidates.filter((team) => team.confederation === "CONMEBOL"),
            ...candidates.filter((team) => team.confederation === "CONCACAF").slice(0, 6),
          ]
        : candidates.slice(0, entry.teamCount);
    const selected = new Rng(seed + season * 101 + index * 7919)
      .shuffle(invitees)
      .slice(0, entry.teamCount);
    const groups: string[][] = Array.from(
      { length: entry.teamCount / 4 },
      () => [],
    );
    selected.forEach((team, teamIndex) => {
      groups[teamIndex % groups.length]!.push(team.id);
    });
    const tournamentInfo = NATIONAL_TOURNAMENTS.find((item) => item.id === entry.id);

    return {
      id: entry.id,
      name: tournamentInfo?.name ?? entry.id,
      season,
      teams: selected.map((team) => team.id),
      groups,
      standings: selected.map((team) => emptyNationalStanding(team.id)),
      startDate: entry.startDate,
      qualifiersPerGroup: entry.qualifiersPerGroup,
      bestThirds: entry.bestThirds,
    };
  });
}

const QUOTAS: Record<Confederation, number> = {
  UEFA: 16,
  CAF: 9,
  AFC: 8,
  CONCACAF: 6,
  CONMEBOL: 6,
  OFC: 1,
};
const PLAYOFF_QUOTAS: Partial<Record<Confederation, number>> = {
  AFC: 1,
  CAF: 1,
  CONCACAF: 2,
  CONMEBOL: 1,
  OFC: 1,
};

function groupPlayersByNationality(players: Player[]) {
  const grouped = new Map<string, Player[]>();
  for (const player of players) {
    const squad = grouped.get(player.nat) ?? [];
    squad.push(player);
    grouped.set(player.nat, squad);
  }
  for (const squad of grouped.values()) squad.sort((a, b) => b.ovr - a.ovr);
  return grouped;
}

function strengthFromSquad(team: NationalTeam, players: Player[]) {
  const squad = players.slice(0, 18);
  if (squad.length < 5) return team.strength;
  const squadAverage = squad.reduce((total, player) => total + player.ovr, 0) / squad.length;
  return Math.round(squadAverage * 0.72 + team.strength * 0.28);
}

export function nationalTeamStrength(team: NationalTeam, players: Player[]) {
  return strengthFromSquad(
    team,
    groupPlayersByNationality(players).get(team.code) ?? [],
  );
}

export function nationalTeamStrengths(players: Player[]) {
  const grouped = groupPlayersByNationality(players);
  return Object.fromEntries(
    NATIONAL_TEAMS.map((team) => [
      team.id,
      strengthFromSquad(team, grouped.get(team.code) ?? []),
    ]),
  ) as Record<string, number>;
}

export function worldCupTeams(seed: number, players: Player[] = []) {
  const strengths = nationalTeamStrengths(players);
  const ratedTeams = NATIONAL_TEAMS.map((team) => ({
    ...team,
    strength: strengths[team.id] ?? team.strength,
  }));
  const selected: NationalTeam[] = [];
  for (const confederation of Object.keys(QUOTAS) as Confederation[]) {
    selected.push(
      ...ratedTeams.filter((team) => team.confederation === confederation)
        .sort((a, b) => b.strength - a.strength || a.id.localeCompare(b.id))
        .slice(0, QUOTAS[confederation]),
    );
  }
  const selectedIds = new Set(selected.map((team) => team.id));
  const playoffPool = (Object.keys(PLAYOFF_QUOTAS) as Confederation[]).flatMap(
    (confederation) =>
      ratedTeams
        .filter(
          (team) =>
            team.confederation === confederation && !selectedIds.has(team.id),
        )
        .sort((a, b) => b.strength - a.strength || a.id.localeCompare(b.id))
        .slice(0, PLAYOFF_QUOTAS[confederation]),
  );
  const playoffWinners = playoffPool
    .sort((a, b) => b.strength - a.strength || a.id.localeCompare(b.id))
    .slice(0, 2);
  return new Rng(seed).shuffle([...selected, ...playoffWinners]);
}

export function worldCupGroups(seed: number, players: Player[] = []) {
  const teams = worldCupTeams(seed, players);
  const groups: NationalTeam[][] = Array.from({ length: 12 }, () => []);
  const confedCounts = groups.map(() => new Map<Confederation, number>());
  const rng = new Rng(seed);
  const confederationOrder = [...new Set(teams.map((team) => team.confederation))]
    .sort(
      (a, b) =>
        teams.filter((team) => team.confederation === b).length -
          teams.filter((team) => team.confederation === a).length ||
        a.localeCompare(b),
    );
  const orderedTeams = confederationOrder.flatMap((confederation) =>
    rng.shuffle(teams.filter((team) => team.confederation === confederation)),
  );
  const assign = (teamIndex: number): boolean => {
    if (teamIndex === orderedTeams.length) return groups.every((group) => group.length === 4);
    const team = orderedTeams[teamIndex]!;
    const legal = groups
      .map((group, index) => ({ group, index }))
      .filter(({ group, index }) => {
        const same = confedCounts[index]!.get(team.confederation) ?? 0;
        return group.length < 4 && same < (team.confederation === "UEFA" ? 2 : 1);
      })
      .sort((a, b) => a.group.length - b.group.length || a.index - b.index);
    const triedStates = new Set<string>();
    for (const target of legal) {
      const state = `${target.group.length}:${JSON.stringify(
        [...confedCounts[target.index]!.entries()].sort(([a], [b]) =>
          a.localeCompare(b),
        ),
      )}`;
      if (triedStates.has(state)) continue;
      triedStates.add(state);
      target.group.push(team);
      const count = confedCounts[target.index]!.get(team.confederation) ?? 0;
      confedCounts[target.index]!.set(team.confederation, count + 1);
      if (assign(teamIndex + 1)) return true;
      target.group.pop();
      if (count) confedCounts[target.index]!.set(team.confederation, count);
      else confedCounts[target.index]!.delete(team.confederation);
    }
    return false;
  };
  if (!assign(0)) {
    throw new Error("No se pudieron distribuir las selecciones en 12 grupos válidos.");
  }
  return groups.map((group) => group.map((team) => team.id));
}

const SQUAD_POSITIONS: Array<{ positions: Pos[]; count: number }> = [
  { positions: ["GK"], count: 3 },
  { positions: ["RB", "CB", "LB"], count: 8 },
  { positions: ["CDM", "CM", "CAM"], count: 8 },
  { positions: ["RW", "LW", "ST"], count: 5 },
];

export function nationalPositionGroup(pos: Pos) {
  return SQUAD_POSITIONS.find(({ positions }) => positions.includes(pos));
}

export function nationalSquad(
  teamId: string,
  players: Player[],
  seed: number,
): NationalSquadPlayer[] {
  const team = NATIONAL_TEAM_BY_ID.get(teamId);
  if (!team) return [];
  const uniquePlayers = [...new Map(players.map((player) => [player.id, player])).values()];
  const rng = new Rng(seed);
  const usedNames = new Set(uniquePlayers.map((player) => player.name));
  const candidates = uniquePlayers
    .filter((player) => player.nat === team.code)
    .sort((a, b) => b.ovr - a.ovr || a.age - b.age);
  const selected = new Set<string>();
  const squad: NationalSquadPlayer[] = [];

  for (const { positions, count } of SQUAD_POSITIONS) {
    const start = squad.length;
    const eligible = candidates.filter(
      (player) => positions.includes(player.pos) && !selected.has(player.id),
    );
    for (const player of eligible.slice(0, count)) {
      selected.add(player.id);
      squad.push({
        id: player.id,
        name: player.name,
        pos: player.pos,
        ovr: player.ovr,
        age: player.age,
        pot: player.pot,
        clubId: player.clubId,
        portraitUrl: player.portraitUrl,
      });
    }
    while (squad.length - start < count) {
      const pos = positions[rng.int(0, positions.length - 1)]!;
      const id = `generated-${team.code}-${pos}-${squad.length}`;
      const ovr = Math.max(56, team.strength - rng.int(4, 17));
      squad.push({
        id,
        name: makeName(rng, team.code, usedNames),
        pos,
        ovr,
        age: rng.int(17, 22),
        pot: Math.min(100, ovr + rng.int(8, 24)),
        generated: true,
        portraitUrl: generatedPortrait(id),
      });
    }
  }
  return squad;
}

export function nationalSquadOptions(
  teamId: string,
  players: Player[],
  seed: number,
): NationalSquadPlayer[] {
  const team = NATIONAL_TEAM_BY_ID.get(teamId);
  if (!team) return [];
  const uniquePlayers = [...new Map(players.map((player) => [player.id, player])).values()];
  const realPlayers = uniquePlayers
    .filter((player) => player.nat === team.code)
    .sort((a, b) => b.ovr - a.ovr || a.age - b.age)
    .map((player) => ({
      id: player.id,
      name: player.name,
      pos: player.pos,
      ovr: player.ovr,
      age: player.age,
      pot: player.pot,
      clubId: player.clubId,
      portraitUrl: player.portraitUrl,
    }));
  const defaultSquad = nationalSquad(teamId, players, seed);
  const defaultGenerated = defaultSquad.filter((player) => player.generated);
  const usedNames = new Set(uniquePlayers.map((player) => player.name));
  const rng = new Rng(seed + 83);
  const reserves = SQUAD_POSITIONS.flatMap(({ positions }) =>
    [...new Set(positions)].flatMap((pos) =>
      Array.from({ length: 2 }, (_, index) => {
        const id = `generated-${team.code}-${pos}-reserve-${index}`;
        const ovr = Math.max(56, team.strength - rng.int(4, 17));
        return {
          id,
          name: makeName(rng, team.code, usedNames),
          pos,
          ovr,
          age: rng.int(17, 22),
          pot: Math.min(100, ovr + rng.int(8, 24)),
          generated: true,
          portraitUrl: generatedPortrait(id),
        };
      }),
    ),
  );
  return [...realPlayers, ...defaultGenerated, ...reserves];
}

export function nationalSquadFromIds(
  teamId: string,
  players: Player[],
  ids: string[],
  seed: number,
): NationalSquadPlayer[] | null {
  if (ids.length !== 24 || new Set(ids).size !== 24) return null;
  const options = new Map(
    nationalSquadOptions(teamId, players, seed).map((player) => [player.id, player]),
  );
  const selected = ids.map((id) => options.get(id));
  if (selected.some((player) => !player)) return null;
  const squad = selected as NationalSquadPlayer[];
  const counts = SQUAD_POSITIONS.map(({ positions }) =>
    squad.filter((player) => positions.includes(player.pos)).length,
  );
  if (!counts.every((count, index) => count === SQUAD_POSITIONS[index]!.count)) {
    return null;
  }
  return squad;
}

export function nationalOffers(
  managerRating: number,
  season: number,
  eligibleTeamIds?: string[],
  players: Player[] = [],
): NationalOffer[] {
  const eligible = eligibleTeamIds ? new Set(eligibleTeamIds) : null;
  const strengths = nationalTeamStrengths(players);
  const ranked = NATIONAL_TEAMS.filter((team) => !eligible || eligible.has(team.id))
    .map((team) => ({ ...team, strength: strengths[team.id] ?? team.strength }))
    .sort((a, b) => b.strength - a.strength);
  const targetRating = nationalOfferStrengthLimit(managerRating);
  return ranked
    .filter((team) => team.strength <= targetRating + 4)
    .sort(
      (a, b) =>
        Math.abs(a.strength - targetRating) -
          Math.abs(b.strength - targetRating) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, 5)
    .map((team) => ({
      teamId: team.id,
      rating: team.strength,
      expiresSeason: season + 1,
    }));
}

export function nationalOfferStrengthLimit(managerRating: number): number {
  return Math.max(55, Math.min(94, 35 + managerRating * 0.62));
}

export function nationalApplicationChance(
  managerRating: number,
  teamStrength: number,
): number {
  return Math.max(
    0.12,
    Math.min(0.95, 0.65 + (managerRating - teamStrength) * 0.012),
  );
}
