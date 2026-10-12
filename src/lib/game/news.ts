import { clubById } from "./clubs";
import { formatMoney, uid } from "./format";
import { sortTable } from "./world";
import type {
  CalendarSlot,
  Fixture,
  GameSave,
  MatchResult,
  NewsCategory,
  NewsImportance,
  NewsItem,
  TransferRecord,
} from "./types";

type NewsDraft = Pick<NewsItem, "title" | "body" | "tone"> &
  Partial<Omit<NewsItem, "id" | "week" | "title" | "body" | "tone">>;
type NewsSaveContext = Pick<GameSave, "season" | "week" | "cursor" | "calendar" | "news">;
type TransferNewsContext = NewsSaveContext & Pick<GameSave, "clubId" | "players">;

const CATEGORY_RULES: Array<[NewsCategory, RegExp]> = [
  ["market", /oferta|fich|traspas|cesi[oó]n|mercado|renov|contrato|agente libre|negociaci[oó]n|venta:/i],
  ["finance", /presupuesto|ingreso|gasto|deuda|patrocin|taquilla|bonus|financ|rescate/i],
  ["club", /conferencia de prensa|declaraci[oó]n|reacci[oó]n de la directiva|objetivo del club|vestuario/i],
  ["competition", /campe[oó]n|t[ií]tulo|ascenso|descenso|eliminad|clasifica|final|copa|playoff|liga/i],
  ["match", /victoria|derrota|empate|goleada|partido|resultado|racha|jornada|gol|remontada/i],
  ["player", /jugador|lesi[oó]n|lesionad|sanci[oó]n|expuls|retiro|juvenil|cantera|progres|moral|plantilla|regresa/i],
  ["event", /directiva|afici[oó]n|crisis|decisi[oó]n|evento|reuni[oó]n|estadio|récord|record/i],
];

const IMPORTANCE_RULES: Array<[NewsImportance, RegExp]> = [
  ["extraordinary", /campe[oó]n|t[ií]tulo|ascenso|descenso|récord hist[oó]rico|record hist[oó]rico|final continental|fichaje r[eé]cord/i],
  ["high", /final|cl[aá]sico|goleada|eliminad|crisis|estrella|lesi[oó]n grave|despido|oferta inesperada/i],
  ["medium", /renov|racha|juvenil|récord|record|sanci[oó]n|lesi[oó]n|oferta|fich|patrocin/i],
];

export const MAX_NEWS_ITEMS = 10;

const IMPORTANCE_SCORE: Record<NewsImportance, number> = {
  extraordinary: 4,
  high: 3,
  medium: 2,
  normal: 1,
};

