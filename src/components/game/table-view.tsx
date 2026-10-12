import { useState } from "react";
import { ClubCrest } from "@/components/game/crest";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { clubById, domesticCompetition, isPortugueseReserveTeam, leagueInfo } from "@/lib/game/clubs";
import {
  COMP_THEME,
  QUAL_COLOR,
  QUAL_LABEL,
  UCL_DIRECT_SPOTS,
  UCL_LEAGUE_ROUNDS,
  UCL_PLAYOFF_SPOTS,
  UECL_DIRECT_SPOTS,
  UECL_LEAGUE_ROUNDS,
  UECL_PLAYOFF_SPOTS,
  UEL_DIRECT_SPOTS,
  UEL_LEAGUE_ROUNDS,
  UEL_PLAYOFF_SPOTS,
  compLabel,
  compPanelStyle,
  continentalCompsFor,
  stageLabel,
  qualBandForPlace,
  type QualBand,
} from "@/lib/game/competitions";
import { useGame } from "@/lib/game/store";
import type { Competition, Fixture, LeagueKind, PlayableLeagueId } from "@/lib/game/types";
import { competitionTopScorers } from "@/lib/game/selectors";
import { sortTable } from "@/lib/game/world";

export function TableView() {
  const clubId = useGame((s) => s.clubId);
  const standings = useGame((s) => s.standings);
  const uclStandings = useGame((s) => s.uclStandings);
  const uelStandings = useGame((s) => s.uelStandings);
  const ueclStandings = useGame((s) => s.ueclStandings);
  const fixtures = useGame((s) => s.fixtures);
  const players = useGame((s) => s.players);
  const libStandings = useGame((s) => s.libStandings);
  const libGroups = useGame((s) => s.libGroups);
  const mundialGroups = useGame((s) => s.mundialGroups);
  const club = clubById(clubId);
  const leagueTab = domesticCompetition(club.league);
  const [tab, setTab] = useState<Competition>(leagueTab);
  const topScorers = competitionTopScorers(fixtures, players, tab);

  const info = leagueInfo(club.league);
  // Solo las competiciones del país/región del club: UEFA (Champions, Europa, Conference) para ligas europeas.
  // Clubes argentinos: Libertadores y Sudamericana (CONMEBOL).
  const continentalTabs = continentalCompsFor(club.league);
  const europeanTabs = continentalTabs.filter((c) => c === "ucl" || c === "uel" || c === "uecl");
  const cupRegion = europeanTabs.length ? "europeas" : continentalTabs.length ? "sudamericanas" : "nacionales";
  const tabs: Competition[] = [
    leagueTab,
    // Los equipos B portugueses (Benfica B, FC Porto B, Sporting CP B) no juegan la Taça de Portugal ni la Taça da Liga.
    ...(isPortugueseReserveTeam(club.id) ||
    club.league === "bundesliga3" ||
    club.league === "promocionalAmateur" ||
    club.league === "saudiProLeague" ||
    club.league === "saudiFirstDivision"
      ? []
      : (["coppa"] as Competition[])),
    ...(club.league === "saudiProLeague" || club.league === "saudiFirstDivision"
      ? (["kingsCup"] as Competition[])
      : []),
    ...(club.league === "premier" || club.league === "championship" || club.league === "leagueOne" || club.league === "leagueTwo" || ((club.league === "primeira" || club.league === "primeira2") && !isPortugueseReserveTeam(club.id)) ? ([ "carabao" ] as Competition[]) : []),
    ...continentalTabs,
    ...(club.league === "championship" || club.league === "leagueOne" || club.league === "leagueTwo" || club.league === "segunda" || club.league === "primeraFed1" || club.league === "primeraFed2" || club.league === "primeraNacional" || club.league === "primeraBMetro" || club.league === "argentinaCuarta" || club.league === "argentinaQuinta" || club.league === "promocionalAmateur" || club.league === "serieB" || club.league === "bundesliga2" || club.league === "bundesliga3" || club.league === "ligue3" || club.league === "brasileiraoB" || club.league === "saudiProLeague" || club.league === "saudiFirstDivision" || ((club.league === "ligue2" || club.league === "primeira2") && !fixtures.some((f) => f.competition === "supercoppa")) ? [] : (["supercoppa"] as Competition[])),
    ...(club.league === "saudiProLeague" || club.league === "saudiFirstDivision"
      ? (["saudiSuperCup"] as Competition[])
      : []),
    ...(club.league === "argentina" ? (["trofeo"] as Competition[]) : []),
    ...((mundialGroups ?? []).length > 0 ? (["mundial"] as Competition[]) : []),
  ];

  const isPlayable = ["serieA", "serieB", "premier", "championship", "leagueOne", "leagueTwo", "laliga", "segunda", "primeraFed1", "primeraFed2", "bundesliga", "bundesliga2", "bundesliga3", "ligue1", "ligue2", "ligue3", "argentina", "primeraNacional", "primeraBMetro", "argentinaCuarta", "argentinaQuinta", "promocionalAmateur", "brasileirao", "brasileiraoB", "primeira", "primeira2"].includes(club.league);
  const bandOf = isPlayable
    ? (place: number, n: number): QualBand => qualBandForPlace(club.league as PlayableLeagueId, place, n)
    : undefined;

  return (
    <div className="flex flex-col gap-4 rounded-3xl p-3 transition-colors" style={compPanelStyle(tab)}>
      <header>
        <h2 className="font-display text-3xl font-semibold" style={{ color: COMP_THEME[tab].accent }}>
          Tablas y copas
        </h2>
        <p className="text-sm text-fg-muted">
          {info.title}, {info.cup} y copas {cupRegion}
        </p>
      </header>
      <div className="flex flex-wrap gap-1">
        {tabs.map((c) => (
          <Button key={c} size="sm" variant={tab === c ? "club" : "ghost"} onClick={() => setTab(c)}>
            {compLabel(c, club.league)}
          </Button>
        ))}
      </div>

      {tab === leagueTab ? <LeagueTable rows={sortTable(standings)} clubId={clubId} bandOf={bandOf} /> : null}
      {tab === "ucl" ? (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="mb-2 text-sm font-medium text-fg-muted">Fase de liga · 36 equipos · 8 jornadas</h3>
            <LeagueTable
              rows={sortTable(uclStandings)}
              clubId={clubId}
              compact
              bandOf={(place): QualBand =>
                place <= UCL_DIRECT_SPOTS ? "ucl" : place <= UCL_PLAYOFF_SPOTS ? "uel" : "releg"
              }
              legendLabels={{
                ucl: "Octavos de final (1.º–8.º)",
                uel: "Playoff de acceso a Octavos (9.º–24.º)",
                releg: "Eliminados (25.º–36.º)",
              }}
            />
          </div>
          <KnockoutList
            fixtures={fixtures.filter((f) => f.competition === "ucl" && f.round > UCL_LEAGUE_ROUNDS)}
            clubId={clubId}
            comp="ucl"
            league={club.league}
          />
        </div>
      ) : null}
      {tab === "libertadores" ? (
        <div className="flex flex-col gap-4">
          {libGroups.map((group, i) => (
            <div key={group.join("-")}>
              <h3 className="mb-2 text-sm font-medium text-fg-muted">Grupo {String.fromCharCode(65 + i)}</h3>
              <LeagueTable
                rows={sortTable(libStandings.filter((r) => group.includes(r.clubId)))}
                clubId={clubId}
                compact
              />
            </div>
          ))}
          <KnockoutList
            fixtures={fixtures.filter((f) => f.competition === "libertadores" && f.round >= 7)}
            clubId={clubId}
            comp="libertadores"
            league={club.league}
          />
        </div>
      ) : null}
      {tab === "sudamericana" ? (
        <KnockoutList
          fixtures={fixtures.filter((f) => f.competition === "sudamericana")}
          clubId={clubId}
          comp="sudamericana"
          league={club.league}
        />
      ) : null}
      {tab === "coppa" ? (
        <KnockoutList
          fixtures={fixtures.filter((f) => f.competition === "coppa")}
          clubId={clubId}
          comp="coppa"
          league={club.league}
        />
      ) : null}
      {tab === "kingsCup" ? (
        <KnockoutList
          fixtures={fixtures.filter((f) => f.competition === "kingsCup")}
          clubId={clubId}
          comp="kingsCup"
          league={club.league}
        />
      ) : null}
      {tab === "uel" ? (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="mb-2 text-sm font-medium text-fg-muted">Fase de liga · 36 equipos · 8 jornadas</h3>
            <LeagueTable
              rows={sortTable(uelStandings)}
              clubId={clubId}
              compact
              bandOf={(place): QualBand =>
                place <= UEL_DIRECT_SPOTS ? "ucl" : place <= UEL_PLAYOFF_SPOTS ? "uel" : "releg"
              }
              legendLabels={{
                ucl: "Octavos de final (1.º–8.º)",
                uel: "Playoff de acceso a Octavos (9.º–24.º)",
                releg: "Eliminados (25.º–36.º)",
              }}
            />
          </div>
          <KnockoutList
            fixtures={fixtures.filter((f) => f.competition === "uel" && f.round > UEL_LEAGUE_ROUNDS)}
            clubId={clubId}
            comp="uel"
            league={club.league}
          />
        </div>
      ) : null}
      {tab === "uecl" ? (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="mb-2 text-sm font-medium text-fg-muted">Fase de liga · 36 equipos · 6 jornadas</h3>
            <LeagueTable
              rows={sortTable(ueclStandings ?? [])}
              clubId={clubId}
              compact
              bandOf={(place): QualBand =>
                place <= UECL_DIRECT_SPOTS ? "ucl" : place <= UECL_PLAYOFF_SPOTS ? "uel" : "releg"
              }
              legendLabels={{
                ucl: "Octavos de final (1.º–8.º)",
                uel: "Playoff de acceso a Octavos (9.º–24.º)",
                releg: "Eliminados (25.º–36.º)",
              }}
            />
          </div>
          <KnockoutList
            fixtures={fixtures.filter((f) => f.competition === "uecl" && f.round > UECL_LEAGUE_ROUNDS)}
            clubId={clubId}
            comp="uecl"
            league={club.league}
          />
        </div>
      ) : null}
      {tab === "trofeo" ? (
        <KnockoutList
          fixtures={fixtures.filter((f) => f.competition === "trofeo")}
          clubId={clubId}
          comp="trofeo"
          league={club.league}
        />
      ) : null}
      {tab === "carabao" ? (
        <KnockoutList
          fixtures={fixtures.filter((f) => f.competition === "carabao")}
          clubId={clubId}
          comp="carabao"
          league={club.league}
        />
      ) : null}
      {tab === "supercoppa" ? (
        <KnockoutList
          fixtures={fixtures.filter((f) => f.competition === "supercoppa")}
          clubId={clubId}
          comp="supercoppa"
          league={club.league}
        />
      ) : null}
      {tab === "saudiSuperCup" ? (
        <KnockoutList
          fixtures={fixtures.filter((f) => f.competition === "saudiSuperCup")}
          clubId={clubId}
          comp="saudiSuperCup"
          league={club.league}
        />
      ) : null}
      {tab === "mundial" ? (
        <KnockoutList
          fixtures={fixtures.filter((f) => f.competition === "mundial")}
          clubId={clubId}
          comp="mundial"
          league={club.league}
        />
      ) : null}
      <TopScorers rows={topScorers} competition={tab} clubId={clubId} league={club.league} />
    </div>
  );
}

