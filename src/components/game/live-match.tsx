import { useEffect, useReducer, useRef, useState } from "react";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { useShallow } from "zustand/react/shallow";
import { ClubCrest } from "@/components/game/crest";
import { Button } from "@/components/ui/button";
import { clubById } from "@/lib/game/clubs";
import { compBackdropStyle } from "@/lib/game/competitions";
import { userMatchBoost } from "@/lib/game/event-effects";
import { lastName } from "@/lib/game/format";
import { LiveEngine, gkSkill, SHOT_POWER_RANGE } from "@/lib/game/live-match";
import type { LiveInput, Outcome, Side, Situation } from "@/lib/game/live-match";
import { nextUserContext } from "@/lib/game/selectors";
import { autoBench, autoLineup, clubQuality } from "@/lib/game/sim";
import { useGame } from "@/lib/game/store";
import { playGameSound } from "@/lib/game/sound";
import type { Fixture, Player } from "@/lib/game/types";

/** Milisegundos reales por minuto de juego (mucho más lento que el repaso de "Simular resultado"). */
const MS_PER_MINUTE = { 1: 700, 2: 350, 4: 150 } as const;
type Speed = keyof typeof MS_PER_MINUTE;
type Phase = "playing" | "situation" | "outcome" | "halftime" | "finished";

export function LiveMatchPlay() {
  const context = useGame(
    useShallow((s) => ({
      calendar: s.calendar,
      cursor: s.cursor,
      fixtures: s.fixtures,
      pendingFixtureId: s.pendingFixtureId,
      clubId: s.clubId,
    })),
  );
  const setScreen = useGame((s) => s.setScreen);
  const ctx = nextUserContext(context);
  const fixture =
    ctx?.fixture ?? context.fixtures.find((f) => f.id === context.pendingFixtureId);
  if (!fixture || fixture.played) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-4">
        <p className="text-fg-muted">No hay partido pendiente.</p>
        <Button onClick={() => setScreen("office")}>Volver al despacho</Button>
      </div>
    );
  }
  return <LiveMatchInner key={fixture.id} fixture={fixture} />;
}

