import { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Newspaper, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clubById } from "@/lib/game/clubs";
import { classifyNews, indexNewsByEdition, MAX_NEWS_ITEMS, trimNewsItems } from "@/lib/game/news";
import { seasonLabel } from "@/lib/game/format";
import { useGame } from "@/lib/game/store";
import type { GameSave, NewsCategory, NewsImportance, NewsItem, Screen } from "@/lib/game/types";

const CATEGORY_FILTERS: Array<{ id: NewsCategory | "all"; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "club", label: "Mi club" },
  { id: "market", label: "Mercado" },
  { id: "match", label: "Partidos" },
  { id: "competition", label: "Competiciones" },
  { id: "player", label: "Jugadores" },
  { id: "other-clubs", label: "Otros clubes" },
  { id: "finance", label: "Finanzas" },
  { id: "event", label: "Eventos" },
  { id: "international", label: "Internacional" },
];

const IMPORTANCE_ORDER: Record<NewsImportance, number> = {
  extraordinary: 0,
  high: 1,
  medium: 2,
  normal: 3,
};

const IMPORTANCE_LABEL: Record<NewsImportance, string> = {
  extraordinary: "Extraordinaria",
  high: "Alta",
  medium: "Media",
  normal: "Normal",
};

type Edition = { season: number; week: number; date?: string; key: string };

function editionKey(season: number, week: number, date?: string) {
  return date ? `${season}:${date}` : `${season}:week-${week}`;
}

function categoryOf(item: NewsItem): NewsCategory {
  return item.category ?? classifyNews(item.title, item.body);
}

function matchesCategory(item: NewsItem, selected: NewsCategory | "all", clubId: string) {
  if (selected === "all") return true;
  const actual = categoryOf(item);
  if (selected === "club") {
    return actual === "club" || item.clubIds?.includes(clubId) === true || item.title.includes(clubById(clubId).name);
  }
  if (selected === "match") return actual === "match" || Boolean(item.fixtureId);
  if (selected === "competition") return actual === "competition" || /competici[oó]n|clasifica|eliminad|campe[oó]n|t[ií]tulo/i.test(item.title);
  if (selected === "other-clubs") return actual === "other-clubs";
  return actual === selected;
}

function issueLabel(edition: Edition) {
  const dateLabel = edition.date ? edition.date.split("-").reverse().join("/") : `Fecha ${edition.week}`;
  return `${seasonLabel(edition.season)} · ${dateLabel}`;
}

