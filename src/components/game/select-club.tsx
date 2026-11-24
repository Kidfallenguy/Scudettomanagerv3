import { useMemo, useRef, useState } from "react";
import { ArrowRight, Globe2, MapPin, Sparkles } from "lucide-react";
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
import { buildSquad } from "@/lib/game/squads";
import { Rng } from "@/lib/game/rng";
import { NATIONAL_TEAMS, NATIONAL_TEAM_BY_ID } from "@/lib/game/national";
import { useGame } from "@/lib/game/store";
import { LanguageSelect } from "@/lib/i18n";
import type { BoardMode, ManagerStyle } from "@/lib/game/types";

const MANAGER_STYLES: Array<{ id: ManagerStyle; title: string; description: string }> = [
  { id: "motivator", title: "Motivador", description: "Liderazgo cercano para levantar al grupo." },
  { id: "tactician", title: "Táctico", description: "Un estratega que prepara cada partido." },
  { id: "developer", title: "Formador", description: "Prioridad al crecimiento de los juveniles." },
  { id: "negotiator", title: "Negociador", description: "Habilidad para gestionar contratos y fichajes." },
];

function stableClubSeed(clubId: string) {
  return [...clubId].reduce((seed, char) => (seed * 31 + char.charCodeAt(0)) >>> 0, 0);
}

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
const COUNTRY_FLAGS: Record<string, string> = {
  Alemania: "DE",
  Arabia: "SA",
  "Arabia Saudita": "SA",
  Argentina: "AR",
  Brasil: "BR",
  "Estados Unidos": "US",
  Francia: "FR",
  Inglaterra: "EN",
  Italia: "IT",
  "Países Bajos": "NL",
  Portugal: "PT",
  España: "ES",
};

function CountryFlag({ country, className }: { country: string; className?: string }) {
  const code = COUNTRY_FLAGS[country];
  const flag = (() => {
    switch (code) {
      case "ES":
        return <><rect width="30" height="20" fill="#aa151b" /><rect y="5" width="30" height="10" fill="#f1bf00" /><circle cx="9" cy="10" r="1.7" fill="#aa151b" /></>;
      case "IT":
        return <><rect width="10" height="20" fill="#009246" /><rect x="10" width="10" height="20" fill="#fff" /><rect x="20" width="10" height="20" fill="#ce2b37" /></>;
      case "EN":
        return <><rect width="30" height="20" fill="#fff" /><rect x="12" width="6" height="20" fill="#c8102e" /><rect y="7" width="30" height="6" fill="#c8102e" /></>;
      case "DE":
        return <><rect width="30" height="6.67" fill="#111" /><rect y="6.67" width="30" height="6.66" fill="#d00" /><rect y="13.33" width="30" height="6.67" fill="#ffce00" /></>;
      case "FR":
        return <><rect width="10" height="20" fill="#002395" /><rect x="10" width="10" height="20" fill="#fff" /><rect x="20" width="10" height="20" fill="#ed2939" /></>;
      case "PT":
        return <><rect width="12" height="20" fill="#006600" /><rect x="12" width="18" height="20" fill="#ff0000" /><circle cx="12" cy="10" r="3.1" fill="#ffcc00" /></>;
      case "NL":
        return <><rect width="30" height="6.67" fill="#ae1c28" /><rect y="6.67" width="30" height="6.66" fill="#fff" /><rect y="13.33" width="30" height="6.67" fill="#21468b" /></>;
      case "AR":
        return <><rect width="30" height="6.67" fill="#74acdf" /><rect y="6.67" width="30" height="6.66" fill="#fff" /><rect y="13.33" width="30" height="6.67" fill="#74acdf" /><circle cx="15" cy="10" r="1.6" fill="#f6b40e" /></>;
      case "BR":
        return <><rect width="30" height="20" fill="#009b3a" /><path d="M15 2 27 10 15 18 3 10Z" fill="#ffdf00" /><circle cx="15" cy="10" r="4.3" fill="#002776" /><path d="M11 8.7q4-1.6 8 0" fill="none" stroke="#fff" strokeWidth=".7" /></>;
      case "US":
        return <><rect width="30" height="20" fill="#fff" />{Array.from({ length: 7 }, (_, index) => <rect key={index} y={index * 3.08} width="30" height="1.54" fill="#b22234" />)}<rect width="13" height="10.8" fill="#3c3b6e" />{Array.from({ length: 9 }, (_, index) => <circle key={index} cx={2 + (index % 3) * 4} cy={2 + Math.floor(index / 3) * 3} r=".55" fill="#fff" />)}</>;
      case "SA":
        return <><rect width="30" height="20" fill="#006c35" /><path d="M7 12h15m-4-1 2 1-2 1" fill="none" stroke="#fff" strokeLinecap="round" strokeWidth="1.1" /><path d="M8 8h14" stroke="#fff" strokeWidth=".8" /></>;
      default:
        return <><rect width="30" height="20" fill="#352942" /><path d="M5 10h20M15 4v12" stroke="#fff" strokeWidth="2" /></>;
    }
  })();

  return (
    <svg
      className={cn("country-flag inline-flex shrink-0", className)}
      viewBox="0 0 30 20"
      role="img"
      aria-label={`Bandera de ${country}`}
    >
      {flag}
      <rect x=".5" y=".5" width="29" height="19" rx="2.2" fill="none" stroke="rgb(255 255 255 / .4)" />
    </svg>
  );
}

