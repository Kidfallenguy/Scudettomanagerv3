import type { Player } from "./types";
import { REAL_PLAYER_FACES_BY_CLUB } from "./real-player-face-index.ts";
import { normalizePlayerName } from "./player-name.ts";
import {
  WONDERKID_ATLAS_COLUMNS,
  WONDERKID_FACE_COUNT,
} from "./wonderkid-face-config.ts";

export { WONDERKID_FACE_COUNT };
export const DEFAULT_PLAYER_FACE_URL = "/player-faces/bajogrlfaces.png";

const REAL_FACE_FILES = new Map<string, string>([
  ["abdelkarim", "/player-faces/real/Abdelkarim.png"],
  ["adamaznou", "/player-faces/real/Adam Aznou.png"],
  ["adeyemi", "/player-faces/real/Adeyemi.png"],
  ["alexismenjivar", "/player-faces/real/Alexis Menjívar.png"],
  ["ardaGuler", "/player-faces/real/Arda Güler.png"],
  ["arounasangante", "/player-faces/real/Arouna Sangante.png"],
  ["axelbanegas", "/player-faces/real/Axel Banegas.png"],
  ["baena", "/player-faces/real/Baena.png"],
  ["balde", "/player-faces/real/balde.png"],
  ["bargladish", "/player-faces/real/Bargladish(ocomosediga).png"],
  ["bastianbelmont", "/player-faces/real/Bastian Belmont.png"],
  ["brunogonzales", "/player-faces/real/Bruno Gonzales.png"],
  ["bernardosilva", "/player-faces/real/bernardosilva.png"],
  ["camavinga", "/player-faces/real/camavinga.png"],
  ["canozturk", "/player-faces/real/Can Öztürk.png"],
  ["carlosespi", "/player-faces/real/Carlos espi.png"],
  ["clemensriedel", "/player-faces/real/Clemens Riedel.png"],
  ["cristianromero", "/player-faces/real/Cristian romero.png"],
  ["daniolmo", "/player-faces/real/Dani Olmo.png"],
  ["david", "/player-faces/real/David.png"],
  ["dejong", "/player-faces/real/De jong.png"],
  ["deanhuijsen", "/player-faces/real/Dean Huijsen.png"],
  ["diomande", "/player-faces/real/Diomande.png"],
  ["duartesantos", "/player-faces/real/Duarte Santos.png"],
  ["dumfries", "/player-faces/real/dumfries.png"],
  ["endrick", "/player-faces/real/Endrick.png"],
  ["ericgarcia", "/player-faces/real/Eric Garcia.png"],
  ["erykmavren", "/player-faces/real/Eryk Mavren.png"],
  ["ewanrosales", "/player-faces/real/Ewan Rosales.png"],
  ["facundovarela", "/player-faces/real/Facundo Varela.png"],
  ["fermin", "/player-faces/real/Fermin.png"],
  ["fernandocastano", "/player-faces/real/Fernando Castaño.png"],
  ["frangonzalez", "/player-faces/real/Fran González.png"],
  ["frankkocsis", "/player-faces/real/Frank Kocsis.png"],
  ["gabrieljesus", "/player-faces/real/Gabriel Jesus.png"],
  ["gaelsalvatierra", "/player-faces/real/Gael Salvatierra.png"],
  ["garrettravenscroft", "/player-faces/real/Garreth Ravenscroft.png"],
  ["gavi", "/player-faces/real/Gavi.png"],
  ["gerardmartin", "/player-faces/real/Gerard martin.png"],
  ["gersonribeiro", "/player-faces/real/Gerson Ribeiro.png"],
  ["gonzalosanguinetti", "/player-faces/real/Gonzalo Sanguinetti.png"],
  ["gordon", "/player-faces/real/gordon.png"],
  ["danielcurti", "/player-faces/real/Santiago Curti.png"],
  ["santiagocurti", "/player-faces/real/Santiago Curti.png"],
  ["santiagobienati", "/player-faces/real/Santiago Bienati.png"],
  ["tizianobolanos", "/player-faces/real/Tiziano Bolaños.png"],
  ["grimaldo", "/player-faces/real/Grimaldo.png"],
  ["hancko", "/player-faces/real/Hancko.png"],
  ["ikeraranda", "/player-faces/real/Iker Aranda.png"],
  ["isakrønning", "/player-faces/real/Isak Rønning.png"],
  ["javierbocchini", "/player-faces/real/Javier Bocchini.png"],
  ["joelvidela", "/player-faces/real/Joel Videla.png"],
  ["joangarcia", "/player-faces/real/Joan García.png"],
  ["joaocancelo", "/player-faces/real/Joao Cancelo.png"],
  ["joneselabdellaoui", "/player-faces/real/Jones El-Abdellaoui.png"],
  ["judebellingham", "/player-faces/real/Jude Bellingham.png"],
  ["julianalvarez", "/player-faces/real/Julián Álvarez.png"],
  ["kanginlee", "/player-faces/real/Kang In-lee.png"],
  ["karemalkhoras", "/player-faces/real/Karem Al-Khoras.png"],
  ["kelashford", "/player-faces/real/Kel Ashford.png"],
  ["kenjiyupanqui", "/player-faces/real/Kenji Yupanqui.png"],
  ["kikesalas", "/player-faces/real/Kike Salas.png"],
  ["koke", "/player-faces/real/Koke.png"],
  ["konate", "/player-faces/real/konate.png"],
  ["ibrahimakonate", "/player-faces/real/konate.png"],
  ["kounde", "/player-faces/real/Kounde.png"],
  ["kylianmbappe", "/player-faces/real/Kylian Mbappé.png"],
  ["lamineyamal", "/player-faces/real/Lamine Yamal.png"],
  ["lenormand", "/player-faces/real/Le normand.png"],
  ["livakovic", "/player-faces/real/Livakovic.png"],
  ["llorente", "/player-faces/real/Llorente.png"],
  ["lookman", "/player-faces/real/Lookman.png"],
  ["lotharvelsen", "/player-faces/real/Lothar Velsen.png"],
  ["lucascallahyen", "/player-faces/real/Lucas Callahyen.png"],
  ["lukasaric", "/player-faces/real/Luka Saric.png"],
  ["lukasvandom", "/player-faces/real/Lukas Van Dorn.png"],
  ["lunin", "/player-faces/real/lunin.png"],
  ["makototaeho", "/player-faces/real/Makoto Tae-ho.png"],
  ["marcbernal", "/player-faces/real/Marc Bernal.png"],
  ["marccasado", "/player-faces/real/Marc Casadó.png"],
  ["marccucurella", "/player-faces/real/Marc Cucurella.png"],
  ["marcpubill", "/player-faces/real/Marc Pubill.png"],
  ["marcosllorente", "/player-faces/real/Marcos Llorente.png"],
  ["marekvoller", "/player-faces/real/Marek Voller.png"],
  ["mateovaldes", "/player-faces/real/Mateo Valdes.png"],
  ["matteoprati", "/player-faces/real/Matteo Prati.png"],
  ["matejkovař", "/player-faces/real/Matěj Kovář.png"],
  ["militao", "/player-faces/real/militao.png"],
  ["niko newman", "/player-faces/real/Niko Newman.png"],
  ["nikolasrathmann", "/player-faces/real/Nikolas Rathmann.png"],
  ["noelberglund", "/player-faces/real/Noel Berglund.png"],
  ["oblak", "/player-faces/real/Oblak.png"],
  ["olekzaren", "/player-faces/real/Olek Zaren.png"],
  ["paucubarsi", "/player-faces/real/Pau Cubarsí.png"],
  ["pedri", "/player-faces/real/Pedri.png"],
  ["pippezmazini", "/player-faces/real/Pippe Mazini.png"],
  ["pitarch", "/player-faces/real/pitarch.png"],
  ["publi", "/player-faces/real/publi.png"],
  ["raphinha", "/player-faces/real/Raphina.png"],
  ["raulasencio", "/player-faces/real/Raúl Asencio.png"],
  ["rodri", "/player-faces/real/Rodri.png"],
  ["rodrygo", "/player-faces/real/rodrygo.png"],
  ["rudiguer", "/player-faces/real/rudiguer.png"],
  ["schenszy", "/player-faces/real/Schenszy.png"],
  ["shuichikasane", "/player-faces/real/Shuichi Kasane.png"],
  ["simeone", "/player-faces/real/Simeone.png"],
  ["sorloth", "/player-faces/real/Sorloth.png"],
  ["tariqbalogun", "/player-faces/real/Tariq Balogun.png"],
  ["tchouameni", "/player-faces/real/tchouameni.png"],
  ["thiagoferreyra", "/player-faces/real/Thiago Ferreyra.png"],
  ["thibautcourtois", "/player-faces/real/Thibaut Courtois.png"],
  ["trentalexanderarnold", "/player-faces/real/Trent Alexander-Arnold.png"],
  ["valentinaimar", "/player-faces/real/Valentín Aimar.png"],
  ["valverde", "/player-faces/real/valverde.png"],
  ["viggosahlen", "/player-faces/real/Viggo Sahlen.png"],
  ["viniciusjunior", "/player-faces/real/Vinicius Junior.png"],
  ["xaviespart", "/player-faces/real/Xavi Espart.png"],
  ["yassineelkaiser", "/player-faces/real/Yassine El Kaiser.png"],
  ["zemvondo", "/player-faces/real/Ze Mvondo.png"],
  ["zezinhomaravilha", "/player-faces/real/Zezinho Maravilha.png"],
  ["alvarobarreto", "/player-faces/real/Álvaro Barreto.png"],
  ["alvarocarreras", "/player-faces/real/Álvaro Carreras.png"],
].map(([name, url]) => [normalizePlayerName(name), url] as const));

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index++) {
    result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  }
  return result >>> 0;
}

