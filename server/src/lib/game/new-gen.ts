import { CLUBS } from "./clubs";
import { playerValue, playerWage } from "./format";
import { Rng } from "./rng";
import { assignShirtNumbers, generated, resyncStats } from "./squads";
import type { Player, Pos } from "./types";

interface NewGenSeed {
  name: string;
  pos: Pos;
  ovr: number;
  age: number;
  nat: string;
  pot: number;
}

export const NEW_GEN_11: readonly NewGenSeed[] = [
  { name: "Thiago Ferreyra", pos: "GK", ovr: 66, age: 18, nat: "ARG", pot: 94 },
  { name: "Marek Voller", pos: "GK", ovr: 61, age: 19, nat: "GER", pot: 96 },
  { name: "Viggo Sahlen", pos: "GK", ovr: 70, age: 20, nat: "SWE", pot: 93 },
  { name: "Olek Zaren", pos: "GK", ovr: 63, age: 18, nat: "UKR", pot: 97 },
  { name: "Pippe Mazini", pos: "CB", ovr: 68, age: 19, nat: "ITA", pot: 95 },
  { name: "Eryk Mavren", pos: "CB", ovr: 59, age: 17, nat: "POL", pot: 97 },
  { name: "Lothar Velsen", pos: "CB", ovr: 72, age: 20, nat: "GER", pot: 94 },
  { name: "Lukas Van Dorn", pos: "CB", ovr: 64, age: 18, nat: "NED", pot: 96 },
  { name: "Frank Kocsis", pos: "CB", ovr: 67, age: 19, nat: "HUN", pot: 92 },
  { name: "Facundo Varela", pos: "CB", ovr: 71, age: 20, nat: "URU", pot: 95 },
  { name: "Can Öztürk", pos: "CB", ovr: 62, age: 18, nat: "TUR", pot: 93 },
  { name: "Zezinho Maravilha", pos: "RB", ovr: 73, age: 19, nat: "BRA", pot: 97 },
  { name: "Álvaro Barreto", pos: "LB", ovr: 67, age: 18, nat: "ESP", pot: 94 },
  { name: "Fernando Castaño", pos: "RB", ovr: 60, age: 17, nat: "COL", pot: 96 },
  { name: "Kel Ashford", pos: "LB", ovr: 65, age: 19, nat: "USA", pot: 93 },
  { name: "Niko Newman", pos: "RB", ovr: 58, age: 18, nat: "PHI", pot: 95 },
  { name: "Valentín Aimar", pos: "CM", ovr: 69, age: 19, nat: "ARG", pot: 96 },
  { name: "Shuichi Kasane", pos: "CDM", ovr: 62, age: 18, nat: "JPN", pot: 97 },
  { name: "Bastian Belmont", pos: "CM", ovr: 70, age: 20, nat: "FRA", pot: 94 },
  { name: "Garreth Ravenscroft", pos: "CM", ovr: 64, age: 19, nat: "ENG", pot: 95 },
  { name: "Noel Berglund", pos: "CDM", ovr: 67, age: 18, nat: "SWE", pot: 93 },
  { name: "Gael Salvatierra", pos: "CM", ovr: 59, age: 17, nat: "PER", pot: 96 },
  { name: "Matěj Kovář", pos: "CDM", ovr: 71, age: 20, nat: "CZE", pot: 92 },
  { name: "Luka Saric", pos: "CAM", ovr: 63, age: 18, nat: "CRO", pot: 97 },
  { name: "Tariq Balogun", pos: "CAM", ovr: 61, age: 17, nat: "NGA", pot: 95 },
  { name: "Iker Aranda", pos: "CAM", ovr: 72, age: 20, nat: "ESP", pot: 96 },
  { name: "Gerson Ribeiro", pos: "CAM", ovr: 68, age: 19, nat: "BRA", pot: 94 },
  { name: "Javier Bocchini", pos: "LW", ovr: 73, age: 20, nat: "ARG", pot: 95 },
  { name: "Duarte Santos", pos: "RW", ovr: 64, age: 18, nat: "POR", pot: 97 },
  { name: "Nikolas Rathmann", pos: "LW", ovr: 69, age: 19, nat: "GER", pot: 96 },
  { name: "Yassine El Kaiser", pos: "RW", ovr: 60, age: 17, nat: "MAR", pot: 99 },
  { name: "Makoto Tae-ho", pos: "LW", ovr: 66, age: 18, nat: "KOR", pot: 95 },
  { name: "Mateo Valdes", pos: "RW", ovr: 62, age: 19, nat: "COL", pot: 96 },
  { name: "Isak Rønning", pos: "ST", ovr: 71, age: 19, nat: "NOR", pot: 97 },
  { name: "Ze Mvondo", pos: "ST", ovr: 65, age: 18, nat: "CMR", pot: 95 },
  { name: "Karem Al-Khoras", pos: "ST", ovr: 58, age: 17, nat: "KSA", pot: 93 },
  { name: "Gonzalo Sanguinetti", pos: "ST", ovr: 70, age: 20, nat: "URU", pot: 96 },
  { name: "Bruno Gonzalez", pos: "CM", ovr: 74, age: 15, nat: "ARG", pot: 95 },
  { name: "Lucas Cayllahua", pos: "RB", ovr: 64, age: 18, nat: "PER", pot: 96 },
  { name: "Joel Videla", pos: "CAM", ovr: 69, age: 15, nat: "ARG", pot: 95 },
  { name: "Daniel Curti", pos: "CB", ovr: 38, age: 17, nat: "ARG", pot: 96 },
  { name: "Santiago Bienati", pos: "ST", ovr: 38, age: 15, nat: "ARG", pot: 97 },
  { name: "Tiziano Bolaños", pos: "GK", ovr: 75, age: 15, nat: "ARG", pot: 97 },
];

export function addNewGen11(players: Player[], rng: Rng, usedNames: Set<string>): void {
  const clubs = rng.shuffle([...new Map(CLUBS.filter((club) => !club.ghost).map((club) => [club.id, club])).values()]);
  if (clubs.length === 0) {
    throw new Error("New Gen 11 needs at least one non-ghost club for random assignments.");
  }

  const prospects = NEW_GEN_11.map((seed, index) => {
    const club = clubs[index % clubs.length]!;
    const player = generated(club.id, seed.pos, 100_000 + index, club.prestige, rng, usedNames);
    player.id = `newgen11-${index + 1}`;
    player.name = seed.name;
    player.pos = seed.pos;
    player.ovr = seed.ovr;
    player.age = seed.age;
    player.nat = seed.nat;
    player.pot = seed.pot;
    player.seasonStartOvr = seed.ovr;
    player.value = playerValue(seed.ovr, seed.age, seed.pot);
    player.wage = playerWage(seed.ovr, club.prestige);
    resyncStats(player, rng);
    usedNames.add(seed.name);
    players.push(player);
    return player;
  });

  for (const clubId of new Set(prospects.map((player) => player.clubId))) {
    assignShirtNumbers(players.filter((player) => player.clubId === clubId));
  }
}
