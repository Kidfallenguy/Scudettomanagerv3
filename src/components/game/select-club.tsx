import { useMemo, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { ClubCrest } from "@/components/game/crest";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import {
  CLUBS,
  LEAGUE_INFO,
  applyDivisions,
  SECOND_DIVISION,
  FIFTH_LEAGUE_OF,
  FOURTH_LEAGUE_OF,
  SIXTH_LEAGUE_OF,
  SECOND_LEAGUE_OF,
  THIRD_LEAGUE_OF,
  isSelectableClub,
  startingBudget,
  type PlayableLeague,
} from "@/lib/game/clubs";
import { formatMoney } from "@/lib/game/format";
import { useGame } from "@/lib/game/store";

function uniqueClubs(league: PlayableLeague) {
  const seen = new Set<string>();
  return CLUBS.filter((c) => {
    if (c.league !== league || c.ghost || seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

type Division = "first" | "second" | "third" | "fourth" | "fifth" | "sixth";
const CLUBS_PER_PAGE = 24;

function clubsOf(league: PlayableLeague, division: Division) {
  if (division === "fourth") {
    return uniqueClubs(FOURTH_LEAGUE_OF[league] ?? "leagueTwo").sort((a, b) => b.prestige - a.prestige);
  }
  if (division === "fifth") {
    return uniqueClubs(FIFTH_LEAGUE_OF[league] ?? "leagueTwo").sort((a, b) => b.prestige - a.prestige);
  }
  if (division === "sixth") {
    return uniqueClubs(SIXTH_LEAGUE_OF[league] ?? "leagueTwo").sort((a, b) => b.prestige - a.prestige);
  }
  if (division === "third") {
    if (league === "eredivisie") return uniqueClubs("tweedeDivisie").sort((a, b) => b.prestige - a.prestige);
    // Tercera división de la liga (League One), de mayor a menor prestigio.
    // España: la Primera Federación son dos grupos de 20 (se muestran juntos, 40 clubes).
    if (league === "laliga") return [...uniqueClubs("primeraFed1"), ...uniqueClubs("primeraFed2")].sort((a, b) => b.prestige - a.prestige);
    return uniqueClubs(THIRD_LEAGUE_OF[league] ?? "leagueOne").sort((a, b) => b.prestige - a.prestige);
  }
  if (division === "second") {
    // Segunda división de la liga (Championship / LaLiga Hypermotion), de mayor a menor prestigio.
    return uniqueClubs(SECOND_LEAGUE_OF[league] ?? "championship").sort((a, b) => b.prestige - a.prestige);
  }
  return uniqueClubs(league);
}

function featuredOf(league: PlayableLeague, division: Division = "first") {
  const list = clubsOf(league, division);
  return list.find((c) => c.featured) ?? list[0]!;
}

export function SelectClub() {
  // Una partida nueva siempre arranca con las divisiones de la 2026/27 (aunque vengas de una con ascensos y descensos).
  useState(() => applyDivisions(null));
  const newGame = useGame((s) => s.newGame);
  const openSlots = useGame((s) => s.openSlots);
  const slot = useGame((s) => s.slot);
  const customClubs = useGame((s) => s.customClubs);
  const setScreen = useGame((s) => s.setScreen);
  const [league, setLeague] = useState<PlayableLeague>("mls");
  const [division, setDivision] = useState<Division>("first");
  const [visibleClubCount, setVisibleClubCount] = useState(CLUBS_PER_PAGE);
  const [picked, setPicked] = useState(featuredOf("mls").id);
  const [customId, setCustomId] = useState("");
  const [keepBaseStadium, setKeepBaseStadium] = useState(false);
  const [rescueMode, setRescueMode] = useState(false);
  const [rescueTerm, setRescueTerm] = useState(4);

  const list = useMemo(() => clubsOf(league, division), [league, division]);
  const featured = useMemo(
    () => list.find((club) => club.featured) ?? list[0]!,
    [list],
  );
  const rest = useMemo(() => list.filter((club) => club.id !== featured.id), [featured.id, list]);
  const club = list.find((c) => c.id === picked) ?? featured;
  const identity = customClubs.find((item) => item.id === customId) ?? null;
  const shownClub = identity
    ? {
        ...club,
        ...identity,
        stadium: keepBaseStadium ? club.stadium : identity.stadium || club.stadium,
        capacity: keepBaseStadium ? club.capacity : identity.capacity || club.capacity,
        id: club.id,
        league: club.league,
      }
    : club;
  const initialBudget = identity?.startingBudget ?? startingBudget(shownClub.prestige, club.league);
  const info = LEAGUE_INFO[league];
  const isSecond = division === "second";
  const isThird = division === "third";
  const isFourth = division === "fourth";
  const secondInfo = LEAGUE_INFO[SECOND_LEAGUE_OF[league] ?? "championship"];
  const thirdLeague = THIRD_LEAGUE_OF[league];
  const fourthLeague = FOURTH_LEAGUE_OF[league];
  const fifthLeague = FIFTH_LEAGUE_OF[league];
  const sixthLeague = SIXTH_LEAGUE_OF[league];
  const thirdInfo = LEAGUE_INFO[thirdLeague ?? "leagueOne"];
  const fourthInfo = LEAGUE_INFO[fourthLeague ?? "leagueTwo"];
  const fifthInfo = LEAGUE_INFO[fifthLeague ?? "leagueTwo"];
  const sixthInfo = LEAGUE_INFO[sixthLeague ?? "leagueTwo"];
  const heading = isThird
    ? league === "laliga"
      ? "Resto de la Primera Federación"
      : league === "eredivisie"
        ? LEAGUE_INFO["tweedeDivisie"].rest
        : thirdInfo.rest
    : division === "sixth"
      ? sixthInfo.rest
      : division === "fifth"
        ? fifthInfo.rest
    : isFourth
      ? fourthInfo.rest
      : isSecond
      ? secondInfo.rest
      : info.rest;
  // Todos los clubes de las divisiones jugables se pueden elegir (también LaLiga Hypermotion).
  const canStart = isSelectableClub(club.id);

  const pickDivision = (lg: PlayableLeague, div: Division) => {
    setLeague(lg);
    setDivision(div);
    setPicked(featuredOf(lg, div).id);
    setVisibleClubCount(CLUBS_PER_PAGE);
  };

  // Al cambiar de liga se arranca siempre en 1ª división; si ya estás en esa liga se conserva la división elegida.
  const pickLeague = (lg: PlayableLeague) => {
    if (lg === league) return;
    pickDivision(lg, "first");
  };

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:py-12">
        <header className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-fg-muted">
            Slot {slot + 1} · Modo mánager
          </p>
          <h1 className="font-display text-6xl font-semibold leading-none tracking-tight md:text-8xl">
            Scudetto: Be a manager
          </h1>
          <p className="max-w-xl text-fg-muted">
            Elige tu desafío, define el rumbo y convierte cada temporada en el inicio de un legado.
          </p>
          <p className="max-w-2xl text-sm text-fg-subtle">
            La liga donde compite tu club y todas las copas se simulan en detalle. Las demás ligas usan resultados rápidos
            para que el juego siga fluido; si ascendés o descendés, el detalle cambia automáticamente con vos.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1 shadow-[var(--shadow-border)] sm:grid-cols-4 md:grid-cols-8">
          {(["laliga", "serieA", "premier", "bundesliga", "ligue1", "primeira", "eredivisie", "argentina", "brasileirao", "mls", "saudiProLeague"] as const).map((id) => (
            <Button
              key={id}
              variant={league === id ? "club" : "ghost"}
              className="min-h-11 px-2 text-xs sm:text-sm"
              onClick={() => pickLeague(id)}
            >
              {LEAGUE_INFO[id].title}
            </Button>
          ))}
        </div>

        {SECOND_DIVISION[league].available || SECOND_DIVISION[league].preview ? (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-fg-muted">
              {info.region} · Elegí la división
            </p>
            <div
              className={cn(
                "grid gap-1 rounded-xl bg-surface p-1 shadow-[var(--shadow-border)]",
                sixthLeague
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-6"
                  : fifthLeague
                    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
                    : fourthLeague
                      ? "grid-cols-2 sm:grid-cols-4"
                      : thirdLeague || league === "eredivisie"
                        ? "grid-cols-2 sm:grid-cols-3"
                        : "grid-cols-2",
              )}
            >
              <Button
                variant={division === "first" ? "club" : "ghost"}
                className="min-h-11 flex-col gap-0 px-2"
                onClick={() => pickDivision(league, "first")}
              >
                <span className="text-[10px] uppercase tracking-wider opacity-70">{league === "argentina" ? "Primera División" : "1ª División"}</span>
                <span className="text-sm">{info.title}</span>
              </Button>
              <Button
                variant={isSecond ? "club" : "ghost"}
                className="min-h-11 flex-col gap-0 px-2"
                onClick={() => pickDivision(league, "second")}
              >
                <span className="text-[10px] uppercase tracking-wider opacity-70">{league === "argentina" ? "Ascenso" : "2ª División"}</span>
                <span className="text-sm">{SECOND_DIVISION[league].title}</span>
              </Button>
              {league === "eredivisie" ? (
                <Button
                  variant={isThird ? "club" : "ghost"}
                  className="min-h-11 flex-col gap-0 px-2"
                  onClick={() => pickDivision(league, "third")}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-70">3ª División</span>
                  <span className="text-sm">{LEAGUE_INFO["tweedeDivisie"].title}</span>
                </Button>
              ) : null}

              {thirdLeague ? (
                <Button
                  variant={isThird ? "club" : "ghost"}
                  className="min-h-11 flex-col gap-0 px-2"
                  onClick={() => pickDivision(league, "third")}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-70">3ª División</span>
                  <span className="text-sm">{league === "laliga" ? "Primera Federación" : LEAGUE_INFO[thirdLeague].title}</span>
                </Button>
              ) : null}
              {fourthLeague ? (
                <Button
                  variant={isFourth ? "club" : "ghost"}
                  className="min-h-11 flex-col gap-0 px-2"
                  onClick={() => pickDivision(league, "fourth")}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-70">4ª División</span>
                  <span className="text-sm">{fourthInfo.title}</span>
                </Button>
              ) : null}
              {fifthLeague ? (
                <Button
                  variant={division === "fifth" ? "club" : "ghost"}
                  className="min-h-11 flex-col gap-0 px-2"
                  onClick={() => pickDivision(league, "fifth")}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-70">5.ª División</span>
                  <span className="text-sm">{fifthInfo.title}</span>
                </Button>
              ) : null}
              {sixthLeague ? (
                <Button
                  variant={division === "sixth" ? "club" : "ghost"}
                  className="min-h-11 flex-col gap-0 px-2"
                  onClick={() => pickDivision(league, "sixth")}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-70">6.ª División</span>
                  <span className="text-sm">{sixthInfo.title}</span>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}

        <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-fg-muted">Prepará tu carrera</p>
              <h2 className="font-display text-2xl font-semibold">Seleccioná el modo</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                aria-pressed={!rescueMode}
                onClick={() => setRescueMode(false)}
                className={cn(
                  "flex min-h-20 flex-col items-start justify-center gap-1 rounded-xl border px-4 py-3 text-left transition-colors",
                  !rescueMode ? "border-primary bg-primary/10" : "border-border bg-bg hover:bg-elevated",
                )}
              >
                <span className="text-sm font-semibold">Modo normal</span>
                <span className="text-xs text-fg-muted">Dirigí el club con sus condiciones habituales.</span>
              </button>
              <button
                type="button"
                aria-pressed={rescueMode}
                onClick={() => setRescueMode(true)}
                className={cn(
                  "flex min-h-20 flex-col items-start justify-center gap-1 rounded-xl border px-4 py-3 text-left transition-colors",
                  rescueMode ? "border-primary bg-primary/10" : "border-border bg-bg hover:bg-elevated",
                )}
              >
                <span className="text-sm font-semibold">Salvar el club</span>
                <span className="text-xs text-fg-muted">Aceptá un rescate financiero y cumplí el plan de pagos.</span>
              </button>
            </div>
            {rescueMode ? (
              <div className="grid gap-4 border-t border-border pt-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
                <p className="text-sm leading-relaxed text-fg-muted">
                  El club recibirá una ayuda según su presupuesto. Las cuotas se descuentan al cierre de temporada; los impagos
                  generan recargos y restricciones. La dirigencia no te despedirá por resultados deportivos mientras dure el plan.
                </p>
                <label className="text-xs font-medium text-fg-muted">
                  Duración del plan
                  <select
                    className="mt-1 min-h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg"
                    value={rescueTerm}
                    onChange={(e) => setRescueTerm(Number(e.target.value))}
                  >
                    {[2, 3, 4, 5, 6].map((years) => <option key={years} value={years}>{years} temporadas</option>)}
                  </select>
                </label>
              </div>
            ) : null}
          </div>
        </section>

        {customClubs.length > 0 ? (
          <section className="flex flex-col gap-3 rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:flex-row sm:items-end">
            <label className="flex-1 text-xs font-medium text-fg-muted">
              Identidad personalizada (opcional)
              <select
                className="mt-1 min-h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg"
                value={customId}
                onChange={(e) => {
                  setCustomId(e.target.value);
                  setKeepBaseStadium(false);
                }}
              >
                <option value="">Mantener identidad original</option>
                {customClubs.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <Button variant="outline" onClick={() => setScreen("club-editor")}>Gestionar identidades</Button>
            {identity ? (
              <fieldset className="grid w-full gap-2 border-0 p-0 sm:grid-cols-2">
                <legend className="mb-1 text-xs font-medium text-fg-muted">Estadio para esta carrera</legend>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-bg px-3 text-sm">
                  <input type="radio" name="stadium-choice" checked={keepBaseStadium} onChange={() => setKeepBaseStadium(true)} />
                  Mantener {club.stadium} ({club.capacity.toLocaleString("es-ES")})
                </label>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border bg-bg px-3 text-sm">
                  <input type="radio" name="stadium-choice" checked={!keepBaseStadium} onChange={() => setKeepBaseStadium(false)} />
                  Usar estadio personalizado
                </label>
              </fieldset>
            ) : null}
          </section>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
            <p className="text-sm text-fg-muted">¿Querés una identidad propia para tu club?</p>
            <Button variant="outline" onClick={() => setScreen("club-editor")}>Abrir editor de clubes</Button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setPicked(featured.id)}
          className={cn(
            "relative overflow-hidden rounded-2xl p-5 text-left shadow-[var(--shadow-border)] transition-[box-shadow] duration-[var(--motion-quick)] md:p-8",
            picked === featured.id ? "shadow-[var(--shadow-border-hover)]" : "",
          )}
          style={{
            background: `linear-gradient(105deg, color-mix(in oklab, ${featured.color} 28%, #12141a) 0%, #12141a 55%)`,
          }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-fg-muted">
            Club recomendado
          </p>
          <div className="mt-4 flex items-center gap-4">
            <ClubCrest club={featured} size={72} />
            <div>
              <h2 className="font-display text-4xl font-semibold leading-none md:text-6xl">
                {featured.name}
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-fg-muted">
                <MapPin className="size-3.5" />
                {featured.stadium} · {featured.city}
              </p>
            </div>
          </div>
        </button>

        <section className="pb-28">
          <h3 className="mb-3 text-sm font-medium text-fg-muted">{heading}</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
            {rest.slice(0, visibleClubCount).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setPicked(c.id)}
                className={cn(
                  "flex min-h-20 flex-col items-center gap-2 rounded-xl p-3 shadow-[var(--shadow-border)] transition-[box-shadow,background-color] duration-[var(--motion-quick)]",
                  picked === c.id ? "bg-elevated shadow-[var(--shadow-border-hover)]" : "bg-surface",
                )}
              >
                <ClubCrest club={c} size={40} />
                <span className="text-center text-xs font-medium leading-tight">{c.short}</span>
              </button>
            ))}
          </div>
          {visibleClubCount < rest.length ? (
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-xs text-fg-subtle">
                {rest.length - visibleClubCount} <span>clubes restantes</span>
              </p>
              <Button
                variant="outline"
                onClick={() => setVisibleClubCount((count) => Math.min(count + CLUBS_PER_PAGE, rest.length))}
              >
                Ver más clubes
              </Button>
            </div>
          ) : null}
        </section>

        <footer className="flex flex-col gap-3 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] md:flex-row md:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <ClubCrest club={shownClub} size={44} />
            <div className="min-w-0">
              <p className="truncate font-display text-2xl font-semibold leading-none">{shownClub.name}</p>
              <p className="mt-1 text-sm text-fg-muted">
                Presupuesto inicial {formatMoney(initialBudget)}{rescueMode ? " + rescate" : ""} · {shownClub.stadium}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => openSlots()}>
              Volver
            </Button>
            <Button
              variant="club"
              size="lg"
              className="flex-1 md:flex-none"
              disabled={!canStart}
              onClick={() =>
                newGame(club.id, identity, rescueMode ? rescueTerm : null, keepBaseStadium)
              }
              style={{ "--club": shownClub.color } as React.CSSProperties}
            >
              {canStart ? rescueMode ? "Empezar el rescate" : "Tomar el cargo" : "Plantilla en preparación"}
              <ArrowRight />
            </Button>
          </div>
        </footer>
      </div>

    </div>
  );
}
