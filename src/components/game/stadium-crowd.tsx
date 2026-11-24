import { useEffect, useRef, type ReactNode } from "react";
import { CrowdScene, STAND, type CrowdClub, type CrowdLevel, type CrowdSide } from "@/lib/game/crowd-engine";
import type { Club, MatchEvent, MatchResult } from "@/lib/game/types";

const toCrowdClub = (c: Club): CrowdClub => ({
  name: c.name,
  short: c.short,
  city: c.city,
  color: c.color,
  color2: c.color2,
  capacity: c.capacity,
  prestige: c.prestige,
});

/**
 * Las tribunas alrededor de la cancha de "Ver partido": hinchada local y visitante animada, banderas, carteles del club
 * y festejos de gol. En clásicos y finales suma tifos, bengalas y humo (`level` 1 y 2).
 * El canvas es solo decorativo (no captura toques): los jugadores de la cancha siguen siendo clickeables.
 */
export function StadiumCrowd({
  home,
  away,
  level,
  accent,
  seed,
  log,
  result,
  done,
  children,
}: {
  home: Club;
  away: Club;
  level: CrowdLevel;
  accent: string;
  seed: number;
  log: MatchEvent[];
  result: MatchResult;
  done: boolean;
  children: ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pitchRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CrowdScene | null>(null);
  const seen = useRef(0);
  const logRef = useRef(log);
  // Los clubes se leen desde refs: la escena se rearma solo si cambia el partido, no en cada render.
  const clubs = useRef({ home, away });
  useEffect(() => {
    logRef.current = log;
    clubs.current = { home, away };
  });

  // Escena + bucle de animación. Se rearma solo si cambia el partido.
  useEffect(() => {
    const wrap = wrapRef.current;
    const pitchEl = pitchRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !pitchEl || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new CrowdScene({
      home: toCrowdClub(clubs.current.home),
      away: toCrowdClub(clubs.current.away),
      level,
      accent,
      seed,
      motion: reduced ? 0.35 : 1,
    });
    sceneRef.current = scene;
    seen.current = logRef.current.length;

    const layout = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w < 20 || h < 20) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const wr = wrap.getBoundingClientRect();
      const pr = pitchEl.getBoundingClientRect();
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene.resize(w, h, { x: pr.left - wr.left, y: pr.top - wr.top, w: pr.width, h: pr.height }, dpr);
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(wrap);
    ro.observe(pitchEl);
    // Los carteles y tifos llevan texto: se re-dibujan cuando la tipografía ya cargó.
    void document.fonts?.ready.then(() => scene.rebuildArt());

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = (now - last) / 1000;
      last = now;
      acc += dt;
      // ~30 fps: alcanza para la hinchada y cuida la batería en el celular.
      if (acc < 1 / 32) return;
      scene.update(acc);
      scene.draw(ctx);
      acc = 0;
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      sceneRef.current = null;
    };
  }, [home.id, away.id, level, accent, seed]);

  // Eventos del partido → reacciones de la hinchada.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    for (let i = seen.current; i < log.length; i++) {
      const e = log[i]!;
      if (!e.clubId) continue;
      const side: CrowdSide = e.clubId === home.id ? "home" : "away";
      if (e.type === "goal") scene.goal(side);
      else if (e.type === "shot" || e.type === "save" || e.type === "chance") scene.chance(side);
    }
    seen.current = log.length;
  }, [log, home.id]);

  // Pitazo final.
  useEffect(() => {
    if (!done) return;
    const g = result.homeGoals - result.awayGoals;
    sceneRef.current?.fullTime(g > 0 ? "home" : g < 0 ? "away" : null);
  }, [done, result.homeGoals, result.awayGoals]);

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto w-full max-w-lg overflow-hidden rounded-xl bg-[#0b0d11] shadow-[var(--shadow-border)]"
      style={{ padding: `${STAND.top}px ${STAND.side}px ${STAND.bottom}px` }}
    >
      <div ref={pitchRef}>{children}</div>
      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0 size-full" />
    </div>
  );
}
