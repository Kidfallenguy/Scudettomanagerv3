import { useMemo } from "react";
import { Award, BarChart3 } from "lucide-react";
import { cn } from "@/lib/cn";
import { ALL_PLAYABLE_LEAGUES, clubById, domesticIds, leagueInfo } from "@/lib/game/clubs";

type LeagueRanking = {
  id: (typeof ALL_PLAYABLE_LEAGUES)[number];
  name: string;
  clubs: number;
  strength: number;
};

export function LeagueRankingView() {
  const rankings = useMemo(
    () =>
      ALL_PLAYABLE_LEAGUES.map((id): LeagueRanking => {
        const teams = domesticIds(id)
          .map((clubId) => clubById(clubId))
          .filter((club) => !club.ghost)
          .sort((a, b) => b.prestige - a.prestige);
        const average = teams.length
          ? teams.reduce((sum, club) => sum + club.prestige, 0) / teams.length
          : 0;
        const eliteAverage = teams.length
          ? teams
              .slice(0, Math.min(5, teams.length))
              .reduce((sum, club) => sum + club.prestige, 0) /
            Math.min(5, teams.length)
          : 0;

        return {
          id,
          name: leagueInfo(id).title,
          clubs: teams.length,
          strength: Math.round(average * 0.4 + eliteAverage * 0.6),
        };
      }).sort((a, b) => b.strength - a.strength || a.name.localeCompare(b.name)),
    [],
  );

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start gap-3">
        <span className="rounded-xl bg-primary/10 p-2 text-primary">
          <BarChart3 className="size-5" />
        </span>
        <div>
          <h2 className="font-display text-3xl font-semibold">Ranking de ligas</h2>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">
            Compará la fuerza de las competiciones según el prestigio de sus
            clubes. El puntaje pondera más a los cinco equipos mejor valorados.
          </p>
        </div>
      </header>

      <ol className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
        {rankings.map((league, index) => (
          <li
            key={league.id}
            className={cn(
              "grid grid-cols-[2.5rem_minmax(0,1fr)_3.5rem] items-center gap-3 border-b border-border/60 px-3 py-3 last:border-0 sm:grid-cols-[3rem_minmax(0,1fr)_6rem_5rem]",
              index < 3 && "bg-primary/[0.035]",
            )}
          >
            <span className="flex items-center justify-center font-display text-lg font-bold tabular-nums text-fg-muted">
              {index < 3 ? (
                <Award
                  className={cn(
                    "size-5",
                    index === 0
                      ? "text-amber-300"
                      : index === 1
                        ? "text-slate-300"
                        : "text-orange-300",
                  )}
                  aria-label={`Puesto ${index + 1}`}
                />
              ) : (
                String(index + 1).padStart(2, "0")
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{league.name}</span>
              <span className="text-xs text-fg-muted">
                {league.clubs} clubes
              </span>
            </span>
            <span
              className="hidden h-2 overflow-hidden rounded-full bg-elevated sm:block"
              aria-hidden="true"
            >
              <span
                className="block h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, league.strength)}%` }}
              />
            </span>
            <span className="text-right font-display text-xl font-bold tabular-nums">
              {league.strength}
              <span className="ml-1 text-[10px] font-medium text-fg-muted">pts</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
