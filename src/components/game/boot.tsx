import { useState } from "react";
import {
  ArrowRight,
  Crown,
  Globe2,
  Landmark,
  Play,
  ShieldPlus,
  Sparkles,
  Trophy,
} from "lucide-react";
import { GlobalCareerHistory } from "@/components/game/global-career-history";
import { ClubCrest } from "@/components/game/crest";
import { clubById, isKnownClub } from "@/lib/game/clubs";
import { NATIONAL_TEAMS, NATIONAL_TEAM_BY_ID } from "@/lib/game/national";
import { useGame } from "@/lib/game/store";
import { LanguageSelect } from "@/lib/i18n";

export function Boot() {
  const [showLegacy, setShowLegacy] = useState(false);
  const [showNationalStart, setShowNationalStart] = useState(false);
  const [nationalTeamId, setNationalTeamId] = useState("");
  const [nationalSlot, setNationalSlot] = useState(0);
  const [overwriteConfirmed, setOverwriteConfirmed] = useState(false);
  const [nationalStartMessage, setNationalStartMessage] = useState("");
  const clubId = useGame((s) => s.clubId);
  const careerMode = useGame((s) => s.careerMode ?? "club");
  const nationalManagerId = useGame((s) => s.nationalManagerId ?? null);
  const activeSlot = useGame((s) => s.slot);
  const slots = useGame((s) => s.slots);
  const setScreen = useGame((s) => s.setScreen);
  const openSlots = useGame((s) => s.openSlots);
  const startNationalCareer = useGame((s) => s.startNationalCareer);
  const hasCareer = isKnownClub(clubId);
  const history = useGame((s) => s.globalCareerHistory);
  const club = hasCareer ? clubById(clubId) : null;
  const activeNationalTeam = nationalManagerId
    ? NATIONAL_TEAM_BY_ID.get(nationalManagerId)
    : undefined;
  const selectedSlotOccupied = Boolean(
    slots[nationalSlot] ||
      (nationalSlot === activeSlot && hasCareer),
  );
  const selectedTeam = NATIONAL_TEAM_BY_ID.get(nationalTeamId);

  function beginNationalCareer() {
    if (!selectedTeam) {
      setNationalStartMessage("Elegí un país para empezar.");
      return;
    }
    if (selectedSlotOccupied && !overwriteConfirmed) {
      setOverwriteConfirmed(true);
      setNationalStartMessage(
        `La partida ${nationalSlot + 1} ya tiene una carrera. Confirmá si querés reemplazarla.`,
      );
      return;
    }
    const error = startNationalCareer(selectedTeam.id, nationalSlot);
    if (error) setNationalStartMessage(error);
  }

  return (
    <main className="boot-screen min-h-dvh overflow-hidden px-4 py-6 text-fg sm:px-7 md:py-10">
      <div className="boot-layout mx-auto grid w-full max-w-7xl items-center gap-8 xl:grid-cols-[1.12fr_0.88fr]">
        <section className="boot-intro flex min-w-0 flex-col gap-7 md:gap-9">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-fg-muted backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--color-primary)]" />
              Fútbol · Decisiones · Legado
            </p>
            <h1 className="mt-5 max-w-3xl font-display text-6xl font-black uppercase leading-[0.82] tracking-tight sm:text-7xl md:text-8xl xl:text-9xl">
              <span className="block text-white">Scudetto</span>
              <span className="mt-2 block text-primary">Be a manager</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
              El estadio está listo. Elegí tu equipo, diseñá tu proyecto y
              competí por los títulos más grandes.
            </p>
          </div>
          <div className="boot-pitch-card boot-stadium-card" aria-hidden="true">
            <div className="boot-stadium-lights">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="boot-stadium-crowd" />
            <div className="boot-pitch-lines">
              <span className="boot-pitch-halfway" />
              <span className="boot-pitch-center" />
              <span className="boot-pitch-box boot-pitch-box--top" />
              <span className="boot-pitch-box boot-pitch-box--bottom" />
              <span className="boot-pitch-markers boot-pitch-markers--top" />
              <span className="boot-pitch-markers boot-pitch-markers--middle" />
              <span className="boot-pitch-markers boot-pitch-markers--bottom" />
            </div>
            <div className="boot-stadium-score">
              <span>ESTADIO ABIERTO</span>
              <span>UNA NUEVA TEMPORADA COMIENZA</span>
            </div>
            <div className="boot-pitch-caption">
              <span>EL JUEGO ES TUYO</span>
              <span>DIRIGÍ · COMPETÍ · DEJÁ HUELLA</span>
            </div>
          </div>
          <div className="hidden items-center gap-3 text-xs text-white/45 sm:flex">
            <span className="h-px w-10 bg-primary/70" />
            UN MUNDO DE FÚTBOL. TU PRÓXIMO DESAFÍO.
          </div>
        </section>

        <section className="boot-menu mx-auto flex w-full max-w-xl flex-col gap-4 xl:mx-0 xl:justify-self-end">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-fg-muted">PANEL DE MÁNAGER</p>
              <p className="mt-1 font-display text-2xl font-bold">¿Cuál es tu próximo paso?</p>
            </div>
            <LanguageSelect />
          </div>

          {hasCareer ? (
            <button type="button" className="boot-career-card" onClick={() => setScreen(careerMode === "national" ? "international" : "office")}>
              <span className="boot-action-icon boot-action-icon--primary"><Play className="size-5 fill-current" /></span>
              <span className="min-w-0 flex-1 text-left">
                <span className="boot-card-kicker">TU CARRERA ACTIVA</span>
                <span className="mt-1 block truncate font-display text-2xl font-bold">
                  {careerMode === "national"
                    ? activeNationalTeam?.name ?? "Selección nacional"
                    : club?.name}
                </span>
                <span className="mt-0.5 block text-xs text-white/60">
                  {careerMode === "national"
                    ? "Volvé a la selección y seguí reconstruyendo el equipo."
                    : "Volvé al despacho y seguí escribiendo la historia."}
                </span>
              </span>
              {careerMode === "national" && activeNationalTeam ? (
                <span className="text-3xl" aria-hidden="true">{activeNationalTeam.flag}</span>
              ) : club ? (
                <ClubCrest club={club} size={48} />
              ) : null}
              <ArrowRight className="size-5 text-primary" />
            </button>
          ) : null}

          <button type="button" className="boot-start-card" onClick={() => openSlots()}>
            <span className="boot-action-icon boot-action-icon--primary"><ShieldPlus className="size-5" /></span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block font-display text-2xl font-bold">{hasCareer ? "Elegir otro desafío" : "Elegir mi club"}</span>
              <span className="mt-1 block text-xs leading-relaxed text-white/65">
                Elegí una liga, compará planteles y descubrí cuál será tu próximo desafío.
              </span>
            </span>
            <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/75 sm:inline-flex">
              Explorar ligas
            </span>
            <ArrowRight className="size-5 shrink-0 text-primary" />
          </button>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              aria-expanded={showNationalStart}
              className={`boot-feature-card${showNationalStart ? " boot-feature-card--active" : ""}`}
              onClick={() => setShowNationalStart((open) => !open)}
            >
              <span className="boot-action-icon boot-action-icon--primary"><Globe2 className="size-5" /></span>
              <span className="mt-4 block text-left font-display text-xl font-bold">Dirigir una selección</span>
              <span className="mt-1 block text-left text-xs leading-relaxed text-white/60">Empezá una carrera internacional sin gestionar ningún club.</span>
            </button>
            <button
              type="button"
              aria-expanded={showLegacy}
              className={`boot-feature-card${showLegacy ? " boot-feature-card--active" : ""}`}
              onClick={() => setShowLegacy((open) => !open)}
            >
              <span className="boot-action-icon boot-action-icon--gold"><Trophy className="size-5" /></span>
              <span className="mt-4 block text-left font-display text-xl font-bold">Mi legado</span>
              <span className="mt-1 block text-left text-xs leading-relaxed text-white/60">Tu trayectoria, victorias y trofeos de todas las carreras.</span>
              <span className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                <span className="text-white/55">{history.played} partidos · {history.won} ganados</span>
                <Crown className="size-4 text-amber-300" />
              </span>
            </button>
            <button type="button" className="boot-feature-card boot-feature-card--editor" onClick={() => setScreen("club-editor")}>
              <span className="boot-action-icon boot-action-icon--editor"><Sparkles className="size-5" /></span>
              <span className="mt-4 block text-left font-display text-xl font-bold">Crear mi club</span>
              <span className="mt-1 block text-left text-xs leading-relaxed text-white/60">Diseñá colores, escudo, estadio e identidad antes de salir a la cancha.</span>
              <span className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                <span className="text-white/55">Editor de equipos</span>
                <Landmark className="size-4 text-primary" />
              </span>
            </button>
          </div>

          {showNationalStart ? (
            <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <h3 className="font-display text-lg font-semibold">Elegí tu reconstrucción</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-fg-muted">
                  Selección
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
                    {Array.from({ length: 5 }, (_, index) => {
                      const occupied = Boolean(
                        slots[index] || (index === activeSlot && hasCareer),
                      );
                      return (
                        <option key={index} value={index}>
                          Partida {index + 1} · {occupied ? "ocupada" : "vacía"}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>
              <p className="mt-2 text-xs text-fg-muted">
                Vas a dirigir amistosos, torneos y convocatorias; las ligas de
                clubes avanzan en segundo plano.
              </p>
              {nationalStartMessage ? (
                <p role="status" className="mt-3 text-sm text-fg-muted">
                  {nationalStartMessage}
                </p>
              ) : null}
              <button
                type="button"
                disabled={!selectedTeam}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                onClick={beginNationalCareer}
              >
                {selectedSlotOccupied && overwriteConfirmed
                  ? "Confirmar y empezar"
                  : "Empezar reconstrucción"}
                <ArrowRight className="size-4" />
              </button>
            </section>
          ) : null}

          {showLegacy ? (
            <div className="boot-legacy-panel">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">HISTORIAL DEL MÁNAGER</p>
                  <p className="font-display text-xl font-bold">Tu legado global</p>
                </div>
                <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1.5 text-xs font-semibold text-amber-100">{history.awards.length} trofeos</span>
              </div>
              <GlobalCareerHistory />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