export function trimNewsItems(items: NewsItem[]): NewsItem[] {
  if (items.length <= MAX_NEWS_ITEMS) return items;
  const kept = new Set(
    items
      .map((item, index) => ({
        index,
        score: IMPORTANCE_SCORE[
          item.importance && item.importance !== "normal"
            ? item.importance
            : rankNews(item.title, item.body, item.tone)
        ],
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, MAX_NEWS_ITEMS)
      .map(({ index }) => index),
  );
  return items.filter((_, index) => kept.has(index));
}

let cachedIssueIndex: {
  items: NewsItem[];
  season: number;
  calendar?: CalendarSlot[];
  index: Map<string, NewsItem[]>;
} | null = null;

function issueKey(item: NewsItem, currentSeason: number, calendar?: CalendarSlot[]) {
  const season = item.season ?? currentSeason;
  const week = item.week ?? 0;
  const date = item.gameDate ?? (season === currentSeason ? calendar?.[week]?.date : undefined);
  return date ? `${season}:${date}` : `${season}:week-${week}`;
}

export function indexNewsByEdition(
  items: NewsItem[],
  currentSeason: number,
  calendar?: CalendarSlot[],
): Map<string, NewsItem[]> {
  if (cachedIssueIndex?.items === items && cachedIssueIndex.season === currentSeason && cachedIssueIndex.calendar === calendar) {
    return cachedIssueIndex.index;
  }
  const index = new Map<string, NewsItem[]>();
  for (const item of items) {
    const key = issueKey(item, currentSeason, calendar);
    const group = index.get(key);
    if (group) group.push(item);
    else index.set(key, [item]);
  }
  cachedIssueIndex = { items, season: currentSeason, calendar, index };
  return index;
}

export function classifyNews(title: string, body = ""): NewsCategory {
  const text = `${title} ${body}`;
  return CATEGORY_RULES.find(([, pattern]) => pattern.test(text))?.[0] ?? "general";
}

export function rankNews(title: string, body = "", tone: NewsItem["tone"] = "neutral"): NewsImportance {
  const text = `${title} ${body}`;
  const match = IMPORTANCE_RULES.find(([, pattern]) => pattern.test(text));
  if (match) return match[0];
  return tone === "bad" ? "medium" : "normal";
}

export function normalizeNews(
  items: NewsItem[] | undefined,
  season: number,
  calendar?: GameSave["calendar"],
): NewsItem[] {
  if (!Array.isArray(items)) return [];
  return trimNewsItems(items.flatMap((item) => {
    if (!item || typeof item.id !== "string" || typeof item.title !== "string" || typeof item.body !== "string") return [];
    const itemSeason = Number.isFinite(item.season) ? item.season! : season;
    return [{
      ...item,
      season: itemSeason,
      week: Number.isFinite(item.week) ? item.week : 0,
      gameDate: item.gameDate ?? (itemSeason === season ? calendar?.[item.week]?.date : undefined),
      category: !item.category || item.category === "general" ? classifyNews(item.title, item.body) : item.category,
      importance: !item.importance || item.importance === "normal"
        ? rankNews(item.title, item.body, item.tone)
        : item.importance,
      clubIds: Array.isArray(item.clubIds) ? item.clubIds : [],
      playerIds: Array.isArray(item.playerIds) ? item.playerIds : [],
      read: Boolean(item.read),
      seen: Boolean(item.seen),
    }];
  }));
}

export function publishNews(save: NewsSaveContext, draft: NewsDraft): NewsItem {
  if (draft.sourceKey) {
    const existing = save.news.find((item) => item.sourceKey === draft.sourceKey);
    if (existing) return existing;
  }
  const item: NewsItem = {
    ...draft,
    id: uid("n"),
    season: draft.season ?? save.season,
    week: save.week,
    gameDate: draft.gameDate ?? save.calendar[save.cursor]?.date,
    tone: draft.tone,
    title: draft.title,
    body: draft.body,
    category: draft.category ?? classifyNews(draft.title, draft.body),
    importance: draft.importance ?? rankNews(draft.title, draft.body, draft.tone),
    clubIds: draft.clubIds ?? [],
    playerIds: draft.playerIds ?? [],
    read: draft.read ?? false,
    seen: draft.seen ?? false,
  };
  save.news.unshift(item);
  save.news = trimNewsItems(save.news);
  return item;
}

function isNotable(result: MatchResult, slotTitle: string): boolean {
  const goals = result.homeGoals + result.awayGoals;
  const margin = Math.abs(result.homeGoals - result.awayGoals);
  const underdogWin =
    result.homeGoals > result.awayGoals
      ? result.awayGrl - result.homeGrl >= 9
      : result.awayGoals > result.homeGoals && result.homeGrl - result.awayGrl >= 9;
  return goals >= 6 || margin >= 3 || underdogWin || /final|playoff|semifinal|semifinales/i.test(slotTitle);
}

function bestRatedPlayer(result: MatchResult, save: GameSave) {
  if (!result.ratings) return null;
  const [playerId, rating] = Object.entries(result.ratings).sort((a, b) => b[1] - a[1])[0] ?? [];
  if (!playerId || typeof rating !== "number") return null;
  const player = save.players.find((candidate) => candidate.id === playerId);
  return player ? { player, rating } : null;
}

function recentRun(save: GameSave, clubId: string) {
  const standing = save.standings.find((row) => row.clubId === clubId);
  if (!standing || standing.form.length < 3) return null;
  const lastThree = standing.form.slice(-3);
  if (!lastThree.every((result) => result === lastThree[0])) return null;
  const word = lastThree[0] === "W" ? "victorias" : lastThree[0] === "D" ? "empates" : "derrotas";
  return `${lastThree.length} ${word} consecutivos`;
}

export function publishMatchNews(
  save: GameSave,
  fixture: Fixture,
  result: MatchResult,
  slotTitle: string,
  isUserMatch: boolean,
  extraContext = "",
): NewsItem | null {
  if (!isUserMatch && !isNotable(result, slotTitle)) return null;
  const home = clubById(fixture.homeId);
  const away = clubById(fixture.awayId);
  const homeWon = result.homeGoals > result.awayGoals;
  const awayWon = result.awayGoals > result.homeGoals;
  const winnerId = homeWon ? fixture.homeId : awayWon ? fixture.awayId : null;
  const winner = winnerId ? clubById(winnerId) : null;
  const score = `${result.homeGoals}–${result.awayGoals}`;
  const roundLabel = fixture.extraTime ? " tras la prórroga" : "";
  const penaltyLabel = result.penalties
    ? ` La tanda terminó ${result.penalties.home}–${result.penalties.away}.`
    : "";
  const goalEvents = result.events.filter((event) => event.type === "goal" && event.playerId);
  const scorers = goalEvents
    .map((event) => {
      const player = save.players.find((candidate) => candidate.id === event.playerId);
      const team = event.clubId === fixture.homeId ? home.short : event.clubId === fixture.awayId ? away.short : null;
      return player && team ? `${player.name} (${team}, ${event.minute}')` : null;
    })
    .filter((name): name is string => Boolean(name));
  const topPerformer = bestRatedPlayer(result, save);
  const sortedStandings = sortTable(save.standings);
  const tableRows = sortedStandings.filter((row) => row.clubId === fixture.homeId || row.clubId === fixture.awayId);
  const tableContext = tableRows.length === 2
    ? tableRows
        .map((row) => `${sortedStandings.findIndex((standing) => standing.clubId === row.clubId) + 1}º ${clubById(row.clubId).short} (${row.pts} puntos)`)
        .join(" y ")
    : null;
  const run = winnerId ? recentRun(save, winnerId) : null;
  const detail = [
    `${slotTitle}: ${home.name} ${score} ${away.name}${roundLabel}.${penaltyLabel}`,
    scorers.length ? `Goles: ${scorers.join(", ")}.` : `El marcador se definió con ${result.homeStats.shots} remates de ${home.short} y ${result.awayStats.shots} de ${away.short}.`,
    `Estadísticas: ${result.homeStats.onTarget}–${result.awayStats.onTarget} remates al arco y ${result.homeStats.possession}%–${result.awayStats.possession}% de posesión.`,
    topPerformer ? `La mejor calificación disponible fue para ${topPerformer.player.name} (${topPerformer.rating.toFixed(1)}).` : "",
    tableContext ? `En la tabla actualizada, ${tableContext}.` : "",
    run ? `${winner?.name} llega con ${run}.` : "",
    extraContext,
  ].filter(Boolean);
  const title = winner
    ? `${winner.name} ${result.homeGoals + result.awayGoals >= 5 ? "protagoniza un gran resultado" : "se impone"} ${score}`
    : `${home.short} y ${away.short} igualan ${score}`;
  const margin = Math.abs(result.homeGoals - result.awayGoals);
  const importance: NewsImportance =
    /final|playoff/i.test(slotTitle) || result.homeGoals + result.awayGoals >= 7 || margin >= 4
      ? "extraordinary"
      : result.homeGoals + result.awayGoals >= 5 || margin >= 3
        ? "high"
        : "normal";
  const playerIds = [...new Set(goalEvents.map((event) => event.playerId).filter((id): id is string => Boolean(id)))];
  if (topPerformer && !playerIds.includes(topPerformer.player.id)) playerIds.push(topPerformer.player.id);
  const tone = !winner ? "neutral" : isUserMatch ? winnerId === save.clubId ? "good" : "bad" : "neutral";
  return publishNews(save, {
    tone,
    title,
    body: detail.join(" "),
    category: isUserMatch ? "club" : tableRows.length === 2 ? "other-clubs" : "international",
    importance,
    clubIds: [fixture.homeId, fixture.awayId],
    playerIds,
    fixtureId: fixture.id,
    action: "calendar",
    sourceKey: `match:${save.season}:${save.week}:${fixture.id}`,
  });
}

export function publishTransferNews(save: TransferNewsContext, transfer: TransferRecord): NewsItem | null {
  const userRelated = transfer.user || transfer.fromId === save.clubId || transfer.toId === save.clubId;
  if (!userRelated && transfer.ovr < 84 && transfer.fee < 25_000_000) return null;
  const from = transfer.fromId === "FA" ? null : clubById(transfer.fromId);
  const to = transfer.toId === "FA" ? null : clubById(transfer.toId);
  const player = save.players.find((candidate) => candidate.id === transfer.playerId);
  const fromName = from?.name ?? "la agencia libre";
  const toName = to?.name ?? "sin club";
  const title = transfer.kind === "release"
    ? `${transfer.name} queda libre`
    : transfer.kind === "loan"
      ? `${transfer.name} sale cedido a ${to?.short ?? toName}`
      : transfer.kind === "free"
        ? `${to?.short ?? toName} ficha libre a ${transfer.name}`
        : `Fichaje confirmado: ${transfer.name} llega a ${to?.short ?? toName}`;
  const movement =
    transfer.kind === "release"
      ? `${transfer.name} dejó ${fromName} y pasó a la agencia libre.`
      : transfer.kind === "loan"
        ? `${fromName} y ${toName} completaron una cesión${transfer.fee > 0 ? ` por ${formatMoney(transfer.fee)}` : ""} hasta el final del plazo acordado.`
        : transfer.kind === "free"
          ? `${transfer.name} llegó a ${toName} sin coste de traspaso.`
          : `${fromName} y ${toName} completaron el traspaso${transfer.fee > 0 ? ` por ${formatMoney(transfer.fee)}` : ""}.`;
  const importance: NewsImportance =
    transfer.fee >= 50_000_000 || transfer.ovr >= 92
      ? "extraordinary"
      : transfer.fee >= 25_000_000 || transfer.ovr >= 87 || userRelated
        ? "high"
        : "medium";
  return publishNews(save, {
    tone: "neutral",
    title,
    body: `${movement} ${player ? `${player.name} juega como ${player.pos}; GRL ${player.ovr}.` : `${transfer.name}: ${transfer.pos}, GRL ${transfer.ovr}.`}`,
    category: "market",
    importance,
    clubIds: [transfer.fromId, transfer.toId].filter((id) => id !== "FA"),
    playerIds: [transfer.playerId],
    sourceKey: `transfer:${transfer.id}`,
  });
}
