import { useEffect, useReducer, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ClubCrest } from "@/components/game/crest";
import { Button } from "@/components/ui/button";
import { clubById } from "@/lib/game/clubs";
import { compBackdropStyle } from "@/lib/game/competitions";
import { userMatchBoost } from "@/lib/game/event-effects";
import { lastName } from "@/lib/game/format";
import { LiveEngine, gkSkill } from "@/lib/game/live-match";
import type { LiveInput, Outcome, Situation } from "@/lib/game/live-match";
import { nextUserContext } from "@/lib/game/selectors";
import { autoBench, autoLineup, clubQuality } from "@/lib/game/sim";
import { useGame } from "@/lib/game/store";
import type { Fixture, Player } from "@/lib/game/types";

/** Milisegundos reales por minuto de juego (mucho más lento que el repaso de "Simular resultado"). */
const MS_PER_MINUTE = { 1: 700, 2: 350, 4: 150 } as const;
type Speed = keyof typeof MS_PER_MINUTE;
type Phase = "playing" | "situation" | "outcome" | "halftime" | "finished";

export function LiveMatchPlay() {
  const save = useGame((s) => s);
  const setScreen = useGame((s) => s.setScreen);
  const ctx = nextUserContext(save);
  const fixture = ctx?.fixture ?? save.fixtures.find((f) => f.id === save.pendingFixtureId);
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
  const [engine] = useState(() => {
    const save = useGame.getState();
    const userHome = fixture.homeId === save.clubId;
    const homeLineup = userHome ? save.tactics.lineup : autoLineup(save.players, fixture.homeId);
    const awayLineup = !userHome ? save.tactics.lineup : autoLineup(save.players, fixture.awayId);
    const boost = userMatchBoost(save);
    const homeBench = userHome ? save.tactics.bench : autoBench(save.players, fixture.homeId, homeLineup);
    const awayBench = !userHome ? save.tactics.bench : autoBench(save.players, fixture.awayId, awayLineup);
    return new LiveEngine({
      fixtureId: fixture.id,
      homeId: fixture.homeId,
      awayId: fixture.awayId,
      homeShort: clubById(fixture.homeId).short,
      awayShort: clubById(fixture.awayId).short,
      stadium: clubById(fixture.homeId).stadium,
      players: save.players,
      homeLineup,
      awayLineup,
      homeBench,
      awayBench,
      userSide: userHome ? "home" : "away",
      homeGrl: clubQuality(save.players, fixture.homeId, homeLineup, userHome ? homeBench : undefined) + (userHome ? boost : 0),
      awayGrl: clubQuality(save.players, fixture.awayId, awayLineup, !userHome ? awayBench : undefined) + (!userHome ? boost : 0),
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
  const scroller = useRef<HTMLUListElement>(null);

  const home = clubById(fixture.homeId);
  const away = clubById(fixture.awayId);

  const proceed = () => {
    if (engine.status === "ht") setPhase("halftime");
    else if (engine.status === "ft") setPhase("finished");
    else setPhase("playing");
    force();
  };

  // Reloj: un minuto de juego por tick; se detiene cuando aparece una situación.
  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setTimeout(() => {
      const r = engine.step();
      if (r.situation) {
        setSituation(r.situation);
        setPhase("situation");
      } else if (r.outcome) {
        setOutcome(r.outcome);
        setPhase("outcome");
      } else {
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
    scroller.current?.lastElementChild?.scrollIntoView({ block: "end" });
  }, [engine.feed.length]);

  const decide = (input: LiveInput) => {
    if (!situation) return;
    const o = engine.resolve(situation, input);
    setSituation(null);
    setOutcome(o);
    setPhase("outcome");
    force();
  };

  const last = engine.feed[engine.feed.length - 1];
  const shots = engine.shots;

  return (
    <div className="flex min-h-dvh flex-col bg-bg" style={compBackdropStyle(fixture.competition)}>
      <header className="border-b border-border px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex w-20 flex-col items-center gap-1">
            <ClubCrest club={home} size={40} />
            <p className="text-center font-display text-sm font-semibold leading-none">{home.short}</p>
          </div>
          <div className="flex-1 text-center">
            <p className="font-display text-5xl font-semibold tabular-nums leading-none">
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
        <div className="mx-auto mt-3 flex max-w-lg items-center gap-3">
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

      <div className="mx-auto w-full max-w-lg px-4 pt-4">
        <div className="rounded-2xl bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-fg-muted">Ahora</p>
          <p
            className={`mt-1 min-h-10 text-sm ${last?.tone === "good" ? "text-good" : last?.tone === "bad" ? "text-bad" : "text-fg"}`}
          >
            {last?.text ?? ""}
          </p>
        </div>
      </div>

      <ul ref={scroller} className="mx-auto max-h-[40dvh] w-full max-w-lg flex-1 overflow-y-auto px-4 py-3">
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
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      const ph = ((now - t0) % periodMs) / periodMs;
      const tri = ph < 0.5 ? ph * 2 : 2 - ph * 2;
      ref.current = tri;
      setV(tri);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [periodMs]);
  return [v, ref] as const;
}

function Meter({
  value,
  sweet,
  label,
}: {
  value: number;
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
        <div className="absolute inset-y-0 w-1.5 -translate-x-1/2 bg-fg" style={{ left: `${value * 100}%` }} />
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
  const [v, ref] = useSweep(1500);
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
      <Meter value={v} sweet={[70, 88]} label="Potencia (tocá Disparar en la zona verde)" />
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
  const [v, ref] = useSweep(1600);
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
      <Meter value={v} sweet={[35, 65]} label="Momento (soltá el pase cuando el compañero arranca)" />
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
  const [v, ref] = useSweep(1500);
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
      <Meter value={v} sweet={[55, 80]} label="Potencia (ni corto ni pasado)" />
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