export function NewsPaper() {
  const allNews = useGame((s) => s.news);
  const news = useMemo(() => trimNewsItems(allNews), [allNews]);
  const season = useGame((s) => s.season);
  const calendar = useGame((s) => s.calendar);
  const clubId = useGame((s) => s.clubId);
  const players = useGame((s) => s.players);
  const offers = useGame((s) => s.offers);
  const setScreen = useGame((s) => s.setScreen);
  const markNewsRead = useGame((s) => s.markNewsRead);
  const markNewsIssueRead = useGame((s) => s.markNewsIssueRead);
  const [selectedEdition, setSelectedEdition] = useState("");
  const [category, setCategory] = useState<NewsCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [articleId, setArticleId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const issueIndex = useMemo(() => indexNewsByEdition(news, season, calendar), [news, season, calendar]);
  const editions = useMemo(() => {
    const available = [...issueIndex.entries()].map(([key, items]) => {
      const first = items[0]!;
      const itemSeason = first.season ?? season;
      const itemWeek = first.week ?? 0;
      return {
        season: itemSeason,
        week: itemWeek,
        date: first.gameDate ?? (itemSeason === season ? calendar[itemWeek]?.date : undefined),
        key,
      };
    });
    if (!available.length) {
      const key = editionKey(season, 0);
      available.push({ season, week: 0, date: undefined, key });
    }
    return available.sort(
      (a, b) => a.season - b.season || (a.date ?? "").localeCompare(b.date ?? "") || a.week - b.week,
    );
  }, [issueIndex, season, calendar]);

  const activeEdition = editions.find((edition) => edition.key === selectedEdition) ?? editions[editions.length - 1];
  const editionItems = useMemo(
    () => (issueIndex.get(activeEdition.key) ?? []).slice(0, MAX_NEWS_ITEMS),
    [issueIndex, activeEdition.key],
  );
  const selectedArticle = articleId ? editionItems.find((item) => item.id === articleId) ?? null : null;
  const lowerQuery = query.trim().toLocaleLowerCase();
  const filteredItems = useMemo(() => {
    const order = new Map(editionItems.map((item, index) => [item.id, index]));
    return editionItems
      .filter((item) => matchesCategory(item, category, clubId))
      .filter((item) => {
        if (!lowerQuery) return true;
        const clubNames = (item.clubIds ?? []).map((id) => clubById(id).name);
        const playerNames = (item.playerIds ?? []).map((id) => players.find((player) => player.id === id)?.name ?? "");
        return [item.title, item.body, ...clubNames, ...playerNames].join(" ").toLocaleLowerCase().includes(lowerQuery);
      })
      .sort((a, b) =>
        IMPORTANCE_ORDER[a.importance ?? "normal"] - IMPORTANCE_ORDER[b.importance ?? "normal"] ||
        (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
      );
  }, [editionItems, category, lowerQuery, players, clubId]);

  const pageSize = 24;
  const archiveItems = filteredItems.slice(3);
  const pageCount = Math.max(1, Math.ceil(archiveItems.length / pageSize));
  const pageItems = archiveItems.slice(page * pageSize, (page + 1) * pageSize);
  const unreadCount = editionItems.filter((item) => !item.read).length;
  const visibleUnread = news.filter((item) => !item.seen).length;
  const featured = filteredItems[0];
  const secondary = filteredItems.slice(1, 3);
  const editionIndex = editions.findIndex((edition) => edition.key === activeEdition.key);

  function changeEdition(index: number) {
    const next = editions[index];
    if (!next) return;
    setSelectedEdition(next.key);
    setArticleId(null);
    setPage(0);
  }

  function openArticle(item: NewsItem) {
    setArticleId(item.id);
    markNewsRead(item.id);
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
        <div className="border-b border-border bg-elevated px-5 py-5 md:px-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Newspaper className="size-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">Scudetto · Edición diaria</p>
                <h1 className="font-display text-2xl font-semibold md:text-3xl">
                  {selectedArticle ? "Artículo" : "La portada"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-fg-muted">
              <span className="rounded-full bg-surface px-3 py-1.5">{visibleUnread} nuevas desde tu última visita</span>
              <span className="rounded-full bg-surface px-3 py-1.5">{unreadCount} sin leer en esta edición</span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {selectedArticle ? (
              <Button variant="outline" size="sm" onClick={() => setArticleId(null)}>
                <ArrowLeft /> Volver a la portada
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="icon"
              aria-label="Edición anterior"
              disabled={editionIndex <= 0}
              onClick={() => changeEdition(editionIndex - 1)}
            >
              <ChevronLeft />
            </Button>
            <label className="flex min-h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm">
              <CalendarDays className="size-4 text-fg-muted" />
              <span className="sr-only">Elegir edición</span>
              <select
                aria-label="Elegir edición diaria"
                value={activeEdition.key}
                onChange={(event) => {
                  setSelectedEdition(event.target.value);
                  setArticleId(null);
                  setPage(0);
                }}
                className="max-w-[210px] bg-transparent outline-none"
              >
                {editions.map((edition) => (
                  <option key={edition.key} value={edition.key}>{issueLabel(edition)}</option>
                ))}
              </select>
            </label>
            <Button
              variant="outline"
              size="icon"
              aria-label="Edición siguiente"
              disabled={editionIndex >= editions.length - 1}
              onClick={() => changeEdition(editionIndex + 1)}
            >
              <ChevronRight />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markNewsIssueRead(activeEdition.season, activeEdition.week, activeEdition.date)}
              disabled={unreadCount === 0}
            >
              Marcar edición como leída
            </Button>
          </div>
        </div>

        {selectedArticle ? (
          <Article
            item={selectedArticle}
            currentSeason={activeEdition.season}
            currentDate={activeEdition.date}
            players={players}
            offers={offers}
            setScreen={setScreen}
            markNewsRead={markNewsRead}
          />
        ) : (
          <div className="p-4 md:p-7">
            <div className="mb-4 flex flex-col gap-3 md:flex-row">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
                <input
                  value={query}
                  onChange={(event) => { setQuery(event.target.value); setPage(0); }}
                  placeholder="Buscar club, jugador, competición o palabra..."
                  className="min-h-10 w-full rounded-lg border border-border bg-elevated pl-10 pr-3 text-sm outline-none focus:border-primary"
                />
              </label>
            </div>
            <div className="mb-5 flex flex-wrap gap-2">
              {CATEGORY_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => { setCategory(filter.id); setPage(0); }}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    category === filter.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-elevated text-fg-muted hover:text-fg"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {featured ? (
              <div className="mb-5 grid gap-4 md:grid-cols-[1.5fr_1fr]">
                <NewsCard item={featured} featured onOpen={() => openArticle(featured)} />
                <div className="grid gap-3">
                  {secondary.map((item) => (
                    <NewsCard key={item.id} item={item} onOpen={() => openArticle(item)} />
                  ))}
                  {!secondary.length ? (
                    <div className="flex min-h-28 items-center rounded-xl border border-dashed border-border p-4 text-sm text-fg-muted">
                      No hay más titulares destacados en esta edición.
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold">{issueLabel(activeEdition)}</h2>
                <p className="text-xs text-fg-muted">{filteredItems.length} noticia{filteredItems.length === 1 ? "" : "s"} en esta selección</p>
              </div>
              <p className="text-xs text-fg-muted">{clubById(clubId).name}</p>
            </div>

            {pageItems.length ? (
              <ul className="grid gap-3 lg:grid-cols-2">
                {pageItems.map((item) => (
                  <li key={item.id}>
                    <NewsCard item={item} onOpen={() => openArticle(item)} />
                  </li>
                ))}
              </ul>
            ) : featured ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-sm text-fg-muted">
                Los titulares destacados son todas las noticias que coinciden con esta selección.
              </p>
            ) : (
              <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-fg-muted">
                No hay noticias que coincidan con estos filtros para la edición seleccionada.
              </div>
            )}
            {pageCount > 1 ? (
              <div className="mt-5 flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>
                  <ChevronLeft /> Anteriores
                </Button>
                <span className="text-xs text-fg-muted">Página {page + 1} de {pageCount}</span>
                <Button variant="outline" size="sm" disabled={page + 1 >= pageCount} onClick={() => setPage((value) => value + 1)}>
                  Siguientes <ChevronRight />
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

function NewsCard({ item, featured, onOpen }: { item: NewsItem; featured?: boolean; onOpen: () => void }) {
  const importance = item.importance ?? "normal";
  return (
    <article className={`relative rounded-xl border border-border bg-elevated ${featured ? "p-5 md:p-7" : "p-4"}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
        <span>{CATEGORY_FILTERS.find((filter) => filter.id === categoryOf(item))?.label ?? "Actualidad"}</span>
        <span aria-hidden="true">·</span>
        <span className={importance === "extraordinary" || importance === "high" ? "text-primary" : ""}>
          {IMPORTANCE_LABEL[importance]}
        </span>
        {!item.read ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Nueva</span> : null}
      </div>
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <h3 className={`font-display font-semibold leading-tight ${featured ? "text-2xl md:text-3xl" : "text-lg"}`}>
          {item.title}
        </h3>
        <p className={`mt-2 text-sm text-fg-muted ${featured ? "" : "line-clamp-3"}`}>{item.body}</p>
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="mt-3 inline-flex min-h-9 items-center gap-1 text-xs font-medium text-primary"
      >
        Leer artículo <ExternalLink className="size-3.5" />
      </button>
    </article>
  );
}

function Article({
  item,
  currentSeason,
  currentDate,
  players,
  offers,
  setScreen,
  markNewsRead,
}: {
  item: NewsItem;
  currentSeason: number;
  currentDate?: string;
  players: GameSave["players"];
  offers: GameSave["offers"];
  setScreen: (screen: Screen) => void;
  markNewsRead: (newsId: string) => void;
}) {
  const connectedOffer = item.offerId ? offers.find((offer) => offer.id === item.offerId) : null;
  const connectedPlayers = (item.playerIds ?? [])
    .map((playerId) => players.find((player) => player.id === playerId))
    .filter((player): player is NonNullable<typeof player> => Boolean(player));
  const relatedClubs = (item.clubIds ?? []).map((id) => clubById(id));
  return (
    <article className="mx-auto max-w-3xl px-5 py-7 md:px-10 md:py-10">
      <div className="mb-4 flex flex-wrap gap-2 text-xs text-fg-muted">
        <span>{issueLabel({ season: item.season ?? currentSeason, week: item.week, date: item.gameDate ?? currentDate, key: "" })}</span>
        <span>·</span>
        <span>{CATEGORY_FILTERS.find((filter) => filter.id === categoryOf(item))?.label ?? "Actualidad"}</span>
        <span>·</span>
        <span>{IMPORTANCE_LABEL[item.importance ?? "normal"]}</span>
      </div>
      <h2 className="font-display text-3xl font-semibold leading-tight md:text-4xl">{item.title}</h2>
      <div className="my-6 h-px bg-border" />
      <p className="whitespace-pre-line text-base leading-8 text-fg md:text-lg">{item.body}</p>

      {relatedClubs.length || connectedPlayers.length ? (
        <div className="mt-7 flex flex-col gap-4 border-t border-border pt-5">
          {relatedClubs.length ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">Clubes</h3>
              <div className="flex flex-wrap gap-2">
                {relatedClubs.map((club) => <span key={club.id} className="rounded-full bg-elevated px-3 py-1.5 text-sm">{club.name}</span>)}
              </div>
            </div>
          ) : null}
          {connectedPlayers.length ? (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">Jugadores</h3>
              <div className="flex flex-wrap gap-2">
                {connectedPlayers.map((player) => (
                  <button key={player.id} type="button" onClick={() => setScreen("squad")} className="rounded-full bg-elevated px-3 py-1.5 text-sm hover:bg-primary/10">
                    {player.name} · Ver plantilla
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-2">
        {connectedOffer ? (
          <Button variant="club" onClick={() => setScreen("market")}>Ver oferta de {connectedPlayers[0]?.name ?? "mercado"}</Button>
        ) : null}
        {item.fixtureId ? (
          <Button variant="outline" onClick={() => setScreen("calendar")}>Ver calendario del partido</Button>
        ) : null}
        <Button variant="ghost" onClick={() => markNewsRead(item.id)}>Marcar como leída</Button>
      </div>
    </article>
  );
}