function isRosterSeedId(id?: string) {
  return Boolean(
    id &&
      (id.startsWith("tm-") ||
        (/^-?[^-]+(?:_[^-]+)*-\d+$/.test(id) && !id.includes("-g-"))),
  );
}

export function regenFaceUrl(index: number) {
  const faceNumber = Math.max(1, Math.min(WONDERKID_FACE_COUNT, Math.trunc(index)));
  const tileIndex = (faceNumber - 1) % WONDERKID_ATLAS_COLUMNS ** 2;
  const atlasIndex = Math.floor((faceNumber - 1) / WONDERKID_ATLAS_COLUMNS ** 2);
  return `/player-faces/wonderkids/atlas-${String(atlasIndex).padStart(4, "0")}.webp#${tileIndex}`;
}

export function wonderkidFaceUrl(index: number) {
  return regenFaceUrl(index);
}

export function wonderkidFaceForPlayer(playerId: string) {
  return wonderkidFaceUrl((hash(playerId) % WONDERKID_FACE_COUNT) + 1);
}

export function portraitForGeneratedPlayer(playerId: string, ovr: number, pot: number) {
  return pot >= 80 || ovr >= 75 ? wonderkidFaceForPlayer(playerId) : undefined;
}

export function regenFaceForPlayer(playerId: string) {
  return regenFaceUrl((hash(playerId) % WONDERKID_FACE_COUNT) + 1);
}

