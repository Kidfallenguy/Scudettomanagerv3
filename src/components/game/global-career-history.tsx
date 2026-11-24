import { AWARD_DEFS, AWARD_KINDS } from "@/lib/game/awards";
import { ClubCrest } from "@/components/game/crest";
import { awardSeasonLabel } from "@/lib/game/award-history";
import { clubById } from "@/lib/game/clubs";
import { globalWinPercentage } from "@/lib/game/global-history";
import { useGame } from "@/lib/game/store";

export function GlobalCareerHistory() {
  const history = useGame((state) => state.globalCareerHistory);
  const winRate = globalWinPercentage(history);

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <h3 className="font-display text-xl font-semibold">
          Tu legado en todas las carreras
        </h3>
        <p className="mt-1 text-sm text-fg-muted">
          Este historial no se borra al eliminar una partida.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl bg-elevated p-3">
            <dt className="text-xs text-fg-muted">Victorias</dt>
            <dd className="mt-1 font-display text-2xl tabular-nums">
              {winRate}%
            </dd>
          </div>
          <div className="rounded-xl bg-elevated p-3">
            <dt className="text-xs text-fg-muted">Partidos</dt>
            <dd className="mt-1 font-display text-2xl tabular-nums">
              {history.played}
            </dd>
          </div>
          <div className="rounded-xl bg-elevated p-3">
            <dt className="text-xs text-fg-muted">Ganados</dt>
            <dd className="mt-1 font-display text-2xl tabular-nums">
              {history.won}
            </dd>
          </div>
          <div className="rounded-xl bg-elevated p-3">
            <dt className="text-xs text-fg-muted">Empates · derrotas</dt>
            <dd className="mt-1 font-display text-2xl tabular-nums">
              {history.drawn} · {history.lost}
            </dd>
          </div>
        </dl>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium">
          Premios ganados por tus clubes
        </h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {AWARD_KINDS.map((kind) => {
            const wins = history.awards
              .filter((award) => award.kind === kind)
              .sort((a, b) => b.season - a.season);
            return (
              <li
                key={kind}
                className="rounded-xl bg-surface p-3 shadow-[var(--shadow-border)]"
              >
                <h4 className="font-medium">{AWARD_DEFS[kind].name}</h4>
                {wins.length ? (
                  <ul className="mt-2 space-y-2">
                    {wins.map((win) => (
                      <li
                        key={win.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <ClubCrest club={clubById(win.clubId)} size={26} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {win.clubName}
                          </span>
                          <span className="block text-xs text-fg-muted">
                            {awardSeasonLabel(win.season, win.clubId)} ·{" "}
                            {win.winnerName}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-good/10 px-2 py-1 text-xs text-good">
                          Ganado
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-fg-muted">
                    Todavía no ganado
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