function TopScorers({
  rows,
  competition,
  clubId,
  league,
}: {
  rows: ReturnType<typeof competitionTopScorers>;
  competition: Competition;
  clubId: string;
  league: LeagueKind;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
      <header className="border-b border-border px-4 py-3">
        <h3 className="font-display text-xl font-semibold" style={{ color: COMP_THEME[competition].accent }}>
          Máximos goleadores
        </h3>
        <p className="text-xs text-fg-muted">{compLabel(competition, league)} · temporada actual</p>
      </header>
      {rows.length ? (
        <ol className="divide-y divide-border/60">
          {rows.map(({ player, goals }, index) => {
            const playerClub = clubById(player.clubId);
            return (
              <li
                key={player.id}
                className={cn("flex items-center gap-3 px-4 py-2.5", player.clubId === clubId && "bg-primary/10")}
              >
                <span className="w-5 text-center font-display text-lg tabular-nums text-fg-muted">
                  {index + 1}
                </span>
                <ClubCrest club={playerClub} size={26} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{player.name}</p>
                  <p className="truncate text-xs text-fg-muted">{playerClub.name}</p>
                </div>
                <p className="font-display text-xl font-semibold tabular-nums">
                  {goals} <span className="text-xs font-normal text-fg-muted">gol{goals === 1 ? "" : "es"}</span>
                </p>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="px-4 py-5 text-sm text-fg-muted">
          Aún no hay goles registrados para esta competición.
        </p>
      )}
    </section>
  );
}

function LeagueTable({
  rows,
  clubId,
  compact,
  bandOf,
  legendLabels,
}: {
  rows: ReturnType<typeof sortTable>;
  clubId: string;
  compact?: boolean;
  bandOf?: (place: number, nTeams: number) => QualBand;
  legendLabels?: Partial<Record<QualBand, string>>;
}) {
  const legend = bandOf
    ? (["promo", "playoff", "ucl", "uel", "uecl", "libertadores", "sudamericana", "relegPlayoff", "releg"] as QualBand[]).filter((b) =>
        rows.some((_, i) => bandOf(i + 1, rows.length) === b),
      )
    : [];
  return (
    <div className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
      <table className="w-full text-sm">
        <thead className="text-left text-[11px] uppercase tracking-wider text-fg-muted">
          <tr className="border-b border-border">
            <th className="px-3 py-2 font-medium">#</th>
            <th className="px-2 py-2 font-medium">Club</th>
            <th className="px-2 py-2 font-medium">PJ</th>
            {!compact ? <th className="hidden px-2 py-2 font-medium sm:table-cell">G</th> : null}
            <th className="px-2 py-2 font-medium">DG</th>
            <th className="px-3 py-2 text-right font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const c = clubById(row.clubId);
            const mine = row.clubId === clubId;
            const band = bandOf ? bandOf(i + 1, rows.length) : "mid";
            const color = QUAL_COLOR[band];
            return (
              <tr
                key={row.clubId}
                className={cn("border-b border-border/60", mine && "bg-primary/12")}
                style={
                  band !== "mid"
                    ? { background: `color-mix(in oklab, ${color} ${mine ? 24 : 13}%, transparent)` }
                    : undefined
                }
              >
                <td
                  className="px-3 py-2 font-display tabular-nums text-fg-muted"
                  style={{ boxShadow: `inset 4px 0 0 ${color}` }}
                >
                  {i + 1}
                </td>
                <td className="px-2 py-2">
                  <span className="flex items-center gap-2">
                    <ClubCrest club={c} size={22} />
                    <span className={cn("truncate", mine && "font-medium")}>{c.short}</span>
                  </span>
                </td>
                <td className="px-2 tabular-nums text-fg-muted">{row.played}</td>
                {!compact ? (
                  <td className="hidden px-2 tabular-nums text-fg-muted sm:table-cell">{row.won}</td>
                ) : null}
                <td className="px-2 tabular-nums text-fg-muted">{row.gf - row.ga}</td>
                <td className="px-3 text-right font-display text-lg tabular-nums">{row.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {legend.length ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border px-3 py-2 text-[11px] text-fg-muted">
          {legend.map((b) => (
            <li key={b} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: QUAL_COLOR[b] }} />
              {legendLabels?.[b] ?? QUAL_LABEL[b]}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function KnockoutList({
  fixtures,
  clubId,
  comp,
  league,
}: {
  fixtures: Fixture[];
  clubId: string;
  comp: Competition;
  league: LeagueKind;
}) {
  const rounds = [...new Set(fixtures.map((f) => f.round))].sort((a, b) => a - b);
  if (rounds.length === 0) {
    if (comp === "kingsCup") {
      return (
        <p className="text-sm text-fg-muted">
          El reglamento y los participantes oficiales de 2026/27 aún no fueron publicados por la SAFF.{" "}
          <a
            className="underline underline-offset-2"
            href="https://www.saff.com.sa/news.php?id=4407"
            target="_blank"
            rel="noreferrer"
          >
            Ver anuncio oficial
          </a>
        </p>
      );
    }
    return <p className="text-sm text-fg-muted">Aún no hay cruces.</p>;
  }
  return (
    <div className="flex flex-col gap-4">
      {rounds.map((r) => (
        <section key={r}>
          <h3 className="mb-2 text-sm font-medium text-fg-muted">{stageLabel(comp, league, r)}</h3>
          <ul className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
            {fixtures
              .filter((f) => f.round === r)
              .map((f) => {
                const home = clubById(f.homeId);
                const away = clubById(f.awayId);
                const mine = f.homeId === clubId || f.awayId === clubId;
                return (
                  <li
                    key={f.id}
                    className={cn(
                      "flex items-center gap-2 border-b border-border/60 px-3 py-2.5 last:border-0",
                      mine && "bg-primary/10",
                    )}
                  >
                    <ClubCrest club={home} size={22} />
                    <span className="w-12 truncate text-sm">{home.short}</span>
                    <span className="flex-1 text-center font-display text-xl tabular-nums">
                      {f.played ? `${f.homeGoals}–${f.awayGoals}` : "vs"}
                    </span>
                    <span className="w-12 truncate text-right text-sm">{away.short}</span>
                    <ClubCrest club={away} size={22} />
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}