/**
 * Motor de la hinchada del partido 2D ("Ver partido").
 *
 * Dibuja en un canvas transparente que se superpone a la cancha: las tribunas rodean el campo
 * (local en la popular de abajo y en los laterales, visitante en un sector de la tribuna de arriba),
 * con hinchas animados, banderas, carteles con el nombre y los colores del club y festejos de gol.
 * En partidos grandes (`level` 1 y 2) suma tifos, bengalas, humo y más movimiento.
 *
 * No depende de React ni del estado del juego: recibe un `CrowdConfig` plano y se maneja con
 * `resize`, `update`, `draw` y los avisos `goal` / `chance` / `fullTime`.
 */
import { mulberry32 } from "./rng";

export type CrowdSide = "home" | "away";
export type CrowdLevel = 0 | 1 | 2;

export interface CrowdClub {
  name: string;
  short: string;
  city: string;
  color: string;
  color2: string;
  capacity: number;
  prestige: number;
}

export interface CrowdConfig {
  home: CrowdClub;
  away: CrowdClub;
  level: CrowdLevel;
  /** Color de la competición: tiñe la luz del vallado. */
  accent: string;
  seed: number;
  /** 0..1. Con "reducir movimiento" se baja a ~0.35: los hinchas se mueven poco y no hay destellos fuertes. */
  motion: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Grosor de las tribunas (px) alrededor de la cancha: lo usa el componente para dejar el lugar. */
export const STAND = { rail: 14, top: 50, bottom: 56, side: 34 } as const;

const COL_W = 6.6;
const ROW_H = 6.8;
const FONT = '"Barlow Condensed", "Segoe UI", system-ui, sans-serif';
const SKINS = ["#f1c9a5", "#e0ac84", "#c68863", "#8d5a3b", "#5e3a24"];
const PAPER_WHITE = "#e8e2d4";
const PAPER_DARK = "#2b2f38";

/* ------------------------------------------------------------------ */
/* Color                                                               */
/* ------------------------------------------------------------------ */

type RGB = [number, number, number];

function parseHex(hex: string): RGB {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return [128, 128, 128];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: RGB): string {
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function lum(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function mix(a: string, b: string, t: number): string {
  const x = parseHex(a);
  const y = parseHex(b);
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

function rgba(hex: string, a: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function dist(a: string, b: string): number {
  const x = parseHex(a);
  const y = parseHex(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

/** Que un color oscuro (negro, azul marino) no desaparezca contra la tribuna. */
function legible(hex: string): string {
  const l = lum(hex);
  return l < 0.12 ? mix(hex, "#ffffff", 0.14 + (0.12 - l) * 0.8) : hex;
}

/** Color de bengala/luz: saturado y brillante, sin perder el tono del club (los clubes blancos usan luz cálida). */
function vivid(hex: string): string {
  const [h, s, l] = rgbToHsl(parseHex(hex));
  if (s < 0.18) return l > 0.5 ? "#fff1d6" : "#ff5a36";
  return toHex(hslToRgb(h, Math.max(s, 0.8), Math.min(0.62, Math.max(l, 0.52))));
}

/* ------------------------------------------------------------------ */
/* Tipos internos                                                      */
/* ------------------------------------------------------------------ */

interface Fan {
  x: number;
  y: number;
  ph: number;
  /** -1..1: desfasaje individual del salto (se reduce cuando la hinchada se sincroniza). */
  jit: number;
  ci: number;
  si: number;
  scarf: boolean;
  amp: number;
  ox: number;
  oy: number;
  arm: number;
}

interface Flag {
  fan: Fan;
  len: number;
  w: number;
  h: number;
  ph: number;
  style: "split" | "bands";
}

type SectorKind = "awayTop" | "homeTopL" | "homeTopR" | "homeBottom" | "homeLeft" | "homeRight";

interface Sector {
  kind: SectorKind;
  side: CrowdSide;
  fan: Rect;
  rail: Rect;
  vertical: boolean;
  palette: string[];
  fans: Fan[];
  shirtBuckets: Fan[][];
  skinBuckets: Fan[][];
  scarves: Fan[];
  flags: Flag[];
  railArt: HTMLCanvasElement | null;
  tifoArt: HTMLCanvasElement | null;
  tifoStart: number;
  tifoHold: number;
  tifoDropped: boolean;
}

interface Flare {
  x: number;
  y: number;
  side: CrowdSide;
  color: string;
  litAt: number;
  lit: boolean;
  until: number;
  boost: number;
  emit: number;
  ph: number;
}

interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  grow: number;
  alpha: number;
  tint: string;
}

interface Paper {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ph: number;
  vph: number;
  age: number;
  life: number;
  color: string;
}

interface SideState {
  boost: number;
  slump: number;
  hold: number;
  slumpHold: number;
  flash: number;
  haze: number;
  e: number;
}

const BASE_ENERGY: Record<CrowdLevel, Record<CrowdSide, number>> = {
  0: { home: 0.3, away: 0.2 },
  1: { home: 0.5, away: 0.4 },
  2: { home: 0.7, away: 0.6 },
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const ease = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

/* ------------------------------------------------------------------ */
/* Escena                                                              */
/* ------------------------------------------------------------------ */

export class CrowdScene {
  private cfg: CrowdConfig;
  private W = 0;
  private H = 0;
  private dpr = 1;
  private pitch: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private sectors: Sector[] = [];
  private flares: Flare[] = [];
  private puffs: Puff[] = [];
  private papers: Paper[] = [];
  private t = 0;
  private st: Record<CrowdSide, SideState> = {
    home: { boost: 0, slump: 0, hold: 0, slumpHold: 0, flash: 0, haze: 0, e: 0 },
    away: { boost: 0, slump: 0, hold: 0, slumpHold: 0, flash: 0, haze: 0, e: 0 },
  };
  private pal: Record<CrowdSide, string[]>;
  private puffSprites = new Map<string, HTMLCanvasElement>();
  private glowSprites = new Map<string, HTMLCanvasElement>();
  private rand: () => number;
  private wavePos = 0;

  constructor(cfg: CrowdConfig) {
    this.cfg = cfg;
    this.rand = mulberry32(cfg.seed);
    this.pal = resolvePalettes(cfg.home, cfg.away);
    this.st.home.e = BASE_ENERGY[cfg.level].home;
    this.st.away.e = BASE_ENERGY[cfg.level].away;
  }

  /* ---------------- API ---------------- */

  resize(w: number, h: number, pitch: Rect, dpr: number) {
    this.W = w;
    this.H = h;
    this.pitch = pitch;
    this.dpr = dpr;
    this.build();
  }

  /** Re-dibuja carteles y tifos (se llama cuando termina de cargar la tipografía). */
  rebuildArt() {
    for (const s of this.sectors) {
      s.railArt = this.makeRail(s);
      s.tifoArt = this.makeTifo(s);
    }
  }

  goal(side: CrowdSide) {
    const mine = this.st[side];
    const other = this.st[side === "home" ? "away" : "home"];
    mine.boost = 1;
    mine.flash = 1;
    other.slump = 1;
    this.spawnPapers(side, this.cfg.level >= 1 ? 80 : 46);
    for (const f of this.flares) {
      if (f.side !== side) continue;
      f.boost = 1;
      if (this.cfg.level >= 1 && (!f.lit || this.t > f.until - 1)) {
        f.lit = true;
        f.litAt = this.t;
        f.until = this.t + 3.2 + this.rand() * 2;
      }
    }
  }

  /** Remate, atajada u ocasión de `side`: la hinchada se mete en el partido. */
  chance(side: CrowdSide) {
    const mine = this.st[side];
    mine.boost = Math.min(1, Math.max(mine.boost, 0.38));
  }

  /** Pitazo final: festeja el ganador, lamenta el perdedor, aplauden si fue empate. */
  fullTime(winner: CrowdSide | null) {
    if (winner) {
      const loser: CrowdSide = winner === "home" ? "away" : "home";
      this.st[winner].hold = 0.9;
      this.st[winner].boost = 1;
      this.st[loser].slumpHold = 0.75;
      this.st[loser].slump = 0.8;
      this.spawnPapers(winner, this.cfg.level >= 1 ? 90 : 50);
    } else {
      this.st.home.hold = 0.5;
      this.st.away.hold = 0.5;
    }
  }

  update(dtRaw: number) {
    const dt = Math.min(dtRaw, 0.05);
    this.t += dt;
    const t = this.t;
    const { level } = this.cfg;
    for (const side of ["home", "away"] as CrowdSide[]) {
      const s = this.st[side];
      s.boost = Math.max(0, s.boost - dt * 0.5);
      s.slump = Math.max(s.slumpHold, s.slump - dt * 0.45);
      s.flash = Math.max(0, s.flash - dt * 1.1);
      const base = BASE_ENERGY[level][side];
      const pulse = 0.08 * Math.sin(t * 1.6 + (side === "home" ? 0 : 1.3)) + 0.05 * Math.sin(t * 0.7);
      let target = base + pulse * (0.5 + base) + s.boost * (1.1 - base) - s.slump * base * 0.85;
      target = Math.max(target, s.hold);
      s.e += (clamp(target, 0, 1.15) - s.e) * Math.min(1, dt * 6);
    }
    this.wavePos = (t * 0.32) % 1.5;

    // Tifos: cuando se caen, la tribuna estalla.
    for (const sec of this.sectors) {
      if (!sec.tifoArt || sec.tifoDropped) continue;
      if (t > sec.tifoHold) {
        sec.tifoDropped = true;
        this.st[sec.side].boost = Math.max(this.st[sec.side].boost, 0.7);
        this.spawnPapers(sec.side, level >= 2 ? 50 : 30, sec);
      }
    }

    // Bengalas: se prenden, humean y se consumen.
    const lit: Record<CrowdSide, number> = { home: 0, away: 0 };
    const total: Record<CrowdSide, number> = { home: 0, away: 0 };
    for (const f of this.flares) {
      total[f.side] += 1;
      if (!f.lit && t >= f.litAt && f.until > t) f.lit = true;
      if (f.lit && t > f.until) f.lit = false;
      f.boost = Math.max(0, f.boost - dt * 0.5);
      if (!f.lit) continue;
      lit[f.side] += 1;
      f.emit += dt * (7 + f.boost * 9) * (0.4 + this.cfg.motion * 0.6);
      while (f.emit >= 1 && this.puffs.length < 240) {
        f.emit -= 1;
        this.puffs.push(this.newPuff(f));
      }
      if (f.emit >= 1) f.emit = 0;
    }
    for (const side of ["home", "away"] as CrowdSide[]) {
      const frac = total[side] ? lit[side] / total[side] : 0;
      const s = this.st[side];
      s.haze += (frac * 0.3 - s.haze) * Math.min(1, dt * 1.2);
    }

    const wind = 6 + 4 * Math.sin(t * 0.4);
    for (const p of this.puffs) {
      p.age += dt;
      p.x += (p.vx + wind * 0.4) * dt;
      p.y += p.vy * dt;
      p.size += p.grow * dt;
    }
    this.puffs = this.puffs.filter((p) => p.age < p.life);

    for (const p of this.papers) {
      p.age += dt;
      p.vy += 95 * dt;
      p.vx *= 1 - dt * 0.8;
      p.vy *= 1 - dt * 0.5;
      p.x += p.vx * dt + Math.sin(p.ph) * 6 * dt;
      p.y += p.vy * dt;
      p.ph += p.vph * dt;
    }
    this.papers = this.papers.filter((p) => p.age < p.life);
  }

  draw(ctx: CanvasRenderingContext2D) {
    const { W, H, pitch: P } = this;
    ctx.clearRect(0, 0, W, H);
    if (W < 10 || H < 10) return;

    // Fondo de las tribunas: todo menos la cancha.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.rect(P.x, P.y, P.w, P.h);
    ctx.fillStyle = "#0b0d11";
    ctx.fill("evenodd");
    ctx.restore();

    for (const sec of this.sectors) this.drawStandRows(ctx, sec);
    for (const sec of this.sectors) {
      const cover = this.tifoProgress(sec);
      if (cover < 0.995) this.drawFans(ctx, sec);
    }
    for (const sec of this.sectors) {
      if (this.tifoProgress(sec) < 0.9) this.drawFlags(ctx, sec);
    }
    for (const sec of this.sectors) if (sec.tifoArt) this.drawTifo(ctx, sec);
    this.drawHaze(ctx);
    for (const sec of this.sectors) this.drawRail(ctx, sec);
    this.drawSmoke(ctx);
    this.drawFlares(ctx);
    this.drawPapers(ctx);
    this.drawGoalFlash(ctx);
  }

  /* ---------------- Construcción ---------------- */

  private build() {
    const { W, H, pitch: P, cfg } = this;
    const R = STAND.rail;
    const rng = mulberry32(cfg.seed ^ 0x9e3779b9);
    const topH = P.y;
    const botY = P.y + P.h;
    const awayX0 = Math.round(W * 0.18);
    const awayX1 = Math.round(W * 0.82);

    const defs: Array<{ kind: SectorKind; side: CrowdSide; fan: Rect; rail: Rect; vertical: boolean }> = [
      {
        kind: "awayTop",
        side: "away",
        fan: { x: awayX0, y: 0, w: awayX1 - awayX0, h: Math.max(0, topH - R) },
        rail: { x: awayX0, y: topH - R, w: awayX1 - awayX0, h: R },
        vertical: false,
      },
      {
        kind: "homeTopL",
        side: "home",
        fan: { x: 0, y: 0, w: awayX0, h: Math.max(0, topH - R) },
        rail: { x: 0, y: topH - R, w: awayX0, h: R },
        vertical: false,
      },
      {
        kind: "homeTopR",
        side: "home",
        fan: { x: awayX1, y: 0, w: W - awayX1, h: Math.max(0, topH - R) },
        rail: { x: awayX1, y: topH - R, w: W - awayX1, h: R },
        vertical: false,
      },
      {
        kind: "homeBottom",
        side: "home",
        fan: { x: 0, y: botY + R, w: W, h: Math.max(0, H - botY - R) },
        rail: { x: 0, y: botY, w: W, h: R },
        vertical: false,
      },
      {
        kind: "homeLeft",
        side: "home",
        fan: { x: 0, y: P.y, w: Math.max(0, P.x - R), h: P.h },
        rail: { x: P.x - R, y: P.y, w: R, h: P.h },
        vertical: true,
      },
      {
        kind: "homeRight",
        side: "home",
        fan: { x: P.x + P.w + R, y: P.y, w: Math.max(0, W - (P.x + P.w) - R), h: P.h },
        rail: { x: P.x + P.w, y: P.y, w: R, h: P.h },
        vertical: true,
      },
    ];

    const homeFill = clamp(0.86 + (cfg.home.capacity - 8000) / 70000 * 0.13 + (cfg.level >= 1 ? 0.04 : 0), 0.84, 0.99);
    const awayFill = clamp(0.5 + cfg.away.prestige / 100 * 0.32 + (cfg.level >= 1 ? 0.06 : 0), 0.52, 0.9);
    const flagDensity = 0.1 + cfg.level * 0.06;

    this.sectors = defs.map((d) => {
      const palette = [...this.pal[d.side]];
      const sec: Sector = {
        ...d,
        palette,
        fans: [],
        shirtBuckets: palette.map(() => []),
        skinBuckets: SKINS.map(() => []),
        scarves: [],
        flags: [],
        railArt: null,
        tifoArt: null,
        tifoStart: 0,
        tifoHold: 0,
        tifoDropped: false,
      };
      const cols = Math.floor(d.fan.w / COL_W);
      const rows = Math.floor(d.fan.h / ROW_H);
      if (cols <= 0 || rows <= 0) return sec;
      const fill = d.side === "home" ? homeFill : awayFill;
      const weights = d.side === "home" ? [0.58, 0.22, 0.12, 0.08] : [0.62, 0.2, 0.1, 0.08];
      // Sector visitante: algunos huecos en bloque (butacas vacías entre las dos hinchadas).
      const gapCols = new Set<number>();
      if (d.side === "away") {
        const gaps = 2 + Math.floor(rng() * 2);
        for (let g = 0; g < gaps; g++) {
          const c0 = Math.floor(rng() * cols);
          const wdt = 1 + Math.floor(rng() * 3);
          for (let c = c0; c < Math.min(cols, c0 + wdt); c++) gapCols.add(c);
        }
      }
      const cw = d.fan.w / cols;
      const rh = d.fan.h / rows;
      // Filas de atrás hacia adelante: así las de adelante tapan a las de atrás.
      for (let r = 0; r < rows; r++) {
        const rr = d.kind === "homeBottom" || d.kind === "homeLeft" || d.kind === "homeRight" ? rows - 1 - r : r;
        const stagger = rr % 2 ? cw * 0.25 : -cw * 0.25;
        for (let c = 0; c < cols; c++) {
          if (gapCols.has(c) || rng() > fill) continue;
          const roll = rng();
          let ci = 0;
          let acc = 0;
          for (let k = 0; k < weights.length; k++) {
            acc += weights[k]!;
            if (roll <= acc) {
              ci = k;
              break;
            }
          }
          const fan: Fan = {
            x: d.fan.x + (c + 0.5) * cw + stagger,
            y: d.fan.y + (rr + 1) * rh - 0.6,
            ph: rng() * Math.PI * 2,
            jit: rng() * 2 - 1,
            ci,
            si: Math.floor(rng() * SKINS.length),
            scarf: rng() < (d.side === "away" ? 0.2 : 0.12),
            amp: 0.7 + rng() * 0.6,
            ox: 0,
            oy: 0,
            arm: 0,
          };
          fan.x = clamp(fan.x, d.fan.x + 2, d.fan.x + d.fan.w - 2);
          sec.fans.push(fan);
          sec.shirtBuckets[ci]!.push(fan);
          sec.skinBuckets[fan.si]!.push(fan);
          if (fan.scarf) sec.scarves.push(fan);
        }
      }
      // Banderas: con palo, sobre fans de las filas del fondo/medio.
      const nFlags = Math.round(cols * flagDensity * (d.vertical ? 0.55 : 1) * (d.side === "away" ? 1.25 : 1));
      const pool = sec.fans.filter((f) => f.ci <= 1);
      for (let i = 0; i < nFlags && pool.length; i++) {
        const fan = pool[Math.floor(rng() * pool.length)]!;
        sec.flags.push({
          fan,
          len: 10 + rng() * 5 + cfg.level * 2,
          w: 11 + rng() * 5 + cfg.level * 2,
          h: 6 + rng() * 2.5 + cfg.level,
          ph: rng() * Math.PI * 2,
          style: d.side === "home" ? "split" : "bands",
        });
      }
      return sec;
    });

    // Tifos: la popular local siempre (nivel ≥ 1) y, en clásicos y finales, también los visitantes.
    const home = this.sectors.find((s) => s.kind === "homeBottom");
    const away = this.sectors.find((s) => s.kind === "awayTop");
    if (cfg.level >= 1 && home && home.fan.h > 8) {
      home.tifoStart = 0.35;
      home.tifoHold = 5.4;
    }
    if (cfg.level >= 2 && away && away.fan.h > 8) {
      away.tifoStart = 0.8;
      away.tifoHold = 5.9;
    }

    for (const s of this.sectors) {
      s.railArt = this.makeRail(s);
      s.tifoArt = s.tifoHold > 0 ? this.makeTifo(s) : null;
    }

    // Bengalas.
    this.flares = [];
    if (cfg.level >= 1) {
      const nHome = cfg.level >= 2 ? 9 : 4;
      const nAway = cfg.level >= 2 ? 5 : 2;
      const homeSecs = this.sectors.filter((s) => s.side === "home" && s.fans.length > 6);
      const awaySecs = this.sectors.filter((s) => s.side === "away" && s.fans.length > 6);
      const place = (side: CrowdSide, secs: Sector[], n: number) => {
        if (!secs.length) return;
        const weight = secs.map((s) => s.fans.length);
        const sum = weight.reduce((a, b) => a + b, 0);
        const color = vivid(side === "home" ? this.pal.home[0]! : this.pal.away[0]!);
        for (let i = 0; i < n; i++) {
          let pick = rng() * sum;
          let sec = secs[0]!;
          for (let k = 0; k < secs.length; k++) {
            pick -= weight[k]!;
            if (pick <= 0) {
              sec = secs[k]!;
              break;
            }
          }
          const fan = sec.fans[Math.floor(rng() * sec.fans.length)]!;
          const litAt = (cfg.level >= 2 ? 0.5 : 1.0) + rng() * 1.4;
          this.flares.push({
            x: fan.x,
            y: fan.y - 6,
            side,
            // Algunas bengalas son blancas, como en las tribunas de verdad.
            color: rng() < 0.22 ? "#fff1d6" : color,
            litAt,
            lit: false,
            until: litAt + 6.5 + rng() * 2.5,
            boost: 0,
            emit: rng(),
            ph: rng() * 6.28,
          });
        }
      };
      place("home", homeSecs, nHome);
      place("away", awaySecs, nAway);
    }
  }

  /* ---------------- Arte pre-renderizado ---------------- */

  private canvas(w: number, h: number): HTMLCanvasElement | null {
    if (typeof document === "undefined" || w < 2 || h < 2) return null;
    const c = document.createElement("canvas");
    c.width = Math.ceil(w * this.dpr);
    c.height = Math.ceil(h * this.dpr);
    return c;
  }

  /** Vallado con los carteles del club (nombre, ciudad, sector) en sus colores. */
  private makeRail(sec: Sector): HTMLCanvasElement | null {
    const len = sec.vertical ? sec.rail.h : sec.rail.w;
    const R = STAND.rail;
    const c = this.canvas(len, R);
    if (!c) return null;
    const g = c.getContext("2d");
    if (!g) return null;
    g.scale(this.dpr, this.dpr);
    g.fillStyle = "#0e1015";
    g.fillRect(0, 0, len, R);
    const club = sec.side === "home" ? this.cfg.home : this.cfg.away;
    const [c1, c2] = [sec.palette[0]!, sec.palette[1]!];
    type Item = { text: string[]; share: number };
    let items: Item[];
    switch (sec.kind) {
      case "homeBottom":
        items = [
          { text: [club.name, club.short], share: 0.42 },
          { text: [club.city, club.short], share: 0.25 },
          { text: ["POPULAR LOCAL", "LOCAL"], share: 0.33 },
        ];
        break;
      case "awayTop":
        items = [
          { text: [club.name, club.short], share: 0.58 },
          { text: ["SECTOR VISITANTE", "VISITANTE"], share: 0.42 },
        ];
        break;
      case "homeLeft":
      case "homeRight":
        items = [
          { text: [club.short], share: 0.5 },
          { text: [club.city, club.short], share: 0.5 },
        ];
        break;
      default:
        items = len > 46 ? [{ text: [club.short], share: 1 }] : [{ text: [""], share: 1 }];
    }
    const gap = 3;
    const usable = len - gap * (items.length + 1);
    let x = gap;
    items.forEach((it, i) => {
      const w = usable * it.share;
      const a = i % 2 ? c2 : c1;
      const b = i % 2 ? c1 : c2;
      this.paintBanner(g, x, 1, w, R - 2, a, b, it.text);
      x += w + gap;
    });
    // Luz de la competición sobre el borde que da a la cancha.
    g.fillStyle = rgba(this.cfg.accent, 0.8);
    const pitchBelow = sec.kind === "awayTop" || sec.kind === "homeTopL" || sec.kind === "homeTopR";
    g.fillRect(0, pitchBelow ? R - 1.5 : 0, len, 1.5);
    return c;
  }

  private paintBanner(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, a: string, b: string, texts: string[]) {
    const grad = g.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, a);
    grad.addColorStop(0.5, a);
    grad.addColorStop(0.5, b);
    grad.addColorStop(1, b);
    g.fillStyle = grad;
    g.fillRect(x, y, w, h);
    g.strokeStyle = "rgba(0,0,0,0.55)";
    g.lineWidth = 1;
    g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    // Líneas verticales de pliegue de la tela.
    g.fillStyle = "rgba(0,0,0,0.12)";
    for (let fx = x + 9; fx < x + w - 2; fx += 11) g.fillRect(fx, y, 1, h);
    const label = texts.map((s) => s.toUpperCase());
    for (const text of label) {
      if (!text) return;
      let size = h - 3;
      g.font = `700 ${size}px ${FONT}`;
      while (g.measureText(text).width > w - 6 && size > 6) {
        size -= 0.5;
        g.font = `700 ${size}px ${FONT}`;
      }
      if (g.measureText(text).width > w - 4) continue;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.lineJoin = "round";
      g.lineWidth = 2.2;
      g.strokeStyle = "rgba(0,0,0,0.7)";
      g.strokeText(text, x + w / 2, y + h / 2 + 0.5);
      g.fillStyle = "#fffaf0";
      g.fillText(text, x + w / 2, y + h / 2 + 0.5);
      return;
    }
  }

  /** Tela gigante (tifo) con los colores y el nombre del club; el diseño sale de la semilla. */
  private makeTifo(sec: Sector): HTMLCanvasElement | null {
    if (sec.tifoHold <= 0) return null;
    const { w, h } = sec.fan;
    const c = this.canvas(w, h);
    if (!c) return null;
    const g = c.getContext("2d");
    if (!g) return null;
    g.scale(this.dpr, this.dpr);
    const club = sec.side === "home" ? this.cfg.home : this.cfg.away;
    const [c1, c2] = [sec.palette[0]!, sec.palette[1]!];
    const design = (this.cfg.seed + (sec.side === "home" ? 0 : 1)) % 3;
    const text = (s: string, x: number, y: number, size: number) => {
      g.font = `700 ${size}px ${FONT}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.lineJoin = "round";
      g.lineWidth = Math.max(2, size * 0.14);
      g.strokeStyle = "rgba(0,0,0,0.75)";
      g.strokeText(s, x, y);
      g.fillStyle = "#fffaf0";
      g.fillText(s, x, y);
    };
    const fit = (s: string, maxW: number, maxSize: number) => {
      let size = maxSize;
      g.font = `700 ${size}px ${FONT}`;
      while (g.measureText(s).width > maxW && size > 8) {
        size -= 1;
        g.font = `700 ${size}px ${FONT}`;
      }
      return size;
    };
    if (design === 0) {
      // Escudo partido en diagonal, como el de la ficha del club.
      const grad = g.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, c1);
      grad.addColorStop(0.5, c1);
      grad.addColorStop(0.5, c2);
      grad.addColorStop(1, c2);
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(0,0,0,0.28)";
      g.beginPath();
      g.arc(w / 2, h / 2, h * 0.46, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = "rgba(255,250,240,0.85)";
      g.stroke();
      const s = club.short.toUpperCase();
      text(s, w / 2, h / 2 + 1, Math.min(h * 0.72, fit(s, h * 0.8, h * 0.72)));
    } else if (design === 1) {
      // Franjas verticales y un cartel en el medio.
      const n = Math.max(6, Math.round(w / 22));
      for (let i = 0; i < n; i++) {
        g.fillStyle = i % 2 ? c2 : c1;
        g.fillRect((i * w) / n, 0, w / n + 1, h);
      }
      g.fillStyle = "rgba(0,0,0,0.55)";
      const pw = Math.min(w * 0.7, 220);
      g.fillRect(w / 2 - pw / 2, h * 0.16, pw, h * 0.68);
      const s = club.name.toUpperCase();
      text(s, w / 2, h / 2 + 1, fit(s, pw - 12, h * 0.55));
    } else {
      // Dos mitades horizontales y el nombre atravesando la tela.
      g.fillStyle = c1;
      g.fillRect(0, 0, w, h / 2);
      g.fillStyle = c2;
      g.fillRect(0, h / 2, w, h / 2);
      g.fillStyle = "rgba(255,250,240,0.9)";
      g.fillRect(0, h / 2 - 1, w, 2);
      const s = (sec.side === "home" ? club.city : club.short).toUpperCase();
      text(s, w / 2, h / 2 + 1, fit(s, w * 0.8, h * 0.78));
    }
    // Pliegues y sombra de la tela.
    g.fillStyle = "rgba(0,0,0,0.1)";
    for (let fx = 8; fx < w; fx += 14) g.fillRect(fx, 0, 1.2, h);
    const shade = g.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0, "rgba(0,0,0,0.25)");
    shade.addColorStop(0.5, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(0,0,0,0.25)");
    g.fillStyle = shade;
    g.fillRect(0, 0, w, h);
    return c;
  }

  private puffSprite(tint: string): HTMLCanvasElement | null {
    const hit = this.puffSprites.get(tint);
    if (hit) return hit;
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    if (!g) return null;
    const r = mulberry32(this.cfg.seed ^ 0x1234);
    for (let i = 0; i < 6; i++) {
      const x = 32 + (r() - 0.5) * 18;
      const y = 32 + (r() - 0.5) * 18;
      const rad = 14 + r() * 10;
      const grad = g.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, rgba(tint, 0.5));
      grad.addColorStop(1, rgba(tint, 0));
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
    }
    this.puffSprites.set(tint, c);
    return c;
  }

  private glowSprite(color: string): HTMLCanvasElement | null {
    const hit = this.glowSprites.get(color);
    if (hit) return hit;
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    if (!g) return null;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,0.95)");
    grad.addColorStop(0.18, rgba(color, 0.85));
    grad.addColorStop(0.55, rgba(color, 0.25));
    grad.addColorStop(1, rgba(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    this.glowSprites.set(color, c);
    return c;
  }

  /* ---------------- Partículas ---------------- */

  private newPuff(f: Flare): Puff {
    const r = this.rand;
    const m = this.cfg.motion;
    return {
      x: f.x + (r() - 0.5) * 3,
      y: f.y - 2,
      vx: (r() - 0.5) * 8,
      vy: -(9 + r() * 12) * (0.6 + m * 0.4),
      age: 0,
      life: 2.2 + r() * 1.6,
      size: 7 + r() * 5,
      grow: 12 + r() * 10,
      alpha: 0.26 + r() * 0.1,
      tint: mix(f.color, "#9a9aa2", 0.5),
    };
  }

  private spawnPapers(side: CrowdSide, n: number, only?: Sector) {
    const secs = only ? [only] : this.sectors.filter((s) => s.side === side && s.fan.w > 6 && s.fan.h > 6);
    if (!secs.length) return;
    const pal = this.pal[side];
    const colors = [pal[0]!, pal[1]!, "#fffaf0"];
    const count = Math.round(n * (0.4 + this.cfg.motion * 0.6));
    for (let i = 0; i < count && this.papers.length < 220; i++) {
      const sec = secs[Math.floor(this.rand() * secs.length)]!;
      const r = this.rand;
      this.papers.push({
        x: sec.fan.x + r() * sec.fan.w,
        y: sec.fan.y + r() * sec.fan.h,
        vx: (r() - 0.5) * 50,
        vy: -(40 + r() * 80),
        ph: r() * 6.28,
        vph: 5 + r() * 8,
        age: 0,
        life: 1.5 + r() * 1.1,
        color: colors[Math.floor(r() * colors.length)]!,
      });
    }
  }

  /* ---------------- Dibujo ---------------- */

  private tifoProgress(sec: Sector): number {
    if (!sec.tifoArt) return 0;
    const t = this.t;
    const up = 1.5;
    const drop = 0.85;
    if (t < sec.tifoStart) return 0;
    if (t < sec.tifoStart + up) return ease((t - sec.tifoStart) / up);
    if (t < sec.tifoHold) return 1;
    if (t < sec.tifoHold + drop) return 1 - ease((t - sec.tifoHold) / drop);
    return 0;
  }

  private drawStandRows(ctx: CanvasRenderingContext2D, sec: Sector) {
    const { fan } = sec;
    if (fan.w <= 0 || fan.h <= 0) return;
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    const rows = Math.floor(fan.h / ROW_H);
    if (!rows) return;
    const rh = fan.h / rows;
    for (let r = 1; r < rows; r++) ctx.fillRect(fan.x, fan.y + r * rh - 0.4, fan.w, 0.8);
  }

  private drawFans(ctx: CanvasRenderingContext2D, sec: Sector) {
    if (!sec.fans.length) return;
    const t = this.t;
    const m = this.cfg.motion;
    const e = this.st[sec.side].e;
    const slump = this.st[sec.side].slump;
    const home = sec.side === "home";
    const omega = Math.PI * 2 * (home ? 2.3 : 1.6) * (0.75 + 0.5 * e);
    const sync = clamp(1.7 - 1.3 * Math.min(1, e), 0.2, 1.7);
    const wave = this.cfg.level >= 1 && home ? 1 : 0;
    const waveX = this.wavePos * (this.W + 120) - 60;
    const armsOn = e > 0.42 && slump < 0.5;
    const armLen = armsOn ? ((e - 0.42) / 0.7) * 3.4 : 0;

    for (const f of sec.fans) {
      const phase = home ? f.jit * Math.PI * sync : f.ph;
      let bob = Math.max(0, Math.sin(omega * t + phase));
      if (wave) {
        const d = (f.x - waveX) / 34;
        bob = Math.max(bob, 0.9 * Math.exp(-d * d) * 0.9);
      }
      const lift = bob * (0.5 + 4.4 * e) * f.amp * m * (1 - clamp(slump, 0, 1) * 0.85);
      f.oy = -lift + clamp(slump, 0, 1) * 0.9;
      f.ox = home ? 0 : Math.sin(t * 1.3 + f.ph) * 0.5 * (0.4 + e) * m;
      f.arm = armLen * (0.4 + 0.6 * bob) * (e > 0.9 ? 1.05 : 1);
    }

    // Camisetas.
    for (let ci = 0; ci < sec.shirtBuckets.length; ci++) {
      const list = sec.shirtBuckets[ci]!;
      if (!list.length) continue;
      ctx.fillStyle = sec.palette[ci]!;
      ctx.beginPath();
      for (const f of list) ctx.rect(f.x + f.ox - 2.3, f.y + f.oy - 3.2, 4.6, 3.2);
      ctx.fill();
      if (armLen > 0.2) {
        ctx.beginPath();
        for (const f of list) {
          const a = f.arm;
          if (a < 0.3) continue;
          ctx.rect(f.x + f.ox - 3.6, f.y + f.oy - 3.2 - a, 1.2, a + 1.6);
          ctx.rect(f.x + f.ox + 2.4, f.y + f.oy - 3.2 - a, 1.2, a + 1.6);
        }
        ctx.fill();
      }
    }
    // Cabezas.
    for (let si = 0; si < sec.skinBuckets.length; si++) {
      const list = sec.skinBuckets[si]!;
      if (!list.length) continue;
      ctx.fillStyle = SKINS[si]!;
      ctx.beginPath();
      for (const f of list) {
        const hx = f.x + f.ox;
        const hy = f.y + f.oy - 5 + (slump > 0.5 ? 0.6 : 0);
        ctx.moveTo(hx + 1.75, hy);
        ctx.arc(hx, hy, 1.75, 0, Math.PI * 2);
      }
      ctx.fill();
    }
    // Bufandas en alto.
    if (sec.scarves.length && e > 0.25 && slump < 0.6) {
      ctx.strokeStyle = sec.palette[1]!;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      for (const f of sec.scarves) {
        const tilt = Math.sin(t * (2.2 + e * 2) + f.ph) * (1.2 + 1.6 * e) * m;
        const y = f.y + f.oy - 8.4 - f.arm * 0.4;
        ctx.moveTo(f.x + f.ox - 4.2, y + tilt);
        ctx.lineTo(f.x + f.ox + 4.2, y - tilt);
      }
      ctx.stroke();
    }
  }

  private drawFlags(ctx: CanvasRenderingContext2D, sec: Sector) {
    if (!sec.flags.length) return;
    const t = this.t;
    const m = this.cfg.motion;
    const e = this.st[sec.side].e;
    const [c1, c2] = [sec.palette[0]!, sec.palette[1]!];
    const N = 6;
    ctx.lineCap = "round";
    for (const fl of sec.flags) {
      const baseX = fl.fan.x + fl.fan.ox;
      const baseY = fl.fan.y + fl.fan.oy - 3;
      const sway = Math.sin(t * 1.3 + fl.ph) * (0.8 + 3.2 * e) * m;
      const topX = baseX + sway;
      const topY = baseY - fl.len;
      ctx.strokeStyle = "#cfc7b6";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.lineTo(topX, topY);
      ctx.stroke();
      const waveAt = (u: number) => Math.sin(t * (3 + 4 * e) - u * 3 + fl.ph) * (0.6 + 2.2 * e) * u * m;
      const poly = (i0: number, i1: number, v0: number, v1: number, fill: string) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        for (let i = i0; i <= i1; i++) {
          const u = i / N;
          const x = topX + u * fl.w;
          const y = topY + waveAt(u) + v0 * fl.h;
          if (i === i0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        for (let i = i1; i >= i0; i--) {
          const u = i / N;
          ctx.lineTo(topX + u * fl.w, topY + waveAt(u) + v1 * fl.h);
        }
        ctx.closePath();
        ctx.fill();
      };
      if (fl.style === "split") {
        poly(0, N / 2, 0, 1, c1);
        poly(N / 2, N, 0, 1, c2);
      } else {
        poly(0, N, 0, 1 / 3, c1);
        poly(0, N, 1 / 3, 2 / 3, c2);
        poly(0, N, 2 / 3, 1, c1);
      }
    }
  }

  private drawTifo(ctx: CanvasRenderingContext2D, sec: Sector) {
    const p = this.tifoProgress(sec);
    if (p <= 0.001 || !sec.tifoArt) return;
    const { fan } = sec;
    const m = this.cfg.motion;
    const vis = p * fan.h;
    const fromBottom = sec.kind === "homeBottom";
    const y0 = fromBottom ? fan.y + fan.h - vis : fan.y;
    ctx.save();
    ctx.beginPath();
    ctx.rect(fan.x, y0, fan.w, vis);
    ctx.clip();
    const sw = 5;
    for (let sx = 0; sx < fan.w; sx += sw) {
      const w = Math.min(sw, fan.w - sx);
      const off = Math.sin(this.t * 2.1 + sx * 0.045) * 1.1 * m * (0.5 + 0.5 * this.st[sec.side].e);
      ctx.drawImage(sec.tifoArt, sx * this.dpr, 0, w * this.dpr, fan.h * this.dpr, fan.x + sx, fan.y + off, w, fan.h);
    }
    ctx.restore();
    // Borde de la tela al desplegarse.
    if (p < 0.999) {
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(fan.x, fromBottom ? y0 - 1.5 : y0 + vis - 0.5, fan.w, 2);
    }
  }

  private drawHaze(ctx: CanvasRenderingContext2D) {
    for (const side of ["home", "away"] as CrowdSide[]) {
      const a = this.st[side].haze;
      if (a < 0.01) continue;
      const tint = mix(vivid(this.pal[side][0]!), "#b8b8c0", 0.55);
      ctx.fillStyle = rgba(tint, a);
      for (const sec of this.sectors) {
        if (sec.side !== side || sec.fan.w <= 0) continue;
        ctx.fillRect(sec.fan.x, sec.fan.y, sec.fan.w, sec.fan.h);
      }
    }
  }

  private drawRail(ctx: CanvasRenderingContext2D, sec: Sector) {
    if (!sec.railArt) return;
    const { rail } = sec;
    const st = this.st[sec.side];
    const shake = st.flash > 0.05 ? Math.sin(this.t * 38) * 0.7 * st.flash * this.cfg.motion : 0;
    ctx.save();
    if (sec.vertical) {
      // El arte del vallado es horizontal (u = largo, v = grosor, v = 0 pegado a la cancha): se gira para los laterales.
      if (sec.kind === "homeLeft") {
        ctx.translate(rail.x + rail.w + shake, rail.y);
        ctx.rotate(Math.PI / 2);
      } else {
        ctx.translate(rail.x - shake, rail.y + rail.h);
        ctx.rotate(-Math.PI / 2);
      }
      ctx.drawImage(sec.railArt, 0, 0, rail.h, STAND.rail);
    } else {
      ctx.drawImage(sec.railArt, rail.x, rail.y + shake, rail.w, rail.h);
    }
    ctx.restore();
    if (st.flash > 0.05) {
      ctx.fillStyle = `rgba(255,250,240,${0.22 * st.flash})`;
      ctx.fillRect(rail.x, rail.y, rail.w, rail.h);
    }
  }

  private drawSmoke(ctx: CanvasRenderingContext2D) {
    for (const p of this.puffs) {
      const sprite = this.puffSprite(p.tint);
      if (!sprite) continue;
      const k = p.age / p.life;
      const a = p.alpha * Math.pow(1 - k, 1.2) * Math.min(1, p.age / 0.18) * (0.5 + this.cfg.motion * 0.5);
      if (a < 0.005) continue;
      ctx.globalAlpha = a;
      ctx.drawImage(sprite, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
    }
    ctx.globalAlpha = 1;
  }

  private drawFlares(ctx: CanvasRenderingContext2D) {
    const t = this.t;
    for (const f of this.flares) {
      if (!f.lit) continue;
      const fade = clamp((f.until - t) / 0.8, 0, 1) * clamp((t - f.litAt) / 0.15, 0, 1);
      // Palito de la bengala.
      ctx.fillStyle = "#d8d0c0";
      ctx.fillRect(f.x - 0.5, f.y, 1, 6);
      const flick = 0.78 + 0.22 * Math.sin(t * 31 + f.ph) * Math.sin(t * 17 + f.ph * 2);
      const glow = this.glowSprite(f.color);
      if (!glow) continue;
      const r = (13 + 9 * f.boost) * flick;
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.85 * fade;
      ctx.drawImage(glow, f.x - r, f.y - r, r * 2, r * 2);
      // Resplandor grande sobre la tribuna.
      ctx.globalAlpha = 0.28 * fade * flick;
      ctx.drawImage(glow, f.x - r * 2.6, f.y - r * 2.6, r * 5.2, r * 5.2);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = fade;
      ctx.fillStyle = "#fffdf4";
      ctx.beginPath();
      ctx.arc(f.x, f.y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawPapers(ctx: CanvasRenderingContext2D) {
    for (const p of this.papers) {
      const k = p.age / p.life;
      ctx.globalAlpha = clamp(1.4 - k * 1.4, 0, 1);
      ctx.fillStyle = p.color;
      const w = Math.abs(Math.cos(p.ph)) * 3.2 + 0.6;
      ctx.fillRect(p.x - w / 2, p.y, w, 2.4);
    }
    ctx.globalAlpha = 1;
  }

  /** Luz del vallado en el color del equipo que hizo el gol. */
  private drawGoalFlash(ctx: CanvasRenderingContext2D) {
    const P = this.pitch;
    for (const side of ["home", "away"] as CrowdSide[]) {
      const fl = this.st[side].flash;
      if (fl < 0.03) continue;
      const col = vivid(this.pal[side][0]!);
      ctx.lineJoin = "round";
      ctx.strokeStyle = rgba(col, 0.28 * fl);
      ctx.lineWidth = 8;
      ctx.strokeRect(P.x, P.y, P.w, P.h);
      ctx.strokeStyle = rgba(col, 0.9 * fl);
      ctx.lineWidth = 2;
      ctx.strokeRect(P.x + 1, P.y + 1, P.w - 2, P.h - 2);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Paletas                                                             */
/* ------------------------------------------------------------------ */

/** Colores de cada hinchada. Si los dos clubes se parecen, la visitante pasa a su color alternativo. */
function resolvePalettes(home: CrowdClub, away: CrowdClub): Record<CrowdSide, string[]> {
  const h1 = legible(home.color);
  const h2 = legible(home.color2);
  let a1 = legible(away.color);
  let a2 = legible(away.color2);
  const CLOSE = 95;
  if (dist(a1, h1) < CLOSE) {
    if (dist(a2, h1) >= CLOSE) [a1, a2] = [a2, a1];
    else {
      a1 = lum(h1) > 0.5 ? "#3a4252" : "#efe9dc";
      if (dist(a2, h1) < CLOSE || dist(a2, a1) < CLOSE) a2 = lum(a1) > 0.5 ? "#c81c2e" : "#e9c46a";
    }
  }
  if (dist(a2, a1) < 40) a2 = lum(a1) > 0.5 ? "#2b2f38" : "#efe9dc";
  const h2b = dist(h2, h1) < 40 ? (lum(h1) > 0.5 ? "#2b2f38" : "#efe9dc") : h2;
  return {
    home: [h1, h2b, PAPER_WHITE, PAPER_DARK],
    away: [a1, a2, PAPER_WHITE, PAPER_DARK],
  };
}