export function wonderkidAtlasTile(source: string) {
  const match =
    /^\/player-faces\/wonderkids\/(atlas-\d{4}\.webp)#(\d+)$/.exec(source);
  if (!match) return null;

  const tileIndex = Number(match[2]);
  if (
    !Number.isInteger(tileIndex) ||
    tileIndex < 0 ||
    tileIndex >= WONDERKID_ATLAS_COLUMNS ** 2
  ) {
    return null;
  }

  return {
    atlasUrl: `/player-faces/wonderkids/${match[1]}`,
    column: tileIndex % WONDERKID_ATLAS_COLUMNS,
    row: Math.floor(tileIndex / WONDERKID_ATLAS_COLUMNS),
  };
}

export function realPlayerFaceForClub(name: string, clubId: string) {
  const faces = REAL_PLAYER_FACES_BY_CLUB[clubId];
  if (!faces) return null;

  const key = normalizePlayerName(name);
  const direct = faces[key];
  if (direct) return direct;

  const nameParts = name
    .split(/\s+/)
    .map(normalizePlayerName)
    .filter((part) => part.length >= 3);
  const scored = Object.entries(faces)
    .map(([faceName, url]) => ({
      url,
      score: nameParts.reduce((total, part, index) => {
        const score = faceName.includes(part)
          ? Math.min(part.length, 10)
          : part.length >= 5 && part.includes(faceName)
            ? Math.min(faceName.length, 10)
            : 0;
        if (index === nameParts.length - 1) return total + score * 2;
        return total + score;
      }, 0),
    }))
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score);
  return scored.length > 0 && scored[0]!.score !== scored[1]?.score
    ? scored[0]!.url
    : null;
}

export function realPlayerFace(name: string, clubId?: string) {
  if (clubId) {
    const clubFace = realPlayerFaceForClub(name, clubId);
    if (clubFace) return clubFace;
  }

  const key = normalizePlayerName(name);
  const direct = REAL_FACE_FILES.get(key);
  if (direct) {
    const file = direct.replace(/^\/player-faces\/real\//, "");
    return `/player-faces/real/${encodeURIComponent(file)}`;
  }

  const nameParts = name
    .split(/\s+/)
    .map(normalizePlayerName)
    .filter(Boolean);
  for (let suffixLength = 1; suffixLength <= Math.min(nameParts.length, 3); suffixLength++) {
    const candidate = nameParts.slice(-suffixLength).join("");
    const match = REAL_FACE_FILES.get(candidate);
    if (!match) continue;

    const hasSpecificAlias = [...REAL_FACE_FILES.keys()].some(
      (alias) => alias !== candidate && alias.endsWith(candidate),
    );
    if (hasSpecificAlias && !REAL_FACE_FILES.has(key)) continue;

    const file = match.replace(/^\/player-faces\/real\//, "");
    return `/player-faces/real/${encodeURIComponent(file)}`;
  }

  return null;
}


export function playerFaceUrl(
  player: Pick<Player, "name" | "portraitUrl"> &
    Partial<Pick<Player, "id" | "clubId">>,
) {
  const rosterSeed = isRosterSeedId(player.id);
  const clubFace =
    player.clubId && rosterSeed
      ? realPlayerFaceForClub(player.name, player.clubId)
      : null;
  const realFace = clubFace ?? realPlayerFace(player.name);
  return (
    player.portraitUrl ??
    clubFace ??
    (rosterSeed ? realFace : null) ??
    (REAL_FACE_FILES.has(normalizePlayerName(player.name)) ? realFace : null) ??
    DEFAULT_PLAYER_FACE_URL
  );
}

export function hasPlayerPhoto(
  player: Pick<Player, "name" | "portraitUrl"> &
    Partial<Pick<Player, "id" | "clubId">>,
) {
  const source = playerFaceUrl(player);
  return Boolean(source && source !== DEFAULT_PLAYER_FACE_URL);
}