function LiveMatchInner({ fixture }: { fixture: Fixture }) {
  const finishLiveMatch = useGame((s) => s.finishLiveMatch);
  const managedClub = clubById(useGame((s) => s.clubId));
  const [engine] = useState(() => {
    const save = useGame.getState();
    const userHome = fixture.homeId === save.clubId;
    const matchPlayers = save.players.filter(
      (player) =>
        player.clubId === fixture.homeId || player.clubId === fixture.awayId,
    );
    const homeLineup = userHome ? save.tactics.lineup : autoLineup(matchPlayers, fixture.homeId);
    const awayLineup = !userHome ? save.tactics.lineup : autoLineup(matchPlayers, fixture.awayId);
    const boost = userMatchBoost(save);
    const homeBench = userHome ? save.tactics.bench : autoBench(matchPlayers, fixture.homeId, homeLineup);
    const awayBench = !userHome ? save.tactics.bench : autoBench(matchPlayers, fixture.awayId, awayLineup);
    return new LiveEngine({
      fixtureId: fixture.id,
      homeId: fixture.homeId,
      awayId: fixture.awayId,
      homeShort: clubById(fixture.homeId).short,
      awayShort: clubById(fixture.awayId).short,
      stadium: clubById(fixture.homeId).stadium,
      players: matchPlayers,
      homeLineup,
      awayLineup,
      homeBench,
      awayBench,
      userSide: userHome ? "home" : "away",
      homeGrl: clubQuality(matchPlayers, fixture.homeId, homeLineup, userHome ? homeBench : undefined) + (userHome ? boost : 0),
      awayGrl: clubQuality(matchPlayers, fixture.awayId, awayLineup, !userHome ? awayBench : undefined) + (!userHome ? boost : 0),
      userMentality: save.tactics.mentality,
      seed: save.seed + save.cursor * 997 + fixture.id.length * 13 + fixture.round,
    });
  });
  const [, force] = useReducer((n: number) => n + 1, 0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [speed, setSpeed] = useState<Speed>(1);
  const [situation, setSituation] = useState<Situation | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pitchFocus, setPitchFocus] = useState(() => ({
    side: "home" as Side,
    playerId: engine.ctx.homeLineup[0] ?? engine.ctx.awayLineup[0] ?? "",
  }));
  const scroller = useRef<HTMLUListElement>(null);

  const home = clubById(fixture.homeId);
  const away = clubById(fixture.awayId);

  const moveAmbientFocus = () => {
    const side: Side = Math.floor(engine.minute / 4) % 2 === 0 ? "home" : "away";
    const lineup = side === "home" ? engine.ctx.homeLineup : engine.ctx.awayLineup;
    const outfield = lineup.filter((id) => engine.ctx.players.find((player) => player.id === id)?.pos !== "GK");
    const playerId = outfield[Math.floor(engine.minute * 0.73) % Math.max(1, outfield.length)] ?? lineup[0] ?? "";
    setPitchFocus({ side, playerId });
  };

  const proceed = () => {
    if (engine.status === "ht") setPhase("halftime");
    else if (engine.status === "ft") setPhase("finished");
    else setPhase("playing");
  };

  // Reloj: un minuto de juego por tick; se detiene cuando aparece una situación.
  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setTimeout(() => {
      const r = engine.step();
      if (r.situation) {
        setPitchFocus({ side: r.situation.attacker, playerId: r.situation.actor.id });
        setSituation(r.situation);
        setPhase("situation");
      } else if (r.outcome) {
        const mentioned = engine.ctx.players
          .filter((player) => r.outcome?.text.includes(player.name))
          .sort((a, b) => b.name.length - a.name.length)[0];
        if (mentioned) {
          setPitchFocus({
            side: engine.ctx.homeLineup.includes(mentioned.id) ? "home" : "away",
            playerId: mentioned.id,
          });
        } else {
          moveAmbientFocus();
        }
        setOutcome(r.outcome);
        setPhase("outcome");
      } else {
        moveAmbientFocus();
        proceed();
      }
      force();
    }, MS_PER_MINUTE[speed]);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, speed, engine.minute]);

  // Resultado de cada jugada a la vista un momento; después sigue la jugada encadenada o el partido.
  useEffect(() => {
    if (phase !== "outcome" || !outcome) return;
    const id = window.setTimeout(() => leaveOutcome(), outcome.followUp ? 1400 : 2000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, outcome]);

  const leaveOutcome = () => {
    if (outcome?.followUp) {
      setSituation(outcome.followUp);
      setOutcome(null);
      setPhase("situation");
    } else {
      setOutcome(null);
      proceed();
    }
  };

  useEffect(() => {
    const list = scroller.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [engine.feed.length]);

  const decide = (input: LiveInput) => {
    if (!situation) return;
    const o = engine.resolve(situation, input);
    setPitchFocus({
      side: o.followUp?.attacker ?? situation.attacker,
      playerId: o.followUp?.actor.id ?? situation.actor.id,
    });
    setSituation(null);
    setOutcome(o);
    setPhase("outcome");
    force();
  };

  const last = engine.feed[engine.feed.length - 1];
  const shots = engine.shots;
  const scoreline = `${engine.score.home}-${engine.score.away}`;
  const previousScoreline = useRef(scoreline);

  useEffect(() => {
    if (previousScoreline.current === scoreline) return;
    previousScoreline.current = scoreline;
    playGameSound("goal");
  }, [engine, scoreline]);

  return (
    <div
      className="flex min-h-dvh flex-col bg-bg"
      style={
        {
          ...compBackdropStyle(fixture.competition),
          "--club": managedClub.color,
          "--club-fg": accentForeground(managedClub.color),
          "--color-primary": managedClub.color,
          "--color-primary-foreground": accentForeground(managedClub.color),
        } as CSSProperties
      }
    >
      <header className="border-b border-border px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="flex w-20 flex-col items-center gap-1">
            <ClubCrest club={home} size={40} />
            <p className="text-center font-display text-sm font-semibold leading-none">{home.short}</p>
          </div>
          <div className="flex-1 text-center">
            <p key={scoreline} className="match-live-score font-display text-5xl font-semibold tabular-nums leading-none">
              {engine.score.home}–{engine.score.away}
            </p>
            <p className="mt-1 font-display text-lg tabular-nums text-fg-muted">
              {phase === "halftime" ? "Descanso" : phase === "finished" ? "Final" : `${engine.minute}'`}
            </p>
          </div>
          <div className="flex w-20 flex-col items-center gap-1">
            <ClubCrest club={away} size={40} />
            <p className="text-center font-display text-sm font-semibold leading-none">{away.short}</p>
          </div>
        </div>
        <div className="mx-auto mt-3 flex max-w-5xl items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
            <div className="h-full bg-fg" style={{ width: `${Math.min(100, (engine.minute / 90) * 100)}%` }} />
          </div>
          <p className="text-[11px] tabular-nums text-fg-muted">
            Tiros {shots.home}–{shots.away}
          </p>
          <div className="flex gap-1">
            {([1, 2, 4] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${speed === s ? "bg-fg text-bg" : "bg-elevated text-fg-muted"}`}
              >
                x{s}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 pt-4">
        <LivePitch
          home={home}
          away={away}
          players={engine.ctx.players}
          homeLineup={engine.ctx.homeLineup}
          awayLineup={engine.ctx.awayLineup}
          managedClubId={managedClub.id}
          minute={engine.minute}
          focus={pitchFocus}
        />
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 pt-4">
        <div className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-fg-muted">Ahora</p>
          <p
            className={`mt-1 min-h-10 text-sm ${last?.tone === "good" ? "text-good" : last?.tone === "bad" ? "text-bad" : "text-fg"}`}
          >
            {last?.text ?? ""}
          </p>
        </div>
      </div>

      <ul ref={scroller} className="mx-auto max-h-[32dvh] min-h-0 w-full max-w-5xl flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        {engine.feed.map((l, i) => (
          <li
            key={`${l.minute}-${i}`}
            className={`py-1.5 text-sm ${l.tone === "good" ? "text-good" : l.tone === "bad" ? "text-bad" : "text-fg-muted"}`}
          >
            {l.text}
          </li>
        ))}
      </ul>

      {phase === "situation" && situation ? (
        <Overlay>
          <SituationView sit={situation} onDecide={decide} />
        </Overlay>
      ) : null}

      {phase === "outcome" && outcome ? (
        <Overlay>
          <button
            type="button"
            onClick={leaveOutcome}
            className="w-full max-w-sm rounded-2xl bg-elevated p-6 text-center shadow-[var(--shadow-border)]"
          >
            <p
              className={`font-display text-4xl font-semibold leading-none ${outcome.tone === "good" ? "text-good" : outcome.tone === "bad" ? "text-bad" : "text-fg"}`}
            >
              {outcome.label}
            </p>
            <p className="mt-3 text-sm text-fg-muted">{outcome.text}</p>
            <p className="mt-4 font-display text-2xl tabular-nums">
              {home.short} {engine.score.home}–{engine.score.away} {away.short}
            </p>
          </button>
        </Overlay>
      ) : null}

      {phase === "halftime" ? (
        <Overlay>
          <div className="w-full max-w-sm rounded-2xl bg-elevated p-6 text-center shadow-[var(--shadow-border)]">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-fg-muted">Descanso</p>
            <p className="mt-2 font-display text-4xl font-semibold tabular-nums">
              {engine.score.home}–{engine.score.away}
            </p>
            <p className="mt-2 text-sm text-fg-muted">
              Tiros {shots.home}–{shots.away}
            </p>
            <Button
              variant="club"
              size="lg"
              className="mt-5 w-full"
              onClick={() => {
                engine.resume();
                setPhase("playing");
                force();
              }}
            >
              Segundo tiempo
            </Button>
          </div>
        </Overlay>
      ) : null}

      {phase === "finished" ? (
        <Overlay>
          <div className="w-full max-w-sm rounded-2xl bg-elevated p-6 text-center shadow-[var(--shadow-border)]">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-fg-muted">Final del partido</p>
            <p className="mt-2 font-display text-5xl font-semibold tabular-nums">
              {engine.score.home}–{engine.score.away}
            </p>
            <p className="mt-2 text-sm text-fg-muted">
              {home.short} · {away.short}
            </p>
            <Button
              variant="club"
              size="lg"
              className="mt-5 w-full"
              disabled={submitted}
              onClick={() => {
                setSubmitted(true);
                finishLiveMatch(engine.finish());
              }}
            >
              Ver resumen
            </Button>
          </div>
        </Overlay>
      ) : null}
    </div>
  );
}

function LivePitch({
  home,
  away,
  players,
  homeLineup,
  awayLineup,
  managedClubId,
  minute,
  focus,
}: {
  home: ReturnType<typeof clubById>;
  away: ReturnType<typeof clubById>;
  players: Player[];
  homeLineup: string[];
  awayLineup: string[];
  managedClubId: string;
  minute: number;
  focus: { side: Side; playerId: string };
}) {
  const playersById = new Map(players.map((player) => [player.id, player]));
  const homePlayers = homeLineup
    .map((id) => playersById.get(id))
    .filter((player): player is Player => Boolean(player));
  const awayPlayers = awayLineup
    .map((id) => playersById.get(id))
    .filter((player): player is Player => Boolean(player));
  const focusedPlayers = focus.side === "home" ? homePlayers : awayPlayers;
  const focusedPlayer = focusedPlayers.find((player) => player.id === focus.playerId) ?? focusedPlayers[0];
  const focusedPosition = focusedPlayer
    ? pitchPosition(focusedPlayer, focusedPlayers, focus.side, minute, true)
    : { left: 50, top: 50 };
  const ballLeft = Math.min(95, Math.max(5, focusedPosition.left + (focus.side === "home" ? 2.5 : -2.5)));
  const ballTop = Math.min(92, Math.max(8, focusedPosition.top - 2));
  const managed = clubById(managedClubId);
  const homeColor = home.id === managedClubId
    ? managed.color
    : contrastingOpponentColor(home.color, managed.color);
  const awayColor = away.id === managedClubId
    ? managed.color
    : contrastingOpponentColor(away.color, managed.color);

  return (
    <div
      className="live-pitch"
      role="img"
      aria-label={`Cancha de ${home.short} contra ${away.short}, minuto ${minute}`}
    >
      <div className="live-pitch-lines" aria-hidden="true" />
      <div className="live-pitch-box live-pitch-box--home" aria-hidden="true" />
      <div className="live-pitch-box live-pitch-box--away" aria-hidden="true" />
      {homePlayers.map((player) => (
        <PitchPlayer
          key={`home-${player.id}`}
          player={player}
          lineup={homePlayers}
          side="home"
          minute={minute}
          active={player.id === focus.playerId && focus.side === "home"}
          clubColor={homeColor}
          focusSide={focus.side}
          isOpponent={home.id !== managedClubId}
        />
      ))}
      {awayPlayers.map((player) => (
        <PitchPlayer
          key={`away-${player.id}`}
          player={player}
          lineup={awayPlayers}
          side="away"
          minute={minute}
          active={player.id === focus.playerId && focus.side === "away"}
          clubColor={awayColor}
          focusSide={focus.side}
          isOpponent={away.id !== managedClubId}
        />
      ))}
      <span
        className="live-pitch-ball"
        aria-hidden="true"
        style={{ left: `${ballLeft}%`, top: `${ballTop}%` }}
      >
        ⚽
      </span>
    </div>
  );
}

function PitchPlayer({
  player,
  lineup,
  side,
  minute,
  active,
  clubColor,
  focusSide,
  isOpponent,
}: {
  player: Player;
  lineup: Player[];
  side: Side;
  minute: number;
  active: boolean;
  clubColor: string;
  focusSide: Side;
  isOpponent: boolean;
}) {
  const position = pitchPosition(player, lineup, side, minute, active, focusSide);
  const style: CSSProperties & { "--player-color": string; "--player-ink": string } = {
    left: `${position.left}%`,
    top: `${position.top}%`,
    "--player-color": clubColor,
    "--player-ink": kitTextColor(clubColor),
  };

  return (
    <span
      className={`live-pitch-player${active ? " live-pitch-player--active" : ""}${isOpponent ? " live-pitch-player--opponent" : ""}`}
      style={style}
      aria-hidden="true"
    >
      {player.number}
    </span>
  );
}

const OPPONENT_KIT_PALETTE = ["#f97316", "#2563eb", "#facc15", "#e11d48", "#f8fafc", "#111827", "#14b8a6"];

function rgb(hex: string): [number, number, number] | null {
  const value = hex.replace("#", "");
  if (!/^[\da-f]{6}$/i.test(value)) return null;
  const [red, green, blue] = [0, 2, 4].map((index) =>
    Number.parseInt(value.slice(index, index + 2), 16),
  );
  return [red!, green!, blue!];
}

function luminance(color: [number, number, number]) {
  const channels = color.map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

function kitTextColor(color: string) {
  const channels = rgb(color);
  if (!channels) return "#ffffff";
  const lightness = luminance(channels);
  const darkContrast = (lightness + 0.05) / 0.05;
  const lightContrast = 1.05 / (lightness + 0.05);
  return darkContrast >= lightContrast ? "#111827" : "#ffffff";
}

function contrastingOpponentColor(opponentColor: string, managedColor: string) {
  const opponent = rgb(opponentColor);
  const managed = rgb(managedColor);
  if (!opponent || !managed) return opponentColor;
  const distance = (a: [number, number, number], b: [number, number, number]) =>
    Math.sqrt(a.reduce((sum, value, index) => sum + (value - b[index]!) ** 2, 0));
  const contrast = (a: [number, number, number], b: [number, number, number]) => {
    const [light, dark] = [luminance(a), luminance(b)].sort((left, right) => right - left);
    return (light! + 0.05) / (dark! + 0.05);
  };
  if (distance(opponent, managed) >= 125 && contrast(opponent, managed) >= 1.65) return opponentColor;
  return OPPONENT_KIT_PALETTE
    .map((color) => ({ color, channels: rgb(color)! }))
    .sort((a, b) => {
      const score = (candidate: typeof a) =>
        distance(candidate.channels, managed) + Math.min(contrast(candidate.channels, managed), 7) * 28;
      return score(b) - score(a);
    })[0]!.color;
}

function pitchPosition(
  player: Player,
  lineup: Player[],
  side: Side,
  minute: number,
  active: boolean,
  focusSide: Side = side,
) {
  const line = player.pos === "GK"
    ? 0
    : ["RB", "CB", "LB"].includes(player.pos)
      ? 1
      : ["ST", "RW", "LW"].includes(player.pos)
        ? 3
        : 2;
  const linePlayers = lineup.filter((candidate) => {
    if (candidate.pos === "GK") return line === 0;
    if (["RB", "CB", "LB"].includes(candidate.pos)) return line === 1;
    if (["ST", "RW", "LW"].includes(candidate.pos)) return line === 3;
    return line === 2;
  });
  const lineIndex = Math.max(0, linePlayers.findIndex((candidate) => candidate.id === player.id));
  const baseX = side === "home" ? [7, 24, 42, 59][line]! : [93, 76, 58, 41][line]!;
  const forward = side === "home" ? 1 : -1;
  const attackShift = side === focusSide ? 5 : -1;
  const activeShift = active ? 7 : 0;
  const sway = Math.sin(minute * 0.58 + lineIndex * 1.7 + line * 0.9) * 2.1;
  const x = Math.min(95, Math.max(5, baseX + (attackShift + activeShift) * forward + sway));
  const baseY = (lineIndex + 1) * (100 / (linePlayers.length + 1));
  const y = Math.min(92, Math.max(8, baseY + Math.sin(minute * 0.43 + lineIndex * 2.2) * 2.2));

  return { left: x, top: y };
}

function accentForeground(color: string) {
  const hex = color.replace("#", "");
  if (hex.length !== 6) return "#fff6f2";
  const channels = [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
  const luminance = 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
  return luminance > 0.62 ? "#141414" : "#fff6f2";
}

function Overlay({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-4 sm:items-center">{children}</div>
  );
}

// ---------- Minijuegos ----------

function SituationView({ sit, onDecide }: { sit: Situation; onDecide: (i: LiveInput) => void }) {
  return (
    <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-elevated p-5 shadow-[var(--shadow-border)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-fg-muted">
        Partido en pausa · {sit.minute}'
      </p>
      <h3 className="mt-1 font-display text-3xl font-semibold leading-none">{sit.title}</h3>
      <p className="mt-2 text-sm text-fg-muted">{sit.prompt}</p>
      <div className="mt-4">
        {sit.kind === "chance" || sit.kind === "freekick" || sit.kind === "penalty" ? (
          <ShotGame sit={sit} onDecide={onDecide} />
        ) : sit.kind === "through" ? (
          <ThroughGame sit={sit} onDecide={onDecide} />
        ) : sit.kind === "cross" ? (
          <CrossGame sit={sit} onDecide={onDecide} />
        ) : sit.kind === "oneOnOne" ? (
          <OneOnOneGame sit={sit} onDecide={onDecide} />
        ) : sit.kind === "keeper" ? (
          <KeeperGame sit={sit} onDecide={onDecide} />
        ) : (
          <DefenseGame sit={sit} onDecide={onDecide} />
        )}
      </div>
    </div>
  );
}

function Chip({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-md bg-surface px-2 py-1 text-[11px] tabular-nums text-fg-muted">
      {label} <span className="font-medium text-fg">{Math.round(value)}</span>
    </span>
  );
}

function PlayerLine({ p, chips }: { p: Player; chips: Array<[string, number]> }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">{lastName(p.name)}</span>
      {chips.map(([l, v]) => (
        <Chip key={l} label={l} value={v} />
      ))}
      <Chip label="FORMA" value={p.form} />
      <Chip label="FÍSICO" value={p.fitness} />
    </div>
  );
}

/** Onda triangular 0..1 que sube y baja sola; `ref.current` tiene el valor exacto al tocar. */
function useSweep(periodMs: number) {
  const ref = useRef(0);
  const markerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const ph = ((now - t0) % periodMs) / periodMs;
      const tri = ph < 0.5 ? ph * 2 : 2 - ph * 2;
      ref.current = tri;
      if (markerRef.current) markerRef.current.style.left = `${tri * 100}%`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [periodMs]);
  return [ref, markerRef] as const;
}

function Meter({
  markerRef,
  sweet,
  label,
}: {
  markerRef: RefObject<HTMLDivElement | null>;
  sweet: [number, number];
  label: string;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] uppercase tracking-wide text-fg-muted">{label}</p>
      <div className="relative h-4 overflow-hidden rounded-full bg-surface">
        <div
          className="absolute inset-y-0 bg-good/35"
          style={{ left: `${sweet[0]}%`, width: `${sweet[1] - sweet[0]}%` }}
        />
        <div className="absolute inset-y-0 right-0 bg-bad/30" style={{ width: "7%" }} />
        <div ref={markerRef} className="absolute inset-y-0 left-0 w-1.5 -translate-x-1/2 bg-fg" />
      </div>
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-3 text-sm font-medium shadow-[var(--shadow-border)] ${selected ? "bg-fg text-bg" : "bg-surface text-fg"}`}
    >
      {children}
    </button>
  );
}

function ShotGame({ sit, onDecide }: { sit: Situation; onDecide: (i: LiveInput) => void }) {
  const [col, setCol] = useState<0 | 1 | 2 | null>(null);
  const [row, setRow] = useState<0 | 1 | null>(null);
  const [ref, markerRef] = useSweep(1500);
  const sent = useRef(false);
  const a = sit.actor;
  const zones: Array<[0 | 1 | 2, 0 | 1, string]> = [
    [0, 0, "↖"],
    [1, 0, "↑"],
    [2, 0, "↗"],
    [0, 1, "↙"],
    [1, 1, "↓"],
    [2, 1, "↘"],
  ];
  return (
    <div className="flex flex-col gap-4">
      <PlayerLine
        p={a}
        chips={[
          ["DEFINICIÓN", a.attrs.sho],
          ["PASE", a.attrs.pas],
        ]}
      />
      {sit.keeper ? (
        <p className="text-xs text-fg-muted">
          Arquero: {lastName(sit.keeper.name)} · nivel {Math.round(gkSkill(sit.keeper))}
        </p>
      ) : null}
      <div>
        <p className="mb-1 text-[11px] uppercase tracking-wide text-fg-muted">Dirección (elegí dónde tirar)</p>
        <div className="grid grid-cols-3 gap-1 rounded-md border-2 border-fg/60 p-1">
          {zones.map(([c, r, glyph]) => (
            <button
              key={`${c}${r}`}
              type="button"
              onClick={() => {
                setCol(c);
                setRow(r);
              }}
              className={`h-12 rounded text-xl ${col === c && row === r ? "bg-fg text-bg" : "bg-surface text-fg-muted"}`}
            >
              {glyph}
            </button>
          ))}
        </div>
      </div>
      <Meter
        markerRef={markerRef}
        sweet={[SHOT_POWER_RANGE[0], SHOT_POWER_RANGE[1]]}
        label="Potencia (tocá Disparar en la zona verde)"
      />
      <p className="-mt-2 text-xs text-fg-muted">
        La zona verde mejora el remate, pero el arquero todavía puede atajarlo.
      </p>
      <Button
        variant="club"
        size="lg"
        disabled={col === null || row === null}
        onClick={() => {
          if (sent.current || col === null || row === null) return;
          sent.current = true;
          onDecide({ type: "shot", col, row, power: Math.round(ref.current * 100) });
        }}
      >
        ¡Disparar!
      </Button>
    </div>
  );
}

function ThroughGame({ sit, onDecide }: { sit: Situation; onDecide: (i: LiveInput) => void }) {
  const [lane, setLane] = useState<0 | 1 | 2 | null>(null);
  const [ref, markerRef] = useSweep(1600);
  const sent = useRef(false);
  const p = sit.actor;
  const r = sit.target;
  return (
    <div className="flex flex-col gap-4">
      <PlayerLine p={p} chips={[["PASE", p.attrs.pas]]} />
      {r ? <PlayerLine p={r} chips={[["VELOCIDAD", r.attrs.pac]]} /> : null}
      <div className="grid grid-cols-3 gap-2">
        {(["Por izquierda", "Al medio", "Por derecha"] as const).map((l, i) => (
          <ChoiceButton key={l} selected={lane === i} onClick={() => setLane(i as 0 | 1 | 2)}>
            {l}
          </ChoiceButton>
        ))}
      </div>
      <Meter markerRef={markerRef} sweet={[35, 65]} label="Momento (soltá el pase cuando el compañero arranca)" />
      <Button
        variant="club"
        size="lg"
        disabled={lane === null}
        onClick={() => {
          if (sent.current || lane === null) return;
          sent.current = true;
          onDecide({ type: "through", lane, timing: ref.current });
        }}
      >
        ¡Pasar ahora!
      </Button>
    </div>
  );
}

function CrossGame({ sit, onDecide }: { sit: Situation; onDecide: (i: LiveInput) => void }) {
  const [zone, setZone] = useState<0 | 1 | 2 | null>(null);
  const [ref, markerRef] = useSweep(1500);
  const sent = useRef(false);
  const p = sit.actor;
  const h = sit.target;
  return (
    <div className="flex flex-col gap-4">
      <PlayerLine p={p} chips={[["PASE", p.attrs.pas]]} />
      {h ? <PlayerLine p={h} chips={[["FÍSICO", h.attrs.phy], ["DEFINICIÓN", h.attrs.sho]]} /> : null}
      <div className="grid grid-cols-3 gap-2">
        {(["Primer palo", "Punto penal", "Segundo palo"] as const).map((l, i) => (
          <ChoiceButton key={l} selected={zone === i} onClick={() => setZone(i as 0 | 1 | 2)}>
            {l}
          </ChoiceButton>
        ))}
      </div>
      <Meter markerRef={markerRef} sweet={[55, 80]} label="Potencia (ni corto ni pasado)" />
      <Button
        variant="club"
        size="lg"
        disabled={zone === null}
        onClick={() => {
          if (sent.current || zone === null) return;
          sent.current = true;
          onDecide({ type: "cross", zone, power: Math.round(ref.current * 100) });
        }}
      >
        ¡Centrar!
      </Button>
    </div>
  );
}

function OneOnOneGame({ sit, onDecide }: { sit: Situation; onDecide: (i: LiveInput) => void }) {
  const a = sit.actor;
  const d = sit.target;
  const sent = useRef(false);
  const go = (choice: "dribble" | "chip" | "shot") => {
    if (sent.current) return;
    sent.current = true;
    onDecide({ type: "oneOnOne", choice });
  };
  return (
    <div className="flex flex-col gap-3">
      <PlayerLine
        p={a}
        chips={[
          ["REGATE", a.attrs.dri],
          ["VELOCIDAD", a.attrs.pac],
          ["DEFINICIÓN", a.attrs.sho],
        ]}
      />
      {d ? (
        <p className="text-xs text-fg-muted">
          Defensor: {lastName(d.name)} · DEF {d.attrs.def} · VEL {d.attrs.pac}
          {sit.keeper ? ` · Arquero ${lastName(sit.keeper.name)} (${Math.round(gkSkill(sit.keeper))})` : ""}
        </p>
      ) : null}
      <ChoiceButton onClick={() => go("dribble")}>Regatear al defensor</ChoiceButton>
      <ChoiceButton onClick={() => go("shot")}>Definir de primera</ChoiceButton>
      <ChoiceButton onClick={() => go("chip")}>Picarla sobre el arquero</ChoiceButton>
    </div>
  );
}

/** Penal en contra: el usuario elige hacia dónde se tira su arquero (el rival patea solo). */
function KeeperGame({ sit, onDecide }: { sit: Situation; onDecide: (i: LiveInput) => void }) {
  const taker = sit.actor;
  const gk = sit.keeper;
  const sent = useRef(false);
  const go = (dir: 0 | 1 | 2) => {
    if (sent.current) return;
    sent.current = true;
    onDecide({ type: "dive", dir });
  };
  return (
    <div className="flex flex-col gap-3">
      <PlayerLine
        p={taker}
        chips={[
          ["DEFINICIÓN", taker.attrs.sho],
          ["FÍSICO", taker.attrs.phy],
        ]}
      />
      {gk ? (
        <p className="text-xs text-fg-muted">
          Tu arquero: {lastName(gk.name)} · nivel {Math.round(gkSkill(gk))}
        </p>
      ) : null}
      <p className="text-[11px] uppercase tracking-wide text-fg-muted">¿Hacia dónde se tira?</p>
      <div className="grid grid-cols-3 gap-2">
        <ChoiceButton onClick={() => go(0)}>← Izquierda</ChoiceButton>
        <ChoiceButton onClick={() => go(1)}>Quedarse al centro</ChoiceButton>
        <ChoiceButton onClick={() => go(2)}>Derecha →</ChoiceButton>
      </div>
    </div>
  );
}

function DefenseGame({ sit, onDecide }: { sit: Situation; onDecide: (i: LiveInput) => void }) {
  const d = sit.actor;
  const a = sit.target;
  const sent = useRef(false);
  const go = (choice: "intercept" | "press" | "tackle") => {
    if (sent.current) return;
    sent.current = true;
    onDecide({ type: "defense", choice });
  };
  return (
    <div className="flex flex-col gap-3">
      <PlayerLine
        p={d}
        chips={[
          ["DEFENSA", d.attrs.def],
          ["FÍSICO", d.attrs.phy],
          ["VELOCIDAD", d.attrs.pac],
        ]}
      />
      {a ? (
        <p className="text-xs text-fg-muted">
          Rival: {lastName(a.name)} · REGATE {a.attrs.dri} · VEL {a.attrs.pac} · PASE {a.attrs.pas}
        </p>
      ) : null}
      <ChoiceButton onClick={() => go("intercept")}>Cortar el pase (intercepción)</ChoiceButton>
      <ChoiceButton onClick={() => go("press")}>Presionar para recuperar</ChoiceButton>
      <ChoiceButton onClick={() => go("tackle")}>Barrida (riesgo de falta)</ChoiceButton>
    </div>
  );
}
