import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyNews, indexNewsByEdition, normalizeNews, publishNews, publishTransferNews, rankNews, trimNewsItems } from "./news.ts";
import type { CalendarSlot, GameSave, NewsItem, TransferRecord } from "./types.ts";

const calendar: CalendarSlot[] = [{
  id: "slot-1",
  competition: "premier",
  round: 1,
  title: "Premier League · Fecha 1",
  fixtures: [],
  date: "2026-08-16",
}];

describe("sports news editions", () => {
  it("classifies market, match and finance articles from their real headlines", () => {
    assert.equal(classifyNews("Oferta por Ruiz", "Northbridge presenta una oferta por el delantero."), "market");
    assert.equal(classifyNews("Victoria 2–0 ante Northbridge", "Resultado de la jornada."), "match");
    assert.equal(classifyNews("Taquilla récord", "El club registra ingresos de taquilla."), "finance");
    assert.equal(classifyNews("Conferencia de prensa: MIA"), "club");
    assert.equal(classifyNews("R$0 ficha a Ramiro", "Sale de Belgrano por €44,1 M."), "market");
  });

  it("ranks decisive milestones above routine updates", () => {
    assert.equal(rankNews("Campeón de liga"), "extraordinary");
    assert.equal(rankNews("Renovación de contrato"), "medium");
    assert.equal(rankNews("Parte de la jornada", "Buen día para el plantel."), "normal");
  });

  it("keeps the ten most important articles while preserving newest-first order", () => {
    const items: NewsItem[] = Array.from({ length: 12 }, (_, index) => ({
      id: `normal-${index}`,
      week: index,
      tone: "neutral",
      importance: "normal",
      title: `Parte de la jornada ${index}`,
      body: "Resumen de la fecha.",
    }));
    items[0]!.importance = "high";
    items[11]!.importance = "extraordinary";

    const trimmed = trimNewsItems(items);

    assert.equal(trimmed.length, 10);
    assert.equal(trimmed[0]?.id, "normal-0");
    assert.equal(trimmed.at(-1)?.id, "normal-11");
    assert.equal(trimmed.some((item) => item.id === "normal-9" || item.id === "normal-10"), false);
  });

  it("upgrades legacy news with game date, category and read state without discarding history", () => {
    const legacy: NewsItem = {
      id: "legacy-1",
      week: 0,
      tone: "good",
      title: "Victoria 2–0",
      body: "El equipo ganó en la primera fecha.",
    };
    const [normalized] = normalizeNews([legacy], 2026, calendar);
    assert.equal(normalized?.season, 2026);
    assert.equal(normalized?.gameDate, "2026-08-16");
    assert.equal(normalized?.category, "match");
    assert.equal(normalized?.read, false);
    assert.equal(normalized?.title, legacy.title);
  });

  it("groups the archive by simulated calendar day", () => {
    const dated = (id: string, gameDate: string): NewsItem => ({
      id,
      season: 2026,
      week: 2,
      gameDate,
      tone: "neutral",
      title: id,
      body: "Artículo de prueba.",
    });
    const index = indexNewsByEdition(
      [dated("early", "2026-08-16"), dated("late", "2026-08-19")],
      2026,
      calendar,
    );
    assert.equal(index.size, 2);
    assert.equal(index.get("2026:2026-08-16")?.[0]?.id, "early");
    assert.equal(index.get("2026:2026-08-19")?.[0]?.id, "late");
  });

  it("does not promote routine rival transfers and publishes confirmed major moves once", () => {
    const save = {
      clubId: "mci",
      season: 2026,
      week: 4,
      cursor: 0,
      calendar: [],
      news: [],
      players: [],
    } satisfies Pick<GameSave, "clubId" | "season" | "week" | "cursor" | "calendar" | "news" | "players">;
    const routine: TransferRecord = {
      id: "routine",
      season: 2026,
      week: 4,
      playerId: "young-player",
      name: "Young Player",
      pos: "CM",
      ovr: 67,
      fromId: "ars",
      toId: "che",
      kind: "sale",
      fee: 2_000_000,
    };
    assert.equal(publishTransferNews(save, routine), null);

    const major = { ...routine, id: "major", name: "Star Forward", pos: "ST" as const, ovr: 91, fee: 55_000_000 };
    const first = publishTransferNews(save, major);
    const duplicate = publishTransferNews(save, major);
    assert.ok(first);
    assert.equal(duplicate?.id, first.id);
    assert.equal(save.news.length, 1);
    assert.match(first.body, /55/);
    assert.match(first.body, /GRL 91/);
  });

  it("reuses an article when the simulation publishes the same source event twice", () => {
    const save = {
      season: 2026,
      week: 2,
      calendar: [],
      cursor: 0,
      news: [],
    } satisfies Pick<GameSave, "season" | "week" | "calendar" | "cursor" | "news">;
    const draft = {
      tone: "neutral" as const,
      title: "Oferta confirmada",
      body: "Un traspaso completado.",
      sourceKey: "transfer:fixed-id",
    };
    const original = publishNews(save, draft);
    const retry = publishNews(save, draft);
    assert.equal(original.id, retry.id);
    assert.equal(save.news.length, 1);
  });
});
