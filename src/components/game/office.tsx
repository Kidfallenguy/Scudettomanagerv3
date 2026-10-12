import { useMemo, useState } from "react";
import { ArrowRight, Building2, Dumbbell, Handshake, Mic, Newspaper, Sprout, Trophy } from "lucide-react";
import { BoardCard } from "@/components/game/board";
import { CareerCard } from "@/components/game/career";
import { ClubCrest } from "@/components/game/crest";
import { MatchHistoryModal } from "@/components/game/match-history";
import { Button } from "@/components/ui/button";
import { clubById } from "@/lib/game/clubs";
import { formatMoney, formatWage, seasonLabel } from "@/lib/game/format";
import { historicalCoverageFor, honourKinds, honourLabel } from "@/lib/game/honours";
import { COMP_THEME, compLabel, compPanelStyle } from "@/lib/game/competitions";
import { formString, nextUserStep, pendingLabel, tablePlace } from "@/lib/game/selectors";
import { useGame, weeklyWages } from "@/lib/game/store";
import { sortTable } from "@/lib/game/world";

export function Office() {
  const clubId = useGame((s) => s.clubId);
  const season = useGame((s) => s.season);
  const budget = useGame((s) => s.budget);
  const news = useGame((s) => s.news);
  const unseenNews = useGame((s) => s.news.filter((item) => !item.seen).length);
  const openNews = useGame((s) => s.openNews);
  const standings = useGame((s) => s.standings);
  const goToNextMatch = useGame((s) => s.goToNextMatch);
  const setScreen = useGame((s) => s.setScreen);
  const pressFrequency = useGame((s) => s.pressFrequency ?? "every");
  const setPressFrequency = useGame((s) => s.setPressFrequency);
  const pressHistoryCount = useGame((s) => s.pressHistory?.length ?? 0);
  const seasonOver = useGame((s) => s.seasonOver);
  const honours = useGame((s) => s.honours);
  const careerTrophies = useGame((s) => s.careerTrophies);
  const save = useGame((s) => s);
  const [historyOpen, setHistoryOpen] = useState(false);
  const club = clubById(clubId);
  // Each calculation receives a save projection, so these are its complete input dependencies.
  const place = useMemo(
    () => tablePlace({ ...save, clubId, standings }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clubId, standings],
  );
  const form = useMemo(
    () => formString({ ...save, calendar: save.calendar, clubId, fixtures: save.fixtures, seed: save.seed }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clubId, save.calendar, save.fixtures, save.seed],
  );
  const nextStep = useMemo(
    () => nextUserStep({
      ...save,
      calendar: save.calendar,
      clubId,
      cursor: save.cursor,
      fixtures: save.fixtures,
      libGroups: save.libGroups,
      libStandings: save.libStandings,
      pendingFixtureId: save.pendingFixtureId,
      seed: save.seed,
      sudTeams: save.sudTeams,
      uclGroups: save.uclGroups,
      uclStandings: save.uclStandings,
      uelStandings: save.uelStandings,
      uelTeams: save.uelTeams,
      ueclStandings: save.ueclStandings,
      ueclTeams: save.ueclTeams,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      clubId,
      save.calendar,
      save.cursor,
      save.fixtures,
      save.libGroups,
      save.libStandings,
      save.pendingFixtureId,
      save.seed,
      save.sudTeams,
      save.uclGroups,
      save.uclStandings,
      save.uelStandings,
      save.uelTeams,
      save.ueclStandings,
      save.ueclTeams,
    ],
  );
  const next = useMemo(
    () => pendingLabel({ ...save, clubId, seasonOver }, nextStep),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clubId, nextStep, seasonOver],
  );
  const nextComp = seasonOver ? null : (nextStep?.slot.competition ?? null);
  const wages = useMemo(
    () => weeklyWages({ ...save, clubId, players: save.players }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clubId, save.players],
  );
  const nearby = sortTable(standings).slice(Math.max(0, place - 3), place + 2);
  const lastTrophy = careerTrophies[careerTrophies.length - 1];
  const historyCoverage = club.league === "saudiProLeague" || club.league === "saudiFirstDivision"
    ? null
    : historicalCoverageFor(clubId);
  const trophyKinds = honourKinds(club.league);
  const hasPendingTrophies = Boolean(
    historyCoverage && trophyKinds.some((kind) => !historyCoverage.knownKinds.includes(kind)),
  );
  const rescue = save.clubRescue;

  return (
    <div className="flex flex-col gap-5">
      <section
        className="overflow-hidden rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] md:p-6"
        style={compPanelStyle(nextComp)}
      >
        <p
          className="text-[11px] font-medium uppercase tracking-[0.18em] text-fg-muted"
          style={nextComp ? { color: COMP_THEME[nextComp].accent } : undefined}
        >
          {nextComp ? `${compLabel(nextComp, club.league)} · ` : "Próximo paso · "}
          {seasonLabel(season)}
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold leading-none md:text-4xl">
          {seasonOver ? "Temporada cerrada" : next}
        </h2>
        <p className="mt-2 text-sm text-fg-muted">
          {club.stadium} · {club.city}
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="club"
            size="lg"
            onClick={() => (seasonOver ? setScreen("season-end") : goToNextMatch())}
          >
            {seasonOver ? "Ver resumen" : "Continuar"}
            <ArrowRight />
          </Button>
          <Button variant="outline" size="lg" onClick={() => setScreen("tactics")}>
            Alineación
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs text-fg-muted">Clasificación</p>
          <p className="font-display text-5xl font-semibold tabular-nums leading-none">{place}º</p>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            aria-label="Ver historial de partidos de la temporada"
            className="mt-3 flex w-full items-center gap-1 text-left"
          >
            {form.length === 0 ? (
              <span className="text-xs text-fg-subtle">Sin partidos</span>
            ) : (
              form.map((f, i) => (
                <span
                  key={`${f}-${i}`}
                  className="flex size-6 items-center justify-center rounded-sm text-[11px] font-semibold text-bg"
                  style={{
                    background:
                      f === "W" ? "var(--color-good)" : f === "D" ? "var(--color-warn)" : "var(--color-bad)",
                  }}
                >
                  {f === "W" ? "G" : f === "D" ? "E" : "P"}
                </span>
              ))
            )}
            <span className="ml-auto text-[11px] text-fg-muted">Historial →</span>
          </button>
        </article>
        <article className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs text-fg-muted">Caja</p>
          <p className="font-display text-4xl font-semibold tabular-nums leading-none">
            {formatMoney(budget)}
          </p>
          <p className="mt-2 text-xs text-fg-muted">Salarios {formatWage(wages)}</p>
        </article>
        <button
          type="button"
          onClick={() => setScreen("cabinet")}
          className="rounded-2xl bg-surface p-4 text-left shadow-[var(--shadow-border)]"
        >
          <p className="text-xs text-fg-muted">Vitrina</p>
          <div className="mt-2 flex items-start gap-2">
            <Trophy className="mt-0.5 size-4 text-primary" />
            <p className="text-sm">{lastTrophy ? lastTrophy.label : "Todavía vacía esta carrera"}</p>
          </div>
          <p className="mt-2 text-xs text-fg-muted">Entrar a trofeos y estadísticas →</p>
        </button>
      </div>

      <BoardCard />

      <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-medium">
              <Mic className="size-4 text-primary" />
              Conferencias de prensa
            </h3>
            <p className="mt-1 text-xs text-fg-muted">Elige cuándo quieres recibir preguntas después de tus partidos.</p>
          </div>
          {pressHistoryCount > 0 ? (
            <Button variant="outline" size="sm" onClick={() => setScreen("press-history")}>
              Historial · {pressHistoryCount}
            </Button>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3" role="group" aria-label="Frecuencia de las conferencias">
          {([
            ["every", "Todos los partidos"],
            ["important", "Solo los importantes"],
            ["off", "No ofrecer"],
          ] as const).map(([frequency, label]) => (
            <button
              key={frequency}
              type="button"
              aria-pressed={pressFrequency === frequency}
              onClick={() => setPressFrequency(frequency)}
              className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                pressFrequency === frequency ? "bg-primary text-bg" : "bg-elevated text-fg-muted hover:text-fg"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {rescue ? (
        <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-fg-muted">Salvar el club</p>
              <h3 className="mt-1 font-display text-2xl font-semibold">
                {rescue.status === "completed" ? "Rescate completado" : "Plan financiero en curso"}
              </h3>
            </div>
            <span className="rounded-full bg-elevated px-3 py-1 text-xs text-fg-muted">
              {rescue.status === "completed" ? "Deuda saldada" : `${rescue.installmentsPaid}/${rescue.termSeasons} cuotas`}
            </span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-elevated p-3"><p className="text-xs text-fg-muted">Deuda inicial</p><p className="mt-1 font-display text-2xl tabular-nums">{formatMoney(rescue.principal)}</p></div>
            <div className="rounded-xl bg-elevated p-3"><p className="text-xs text-fg-muted">Saldo</p><p className="mt-1 font-display text-2xl tabular-nums">{formatMoney(rescue.balance)}</p></div>
            <div className="rounded-xl bg-elevated p-3"><p className="text-xs text-fg-muted">Próxima cuota</p><p className="mt-1 font-display text-2xl tabular-nums">{formatMoney(rescue.installmentAmount)}</p></div>
          </div>
          {rescue.status === "active" ? (
            <p className="mt-3 text-xs leading-relaxed text-fg-muted">
              Se cobra una sola vez cuando avanzas a la siguiente temporada. Impagos acumulados: {rescue.missedPayments}.
              {rescue.missedPayments >= 2 ? " Los planes pagos de entrenamiento están suspendidos." : rescue.missedPayments >= 1 ? " Las nuevas contrataciones están congeladas." : ""}
              {" "}El balance deportivo no puede despedirte mientras el rescate siga activo.
            </p>
          ) : (
            <p className="mt-3 text-xs text-fg-muted">La carrera continúa con normalidad y se reactivan las decisiones deportivas de la directiva.</p>
          )}
          {rescue.history.length ? (
            <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
              {rescue.history.slice(-3).reverse().map((payment) => (
                <li key={payment.season} className="flex flex-wrap justify-between gap-2 text-xs text-fg-muted">
                  <span>Temporada {payment.season} · {payment.missed ? "Incumplida" : "Pagada"}</span>
                  <span>{formatMoney(payment.paid)} · saldo {formatMoney(payment.balance)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <CareerCard />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Button variant="outline" size="lg" onClick={() => setScreen("stadium")}>
          <Building2 className="size-4" />
          Estadio
        </Button>
        <Button variant="outline" size="lg" onClick={() => setScreen("academy")}>
          <Sprout className="size-4" />
          Cantera y ojeos
        </Button>
        <Button variant="outline" size="lg" onClick={() => setScreen("train")}>
          <Dumbbell className="size-4" />
          {save.trainingReports.some((r) => !r.seen)
            ? "Entrenamiento · ¡informe listo!"
            : save.trainingPlans.length > 0
              ? "Entrenamiento · en curso"
              : "Entrenamiento"}
        </Button>
        <Button variant="outline" size="lg" onClick={() => setScreen("sponsors")}>
          <Handshake className="size-4" />
          Patrocinadores
        </Button>
      </div>

      <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <Trophy className="size-4 text-primary" />
            Palmarés
          </h3>
          <button type="button" className="text-xs text-fg-muted" onClick={() => setScreen("cabinet")}>
            Ver vitrina
          </button>
        </div>
        {historyCoverage && historyCoverage.status !== "complete" && hasPendingTrophies && (
          <p className="mb-3 text-xs text-fg-muted">
            {historyCoverage.status === "partial"
              ? "Historial parcial; los torneos pendientes no se cuentan como cero."
              : "Historial pendiente de documentación."}
          </p>
        )}
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {trophyKinds.map((k) => {
            const countKnown = !historyCoverage || historyCoverage.status === "complete" || historyCoverage.knownKinds.includes(k);
            const trophyCount = honours[k] ?? 0;
            return (
              <li key={k} className="rounded-lg bg-elevated px-3 py-2">
                <p className="text-[11px] text-fg-muted">{honourLabel(k, club.league)}</p>
                <p className="font-display text-2xl tabular-nums">×{countKnown ? trophyCount : 0}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium">Vecinos de tabla</h3>
          <button type="button" className="text-xs text-fg-muted" onClick={() => setScreen("table")}>
            Ver liga
          </button>
        </div>
        <ul className="divide-y divide-border">
          {nearby.map((row) => {
            const c = clubById(row.clubId);
            const pos = sortTable(standings).findIndex((r) => r.clubId === row.clubId) + 1;
            return (
              <li key={row.clubId} className="flex items-center gap-3 py-2">
                <span className="w-6 text-right font-display text-lg tabular-nums text-fg-muted">
                  {pos}
                </span>
                <ClubCrest club={c} size={24} />
                <span className={row.clubId === clubId ? "flex-1 font-medium" : "flex-1 text-fg-muted"}>
                  {c.name}
                </span>
                <span className="font-display text-lg tabular-nums">{row.pts}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <Newspaper className="size-4 text-fg-muted" />
            Despacho
          </h3>
          <Button variant="outline" size="sm" onClick={openNews}>
            Abrir periódico · {unseenNews} nuevas
          </Button>
        </div>
        <ul className="flex flex-col gap-3">
          {news.slice(0, 5).map((n) => (
            <li key={n.id} className="border-l-2 pl-3" style={{ borderColor: tone(n.tone) }}>
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-fg-muted">{n.body}</p>
            </li>
          ))}
        </ul>
      </section>
      {historyOpen ? <MatchHistoryModal onClose={() => setHistoryOpen(false)} /> : null}
    </div>
  );
}

function tone(t: "good" | "bad" | "neutral") {
  if (t === "good") return "var(--color-good)";
  if (t === "bad") return "var(--color-bad)";
  return "var(--color-border-strong)";
}
