import { useMemo, useState } from "react";
import { clubById } from "@/lib/game/clubs";
import { lastName } from "@/lib/game/format";
import { resolveNumberColor } from "@/lib/game/kit";
import { useGame } from "@/lib/game/store";
import { FORMATIONS } from "@/lib/game/tactics";
import type { MatchResult, Player } from "@/lib/game/types";

/** Color de la nota, como en Sofascore: azul (excelente), verde (buena), amarillo (normal) y naranja (floja). */
function ratingColor(r: number) {
  if (r >= 8.5) return "#3a7bd5";
  if (r >= 7) return "#3fa65a";
  if (r >= 6) return "#c9a227";
  return "#d9632b";
}

function RatingBadge({ value, big }: { value: number; big?: boolean }) {
  return (
    <span
      className={`rounded-md px-1 font-display font-semibold tabular-nums leading-4 text-white shadow ${big ? "text-sm" : "text-[10px]"}`}
      style={{ background: ratingColor(value) }}
    >
      {value.toFixed(1)}
    </span>
  );
}

type Marks = { goals: number; assists: number; yellow: boolean; red: boolean; injury: boolean; subOut: number | null; subIn: number | null };

function marksFor(result: MatchResult, id: string): Marks {
  const m: Marks = { goals: 0, assists: 0, yellow: false, red: false, injury: false, subOut: null, subIn: null };
  for (const e of result.events) {
    if (e.type === "goal" && e.playerId === id) m.goals += 1;
    if (e.type === "goal" && e.assistPlayerId === id) m.assists += 1;
    if (e.type === "yellow" && e.playerId === id) m.yellow = true;
    if (e.type === "red" && e.playerId === id) m.red = true;
    if (e.type === "injury" && e.playerId === id) m.injury = true;
    if (e.type === "sub" && e.outPlayerId === id) m.subOut = e.minute;
    if (e.type === "sub" && e.playerId === id) m.subIn = e.minute;
  }
  return m;
}

/** Insignia redonda sobre el jugador (gol / asistencia), como en Sofascore. */
function EventBadge({ icon, count }: { icon: string; count: number }) {
  return (
    <span className="flex h-4 min-w-4 items-center justify-center gap-px rounded-full bg-white px-0.5 text-[10px] leading-none text-black shadow">
      <span>{icon}</span>
      {count > 1 ? <span className="font-display text-[9px] font-semibold">{count}</span> : null}
    </span>
  );
}

function Icons({ m, skipGoalsAssists }: { m: Marks; skipGoalsAssists?: boolean }) {
  const items: string[] = [];
  if (!skipGoalsAssists) {
    if (m.goals) items.push(m.goals > 1 ? `⚽×${m.goals}` : "⚽");
    if (m.assists) items.push(m.assists > 1 ? `👟×${m.assists}` : "👟");
  }
  if (m.injury) items.push("🚑");
  if (m.red) items.push("🟥");
  else if (m.yellow) items.push("🟨");
  if (m.subOut !== null) items.push("🔄");
  if (!items.length) return null;
  return <span className="text-[10px] leading-3">{items.join(" ")}</span>;
}

/** Formación y notas de ambos equipos al terminar el partido (estilo Sofascore). */
export function MatchRatings({ result }: { result: MatchResult }) {
  const userId = useGame((s) => s.clubId);
  const players = useGame((s) => s.players);
  const userFormation = useGame((s) => s.tactics.formation);
  const numberColor = useGame((s) => s.tactics.numberColor);
  const [side, setSide] = useState<"home" | "away">(result.homeId === userId ? "home" : "away");

  const ratings = result.ratings;
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  if (!ratings) return null;

  const clubId = side === "home" ? result.homeId : result.awayId;
  const club = clubById(clubId);
  const lineup = side === "home" ? result.homeLineup : result.awayLineup;
  const subsIn = (side === "home" ? result.homeSubsIn : result.awaySubsIn) ?? [];
  const slots = FORMATIONS[clubId === userId ? userFormation : "433"].slots;
  const ink = resolveNumberColor(club.color, clubId === userId ? numberColor : "auto");

  // Mejor jugador del partido (de ambos equipos).
  const best = Object.entries(ratings).sort((a, b) => b[1] - a[1])[0];
  const bestPlayer = best ? byId.get(best[0]) : undefined;

  const subs = subsIn.map((id) => byId.get(id)).filter((p): p is Player => Boolean(p));

  return (
    <section className="rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold">Formación y notas</h3>
        <div className="flex rounded-full bg-elevated p-0.5 text-xs font-medium">
          {(["home", "away"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className={`rounded-full px-3 py-1 ${side === s ? "bg-fg text-bg" : "text-fg-muted"}`}
            >
              {clubById(s === "home" ? result.homeId : result.awayId).short}
            </button>
          ))}
        </div>
      </div>

      <div className="pitch-grid relative mx-auto aspect-[3/3.4] w-full max-w-md overflow-hidden rounded-xl">
        <div className="pointer-events-none absolute inset-2 rounded-[16px] border border-white/15" />
        {slots.map((slot, i) => {
          const p = lineup[i] ? byId.get(lineup[i]!) : undefined;
          if (!p) return null;
          const r = ratings[p.id];
          const m = marksFor(result, p.id);
          const isBest = best?.[0] === p.id;
          return (
            <div
              key={p.id}
              className="absolute flex w-16 -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${slot.x}%`, top: `${slot.y * 0.94}%` }}
            >
              <span className="relative">
                <span
                  className="flex size-9 items-center justify-center rounded-full font-display text-xs tabular-nums shadow-[var(--shadow-border)]"
                  style={{ background: club.color, color: ink }}
                >
                  {p.number ?? ""}
                </span>
                {r !== undefined ? (
                  <span className="absolute -right-4 -top-2">
                    <RatingBadge value={r} />
                  </span>
                ) : null}
                {isBest ? <span className="absolute -left-3 -top-2 text-xs">⭐</span> : null}
                {m.goals ? (
                  <span className="absolute -bottom-1 -right-3">
                    <EventBadge icon="⚽" count={m.goals} />
                  </span>
                ) : null}
                {m.assists ? (
                  <span className="absolute -bottom-1 -left-3">
                    <EventBadge icon="👟" count={m.assists} />
                  </span>
                ) : null}
              </span>
              <span className="mt-0.5 max-w-full truncate rounded bg-black/45 px-1 text-[10px] leading-4 text-white">
                {lastName(p.name)}
              </span>
              <Icons m={m} skipGoalsAssists />
            </div>
          );
        })}
      </div>

      {subs.length ? (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-fg-muted">Suplentes que entraron</p>
          <ul className="flex flex-col gap-1">
            {subs.map((p) => {
              const m = marksFor(result, p.id);
              const r = ratings[p.id];
              return (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-elevated px-3 py-1.5 text-sm">
                  <span className="truncate">
                    {p.name} <span className="text-xs text-fg-muted">· {m.subIn ?? "?"}'</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Icons m={m} />
                    {r !== undefined ? <RatingBadge value={r} /> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {bestPlayer && best ? (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-elevated px-3 py-2 text-sm">
          <span>
            ⭐ Mejor jugador: <span className="font-medium">{bestPlayer.name}</span>{" "}
            <span className="text-xs text-fg-muted">({clubById(bestPlayer.clubId).short})</span>
          </span>
          <RatingBadge value={best[1]} big />
        </div>
      ) : null}

      <p className="mt-2 text-[11px] text-fg-muted">⚽ gol · 👟 asistencia · 🚑 lesión · 🟨 amarilla · 🟥 roja · 🔄 sustituido</p>
    </section>
  );
}
