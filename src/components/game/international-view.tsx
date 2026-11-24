import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  Globe2,
  Search,
  Shield,
  Swords,
  Table2,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NationalFlag } from "@/components/game/national-flag";
import { PlayerPortrait } from "@/components/game/player-portrait";
import { CLUBS } from "@/lib/game/clubs";
import {
  NATIONAL_TEAMS,
  NATIONAL_TEAM_BY_ID,
  NATIONAL_TOURNAMENTS,
  nationalPositionGroup,
  nationalSquad,
  nationalSquadFromIds,
  nationalSquadOptions,
  type NationalApplication,
  type NationalOffer,
  type NationalTitle,
} from "@/lib/game/national";
import { managerLabel, managerReport } from "@/lib/game/manager";
import { useGame } from "@/lib/game/store";
import type {
  NationalSquadPlayer,
  NationalTournamentState,
  Standing,
} from "@/lib/game/types";
import { translate, useLang } from "@/lib/i18n";

const CONFEDERATIONS = ["UEFA", "CAF", "AFC", "CONCACAF", "CONMEBOL", "OFC"] as const;
const CONFEDERATION_PLACES = "UEFA 16 · CAF 9 · AFC 8 · CONCACAF 6 · CONMEBOL 6 · OFC 1 · Repechaje 2";
const EMPTY_PLAYER_IDS: string[] = [];
const EMPTY_OFFERS: NationalOffer[] = [];
const EMPTY_NATIONAL_APPLICATIONS: NationalApplication[] = [];
const EMPTY_GROUPS: string[][] = [];
const EMPTY_STANDINGS: Standing[] = [];
const EMPTY_TROPHIES: NationalTitle[] = [];
const EMPTY_NATIONAL_TOURNAMENTS: NationalTournamentState[] = [];
const EMPTY_SWITCH_REQUESTS: Array<{
  playerId: string;
  teamId: string;
  season: number;
  accepted: boolean;
}> = [];
const EMPTY_DEVELOPMENT_REQUESTS: Array<{
  playerId: string;
  teamId: string;
  season: number;
}> = [];

function ranked(rows: Standing[]) {
  return [...rows].sort(
    (a, b) =>
      b.pts - a.pts ||
      b.gf - b.ga - (a.gf - a.ga) ||
      b.gf - a.gf ||
      a.clubId.localeCompare(b.clubId),
  );
}

