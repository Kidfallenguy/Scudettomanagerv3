import { Layers, Play, Plus, Trash2 } from "lucide-react";
import { ClubCrest } from "@/components/game/crest";
import { NationalFlag } from "@/components/game/national-flag";
import { Button } from "@/components/ui/button";
import { findClub } from "@/lib/game/clubs";
import { seasonLabel } from "@/lib/game/format";
import { NATIONAL_TEAM_BY_ID } from "@/lib/game/national";
import { SLOT_COUNT, useGame } from "@/lib/game/store";
import type { GameSave } from "@/lib/game/types";

export function SlotsScreen() {
  const slots = useGame((s) => s.slots);
  const active = useGame((s) => s.slot);
  const clubId = useGame((s) => s.clubId);
  const careerMode = useGame((s) => s.careerMode ?? "club");
  const prepareSlot = useGame((s) => s.prepareSlot);
  const loadSlot = useGame((s) => s.loadSlot);
  const clearSlot = useGame((s) => s.clearSlot);
  const setScreen = useGame((s) => s.setScreen);
  const hasCareer = Boolean(findClub(clubId));

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 md:py-12">
        <header className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-fg-muted">Italia · Inglaterra</p>
          <h1 className="font-display text-5xl font-semibold leading-none tracking-tight md:text-7xl">
            Partidas
          </h1>
          <p className="max-w-lg text-fg-muted">
            Cinco huecos para carreras distintas.             Elige un slot vacío para tomar un club o una selección, o retoma una
            campaña guardada.
          </p>
        </header>

        <ul className="flex flex-col gap-3">
          {Array.from({ length: SLOT_COUNT }, (_, i) => {
            const save = slots[i] ?? null;
            return (
              <li key={i}>
                <SlotCard
                  index={i}
                  save={save}
                  active={active === i && hasCareer}
                  onPlay={() => (save ? loadSlot(i) : prepareSlot(i))}
                  onClear={() => clearSlot(i)}
                />
              </li>
            );
          })}
        </ul>

        {hasCareer ? (
          <Button
            variant="ghost"
            onClick={() =>
              setScreen(careerMode === "national" ? "international" : "office")
            }
          >
            {careerMode === "national"
              ? "Volver a la selección"
              : "Volver a la campaña activa"}
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => setScreen("boot")}>
            Volver al inicio
          </Button>
        )}
      </div>
    </div>
  );
}

function SlotCard({
  index,
  save,
  active,
  onPlay,
  onClear,
}: {
  index: number;
  save: GameSave | null;
  active: boolean;
  onPlay: () => void;
  onClear: () => void;
}) {
  const club = save ? findClub(save.clubId) : undefined;
  const nationalTeam =
    save?.careerMode === "national"
      ? NATIONAL_TEAM_BY_ID.get(save.nationalManagerId ?? "")
      : undefined;

  if (!save || (!club && !nationalTeam)) {
    return (
      <button
        type="button"
        onClick={onPlay}
        className="flex min-h-24 w-full items-center gap-4 rounded-2xl bg-surface px-4 py-4 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-[var(--motion-quick)] hover:shadow-[var(--shadow-border-hover)] md:px-5"
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-elevated text-fg-muted">
          <Plus className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-fg-muted">
            Slot {index + 1}
          </span>
          <span className="mt-1 block font-display text-2xl font-semibold leading-none">Vacío</span>
          <span className="mt-1 block text-sm text-fg-muted">Nueva carrera · club o selección</span>
        </span>
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5"
      style={
        active
          ? {
              boxShadow: "0 0 0 1px color-mix(in oklab, var(--color-primary) 55%, transparent)",
            }
          : undefined
      }
    >
      <div className="flex items-center gap-4">
        {nationalTeam ? (
          <NationalFlag team={nationalTeam} size="lg" className="h-10 w-14" />
        ) : club ? (
          <ClubCrest club={club} size={52} />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-fg-muted">
            Slot {index + 1}
            {active ? " · activa" : ""}
          </p>
          <p className="truncate font-display text-2xl font-semibold leading-none">
            {nationalTeam?.name ?? club?.name}
          </p>
          <p className="mt-1 text-sm text-fg-muted">
            {nationalTeam
              ? `Carrera de selección · ${seasonLabel(save.season)}`
              : `${seasonLabel(save.season)} · Jornada ${Math.max(1, save.week)}`}
          </p>
        </div>
        <Layers className="hidden size-4 text-fg-subtle sm:block" />
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          variant="club"
          className="flex-1"
          onClick={onPlay}
          style={{ "--club": club?.color } as React.CSSProperties}
        >
          <Play className="size-4" />
          Continuar
        </Button>
        <Button variant="outline" onClick={onClear} aria-label={`Borrar slot ${index + 1}`}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