function clubsOf(league: PlayableLeague, division: Division) {
  if (division === "fourth") {
    return uniqueClubs(FOURTH_LEAGUE_OF[league] ?? "leagueTwo").sort(
      (a, b) => b.prestige - a.prestige,
    );
  }
  if (division === "fifth") {
    return uniqueClubs(FIFTH_LEAGUE_OF[league] ?? "leagueTwo").sort(
      (a, b) => b.prestige - a.prestige,
    );
  }
  if (division === "sixth") {
    return uniqueClubs(SIXTH_LEAGUE_OF[league] ?? "leagueTwo").sort(
      (a, b) => b.prestige - a.prestige,
    );
  }
  if (division === "third") {
    if (league === "eredivisie")
      return uniqueClubs("tweedeDivisie").sort(
        (a, b) => b.prestige - a.prestige,
      );
    // Tercera división de la liga (League One), de mayor a menor prestigio.
    // España: la Primera Federación son dos grupos de 20 (se muestran juntos, 40 clubes).
    if (league === "laliga")
      return [
        ...uniqueClubs("primeraFed1"),
        ...uniqueClubs("primeraFed2"),
      ].sort((a, b) => b.prestige - a.prestige);
    return uniqueClubs(THIRD_LEAGUE_OF[league] ?? "leagueOne").sort(
      (a, b) => b.prestige - a.prestige,
    );
  }
  if (division === "second") {
    // Segunda división de la liga (Championship / LaLiga Hypermotion), de mayor a menor prestigio.
    return uniqueClubs(SECOND_LEAGUE_OF[league] ?? "championship").sort(
      (a, b) => b.prestige - a.prestige,
    );
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
  const startNationalCareer = useGame((s) => s.startNationalCareer);
  const openSlots = useGame((s) => s.openSlots);
  const slot = useGame((s) => s.slot);
  const slots = useGame((s) => s.slots);
  const customClubs = useGame((s) => s.customClubs);
  const setScreen = useGame((s) => s.setScreen);
  const [league, setLeague] = useState<PlayableLeague>("laliga");
  const [division, setDivision] = useState<Division>("first");
  const [visibleClubCount, setVisibleClubCount] = useState(CLUBS_PER_PAGE);
  const [picked, setPicked] = useState(featuredOf("laliga").id);
  const [customId, setCustomId] = useState("");
  const [keepBaseStadium, setKeepBaseStadium] = useState(false);
  const [rescueMode, setRescueMode] = useState(false);
  const [rescueTerm, setRescueTerm] = useState(4);
  const [boardMode, setBoardMode] = useState<BoardMode>("balanced");
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [managerName, setManagerName] = useState("");
  const [managerStyle, setManagerStyle] = useState<ManagerStyle>("motivator");
  const [showNationalStart, setShowNationalStart] = useState(false);
  const [nationalTeamId, setNationalTeamId] = useState("");
  const [nationalSlot, setNationalSlot] = useState(slot);
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false);
  const [nationalStartMessage, setNationalStartMessage] = useState("");
  const clubDetailsRef = useRef<HTMLElement>(null);

  const list = useMemo(() => clubsOf(league, division), [league, division]);
  const featured = useMemo(
    () => list.find((club) => club.featured) ?? list[0]!,
    [list],
  );
  const rest = useMemo(
    () => list.filter((club) => club.id !== featured.id),
    [featured.id, list],
  );
  const club = list.find((c) => c.id === picked) ?? featured;
  const identity = customClubs.find((item) => item.id === customId) ?? null;
  const shownClub = identity
    ? {
        ...club,
        ...identity,
        stadium: keepBaseStadium
          ? club.stadium
          : identity.stadium || club.stadium,
        capacity: keepBaseStadium
          ? club.capacity
          : identity.capacity || club.capacity,
        id: club.id,
        league: club.league,
      }
    : club;
  const initialBudget =
    identity?.startingBudget ?? startingBudget(shownClub.prestige, club.league);
  const previewPlayers = useMemo(
    () => buildSquad(club.id, new Rng(stableClubSeed(club.id)), new Set())
      .sort((a, b) => b.ovr - a.ovr)
      .slice(0, 3),
    [club.id],
  );
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
  const selectedNationalTeam = NATIONAL_TEAM_BY_ID.get(nationalTeamId);
  const nationalSlotOccupied = Boolean(slots[nationalSlot]);

  const beginNationalCareer = () => {
    if (!selectedNationalTeam) {
      setNationalStartMessage("Elegí un país para empezar.");
      return;
    }
    if (nationalSlotOccupied && !overwriteConfirmed) {
      setOverwriteConfirmed(true);
      setNationalStartMessage(
        `La partida ${nationalSlot + 1} ya tiene una carrera. Confirmá si querés reemplazarla.`,
      );
      return;
    }
    const error = startNationalCareer(selectedNationalTeam.id, nationalSlot);
    if (error) setNationalStartMessage(error);
  };

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

  const chooseClub = (clubId: string) => {
    setPicked(clubId);
    window.requestAnimationFrame(() => {
      clubDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  };

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex max-w-6xl flex-col gap-7 px-4 py-7 md:py-10">
        <header className="flex flex-col gap-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-fg-muted">
              <span className="mr-2 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-primary">
                <span className="size-1.5 rounded-full bg-primary" /> SLOT {slot + 1}
              </span>
              MODO MÁNAGER · TEMPORADA 2026/27
            </p>
            <LanguageSelect className="w-full sm:w-auto" />
          </div>
          <h1 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-tight md:text-7xl">
            {step === 0 ? <>Elegí tu <span className="text-primary">club.</span></> : null}
            {step === 1 ? <>Presentate, <span className="text-primary">míster.</span></> : null}
            {step === 2 ? <>Armá tu <span className="text-primary">carrera.</span></> : null}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-fg-muted md:text-base">
            {step === 0
              ? "Explorá las ligas y divisiones disponibles, y conocé cada equipo antes de elegir."
              : step === 1
                ? "Definí tu identidad y el estilo con el que vas a dirigir."
                : "Ajustá el desafío y la relación con la directiva antes de tomar el cargo."}
          </p>
          {step === 0 ? (
            <p className="max-w-2xl text-xs leading-relaxed text-fg-subtle">
              La liga de tu club y las copas se simulan en detalle. El resto del mundo usa resultados rápidos para mantener el juego fluido.
            </p>
          ) : null}
          {step === 0 ? (
            <section className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Globe2 className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-display text-lg font-bold">¿Preferís dirigir una selección?</h2>
                    <p className="mt-1 max-w-xl text-xs leading-relaxed text-fg-muted">
                      Elegí un país, convocá jugadores, desarrollá promesas y competí en amistosos y torneos.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="club"
                  className="min-h-11 shrink-0"
                  aria-expanded={showNationalStart}
                  onClick={() => setShowNationalStart((visible) => !visible)}
                >
                  {showNationalStart ? "Cerrar selector" : "Elegir una selección"}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
              {showNationalStart ? (
                <div className="mt-4 grid gap-3 border-t border-primary/15 pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <label className="text-xs text-fg-muted">
                    País
                    <select
                      value={nationalTeamId}
                      onChange={(event) => {
                        setNationalTeamId(event.target.value);
                        setOverwriteConfirmed(false);
                        setNationalStartMessage("");
                      }}
                      className="mt-1.5 block min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg"
                    >
                      <option value="">Elegí un país</option>
                      {NATIONAL_TEAMS.slice()
                        .sort((a, b) => a.name.localeCompare(b.name, "es"))
                        .map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.flag} {team.name} · {team.strength} GRL
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="text-xs text-fg-muted">
                    Guardar en
                    <select
                      value={nationalSlot}
                      onChange={(event) => {
                        setNationalSlot(Number(event.target.value));
                        setOverwriteConfirmed(false);
                        setNationalStartMessage("");
                      }}
                      className="mt-1.5 block min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-fg"
                    >
                      {Array.from({ length: 5 }, (_, index) => (
                        <option key={index} value={index}>
                          Partida {index + 1} · {slots[index] ? "ocupada" : "vacía"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button
                    type="button"
                    variant="club"
                    className="min-h-11"
                    disabled={!selectedNationalTeam}
                    onClick={beginNationalCareer}
                  >
                    {nationalSlotOccupied && overwriteConfirmed
                      ? "Confirmar y empezar"
                      : "Empezar reconstrucción"}
                    <ArrowRight className="size-4" />
                  </Button>
                  {nationalStartMessage ? (
                    <p role="status" className="text-sm text-fg-muted sm:col-span-3">
                      {nationalStartMessage}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}
        </header>

        <nav aria-label="Pasos para crear una carrera" className="grid grid-cols-3 gap-2">
          {(["Club", "DT", "Carrera"] as const).map((label, index) => (
            <div
              key={label}
              aria-current={step === index ? "step" : undefined}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${
                step === index ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-surface text-fg-muted"
              }`}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-bg">{index + 1}</span>
              <span>{label}</span>
              {index < 2 ? <span className="ml-auto hidden h-px flex-1 bg-border sm:block" /> : null}
            </div>
          ))}
        </nav>

        {step === 0 ? (
          <>
        <div
          role="group"
          aria-label="Seleccionar liga"
          className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1 shadow-[var(--shadow-border)] sm:grid-cols-3 md:flex md:flex-wrap"
        >
          {(
            [
              "laliga",
              "serieA",
              "premier",
              "bundesliga",
              "ligue1",
              "primeira",
              "eredivisie",
              "argentina",
              "brasileirao",
              "mls",
              "saudiProLeague",
            ] as const
          ).map((id) => (
            <Button
              key={id}
              variant={league === id ? "club" : "ghost"}
              className="min-h-11 whitespace-normal px-1 text-xs leading-tight sm:px-3 md:text-sm"
              aria-pressed={league === id}
              onClick={() => pickLeague(id)}
            >
              <CountryFlag country={LEAGUE_INFO[id].region} />
              <span className="text-left leading-tight">
                <span className="block">{LEAGUE_INFO[id].title}</span>
                <span className="block text-[9px] font-medium opacity-65">{LEAGUE_INFO[id].region}</span>
              </span>
            </Button>
          ))}
        </div>

        {SECOND_DIVISION[league].available ||
        SECOND_DIVISION[league].preview ? (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-fg-muted">
              {info.region} · Elegí la división
            </p>
            <div
              className={cn(
                "grid gap-2 rounded-xl bg-surface p-2 shadow-[var(--shadow-border)]",
                sixthLeague
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : fifthLeague
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : fourthLeague
                      ? "grid-cols-1 sm:grid-cols-2"
                      : thirdLeague || league === "eredivisie"
                        ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                        : "grid-cols-1 sm:grid-cols-2",
              )}
            >
              <Button
                variant={division === "first" ? "club" : "ghost"}
                className="min-h-16 min-w-0 flex-col items-start gap-1 px-3 py-2 text-left whitespace-normal"
                onClick={() => pickDivision(league, "first")}
              >
                <span className="text-[10px] uppercase tracking-wider opacity-70">
                  {league === "argentina" ? "Primera División" : "1ª División"}
                </span>
                <span className="w-full break-words text-sm font-semibold leading-snug">{info.title}</span>
              </Button>
              <Button
                variant={isSecond ? "club" : "ghost"}
                className="min-h-16 min-w-0 flex-col items-start gap-1 px-3 py-2 text-left whitespace-normal"
                onClick={() => pickDivision(league, "second")}
              >
                <span className="text-[10px] uppercase tracking-wider opacity-70">
                  {league === "argentina" ? "Ascenso" : "2ª División"}
                </span>
                <span className="w-full break-words text-sm font-semibold leading-snug">{SECOND_DIVISION[league].title}</span>
              </Button>
              {league === "eredivisie" ? (
                <Button
                  variant={isThird ? "club" : "ghost"}
                  className="min-h-16 min-w-0 flex-col items-start gap-1 px-3 py-2 text-left whitespace-normal"
                  onClick={() => pickDivision(league, "third")}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-70">
                    3ª División
                  </span>
                  <span className="w-full break-words text-sm font-semibold leading-snug">
                    {LEAGUE_INFO["tweedeDivisie"].title}
                  </span>
                </Button>
              ) : null}
              {thirdLeague ? (
                <Button
                  variant={isThird ? "club" : "ghost"}
                  className="min-h-16 min-w-0 flex-col items-start gap-1 px-3 py-2 text-left whitespace-normal"
                  onClick={() => pickDivision(league, "third")}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-70">
                    3ª División
                  </span>
                  <span className="w-full break-words text-sm font-semibold leading-snug">
                    {league === "laliga"
                      ? "Primera Federación"
                      : LEAGUE_INFO[thirdLeague].title}
                  </span>
                </Button>
              ) : null}
              {fourthLeague ? (
                <Button
                  variant={isFourth ? "club" : "ghost"}
                  className="min-h-16 min-w-0 flex-col items-start gap-1 px-3 py-2 text-left whitespace-normal"
                  onClick={() => pickDivision(league, "fourth")}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-70">
                    4ª División
                  </span>
                  <span className="w-full break-words text-sm font-semibold leading-snug">{fourthInfo.title}</span>
                </Button>
              ) : null}
              {fifthLeague ? (
                <Button
                  variant={division === "fifth" ? "club" : "ghost"}
                  className="min-h-16 min-w-0 flex-col items-start gap-1 px-3 py-2 text-left whitespace-normal"
                  onClick={() => pickDivision(league, "fifth")}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-70">
                    5.ª División
                  </span>
                  <span className="w-full break-words text-sm font-semibold leading-snug">{fifthInfo.title}</span>
                </Button>
              ) : null}
              {sixthLeague ? (
                <Button
                  variant={division === "sixth" ? "club" : "ghost"}
                  className="min-h-16 min-w-0 flex-col items-start gap-1 px-3 py-2 text-left whitespace-normal"
                  onClick={() => pickDivision(league, "sixth")}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-70">
                    6.ª División
                  </span>
                  <span className="w-full break-words text-sm font-semibold leading-snug">{sixthInfo.title}</span>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
          </>
        ) : null}

        {step === 2 ? (
        <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-fg-muted">
                Prepará tu carrera
              </p>
              <h2 className="font-display text-2xl font-semibold">
                Seleccioná el modo
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                type="button"
                aria-pressed={!rescueMode}
                onClick={() => setRescueMode(false)}
                className={cn(
                  "flex min-h-20 flex-col items-start justify-center gap-1 rounded-xl border px-4 py-3 text-left transition-colors",
                  !rescueMode
                    ? "border-primary bg-primary/10"
                    : "border-border bg-bg hover:bg-elevated",
                )}
              >
                <span className="text-sm font-semibold">Modo normal</span>
                <span className="text-xs text-fg-muted">
                  Dirigí el club con sus condiciones habituales.
                </span>
              </button>
              <button
                type="button"
                aria-pressed={rescueMode}
                onClick={() => setRescueMode(true)}
                className={cn(
                  "flex min-h-20 flex-col items-start justify-center gap-1 rounded-xl border px-4 py-3 text-left transition-colors",
                  rescueMode
                    ? "border-primary bg-primary/10"
                    : "border-border bg-bg hover:bg-elevated",
                )}
              >
                <span className="text-sm font-semibold">Salvar el club</span>
                <span className="text-xs text-fg-muted">
                  Aceptá un rescate financiero y cumplí el plan de pagos.
                </span>
              </button>
            </div>
            {rescueMode ? (
              <div className="grid gap-4 border-t border-border pt-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
                <p className="text-sm leading-relaxed text-fg-muted">
                  El club recibirá una ayuda según su presupuesto. Las cuotas se
                  descuentan al cierre de temporada; los impagos generan
                  recargos y restricciones. La dirigencia no te despedirá por
                  resultados deportivos mientras dure el plan.
                </p>
                <label className="text-xs font-medium text-fg-muted">
                  Duración del plan
                  <select
                    className="mt-1 min-h-11 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg"
                    value={rescueTerm}
                    onChange={(e) => setRescueTerm(Number(e.target.value))}
                  >
                    {[2, 3, 4, 5, 6].map((years) => (
                      <option key={years} value={years}>
                        {years} temporadas
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}
          </div>
        </section>

        ) : null}

        {step === 0 ? (
        <section
          ref={clubDetailsRef}
          className="grid gap-5 rounded-2xl border border-white/10 bg-surface p-4 shadow-[var(--shadow-border)] sm:grid-cols-[minmax(0,1.15fr)_minmax(220px,0.85fr)] md:p-6"
          style={{ "--club": shownClub.color } as React.CSSProperties}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">FICHA DEL CLUB</p>
            <div className="mt-3 flex items-center gap-3">
              <ClubCrest club={shownClub} size={56} />
              <div className="min-w-0">
                <h2 className="truncate font-display text-2xl font-bold">{shownClub.name}</h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-fg-muted">
                  <CountryFlag country={info.region} /> {info.title} · {info.region}
                </p>
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
              <div className="rounded-xl bg-bg/70 p-3"><dt className="text-fg-muted">Presupuesto inicial</dt><dd className="mt-1 font-bold text-fg">{formatMoney(initialBudget)}</dd></div>
              <div className="rounded-xl bg-bg/70 p-3"><dt className="text-fg-muted">Estadio</dt><dd className="mt-1 truncate font-bold text-fg">{shownClub.stadium}</dd></div>
              <div className="rounded-xl bg-bg/70 p-3"><dt className="text-fg-muted">Ciudad</dt><dd className="mt-1 truncate font-bold text-fg">{shownClub.city}</dd></div>
            </dl>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">FIGURAS DEL PLANTEL</p>
            <ul className="mt-2 flex flex-col gap-2">
              {previewPlayers.map((player) => (
                <li key={player.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-bg/60 px-3 py-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 font-display font-bold text-primary">{player.ovr}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{player.name}</span>
                  <span className="text-xs text-fg-muted">{player.pos}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
        ) : null}

        {step === 1 ? (
          <section className="rounded-2xl border border-white/10 bg-surface p-4 shadow-[var(--shadow-border)] md:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">PERFIL DEL DIRECTOR TÉCNICO</p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-fg-muted">
              Nombre del DT
              <input
                value={managerName}
                onChange={(event) => setManagerName(event.target.value)}
                maxLength={32}
                placeholder="Por ejemplo: Marcelo"
                className="mt-2 min-h-12 w-full rounded-xl border border-border bg-bg px-4 text-base font-normal normal-case text-fg placeholder:text-fg-subtle"
              />
            </label>
            <fieldset className="mt-6">
              <legend className="text-xs font-semibold uppercase tracking-wide text-fg-muted">Elegí tu perfil</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {MANAGER_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    aria-pressed={managerStyle === style.id}
                    onClick={() => setManagerStyle(style.id)}
                    className={`min-h-24 rounded-xl border p-4 text-left transition-colors ${
                      managerStyle === style.id ? "border-primary bg-primary/10" : "border-border bg-bg hover:bg-elevated"
                    }`}
                  >
                    <span className="block font-display text-lg font-bold">{style.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-fg-muted">{style.description}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </section>
        ) : null}

        {step === 2 ? (
          <>
        <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-fg-muted">
            Presión deportiva
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold">
            Elegí la política de la directiva
          </h2>
          <p className="mt-1 text-sm text-fg-muted">
            {"Afecta el riesgo de despido; tus objetivos y resultados siguen contando en todos los modos."}
          </p>
          <div className="mt-4 grid gap-2 md:grid-cols-3">
            {(
              [
                {
                  id: "demanding",
                  title: "Exigente",
                  description:
                    "Tolera menos la crisis y puede despedirte antes.",
                },
                {
                  id: "balanced",
                  title: "Equilibrada",
                  description: "Expectativas y riesgo de despido estándar.",
                },
                {
                  id: "longTerm",
                  title: "Proyecto a largo plazo",
                  description:
                    "Sin despidos por resultados; la confianza y los objetivos siguen activos.",
                },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                aria-pressed={boardMode === mode.id}
                onClick={() => setBoardMode(mode.id)}
                className={cn(
                  "flex min-h-24 flex-col items-start justify-center gap-1 rounded-xl border px-4 py-3 text-left transition-colors",
                  boardMode === mode.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-bg hover:bg-elevated",
                )}
              >
                <span className="text-sm font-semibold">{mode.title}</span>
                <span className="text-xs leading-relaxed text-fg-muted">
                  {mode.description}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-surface p-4 shadow-[var(--shadow-border)] backdrop-blur-md md:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">IDENTIDAD DEL EQUIPO</p>
              <h2 className="mt-1 font-display text-2xl font-bold">Elegí cómo va a salir a la cancha</h2>
              <p className="mt-1 text-xs text-fg-muted">Usá la identidad oficial o personalizá escudo, colores y estadio.</p>
            </div>
            <button type="button" className="boot-editor-link" onClick={() => setScreen("club-editor")}>
              <span className="boot-action-icon boot-action-icon--editor"><Sparkles className="size-4" /></span>
              <span className="text-left">
                <span className="block text-sm font-bold">Crear identidad</span>
                <span className="block text-[10px] text-white/55">Diseñar un equipo propio</span>
              </span>
              <ArrowRight className="size-4 text-primary" />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              aria-pressed={!identity}
              onClick={() => { setCustomId(""); setKeepBaseStadium(false); }}
              className={cn("custom-identity-card", !identity && "custom-identity-card--selected")}
              style={{ "--identity-color": club.color } as React.CSSProperties}
            >
              <ClubCrest club={club} size={44} />
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-bold">Identidad oficial</span>
                <span className="mt-0.5 block truncate text-[11px] text-fg-muted">{club.name} · {club.city}</span>
              </span>
              <span className="custom-identity-check">{!identity ? "✓" : ""}</span>
            </button>
            {customClubs.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={customId === item.id}
                onClick={() => { setCustomId(item.id); setKeepBaseStadium(false); }}
                className={cn("custom-identity-card", customId === item.id && "custom-identity-card--selected")}
                style={{ "--identity-color": item.color } as React.CSSProperties}
              >
                <span className="custom-identity-crest" style={{ backgroundColor: item.color }}>
                  {item.crest ? <img src={item.crest} alt="" /> : item.short.slice(0, 3) || "CLB"}
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-bold">{item.name}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-fg-muted">{item.city || "Ciudad propia"} · {item.stadium || "Estadio propio"}</span>
                </span>
                <span className="custom-identity-check">{customId === item.id ? "✓" : ""}</span>
              </button>
            ))}
            {!customClubs.length ? (
              <div className="flex min-h-[72px] items-center gap-3 rounded-xl border border-dashed border-white/10 px-3 py-2 sm:col-span-1 lg:col-span-2">
                <span className="boot-action-icon boot-action-icon--editor"><Sparkles className="size-4" /></span>
                <p className="text-xs leading-relaxed text-fg-muted">Todavía no hay clubes creados. Abrí el editor para diseñar tu escudo, elegir colores y ponerle nombre a tu estadio.</p>
              </div>
            ) : null}
          </div>
          {identity ? (
            <div className="mt-4 grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted sm:col-span-2">Estadio para esta carrera</p>
              <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-bg/50 px-3 text-xs transition-colors hover:bg-elevated">
                <input type="radio" name="stadium-choice" checked={keepBaseStadium} onChange={() => setKeepBaseStadium(true)} />
                <span><span className="block font-semibold text-fg">Conservar el estadio real</span><span className="text-fg-muted">{club.stadium} · {club.capacity.toLocaleString("es-ES")} lugares</span></span>
              </label>
              <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-bg/50 px-3 text-xs transition-colors hover:bg-elevated">
                <input type="radio" name="stadium-choice" checked={!keepBaseStadium} onChange={() => setKeepBaseStadium(false)} />
                <span><span className="block font-semibold text-fg">Usar mi estadio</span><span className="text-fg-muted">{identity.stadium || "Estadio personalizado"} · {identity.capacity.toLocaleString("es-ES")} lugares</span></span>
              </label>
            </div>
          ) : null}
        </section>
          </>
        ) : null}

        {step === 0 ? (
          <>
        <button
          type="button"
          aria-pressed={picked === featured.id}
          onClick={() => chooseClub(featured.id)}
          className={cn(
            "relative overflow-hidden rounded-2xl border border-transparent p-5 text-left shadow-[var(--shadow-border)] transition-[box-shadow,background-color] duration-[var(--motion-quick)] md:p-8",
            picked === featured.id ? "shadow-[var(--shadow-border-hover)]" : "",
          )}
          style={
            {
              "--club": featured.color,
              background: `linear-gradient(105deg, color-mix(in oklab, ${featured.color} 28%, #12141a) 0%, #12141a 55%)`,
              borderColor:
                picked === featured.id ? featured.color : "transparent",
            } as React.CSSProperties
          }
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-fg-muted">
            Club recomendado
          </p>
          <div className="mt-4 flex items-center gap-4">
            <ClubCrest club={featured} size={72} />
            <div>
              <h2 className="flex items-center gap-2 font-display text-4xl font-semibold leading-none md:text-6xl">
                <CountryFlag country={info.region} />
                {featured.name}
              </h2>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-fg-muted">
                <MapPin className="size-3.5" />
                {featured.stadium} · {featured.city}
              </p>
            </div>
          </div>
        </button>

        <section className="pb-4">
          <h3 className="mb-3 text-sm font-medium text-fg-muted">{heading}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {rest.slice(0, visibleClubCount).map((c) => (
              <button
                key={c.id}
                type="button"
                aria-label={c.name}
                aria-pressed={picked === c.id}
                title={c.name}
                onClick={() => chooseClub(c.id)}
                className={cn(
                  "flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-transparent p-2 shadow-[var(--shadow-border)] transition-[box-shadow,background-color] duration-[var(--motion-quick)]",
                  picked === c.id
                    ? "border-club bg-elevated shadow-[var(--shadow-border-hover)]"
                    : "bg-surface hover:bg-elevated",
                )}
                style={{ "--club": c.color } as React.CSSProperties}
              >
                <ClubCrest club={c} size={36} />
                <span className="line-clamp-2 inline-flex items-center justify-center gap-1.5 text-center text-xs font-medium leading-tight">
                  <CountryFlag country={info.region} className="text-sm" />
                  {c.name}
                </span>
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
                onClick={() =>
                  setVisibleClubCount((count) =>
                    Math.min(count + CLUBS_PER_PAGE, rest.length),
                  )
                }
              >
                Ver más clubes
              </Button>
            </div>
          ) : null}
        </section>
          </>
        ) : null}

        <footer className="selection-dock flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <ClubCrest club={shownClub} size={48} />
            <div className="min-w-0">
              <p className="flex items-center gap-2 truncate font-display text-xl font-semibold leading-none">
                <CountryFlag country={info.region} />
                {shownClub.name}
              </p>
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-fg-muted">
                <MapPin className="size-3.5 shrink-0" />
                {shownClub.stadium} · {shownClub.city}
              </p>
              {step === 2 ? <p className="mt-1 text-xs text-fg-muted">
                Presupuesto inicial{" "}
                <span className="font-medium text-fg">
                  {formatMoney(initialBudget)}
                </span>
                {rescueMode ? " + rescate" : ""}
              </p> : null}
            </div>
          </div>
          <div className="flex gap-2 md:shrink-0">
            <Button
              variant="ghost"
              className="min-h-11"
              onClick={() => step === 0 ? openSlots() : setStep((current) => (current - 1) as 0 | 1 | 2)}
            >
              {step === 0 ? "Volver" : "Paso anterior"}
            </Button>
            {step < 2 ? (
              <Button
                variant="club"
                size="lg"
                className="min-h-11 flex-1 md:flex-none"
                disabled={step === 0 && !canStart}
                onClick={() => setStep((current) => (current + 1) as 0 | 1 | 2)}
                style={{ "--club": shownClub.color } as React.CSSProperties}
              >
                {step === 0 ? "Continuar con este club" : "Siguiente: opciones de carrera"}
                <ArrowRight />
              </Button>
            ) : (
            <Button
              variant="club"
              size="lg"
              className="min-h-11 flex-1 md:flex-none"
              disabled={!canStart}
              onClick={() =>
                newGame(
                  club.id,
                  identity,
                  rescueMode ? rescueTerm : null,
                  keepBaseStadium,
                  boardMode,
                  { name: managerName.trim(), style: managerStyle },
                )
              }
              style={{ "--club": shownClub.color } as React.CSSProperties}
            >
              {canStart
                ? rescueMode
                  ? "Empezar el rescate"
                  : "Tomar el cargo"
                : "Plantilla en preparación"}
              <ArrowRight />
            </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