export function InternationalView() {
  const lang = useLang();
  const displayNames = useMemo(
    () => new Intl.DisplayNames([lang === "pt" ? "pt-BR" : lang], { type: "region" }),
    [lang],
  );
  const season = useGame((state) => state.season);
  const careerMode = useGame((state) => state.careerMode ?? "club");
  const seasonOver = useGame((state) => state.seasonOver);
  const nationalTrainingCursor = useGame(
    (state) => state.nationalTrainingCursor,
  );
  const nationalTrainingSeason = useGame(
    (state) => state.nationalTrainingSeason,
  );
  const seed = useGame((state) => state.seed);
  const players = useGame((state) => state.players);
  const freeAgents = useGame((state) => state.freeAgents);
  const calendar = useGame((state) => state.calendar);
  const cursor = useGame((state) => state.cursor);
  const managerTeamId = useGame((state) => state.nationalManagerId ?? null);
  const selectedIds = useGame((state) => state.nationalSquad ?? EMPTY_PLAYER_IDS);
  const offers = useGame((state) => state.nationalOffers ?? EMPTY_OFFERS);
  const applications = useGame(
    (state) => state.nationalApplications ?? EMPTY_NATIONAL_APPLICATIONS,
  );
  const managerRating = useGame((state) => managerReport(state).rating);
  const groups = useGame((state) => state.worldCupGroups ?? EMPTY_GROUPS);
  const standings = useGame((state) => state.worldCupStandings ?? EMPTY_STANDINGS);
  const edition = useGame((state) => state.worldCupEdition);
  const fixtures = useGame((state) => state.fixtures);
  const trophies = useGame((state) => state.nationalTrophies ?? EMPTY_TROPHIES);
  const switchRequests = useGame(
    (state) => state.nationalSwitchRequests ?? EMPTY_SWITCH_REQUESTS,
  );
  const developmentRequests = useGame(
    (state) =>
      state.nationalDevelopmentRequests ?? EMPTY_DEVELOPMENT_REQUESTS,
  );
  const nationalTournaments = useGame(
    (state) => state.nationalTournaments ?? EMPTY_NATIONAL_TOURNAMENTS,
  );
  const acceptOffer = useGame((state) => state.acceptNationalOffer);
  const applyForNationalTeam = useGame((state) => state.applyForNationalTeam);
  const saveNationalSquad = useGame((state) => state.setNationalSquad);
  const declineRole = useGame((state) => state.declineNationalRole);
  const offerNationalSwitch = useGame((state) => state.offerNationalSwitch);
  const supportNationalProspect = useGame(
    (state) => state.supportNationalProspect,
  );
  const trainNationalSquad = useGame((state) => state.trainNationalSquad);
  const trainNationalPlayer = useGame(
    (state) => state.trainNationalPlayer,
  );
  const scheduleNationalFriendly = useGame(
    (state) => state.scheduleNationalFriendly,
  );
  const simulateNextCalendarSlot = useGame(
    (state) => state.simulateNextCalendarSlot,
  );
  const startNextSeason = useGame((state) => state.startNextSeason);
  const setScreen = useGame((state) => state.setScreen);
  const [message, setMessage] = useState("");
  const [squadMessage, setSquadMessage] = useState("");
  const [teamChoice, setTeamChoice] = useState("");
  const [marketSlot, setMarketSlot] = useState<number | null>(null);
  const [marketSearch, setMarketSearch] = useState("");
  const [friendlyOpponentId, setFriendlyOpponentId] = useState("");

  const managerTeam = managerTeamId
    ? NATIONAL_TEAM_BY_ID.get(managerTeamId)
    : undefined;
  const teamName = (team: (typeof NATIONAL_TEAMS)[number]) =>
    team.code.length === 2
      ? displayNames.of(team.code) ?? team.name
      : translate(team.name, lang);
  const eligiblePlayers = useMemo(
    () => [...new Map([...players, ...freeAgents].map((player) => [player.id, player])).values()],
    [players, freeAgents],
  );
  const squadSeed = seed + season * 41;
  const defaultSquad = useMemo(
    () => (managerTeam ? nationalSquad(managerTeam.id, eligiblePlayers, squadSeed) : []),
    [managerTeam, eligiblePlayers, squadSeed],
  );
  const squadOptions = useMemo(
    () => (managerTeam ? nationalSquadOptions(managerTeam.id, eligiblePlayers, squadSeed) : []),
    [managerTeam, eligiblePlayers, squadSeed],
  );
  const squad = useMemo(() => {
    if (!managerTeam) return [];
    return nationalSquadFromIds(managerTeam.id, eligiblePlayers, selectedIds, squadSeed) ?? defaultSquad;
  }, [managerTeam, eligiblePlayers, selectedIds, squadSeed, defaultSquad]);
  const currentDate =
    calendar[cursor]?.date ?? calendar[cursor - 1]?.date;
  const appliedTeamIds = new Set(
    applications
      .filter((application) => application.season === season)
      .map((application) => application.teamId),
  );
  const tournamentStart = managerTeam
    ? nationalTournaments
        .filter((tournament) => tournament.teams.includes(managerTeam.id))
        .map((tournament) => tournament.startDate)
        .sort()[0]
    : undefined;
  const squadLocked = Boolean(
    cursor > 0 &&
      ((edition && currentDate && currentDate >= `${edition}-06-04`) ||
        (tournamentStart &&
          currentDate &&
          currentDate >=
            new Date(
              new Date(`${tournamentStart}T00:00:00Z`).getTime() -
                7 * 86400000,
            )
              .toISOString()
              .slice(0, 10))),
  );
  const qualified = new Set(groups.flat());
  const cupFixtures = fixtures.filter((fixture) => fixture.competition === "worldCup");
  const friendlyFixtures = fixtures
    .filter(
      (fixture) =>
        fixture.competition === "nationalFriendly" &&
        managerTeamId &&
        (fixture.homeId === managerTeamId || fixture.awayId === managerTeamId),
    )
    .sort((a, b) => a.round - b.round);
  const hasPendingFriendly = friendlyFixtures.some((fixture) => {
    if (fixture.played) return false;
    const date = calendar.find((slot) => slot.fixtures.includes(fixture.id))?.date;
    return Boolean(date && date >= (calendar[cursor]?.date ?? "0000-00-00"));
  });
  const teamFixtures = managerTeamId
    ? fixtures
        .filter(
          (fixture) =>
            fixture.homeId === managerTeamId ||
            fixture.awayId === managerTeamId,
        )
        .map((fixture) => ({
          fixture,
          slot: calendar.find((item) => item.fixtures.includes(fixture.id)),
        }))
        .filter(
          (entry): entry is typeof entry & { slot: NonNullable<typeof entry.slot> } =>
            Boolean(entry.slot?.date),
        )
        .sort((a, b) =>
          (a.slot.date ?? "").localeCompare(b.slot.date ?? ""),
        )
    : [];
  const nextTeamFixtures = teamFixtures
    .filter(({ fixture }) => !fixture.played)
    .slice(0, 5);
  const recentTeamFixtures = teamFixtures
    .filter(({ fixture }) => fixture.played)
    .slice(-3)
    .reverse();
  const clubShortById = new Map(CLUBS.map((club) => [club.id, club.short]));
  const activePlayer =
    marketSlot === null ? undefined : squad[marketSlot];
  const activePositionGroup = activePlayer
    ? nationalPositionGroup(activePlayer.pos)
    : undefined;
  const marketCandidates = squadOptions
    .filter(
      (option) =>
        activePositionGroup?.positions.includes(option.pos) &&
        (option.id === activePlayer?.id ||
          !squad.some((selected) => selected.id === option.id)),
    )
    .filter((option) => {
      const query = marketSearch.trim().toLocaleLowerCase();
      if (!query) return true;
      const clubName = clubShortById.get(option.clubId ?? "") ?? "";
      return `${option.name} ${clubName} ${option.pos}`
        .toLocaleLowerCase()
        .includes(query);
    })
    .sort((a, b) => b.pot - a.pot || b.ovr - a.ovr || a.name.localeCompare(b.name));
  const switchCandidates = managerTeam
    ? eligiblePlayers
        .filter(
          (player) =>
            player.age <= 23 &&
            player.nat !== managerTeam.code &&
            (player.internationalCaps ?? 0) === 0,
        )
        .filter(
          (player) =>
            !switchRequests.some(
              (request) =>
                request.playerId === player.id &&
                request.teamId === managerTeam.id &&
                request.season === season,
            ),
        )
        .sort((a, b) => b.pot - a.pot || b.ovr - a.ovr)
        .slice(0, 8)
    : [];
  const supportedProspects = managerTeam
    ? eligiblePlayers
        .filter(
          (player) =>
            player.nat === managerTeam.code &&
            player.age <= 21 &&
            player.pot < 100 &&
            !developmentRequests.some(
              (request) =>
                request.playerId === player.id &&
                request.teamId === managerTeam.id &&
                request.season === season,
            ),
        )
        .sort((a, b) => b.pot - a.pot || b.ovr - a.ovr)
        .slice(0, 6)
    : [];
  const nationalTrainingReady =
    nationalTrainingSeason !== season ||
    cursor - (nationalTrainingCursor ?? -100) >= 3;
  const nextCalendarSlot = calendar[cursor];
  const nextSlotHasNationalMatch = Boolean(
    managerTeamId &&
      nextCalendarSlot?.fixtures.some((fixtureId) =>
        teamFixtures.some(
          ({ fixture }) =>
            fixture.id === fixtureId && !fixture.played,
        ),
      ),
  );

  function chooseSquadPlayer(player: NationalSquadPlayer) {
    if (marketSlot === null) return;
    changeSquadPlayer(marketSlot, player.id);
    setMarketSlot(null);
    setMarketSearch("");
  }

  function choose(teamId: string) {
    const error = acceptOffer(teamId);
    setMessage(error ?? "");
  }

  function submitApplication() {
    const teamId = teamChoice;
    const team = teamId ? NATIONAL_TEAM_BY_ID.get(teamId) : undefined;
    if (!team) {
      setMessage("Elegí una selección para enviar tu postulación.");
      return;
    }
    setMessage(applyForNationalTeam(team.id));
  }

  function changeSquadPlayer(index: number, playerId: string) {
    const next = squad.map((player) => player.id);
    next[index] = playerId;
    const error = saveNationalSquad(next);
    setSquadMessage(error ?? "Convocatoria actualizada.");
  }

  function advanceNationalCareer() {
    if (seasonOver) {
      startNextSeason();
      setScreen("international");
      setMessage(`Comienza la temporada ${season + 1}. La reconstrucción continúa.`);
      return;
    }
    if (!nextCalendarSlot?.date) {
      setMessage("No hay más fechas disponibles para simular.");
      return;
    }
    const summary = simulateNextCalendarSlot(nextCalendarSlot.date);
    if (!summary) {
      setMessage("No se pudo avanzar esta fecha. Revisá el calendario de la partida.");
      return;
    }
    setScreen("international");
    const nationalMatch = summary.matches[0];
    const home = nationalMatch
      ? NATIONAL_TEAM_BY_ID.get(nationalMatch.homeId)
      : undefined;
    const away = nationalMatch
      ? NATIONAL_TEAM_BY_ID.get(nationalMatch.awayId)
      : undefined;
    setMessage(
      nationalMatch && home && away
        ? `Final: ${teamName(home)} ${nationalMatch.homeGoals}–${nationalMatch.awayGoals} ${teamName(away)} · ${summary.currentDate}.`
        : `Fecha ${summary.currentDate} simulada. Las ligas avanzaron en segundo plano.`,
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-fg-muted">
            Selecciones nacionales
          </p>
          <h2 className="font-display text-3xl font-semibold">Carrera internacional</h2>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">
            La Copa Mundial se disputa cada cuatro años, con 48 selecciones, 12 grupos y una fase final de eliminación directa.
          </p>
        </div>
        <Globe2 className="hidden size-9 text-primary sm:block" />
      </header>

      {careerMode === "national" ? (
        <nav
          aria-label="Secciones de tu selección"
          className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-surface p-3 sm:grid-cols-4"
        >
          {[
            { href: "#national-calendar", label: "Calendario", icon: CalendarDays },
            { href: "#national-standings", label: "Tabla", icon: Table2 },
            { href: "#national-squad", label: "Convocatoria", icon: Shield },
            { href: "#national-friendlies", label: "Amistosos", icon: Swords },
          ].map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-bg/70 px-3 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Icon className="size-4" />
              {label}
            </a>
          ))}
        </nav>
      ) : null}

      {careerMode === "national" ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div>
            <p className="font-display text-lg font-semibold">
              Temporada {season} · Carrera de selección
            </p>
            <p className="mt-1 text-sm text-fg-muted">
              {seasonOver
                ? "La temporada terminó. Prepará el próximo ciclo internacional."
                : nextCalendarSlot?.date
                  ? `Próxima fecha del calendario: ${nextCalendarSlot.date}. Las ligas avanzan en segundo plano.`
                  : "No quedan fechas en el calendario actual."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!managerTeam || !nationalTrainingReady}
              onClick={() => setMessage(trainNationalSquad())}
            >
              Entrenar toda la convocatoria
            </Button>
            <Button onClick={advanceNationalCareer}>
              {seasonOver
                ? "Empezar próxima temporada"
                : nextSlotHasNationalMatch
                  ? "Jugar partido"
                  : "Avanzar calendario"}
            </Button>
          </div>
          {!seasonOver ? (
            <p className="w-full text-xs text-fg-muted">
              Los partidos se simulan al llegar a su fecha. Avanzá el calendario para jugar amistosos y torneos; las ligas de clubes progresan en segundo plano.
            </p>
          ) : null}
          {message ? (
            <p role="status" className="w-full rounded-lg bg-bg/70 px-3 py-2 text-sm text-fg-muted">
              {message}
            </p>
          ) : null}
        </section>
      ) : null}

      {managerTeam ? (
        <section
          id="national-calendar"
          className="scroll-mt-20 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-border)]"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <h3 className="font-display text-xl font-semibold">Calendario de {teamName(managerTeam)}</h3>
          </div>
          <p className="mt-1 text-sm text-fg-muted">
            Próximos partidos y últimos resultados. Usá el botón de arriba para avanzar fecha por fecha.
          </p>
          <div className="mt-3 space-y-2">
            {[...recentTeamFixtures, ...nextTeamFixtures].map(({ fixture, slot }) => {
              const home = NATIONAL_TEAM_BY_ID.get(fixture.homeId);
              const away = NATIONAL_TEAM_BY_ID.get(fixture.awayId);
              if (!home || !away || !slot?.date) return null;
              return (
                <article
                  key={fixture.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-bg/70 px-3 py-2"
                >
                  <span className="w-24 shrink-0 text-xs text-fg-muted">{slot.date}</span>
                  <span className="min-w-0 flex-1 text-right text-sm">{teamName(home)}</span>
                  <span className="flex items-center gap-2 font-display tabular-nums">
                    <NationalFlag team={home} size="sm" />
                    {fixture.played
                      ? `${fixture.homeGoals ?? 0}–${fixture.awayGoals ?? 0}`
                      : "vs"}
                    <NationalFlag team={away} size="sm" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm">{teamName(away)}</span>
                  <span className="w-full text-center text-[10px] text-fg-muted sm:w-auto sm:text-right">
                    {fixture.competition === "nationalFriendly"
                      ? "Amistoso"
                      : fixture.competition === "nationalTournament"
                        ? "Copa continental"
                        : "Copa Mundial"}
                  </span>
                </article>
              );
            })}
            {!recentTeamFixtures.length && !nextTeamFixtures.length ? (
              <p className="rounded-xl bg-bg/70 p-3 text-sm text-fg-muted">
                Todavía no hay partidos programados. Avanzá a la próxima temporada para generar el calendario internacional.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-medium">
              <Trophy className="size-4 text-primary" />
              {translate("Copa Mundial", lang)} · {season % 4 === 2 ? season : season + ((2 - (season % 4) + 4) % 4)}
            </h3>
            <p className="mt-1 text-xs text-fg-muted">
              {translate(`Clasificación por confederación: ${CONFEDERATION_PLACES}.`, lang)}
            </p>
          </div>
          {managerTeam ? (
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm">
              <NationalFlag team={managerTeam} />
              <span>{translate("DT de", lang)} {teamName(managerTeam)}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-2 rounded-xl border border-border bg-bg/70 p-3">
          <label className="min-w-52 flex-1 text-xs text-fg-muted">
            Postulate para dirigir una selección
            <select
              value={teamChoice}
              onChange={(event) => setTeamChoice(event.target.value)}
              className="mt-1.5 block min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg"
            >
              <option value="">Seleccioná un país</option>
              {CONFEDERATIONS.map((confederation) => (
                <optgroup key={confederation} label={confederation}>
                  {NATIONAL_TEAMS.filter(
                    (team) => team.confederation === confederation,
                  )
                    .sort((a, b) => teamName(a).localeCompare(teamName(b), lang))
                    .map((team) => (
                      <option
                        key={team.id}
                        value={team.id}
                        disabled={
                          team.id === managerTeamId ||
                          appliedTeamIds.has(team.id)
                        }
                      >
                        {teamName(team)}
                        {team.id === managerTeamId
                          ? " · tu selección actual"
                          : appliedTeamIds.has(team.id)
                            ? " · ya postulaste esta temporada"
                            : ""}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-fg-muted">
              Nivel del DT: {managerRating} · {translate(managerLabel(managerRating), lang)}
            </p>
            <Button onClick={submitApplication}>Enviar postulación</Button>
          </div>
        </div>
        <p className="mt-2 text-xs text-fg-muted">
          La federación evalúa tu nivel y puede aceptar o rechazar el pedido. Las ofertas espontáneas también se ajustan a tu trayectoria.
        </p>

        {offers.length ? (
          <div className="mt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-medium">Ofertas para dirigir</h4>
                <p className="text-sm text-fg-muted">
                  Estas selecciones te contactaron por tu trayectoria. Aceptá una oferta o rechazalas para seguir únicamente en tu club.
                </p>
              </div>
              {careerMode !== "national" ? (
                <Button variant="ghost" size="sm" onClick={() => declineRole()}>
                  No participar
                </Button>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => {
                const team = NATIONAL_TEAM_BY_ID.get(offer.teamId);
                if (!team) return null;
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => choose(team.id)}
                    className="flex min-h-20 items-center gap-3 rounded-xl border border-border bg-bg/70 p-3 text-left transition hover:border-primary/50 hover:bg-primary/5"
                  >
                    <NationalFlag team={team} size="lg" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{teamName(team)}</span>
                      <span className="block text-xs text-fg-muted">
                        {team.confederation} · {translate("Nivel", lang)} {team.strength}
                      </span>
                    </span>
                    <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : managerTeam ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
            <span>Tu selección está lista para la próxima ventana internacional.</span>
            {careerMode !== "national" ? (
              <Button variant="ghost" size="sm" onClick={() => declineRole()}>
                Dejar el cargo
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-bg/70 p-3 text-sm text-fg-muted">
            No hay ofertas activas. Podés postularte a una selección; las ofertas espontáneas dependen de tu nivel como DT.
          </p>
        )}
        {message ? <p role="status" className="mt-3 text-sm text-fg-muted">{message}</p> : null}
      </section>

      {managerTeam ? (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-border)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="national-squad" className="scroll-mt-20 flex items-center gap-2 font-display text-xl font-semibold">
              <NationalFlag team={managerTeam} />
              {translate("Convocatoria", lang)} · {teamName(managerTeam)}
            </h3>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
              24 jugadores · 3 arqueros
            </span>
          </div>
          <p className="mt-2 text-sm text-fg-muted">
            {translate("Elegí a tus convocados entre los jugadores de esa nacionalidad, también los agentes libres.", lang)}{" "}
            {translate("La lista se cierra una semana antes de cada torneo.", lang)}
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            Entrená un jugador desde su tarjeta o entrená a toda la convocatoria. Cada sesión se habilita después de tres fechas.
          </p>
          {squadLocked ? (
            <p className="mt-2 rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-xs text-amber-200">
              {translate("Convocatoria cerrada: falta una semana o menos para el próximo torneo.", lang)}
            </p>
          ) : null}
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {squad.map((player, index) => (
              <article
                key={`${player.id}-${index}`}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-bg/70 p-3"
              >
                <PlayerPortrait
                  player={player}
                  size="list"
                  className="size-14 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{player.name}</p>
                  <p className="mt-0.5 truncate text-xs text-fg-muted">
                    {player.pos} · {player.age} años ·{" "}
                    {player.generated
                      ? translate("promesa nacional", lang)
                      : clubShortById.get(player.clubId ?? "") ??
                        translate("Agente libre", lang)}
                  </p>
                  <p className="mt-1 text-[11px] text-fg-subtle">
                    GRL <span className="font-semibold text-fg">{player.ovr}</span>
                    {" · "}POT{" "}
                    <span className="font-semibold text-primary">
                      {player.pot}
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={squadLocked}
                    onClick={() => {
                      setMarketSearch("");
                      setMarketSlot(index);
                    }}
                  >
                    Cambiar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={
                      !nationalTrainingReady ||
                      !eligiblePlayers.some((candidate) => candidate.id === player.id)
                    }
                    title={
                      !eligiblePlayers.some((candidate) => candidate.id === player.id)
                        ? "Esta promesa simulada aún no tiene ficha entrenable"
                        : "Entrenamiento individual"
                    }
                    onClick={() =>
                      setSquadMessage(trainNationalPlayer(player.id))
                    }
                  >
                    <Dumbbell className="size-3.5" />
                    Entrenar
                  </Button>
                </div>
              </article>
            ))}
          </div>
          {squadMessage ? <p role="status" className="mt-2 text-sm text-fg-muted">{translate(squadMessage, lang)}</p> : null}
          {!qualified.has(managerTeam.id) ? (
            <p className="mt-3 text-sm text-fg-muted">
              Esta selección no clasificó a la edición actual; tu cargo queda registrado para el próximo ciclo.
            </p>
          ) : null}
        </section>
      ) : null}

      {managerTeam && switchCandidates.length ? (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-border)]">
          <div>
            <h3 className="font-display text-xl font-semibold">
              Jóvenes elegibles para cambiar de selección
            </h3>
            <p className="mt-1 text-sm text-fg-muted">
              Invitá a promesas de hasta 23 años que todavía no debutaron con su
              país. Cada jugador decide según su edad, potencial y el nivel de
              ambas selecciones.
            </p>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {switchCandidates.map((player) => {
              const formerTeam = NATIONAL_TEAMS.find(
                (team) => team.code === player.nat,
              );
              return (
                <li
                  key={player.id}
                  className="flex items-center gap-3 rounded-xl border border-border/70 bg-bg/70 p-3"
                >
                  <PlayerPortrait
                    player={player}
                    size="list"
                    className="size-12 rounded-xl"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {player.name}
                    </span>
                    <span className="block text-xs text-fg-muted">
                      {player.age} años · {formerTeam?.flag ?? player.nat} · GRL{" "}
                      {player.ovr} · POT {player.pot}
                    </span>
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setMessage(offerNationalSwitch(player.id))
                    }
                  >
                    Invitar
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {managerTeam ? (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-border)]">
          <div>
            <h3 className="font-display text-xl font-semibold">
              Promesas para reconstruir {teamName(managerTeam)}
            </h3>
            <p className="mt-1 text-sm text-fg-muted">
              Apoyá hasta tres juveniles por temporada para aumentar su
              potencial y ayudarlos a crecer en sus clubes.
            </p>
          </div>
          {supportedProspects.length ? (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {supportedProspects.map((player) => (
                <li
                  key={player.id}
                  className="flex items-center gap-3 rounded-xl border border-border/70 bg-bg/70 p-3"
                >
                  <PlayerPortrait
                    player={player}
                    size="list"
                    className="size-12 rounded-xl"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {player.name}
                    </span>
                    <span className="block text-xs text-fg-muted">
                      {player.age} años · GRL {player.ovr} · POT {player.pot}
                    </span>
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setMessage(supportNationalProspect(player.id))
                    }
                  >
                    Apoyar
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-lg bg-bg/70 p-3 text-sm text-fg-muted">
              No hay promesas disponibles para apoyar esta temporada.
            </p>
          )}
        </section>
      ) : null}

      {managerTeam ? (
        <section id="national-friendlies" className="scroll-mt-20 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-border)]">
          <h3 className="font-display text-xl font-semibold">{translate("Amistosos de selección", lang)}</h3>
          <p className="mt-1 text-sm text-fg-muted">
            {translate("Elegí el rival del próximo amistoso programado. Después, avanzá el calendario hasta la fecha para jugarlo.", lang)}
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <label className="flex-1 text-xs text-fg-muted">
              Rival
              <select
                value={friendlyOpponentId}
                onChange={(event) => setFriendlyOpponentId(event.target.value)}
                className="mt-1.5 block min-h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg"
              >
                <option value="">Elegí una selección rival</option>
                {NATIONAL_TEAMS.filter((team) => team.id !== managerTeam.id)
                  .sort((a, b) => teamName(a).localeCompare(teamName(b), lang))
                  .map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.flag} {teamName(team)}
                    </option>
                  ))}
              </select>
            </label>
            <Button
              type="button"
              className="self-end"
              disabled={!friendlyOpponentId || !hasPendingFriendly}
              onClick={() => {
                setMessage(scheduleNationalFriendly(friendlyOpponentId));
                setFriendlyOpponentId("");
              }}
            >
              <Swords className="size-4" />
              Programar amistoso
            </Button>
          </div>
          {!hasPendingFriendly ? (
            <p className="mt-2 text-xs text-fg-muted">
              No hay amistosos pendientes esta temporada. Podrás programar otro al iniciar el próximo ciclo.
            </p>
          ) : null}
          {friendlyFixtures.length ? (
            <ul className="mt-3 divide-y divide-border/60">
              {friendlyFixtures.map((fixture) => {
                const home = NATIONAL_TEAM_BY_ID.get(fixture.homeId);
                const away = NATIONAL_TEAM_BY_ID.get(fixture.awayId);
                if (!home || !away) return null;
                const date = calendar.find((slot) => slot.fixtures.includes(fixture.id))?.date;
                return (
                  <li key={fixture.id} className="flex items-center gap-2 py-2 text-sm">
                    <span className="w-16 shrink-0 text-xs text-fg-muted">{date ?? translate("Fecha FIFA", lang)}</span>
                    <span className="flex min-w-0 flex-1 items-center gap-2"><NationalFlag team={home} size="sm" /><span className="truncate">{teamName(home)}</span></span>
                    <span className="font-display tabular-nums">{fixture.played ? `${fixture.homeGoals}–${fixture.awayGoals}` : "vs"}</span>
                    <span className="flex min-w-0 flex-1 items-center justify-end gap-2"><span className="truncate">{teamName(away)}</span><NationalFlag team={away} size="sm" /></span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-fg-muted">{translate("Los próximos amistosos se programan al aceptar el cargo o al comenzar una nueva temporada.", lang)}</p>
          )}
        </section>
      ) : null}

      {groups.length === 12 ? (
        <section id="national-standings" className="scroll-mt-20 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-border)]">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            <h3 className="font-display text-xl font-semibold">
              {edition ?? season} · Tabla de selecciones y resultados
            </h3>
          </div>
          <div className="mt-4 grid gap-3 xl:grid-cols-2">
            {groups.map((group, index) => {
              const rows = ranked(standings.filter((standing) => group.includes(standing.clubId)));
              const matches = cupFixtures.filter(
                (fixture) =>
                  fixture.round <= 3 &&
                  group.includes(fixture.homeId) &&
                  group.includes(fixture.awayId),
              );
              return (
                <article key={`group-${index}`} className="overflow-hidden rounded-xl border border-border">
                  <header className="bg-primary/10 px-3 py-2 text-sm font-semibold">Grupo {String.fromCharCode(65 + index)}</header>
                  <div className="grid grid-cols-[1fr_repeat(3,2rem)] gap-1 px-3 py-2 text-[10px] uppercase tracking-wide text-fg-muted">
                    <span>Selección</span><span className="text-center">PJ</span><span className="text-center">DG</span><span className="text-center">Pts</span>
                  </div>
                  {rows.map((row) => {
                    const team = NATIONAL_TEAM_BY_ID.get(row.clubId);
                    if (!team) return null;
                    return (
                      <div key={team.id} className="grid grid-cols-[1fr_repeat(3,2rem)] items-center gap-1 border-t border-border/60 px-3 py-2 text-sm">
                        <span className="flex min-w-0 items-center gap-2">
                          <NationalFlag team={team} size="sm" />
                          <span className="truncate">{teamName(team)}</span>
                        </span>
                        <span className="text-center tabular-nums">{row.played}</span>
                        <span className="text-center tabular-nums">{row.gf - row.ga}</span>
                        <span className="text-center font-semibold tabular-nums">{row.pts}</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-border/60 px-3 py-2">
                    {matches.length ? matches.map((fixture) => {
                      const home = NATIONAL_TEAM_BY_ID.get(fixture.homeId);
                      const away = NATIONAL_TEAM_BY_ID.get(fixture.awayId);
                      if (!home || !away) return null;
                      return (
                        <p key={fixture.id} className="flex items-center justify-between gap-2 py-1 text-xs">
                          <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate"><NationalFlag team={home} size="sm" />{teamName(home)}</span>
                          <span className="font-display text-sm tabular-nums">
                            {fixture.played ? `${fixture.homeGoals}–${fixture.awayGoals}` : "vs"}
                          </span>
                          <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5 truncate text-right">{teamName(away)}<NationalFlag team={away} size="sm" /></span>
                        </p>
                      );
                    }) : <p className="text-xs text-fg-muted">Los partidos aparecen al avanzar el calendario.</p>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <section id="national-standings" className="scroll-mt-20 rounded-2xl border border-border bg-surface p-4 text-sm text-fg-muted shadow-[var(--shadow-border)]">
          La fase de grupos aparecerá en el calendario durante la ventana internacional de la próxima edición.
        </section>
      )}

      {cupFixtures.some((fixture) => fixture.round > 3) ? (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-border)]">
          <h3 className="font-display text-xl font-semibold">Eliminatorias</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {cupFixtures
              .filter((fixture) => fixture.round > 3)
              .sort((a, b) => a.round - b.round)
              .map((fixture) => {
                const home = NATIONAL_TEAM_BY_ID.get(fixture.homeId);
                const away = NATIONAL_TEAM_BY_ID.get(fixture.awayId);
                if (!home || !away) return null;
                const stage = ["", "", "", "", "Dieciseisavos", "Octavos", "Cuartos", "Semifinales", "Final"][fixture.round] ?? "Eliminatoria";
                return (
                  <article key={fixture.id} className="flex items-center gap-2 rounded-xl border border-border/70 bg-bg/70 p-3 text-sm">
                    <span className="w-24 shrink-0 text-[10px] uppercase tracking-wide text-fg-muted">{stage}</span>
                    <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate"><NationalFlag team={home} size="sm" />{teamName(home)}</span>
                    <span className="font-display text-lg tabular-nums">
                      {fixture.played ? `${fixture.homeGoals}–${fixture.awayGoals}` : "vs"}
                    </span>
                    <span className="flex min-w-0 flex-1 items-center justify-end gap-1.5 truncate text-right">{teamName(away)}<NationalFlag team={away} size="sm" /></span>
                  </article>
                );
              })}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-border)]">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-primary" />
          <h3 className="font-display text-xl font-semibold">Copas de selecciones</h3>
        </div>
        <p className="mt-1 text-sm text-fg-muted">
          Elegí una selección y competí en los torneos de su confederación. Los partidos se juegan avanzando el calendario.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {NATIONAL_TOURNAMENTS.map((tournamentInfo) => {
            const phase =
              tournamentInfo.id === "euro" ||
              tournamentInfo.id === "copaAmerica"
                ? 0
                : 3;
            const nextSeason =
              season + ((phase - (season % 4) + 4) % 4);
            return (
              <article
                key={tournamentInfo.id}
                className="rounded-xl border border-border/70 bg-bg/70 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-medium">{tournamentInfo.name}</h4>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                    {tournamentInfo.confederation}
                  </span>
                </div>
                <p className="mt-1 text-xs text-fg-muted">{tournamentInfo.format}</p>
                <p className="mt-2 text-xs text-fg-subtle">
                  {nationalTournaments.some((item) => item.id === tournamentInfo.id)
                    ? `Edición ${season}`
                    : `Próxima edición: ${nextSeason}`}
                </p>
              </article>
            );
          })}
        </div>

        {nationalTournaments.map((tournament) => {
          const tournamentFixtures = fixtures
            .filter(
              (fixture) =>
                fixture.competition === "nationalTournament" &&
                fixture.tournamentId === tournament.id,
            )
            .sort((a, b) => a.round - b.round);
          const knockoutRoundCount = Math.log2(
            tournament.groups.length * tournament.qualifiersPerGroup +
              tournament.bestThirds,
          );
          return (
            <section
              key={`edition-${tournament.id}`}
              className="mt-4 rounded-xl border border-primary/20 p-3"
            >
              <h4 className="font-display text-lg font-semibold">
                {tournament.name} {tournament.season}
              </h4>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {tournament.groups.map((group, groupIndex) => {
                  const rows = ranked(
                    tournament.standings.filter((row) =>
                      group.includes(row.clubId),
                    ),
                  );
                  const matches = tournamentFixtures.filter(
                    (fixture) =>
                      fixture.round <= 3 &&
                      group.includes(fixture.homeId) &&
                      group.includes(fixture.awayId),
                  );
                  return (
                    <article
                      key={`${tournament.id}-group-${groupIndex}`}
                      className="overflow-hidden rounded-lg border border-border/70"
                    >
                      <h5 className="bg-primary/10 px-3 py-2 text-xs font-semibold">
                        Grupo {String.fromCharCode(65 + groupIndex)}
                      </h5>
                      <ul className="divide-y divide-border/60">
                        {rows.map((row) => {
                          const team = NATIONAL_TEAM_BY_ID.get(row.clubId);
                          if (!team) return null;
                          return (
                            <li
                              key={team.id}
                              className="flex items-center gap-2 px-3 py-1.5 text-xs"
                            >
                              <NationalFlag team={team} size="sm" />
                              <span className="min-w-0 flex-1 truncate">
                                {teamName(team)}
                              </span>
                              <span className="w-6 text-center tabular-nums">
                                {row.played}
                              </span>
                              <span className="w-8 text-center tabular-nums">
                                {row.pts} pts
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      <div className="border-t border-border/60 px-3 py-2">
                        {matches.map((fixture) => {
                          const home = NATIONAL_TEAM_BY_ID.get(fixture.homeId);
                          const away = NATIONAL_TEAM_BY_ID.get(fixture.awayId);
                          if (!home || !away) return null;
                          return (
                            <p
                              key={fixture.id}
                              className="flex items-center gap-2 py-1 text-[11px]"
                            >
                              <span className="min-w-0 flex-1 truncate">
                                {teamName(home)}
                              </span>
                              <span className="font-display tabular-nums">
                                {fixture.played
                                  ? `${fixture.homeGoals}–${fixture.awayGoals}`
                                  : "vs"}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-right">
                                {teamName(away)}
                              </span>
                            </p>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
              {tournamentFixtures.some((fixture) => fixture.round > 3) ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {tournamentFixtures
                    .filter((fixture) => fixture.round > 3)
                    .map((fixture) => {
                      const home = NATIONAL_TEAM_BY_ID.get(fixture.homeId);
                      const away = NATIONAL_TEAM_BY_ID.get(fixture.awayId);
                      if (!home || !away) return null;
                      const roundsRemaining =
                        3 + knockoutRoundCount - fixture.round;
                      const stage =
                        roundsRemaining === 0
                          ? "Final"
                          : roundsRemaining === 1
                            ? "Semifinal"
                            : roundsRemaining === 2
                              ? "Cuartos"
                              : knockoutRoundCount === 4
                                ? "Octavos"
                                : "Eliminatoria";
                      return (
                        <article
                          key={fixture.id}
                          className="flex items-center gap-2 rounded-lg border border-border/70 bg-bg/70 p-2 text-xs"
                        >
                          <span className="w-20 shrink-0 text-[10px] uppercase text-fg-muted">
                            {stage}
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {teamName(home)}
                          </span>
                          <span className="font-display tabular-nums">
                            {fixture.played
                              ? `${fixture.homeGoals}–${fixture.awayGoals}`
                              : "vs"}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-right">
                            {teamName(away)}
                          </span>
                        </article>
                      );
                    })}
                </div>
              ) : null}
            </section>
          );
        })}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-border)]">
        <h3 className="font-display text-xl font-semibold">Campeones en tu trayectoria</h3>
        {trophies.length ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {[...trophies].reverse().map((title, index) => {
              const team = NATIONAL_TEAM_BY_ID.get(title.teamId);
              const competition =
                title.tournamentId === "worldCup" || !title.tournamentId
                  ? translate("Copa Mundial", lang)
                  : NATIONAL_TOURNAMENTS.find(
                      (item) => item.id === title.tournamentId,
                    )?.name ?? "Torneo internacional";
              return (
                <li key={`${title.season}-${index}`} className="rounded-full bg-primary/10 px-3 py-1.5 text-sm">
                  {team ? <><NationalFlag team={team} size="sm" /> </> : null}{competition} {title.season} · {team ? teamName(team) : title.teamId}
                </li>
              );
            })}
          </ul>
        ) : <p className="mt-2 text-sm text-fg-muted">Los títulos mundiales ganados como seleccionador se guardarán aquí.</p>}
      </section>

      <section>
        <h3 className="font-display text-xl font-semibold">{translate("Selecciones del mundo", lang)}</h3>
        <p className="mt-1 text-sm text-fg-muted">Planteles internacionales incluidos y su nivel estimado.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {CONFEDERATIONS.map((confederation) => (
            <article key={confederation} className="rounded-xl border border-border bg-surface p-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">{confederation}</h4>
              <ul className="space-y-1.5">
                {NATIONAL_TEAMS.filter((team) => team.confederation === confederation)
                  .sort((a, b) => b.strength - a.strength)
                  .map((team) => (
                    <li key={team.id} className="flex items-center gap-2 text-xs">
                      <NationalFlag team={team} size="sm" />
                      <span className="min-w-0 flex-1 truncate">{teamName(team)}</span>
                      <span className="tabular-nums text-fg-muted">{team.strength}</span>
                    </li>
                  ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <Dialog.Root
        open={marketSlot !== null}
        onOpenChange={(open) => {
          if (!open) setMarketSlot(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[88dvh] w-[min(94vw,900px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl focus:outline-none">
            <header className="flex items-start justify-between gap-4 border-b border-border p-4 sm:p-5">
              <div>
                <Dialog.Title className="font-display text-xl font-semibold sm:text-2xl">
                  Mercado de convocatoria
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-fg-muted">
                  {activePlayer
                    ? `Buscá un reemplazo para ${activePlayer.pos}. Elegí entre los jugadores disponibles de ${managerTeam ? teamName(managerTeam) : "tu selección"}.`
                    : "Elegí un jugador disponible para tu convocatoria."}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <Button
                  type="button"
                  aria-label="Cerrar mercado"
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0"
                >
                  <X aria-hidden="true" />
                </Button>
              </Dialog.Close>
            </header>

            <div className="border-b border-border p-4">
              <label className="relative block">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
                />
                <input
                  autoFocus
                  type="search"
                  value={marketSearch}
                  onChange={(event) => setMarketSearch(event.target.value)}
                  placeholder="Buscar por nombre o club..."
                  aria-label="Buscar jugadores de la selección"
                  className="h-11 w-full rounded-lg border border-border bg-bg pl-10 pr-3 text-sm text-fg outline-none transition focus:border-primary"
                />
              </label>
              <p className="mt-2 text-xs text-fg-muted">
                {marketCandidates.length} jugadores disponibles · ordenados por
                potencial
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {marketCandidates.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {marketCandidates.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => chooseSquadPlayer(candidate)}
                      className="group flex min-h-24 items-center gap-3 rounded-xl border border-border/70 bg-bg/70 p-3 text-left transition hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <PlayerPortrait
                        player={candidate}
                        size="list"
                        className="size-16 rounded-xl"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {candidate.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-fg-muted">
                          {candidate.pos} · {candidate.age} años ·{" "}
                          {candidate.generated
                            ? "Promesa nacional"
                            : clubShortById.get(candidate.clubId ?? "") ??
                              "Agente libre"}
                        </span>
                        <span className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
                          <span className="rounded-md bg-surface px-2 py-1 text-fg-muted">
                            GRL{" "}
                            <strong className="text-fg">{candidate.ovr}</strong>
                          </span>
                          <span className="rounded-md bg-primary/10 px-2 py-1 text-primary">
                            POT <strong>{candidate.pot}</strong>
                          </span>
                        </span>
                      </span>
                      <CheckCircle2
                        aria-hidden="true"
                        className="size-5 shrink-0 text-fg-subtle transition group-hover:text-primary"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-fg-muted">
                  No hay jugadores que coincidan con la búsqueda para esta posición.
                </p>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
