import { useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { ClubCrest } from "@/components/game/crest";
import { PlayerPortrait } from "@/components/game/player-portrait";
import { Button } from "@/components/ui/button";
import { clubById } from "@/lib/game/clubs";
import { contractEndLabel } from "@/lib/game/contracts";
import { useGame } from "@/lib/game/store";
import type { Player } from "@/lib/game/types";

export function RenewalCelebration({
  player,
  onClose,
}: {
  player: Player;
  onClose: () => void;
}) {
  const season = useGame((state) => state.season);
  const club = clubById(player.clubId);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="signing-celebration"
      role="dialog"
      aria-modal="true"
      aria-labelledby="renewal-moment-title"
      onClick={onClose}
    >
      <div className="signing-sparks" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <span
            key={index}
            className="signing-spark"
            style={{
              left: `${5 + ((index * 47) % 90)}%`,
              top: `${(index * 31) % 75}%`,
              animationDelay: `${(index % 6) * 90}ms`,
              transform: `rotate(${index * 35}deg)`,
            }}
          />
        ))}
      </div>
      <section
        className="signing-card"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          autoFocus
          aria-label="Cerrar celebración de renovación"
          className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-fg/8 hover:text-fg"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
        <div className="signing-seal" aria-hidden="true">
          <Sparkles className="size-8" />
        </div>
        <PlayerPortrait player={player} size="hero" className="mx-auto mt-4" />
        <p className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-club">
          <Sparkles className="size-4" />
          Renovación confirmada
          <Sparkles className="size-4" />
        </p>
        <h2
          id="renewal-moment-title"
          className="mt-2 font-display text-4xl font-semibold leading-none sm:text-5xl"
        >
          {player.name}
        </h2>
        <p className="mt-2 text-sm text-fg-muted">
          Seguirá defendiendo estos colores hasta el{" "}
          {contractEndLabel(season, player)}.
        </p>
        <div className="my-5 flex items-center justify-center gap-3 border-y border-border py-4">
          <span className="signing-club-crest">
            <ClubCrest club={club} size={40} />
          </span>
          <div className="text-left">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-fg-muted">
              Sigue en
            </p>
            <p className="font-display text-xl font-semibold">{club.name}</p>
          </div>
        </div>
        <Button variant="outline" onClick={onClose}>
          Celebrar
        </Button>
      </section>
    </div>
  );
}
