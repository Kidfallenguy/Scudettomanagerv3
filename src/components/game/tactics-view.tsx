import { useState } from "react";
import { HeartPulse } from "lucide-react";
import { ClubCrest } from "@/components/game/crest";
import {
  StatusGlyph,
  outGames,
  outReason,
  outText,
  statusWord,
  type OutStatus,
} from "@/components/game/status-icons";
import { PlayerPortrait } from "@/components/game/player-portrait";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { clubById } from "@/lib/game/clubs";
import { POS_LABEL, lastName, ovrClass } from "@/lib/game/format";
import {
  BENCH_SIZE,
  FORMATION_IDS,
  FORMATIONS,
  MENTALITY_LABEL,
  benchRating,
  canPlaySlot,
  isUnavailable,
  slotFit,
  unavailableReason,
  xiRating,
} from "@/lib/game/tactics";
import { useGame } from "@/lib/game/store";
import type { FormationId, Mentality, Player } from "@/lib/game/types";

export function TacticsView() {
  const clubId = useGame((s) => s.clubId);
  const players = useGame((s) => s.players);
  const tactics = useGame((s) => s.tactics);
  const pending = useGame((s) => s.pendingFixtureId);
  const setFormation = useGame((s) => s.setFormation);
  const setMentality = useGame((s) => s.setMentality);
  const setLineupSlot = useGame((s) => s.setLineupSlot);
  const autoFill = useGame((s) => s.autoFill);
  const toggleBench = useGame((s) => s.toggleBench);
  const autoBench = useGame((s) => s.autoBench);
  const setScreen = useGame((s) => s.setScreen);
  const [slotIndex, setSlotIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [benchOpen, setBenchOpen] = useState(false);
  const [benchNotice, setBenchNotice] = useState<string | null>(null);
  const [formationPickerOpen, setFormationPickerOpen] = useState(false);
  const club = clubById(clubId);
  const squad = players.filter((p) => p.clubId === clubId);
  const slots = FORMATIONS[tactics.formation].slots;
  const rating = Math.round(xiRating(players, tactics.lineup));
  const benchPlayers = tactics.bench
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => Boolean(p));
  const benchAvg = Math.round(benchRating(players, tactics.bench));
  const outPlayers = tactics.lineup
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => Boolean(p) && isUnavailable(p as Player));
  const benchCandidates = squad
    .filter((p) => !tactics.lineup.includes(p.id))
    .sort((a, b) => {
      const ua = isUnavailable(a) ? 0 : 1;
      const ub = isUnavailable(b) ? 0 : 1;
      return ub - ua || b.ovr - a.ovr;
    });
  const pickerPlayers = squad.slice().sort((a, b) => {
    if (slotIndex === null) return b.ovr - a.ovr;
    const allowed = slots[slotIndex]?.pos ?? [];
    const ua = isUnavailable(a) ? 0 : 1;
    const ub = isUnavailable(b) ? 0 : 1;
    if (ub !== ua) return ub - ua;
    const fa = slotFit(a.pos, allowed);
    const fb = slotFit(b.pos, allowed);
    if (fb !== fa) return fb - fa;
    return b.ovr - a.ovr;
  });

  return (
    <div className="flex flex-col gap-4">
      {pending ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-elevated px-3 py-2 shadow-[var(--shadow-border)]">
          <p className="text-sm text-fg-muted">El partido espera tu once.</p>
          <Button size="sm" variant="club" onClick={() => setScreen("preview")}>
            Ir al partido
          </Button>
        </div>
      ) : null}
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-3xl font-semibold">Táctica</h2>
          <p className="text-sm text-fg-muted">
            Once titular {rating} MED · Banquillo {benchAvg} ·{" "}
            {FORMATIONS[tactics.formation].name}
          </p>
        </div>
        <Button variant="outline" onClick={() => autoFill()}>
          Mejor once y banquillo
        </Button>
      </header>

      <section className="rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Formación actual</p>
            <p className="text-xs text-fg-muted">
              {FORMATIONS[tactics.formation].name} · {slots.length} jugadores ·{" "}
              {FORMATION_IDS.length} sistemas disponibles
            </p>
          </div>
          <Button
            variant={formationPickerOpen ? "club" : "outline"}
            aria-expanded={formationPickerOpen}
            onClick={() => setFormationPickerOpen((open) => !open)}
          >
            {formationPickerOpen ? "Cerrar formaciones" : "Elegir formación"}
          </Button>
        </div>
        {formationPickerOpen ? (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {FORMATION_IDS.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={tactics.formation === id}
                onClick={() => {
                  setFormation(id);
                  setFormationPickerOpen(false);
                }}
                className={cn(
                  "rounded-xl border p-2 text-left transition-colors hover:border-primary/60 hover:bg-primary/5",
                  tactics.formation === id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-bg/70",
                )}
              >
                <FormationPreview formationId={id} />
                <span className="mt-2 block truncate text-sm font-semibold">
                  {FORMATIONS[id].name}
                </span>
                <span className="text-[11px] text-fg-muted">
                  Vista de posiciones
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </section>
      <div className="flex flex-wrap gap-1">
        {(Object.keys(MENTALITY_LABEL) as Mentality[]).map((m) => (
          <Button
            key={m}
            size="sm"
            variant={tactics.mentality === m ? "club" : "outline"}
            onClick={() => setMentality(m)}
          >
            {MENTALITY_LABEL[m]}
          </Button>
        ))}
      </div>
      {outPlayers.length ? (
        <div
          role="alert"
          className="flex flex-col gap-1.5 rounded-xl bg-elevated px-3 py-2.5 shadow-[var(--shadow-border)]"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-bad">
            Bajas en el once
          </p>
          <ul className="flex flex-col gap-1">
            {outPlayers.map((p) => {
              const st = unavailableReason(p)!;
              return (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <StatusGlyph status={st} />
                  <span className="font-medium">{p.name}</span>
                  <span className="text-fg-muted">
                    {statusWord(st)}
                    {outReason(p, st) ? `: ${outReason(p, st)}` : ""} ·{" "}
                    {outGames(p, st)} j
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-fg-muted">
            Toca su puesto para reemplazarlo, o usa “Mejor once”.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-fg-muted">
        <span>El número en cada jugador es su GRL actual.</span>
        <span className="inline-flex items-center gap-1">
          <HeartPulse className="size-3.5 text-bad" /> Lesión
        </span>
        <span className="inline-flex items-center gap-1">
          <StatusGlyph status="suspension" /> Expulsado
        </span>
        <span className="inline-flex items-center gap-1">
          <StatusGlyph status="illness" /> Enfermo
        </span>
        <span className="inline-flex items-center gap-1">
          <StatusGlyph status="absence" /> Ausente
        </span>
      </div>

      <div className="pitch-grid relative aspect-[3/4] max-h-[72dvh] w-full overflow-hidden rounded-2xl shadow-[var(--shadow-border)] sm:aspect-[3/3.4]">
        <div className="pitch-lines" aria-hidden="true">
          <span className="pitch-boundary" />
          <span className="pitch-halfway" />
          <span className="pitch-center-circle" />
          <span className="pitch-box pitch-box--top" />
          <span className="pitch-box pitch-box--bottom" />
          <span className="pitch-goal pitch-goal--top" />
          <span className="pitch-goal pitch-goal--bottom" />
        </div>
        {slots.map((slot, i) => {
          const p = players.find((x) => x.id === tactics.lineup[i]);
          const reason = p ? unavailableReason(p) : null;
          return (
            <button
              key={`${slot.label}-${i}`}
              type="button"
              onClick={() => {
                setNotice(null);
                setSlotIndex(i);
              }}
              className={cn(
                "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1",
                "w-16",
              )}
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            >
              {p ? (
                <PlayerChip
                  player={p}
                  active={slotIndex === i}
                  offPos={!canPlaySlot(p.pos, slot.pos)}
                  status={reason}
                />
              ) : (
                <span className="flex size-11 items-center justify-center rounded-full bg-bg/70 text-xs text-fg-muted">
                  {slot.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <section className="rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">
              Suplentes · {benchPlayers.length}/{BENCH_SIZE}
            </p>
            <p className="text-[11px] text-fg-muted">
              Entran en la segunda parte o si alguien se lesiona. Afectan un
              poco a la media del equipo.
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button size="sm" variant="ghost" onClick={() => autoBench()}>
              Automático
            </Button>
            <Button
              size="sm"
              variant={benchOpen ? "club" : "outline"}
              onClick={() => setBenchOpen((v) => !v)}
            >
              {benchOpen ? "Listo" : "Elegir"}
            </Button>
          </div>
        </div>
        {benchPlayers.length ? (
          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {benchPlayers.map((p) => {
              const reason = unavailableReason(p);
              return (
                <li
                  key={p.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg bg-elevated px-2 py-1.5",
                    reason && "opacity-60",
                  )}
                >
                  <PlayerPortrait
                    player={p}
                    size="list"
                    className="size-11 rounded-xl"
                  />
                  <span
                    className={cn(
                      "w-7 font-display text-base tabular-nums",
                      ovrClass(p.ovr),
                    )}
                  >
                    {p.ovr}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">
                      {lastName(p.name)}
                    </span>
                    <span className="text-[10px] text-fg-muted">
                      {POS_LABEL[p.pos]}
                    </span>
                  </span>
                  {reason ? <StatusGlyph status={reason} /> : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-lg bg-elevated px-3 py-2 text-xs text-fg-muted">
            Sin suplentes: un banquillo vacío resta algo de media y no habrá
            cambios.
          </p>
        )}
        {benchOpen ? (
          <div className="mt-3">
            {benchNotice ? (
              <p
                role="alert"
                className="mb-2 rounded-lg bg-bad/15 px-3 py-2 text-sm text-bad"
              >
                {benchNotice}
              </p>
            ) : null}
            <ul className="max-h-64 overflow-y-auto">
              {benchCandidates.map((p) => {
                const onBench = tactics.bench.includes(p.id);
                const blocked = isUnavailable(p);
                const reason = unavailableReason(p);
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      disabled={blocked && !onBench}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-fg/5 disabled:cursor-not-allowed disabled:opacity-45"
                      onClick={() => setBenchNotice(toggleBench(p.id))}
                    >
                      <span
                        className={cn(
                          "w-8 font-display text-lg tabular-nums",
                          ovrClass(p.ovr),
                        )}
                      >
                        {p.ovr}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium">
                          {p.name}
                        </span>
                        <span className="text-[11px] text-fg-muted">
                          {POS_LABEL[p.pos]}
                          {outText(p, reason)}
                        </span>
                      </span>
                      {reason ? <StatusGlyph status={reason} /> : null}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          onBench
                            ? "bg-fg text-bg"
                            : "bg-elevated text-fg-muted",
                        )}
                      >
                        {onBench ? "Convocado" : "Convocar"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </section>

      {slotIndex !== null ? (
        <SlotPicker
          slotLabel={slots[slotIndex]?.label ?? ""}
          allowed={slots[slotIndex]?.pos ?? []}
          players={pickerPlayers}
          lineup={tactics.lineup}
          bench={tactics.bench}
          club={club}
          notice={notice}
          onPick={(id) => {
            const err = setLineupSlot(slotIndex, id);
            if (err) {
              setNotice(err);
              return;
            }
            setNotice(null);
            setSlotIndex(null);
          }}
          onClose={() => {
            setNotice(null);
            setSlotIndex(null);
          }}
        />
      ) : null}
    </div>
  );
}

function SlotPicker({
  slotLabel,
  allowed,
  players,
  lineup,
  bench,
  club,
  notice,
  onPick,
  onClose,
}: {
  slotLabel: string;
  allowed: Player["pos"][];
  players: Player[];
  lineup: string[];
  bench: string[];
  club: ReturnType<typeof clubById>;
  notice: string | null;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)]">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium">
          Puesto {slotLabel} · {allowed.map((p) => POS_LABEL[p]).join(" / ")}
        </p>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Listo
        </Button>
      </div>
      {notice ? (
        <p
          role="alert"
          className="mb-2 rounded-lg bg-bad/15 px-3 py-2 text-sm text-bad"
        >
          {notice}
        </p>
      ) : null}
      <ul className="max-h-56 overflow-y-auto">
        {players.map((p) => {
          const inXi = lineup.includes(p.id);
          const offPos = !canPlaySlot(p.pos, allowed);
          const blocked = isUnavailable(p);
          const reason = unavailableReason(p);
          return (
            <li key={p.id}>
              <button
                type="button"
                disabled={blocked}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-fg/5 disabled:cursor-not-allowed disabled:opacity-45",
                  offPos && !blocked && "opacity-50",
                )}
                onClick={() => {
                  if (blocked) return;
                  onPick(p.id);
                }}
              >
                <span
                  className={cn(
                    "w-8 font-display text-lg tabular-nums",
                    ovrClass(p.ovr),
                  )}
                >
                  {p.ovr}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{p.name}</span>
                  <span className="text-[11px] text-fg-muted">
                    {POS_LABEL[p.pos]}
                    {offPos ? " · no juega aquí" : ""}
                    {outText(p, reason)}
                    {inXi
                      ? " · titular"
                      : bench.includes(p.id)
                        ? " · suplente"
                        : ""}
                  </span>
                </span>
                {reason ? <StatusGlyph status={reason} /> : null}
                <ClubCrest club={club} size={18} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FormationPreview({ formationId }: { formationId: FormationId }) {
  return (
    <div
      aria-hidden="true"
      className="pitch-grid relative mx-auto aspect-[3/4] w-full max-w-24 overflow-hidden rounded-lg"
    >
      <span className="pitch-boundary" />
      <span className="pitch-halfway" />
      <span className="pitch-center-circle" />
      {FORMATIONS[formationId].slots.map((slot, index) => (
        <span
          key={`${formationId}-${index}`}
          className={cn(
            "absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-bg shadow-sm",
            slot.pos.includes("GK") ? "bg-fg-muted" : "bg-primary",
          )}
          style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
        />
      ))}
    </div>
  );
}

function PlayerChip({
  player,
  active,
  offPos,
  status,
}: {
  player: Player;
  active: boolean;
  offPos?: boolean;
  status: OutStatus | null;
}) {
  return (
    <>
      <span
        className={cn(
          "relative inline-flex rounded-full",
          active && "ring-2 ring-fg",
          offPos && !status && "opacity-55",
          status === "injury" && "ring-2 ring-bad",
          status === "suspension" && "ring-2 ring-red-600",
          (status === "illness" || status === "absence") &&
            "ring-2 ring-fg-muted",
        )}
      >
        <PlayerPortrait
          player={player}
          size="list"
          className="size-14 rounded-full"
        />
        <span
          className={cn(
            "absolute -bottom-1 -right-2 min-w-7 rounded-md bg-elevated px-1.5 py-0.5 text-center font-display text-sm font-bold tabular-nums shadow-[var(--shadow-border)]",
            ovrClass(player.ovr),
          )}
        >
          {player.ovr}
        </span>
        {status ? (
          <span className="absolute -left-1 -top-1 rounded-full bg-elevated p-0.5">
            <StatusGlyph status={status} />
          </span>
        ) : null}
      </span>
      <span className="flex max-w-full flex-col items-center rounded-sm bg-bg/85 px-1.5 py-0.5 text-center leading-tight">
        <span className="max-w-full truncate text-[10px] font-medium">
          {lastName(player.name)}
          {offPos && !status ? " !" : ""}
        </span>
        <span className="text-[9px] text-fg-muted">
          {POS_LABEL[player.pos]}
        </span>
      </span>
    </>
  );
}
