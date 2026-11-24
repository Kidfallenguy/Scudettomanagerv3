import { posGroup } from "./format";
import { isUnavailable } from "./tactics";
import { kickText, refreshFinalEvent, shootoutTakers, shootoutWinner } from "./knockout";
import { Rng } from "./rng";
import { computeRatings } from "./sim";
import type { MatchEvent, MatchResult, MatchStats, Mentality, Player, ShootoutKick } from "./types";

/**
 * Partido "jugado" (Ver el partido): avanza minuto a minuto y, cuando el equipo del usuario tiene una
 * jugada importante (o el rival le ataca), devuelve una `Situation` para que el usuario decida.
 * El motor no toca el save: al terminar entrega un `MatchResult` que se aplica con `simSlot(save, result)`.
 * "Simular resultado" no pasa por acá.
 */

export type Side = "home" | "away";
/** "keeper": penal en contra, el usuario elige hacia dónde se tira su arquero. */
export type ThreatKind = "chance" | "freekick" | "penalty" | "oneOnOne" | "through" | "cross";
export type SituationKind = ThreatKind | "defense" | "keeper";

export interface Situation {
  kind: SituationKind;
  minute: number;
  /** Quién ataca en la jugada. */
  attacker: Side;
  userAttacks: boolean;
  title: string;
  prompt: string;
  /** Protagonista: tirador, pasador, centrador o defensor del usuario. */
  actor: Player;
  /** Receptor del pase, cabeceador del centro o delantero rival (en defensa). */
  target?: Player;
  keeper?: Player;
  assist?: Player;
  /** Solo en "defense": qué intenta el rival. */
  threat?: ThreatKind;
  /** Dificultad extra del tiro (+ más difícil, − más fácil). */
  miss?: number;
  save?: number;
  headed?: boolean;
}

export type LiveInput =
  | { type: "shot"; col: 0 | 1 | 2; row: 0 | 1; power: number }
  | { type: "through"; lane: 0 | 1 | 2; timing: number }
  | { type: "cross"; zone: 0 | 1 | 2; power: number }
  | { type: "oneOnOne"; choice: "dribble" | "chip" | "shot" }
  | { type: "defense"; choice: "intercept" | "press" | "tackle" }
  | { type: "dive"; dir: 0 | 1 | 2 };

export interface Outcome {
  /** Visto desde el equipo del usuario. */
  tone: "good" | "bad" | "neutral";
  goal: boolean;
  label: string;
  text: string;
  followUp?: Situation;
}

export interface FeedLine {
  minute: number;
  text: string;
  tone: "good" | "bad" | "neutral";
}

export interface StepResult {
  ambient?: string;
  situation?: Situation;
  outcome?: Outcome;
}

export interface LiveCtx {
  fixtureId: string;
  homeId: string;
  awayId: string;
  homeShort: string;
  awayShort: string;
  stadium: string;
  players: Player[];
  homeLineup: string[];
  awayLineup: string[];
  homeBench?: string[];
  awayBench?: string[];
  userSide: Side;
  /** GRL de equipo (ya con bonus de sucesos para el usuario). */
  homeGrl: number;
  awayGrl: number;
  userMentality: Mentality;
  seed: number;
  /**
   * Eliminatoria que tiene que dar ganador: goles que cada lado ya trae de la ida (0–0 en partido único).
   * Si está, un empate global se juega con prórroga y tanda de penales. Sin él (liga, grupos) el empate vale.
   */
  carry?: { home: number; away: number } | null;
}

/** Cambios máximos por equipo (los forzados por lesión o expulsión cuentan igual). */
const MAX_SUBS = 5;

/**
 * Sucesos de GRL: además de las jugadas normales, en cada partido pasan cosas que dependen de la diferencia de
 * GRL entre los dos equipos (penales, errores del arquero, goles inevitables). Si los GRL son parejos, los sucesos
 * se reparten 50/50 y no hay goles inevitables; cuanto más grande la diferencia, más se inclinan hacia el mejor
 * equipo (sea el tuyo o el rival). Tocá estos números para hacer el juego más fácil o más difícil.
 */
const FATE = {
  /** Probabilidad por minuto de que ocurra un suceso (≈ 1,4 por partido). */
  perMinute: 0.015,
  /** Puntos de GRL para inclinar la balanza (más bajo = el favorito se lleva casi todos los sucesos). */
  slope: 7,
  /** Diferencia de GRL a partir de la cual el favorito está "a tope" (sucesos de máxima intensidad). */
  fullEdge: 14,
  /** Goles inevitables máximos por equipo y partido. */
  maxUnstoppable: 2,
};

/** Estado de la tanda de penales. */
export interface ShootoutRun {
  first: Side;
  next: Side;
  takers: Record<Side, Player[]>;
  taken: Record<Side, number>;
  score: Record<Side, number>;
  /** Cada penal ejecutado (true = gol), por lado, para dibujar la tanda. */
  marks: Record<Side, boolean[]>;
  kicks: ShootoutKick[];
  winner: Side | null;
}

const MENTALITY_MOD: Record<Mentality, { atk: number; def: number }> = {
  defensive: { atk: 0.88, def: 1.12 },
  balanced: { atk: 1, def: 1 },
  attacking: { atk: 1.14, def: 0.9 },
};

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const lastName = (name: string) => name.trim().split(/\s+/).pop() ?? name;
/** Forma y estado físico mueven la habilidad efectiva (−5..5 de forma, 40..100 de físico). */
const eff = (p: Player, v: number) => v + p.form * 1.2 + (p.fitness - 85) * 0.12;
const OUT = (p: Player) => p.pos !== "GK";

export function gkSkill(gk: Player | undefined): number {
  if (!gk) return 60;
  if (!gk.gk) return eff(gk, gk.ovr * 0.75);
  return eff(gk, ((gk.gk.div + gk.gk.ref + gk.gk.pos) / 3) * 0.85 + gk.gk.han * 0.15);
}

export class LiveEngine {
  readonly ctx: LiveCtx;
  readonly rng: Rng;
  minute = 0;
  goals: Record<Side, number> = { home: 0, away: 0 };
  /** "et" = pausa antes de la prórroga; "pens" = tanda de penales. */
  status: "playing" | "ht" | "ft" | "et" | "pens" = "playing";
  /** Ya se está jugando la prórroga (minutos 91 a 120). */
  inExtra = false;
  events: MatchEvent[] = [];
  feed: FeedLine[] = [];
  private stats: Record<Side, { shots: number; onTarget: number; corners: number; yellows: number; reds: number }> = {
    home: { shots: 0, onTarget: 0, corners: 0, yellows: 0, reds: 0 },
    away: { shots: 0, onTarget: 0, corners: 0, yellows: 0, reds: 0 },
  };
  private pitch: Record<Side, Player[]>;
  private rate: Record<Side, number> = { home: 0.06, away: 0.06 };
  private baseRate: Record<Side, number>;
  private benchPool: Record<Side, Player[]>;
  private subsIn: Record<Side, string[]> = { home: [], away: [] };
  private yellowsOf = new Map<string, number>();
  private hurt = new Set<string>();
  private sh: ShootoutRun | null = null;
  /** Ventaja de GRL de cada lado sobre el otro (positivo = es el mejor equipo). */
  private edge: Record<Side, number>;
  private unstoppable: Record<Side, number> = { home: 0, away: 0 };
  private htDone = false;
  private ended = false;

  constructor(ctx: LiveCtx) {
    this.ctx = ctx;
    this.rng = new Rng(ctx.seed);
    const byId = (id: string) => ctx.players.find((p) => p.id === id);
    const xi = (ids: string[]) => ids.map(byId).filter((p): p is Player => Boolean(p));
    this.pitch = { home: xi(ctx.homeLineup), away: xi(ctx.awayLineup) };

    const qH = Math.max(52, ctx.homeGrl + 1.8);
    const qA = Math.max(52, ctx.awayGrl);
    const ratio = qH / qA;
    this.edge = { home: clamp(qH - qA, -30, 30), away: clamp(qA - qH, -30, 30) };
    const user = MENTALITY_MOD[ctx.userMentality];
    const homeMod = ctx.userSide === "home" ? user.atk / 1 : 1 / user.def;
    const awayMod = ctx.userSide === "away" ? user.atk / 1 : 1 / user.def;
    this.baseRate = {
      home: clamp(0.064 * Math.pow(ratio, 0.9) * homeMod, 0.026, 0.12),
      away: clamp(0.06 * Math.pow(1 / ratio, 0.9) * awayMod, 0.022, 0.115),
    };
    const bench = (ids: string[] | undefined, lineup: string[]) =>
      (ids ?? [])
        .map(byId)
        .filter((p): p is Player => Boolean(p) && !lineup.includes(p!.id) && !isUnavailable(p!));
    this.benchPool = { home: bench(ctx.homeBench, ctx.homeLineup), away: bench(ctx.awayBench, ctx.awayLineup) };
    this.refreshRates();
    this.events.push({ minute: 0, type: "kickoff", text: `Arranca el partido en ${ctx.stadium}.` });
    this.feed.push({ minute: 0, text: `Arranca el partido en ${ctx.stadium}.`, tone: "neutral" });
  }

  get user(): Side {
    return this.ctx.userSide;
  }
  private other(s: Side): Side {
    return s === "home" ? "away" : "home";
  }
  private short(s: Side) {
    return s === "home" ? this.ctx.homeShort : this.ctx.awayShort;
  }
  private clubId(s: Side) {
    return s === "home" ? this.ctx.homeId : this.ctx.awayId;
  }
  get score() {
    return this.goals;
  }
  get shots() {
    return { home: this.stats.home.shots, away: this.stats.away.shots };
  }
  get cards() {
    return {
      yellows: { home: this.stats.home.yellows, away: this.stats.away.yellows },
      reds: { home: this.stats.home.reds, away: this.stats.away.reds },
    };
  }
  /** Jugadores en cancha de cada lado (baja con las rojas y las lesiones sin cambio). */
  get onPitch() {
    return { home: this.pitch.home.length, away: this.pitch.away.length };
  }

  /** Con uno menos se ataca menos y se sufre más. */
  private refreshRates() {
    const f = (s: Side) => Math.pow(Math.max(1, this.pitch[s].length) / 11, 1.5);
    const h = f("home");
    const a = f("away");
    this.rate = {
      home: clamp(this.baseRate.home * h * Math.pow(1 / a, 0.5), 0.015, 0.16),
      away: clamp(this.baseRate.away * a * Math.pow(1 / h, 0.5), 0.012, 0.15),
    };
  }

  // ---------- Selección de protagonistas ----------

  private pickWeighted(list: Player[], w: (p: Player) => number): Player {
    const ws = list.map((p) => Math.max(1, w(p)));
    const total = ws.reduce((s, x) => s + x, 0);
    let roll = this.rng.float() * total;
    for (let i = 0; i < list.length; i++) {
      roll -= ws[i]!;
      if (roll <= 0) return list[i]!;
    }
    return list[0]!;
  }
  private group(side: Side, pos: string[]): Player[] {
    const g = this.pitch[side].filter((p) => pos.includes(p.pos));
    return g.length ? g : this.pitch[side].filter(OUT);
  }
  /** La lista sin ese jugador (si era el único, se queda como está: con diez o menos hay que usar a quien haya). */
  private without(list: Player[], id: string): Player[] {
    const rest = list.filter((p) => p.id !== id);
    return rest.length ? rest : list;
  }
  private keeperOf(side: Side): Player {
    return this.pitch[side].find((p) => p.pos === "GK") ?? this.pitch[side][0]!;
  }
  private shooter(side: Side): Player {
    return this.pickWeighted(this.group(side, ["ST", "LW", "RW", "CAM"]), (p) => Math.pow(Math.max(10, p.attrs.sho + p.form * 2), 2.4));
  }
  private defender(side: Side): Player {
    return this.pickWeighted(this.group(side, ["CB", "LB", "RB", "CDM"]), (p) => p.attrs.def);
  }
  private defLine(side: Side): number {
    const d = this.group(side, ["CB", "LB", "RB", "CDM"]);
    return d.reduce((s, p) => s + eff(p, p.attrs.def * 0.6 + p.attrs.pac * 0.15 + p.attrs.phy * 0.25), 0) / d.length;
  }

  // ---------- Núcleo del tiro ----------

  private rollShot(
    shooter: Player,
    gk: Player,
    col: number,
    row: number,
    power: number,
    mods: {
      miss?: number;
      save?: number;
      headed?: boolean;
      penalty?: boolean;
      /** Ventaja de GRL del que patea: el mejor equipo define mejor y al flojo le cuesta más atajar. */
      edge?: number;
      /** Lado al que se tira el arquero (si lo elige el usuario). Si no viene, adivina solo. */
      guess?: number;
    },
  ): "goal" | "save" | "wide" | "post" | "bar" {
    const edge = clamp(mods.edge ?? 0, -20, 20);
    const skill = mods.headed
      ? eff(shooter, shooter.attrs.sho * 0.5 + shooter.attrs.phy * 0.4 + shooter.attrs.pac * 0.1)
      : eff(shooter, shooter.attrs.sho * 0.85 + shooter.attrs.dri * 0.15);
    const cornerTop = row === 0 && col !== 1;
    const centerTop = row === 0 && col === 1;
    const cornerLow = row === 1 && col !== 1;
    let miss = 0.33 - (skill - 60) * 0.004 + (mods.miss ?? 0) - edge * 0.0016;
    miss += cornerTop ? 0.14 : centerTop ? 0.05 : cornerLow ? 0.04 : 0;
    miss += power > 93 ? 0.3 : power > 86 ? 0.12 : power < 30 ? 0.04 : 0;
    miss = clamp(miss, 0.03, 0.75);
    if (this.rng.chance(miss)) {
      if (row === 0 && power > 80 && this.rng.chance(0.4)) return "bar";
      return this.rng.chance(0.22) ? "post" : "wide";
    }
    // El arquero adivina un costado: si coincide, tiene mucha más chance.
    const guess = mods.guess ?? this.rng.pick([0, 0, 1, 2, 2] as const);
    let save = 0.4 + (gkSkill(gk) - skill) * 0.006 + (mods.save ?? 0) - edge * 0.003;
    save += cornerTop ? -0.16 : centerTop ? -0.02 : cornerLow ? -0.06 : 0.18;
    save -= clamp((power - 60) * 0.003, -0.09, 0.14);
    if (power < 35) save += 0.1;
    if (guess === col) save += mods.penalty ? 0.3 : 0.1;
    save = clamp(save, 0.04, 0.88);
    return this.rng.chance(save) ? "save" : "goal";
  }

  private aiShotInput(): { col: 0 | 1 | 2; row: 0 | 1; power: number } {
    return {
      col: this.rng.pick([0, 1, 2, 0, 2] as const),
      row: this.rng.chance(0.25) ? 0 : 1,
      power: this.rng.int(56, 82),
    };
  }

  // ---------- Registro ----------

  private line(text: string, tone: "good" | "bad" | "neutral") {
    this.feed.push({ minute: this.minute, text: `${this.minute}' · ${text}`, tone });
  }
  private ev(type: MatchEvent["type"], text: string, extra: Partial<MatchEvent> = {}) {
    this.events.push({ minute: this.minute, type, text: `${this.minute}' · ${text}`, ...extra });
  }
  private toneFor(side: Side, goodForAttacker: boolean): "good" | "bad" {
    const goodForUser = side === this.user ? goodForAttacker : !goodForAttacker;
    return goodForUser ? "good" : "bad";
  }

  private applyShot(
    side: Side,
    shooter: Player,
    gk: Player,
    result: "goal" | "save" | "wide" | "post" | "bar",
    assist?: Player,
    verb = "dispara",
  ): Outcome {
    const s = this.stats[side];
    s.shots += 1;
    const clubId = this.clubId(side);
    const name = lastName(shooter.name);
    if (result === "goal") {
      s.onTarget += 1;
      this.goals[side] += 1;
      const a = assist && assist.id !== shooter.id ? assist : undefined;
      const text = `Gol de ${shooter.name} (${this.short(side)})${a ? `, asistencia de ${lastName(a.name)}` : ""}`;
      this.ev("goal", text, { clubId, playerId: shooter.id, assistPlayerId: a?.id });
      const tone = this.toneFor(side, true);
      this.line(`¡GOL! ${text}.`, tone);
      return { tone, goal: true, label: side === this.user ? "¡GOL!" : `Gol de ${this.short(side)}`, text: `${text}.` };
    }
    if (result === "save") {
      s.onTarget += 1;
      const caught = this.rng.chance(0.35 + ((gk.gk?.han ?? 60) - 60) * 0.006);
      if (!caught && this.rng.chance(0.5)) this.stats[side].corners += 1;
      const text = `${shooter.name} ${verb} y ${lastName(gk.name)} ${caught ? "la ataja" : "la manda al córner"}.`;
      this.ev("save", text, { clubId, playerId: shooter.id });
      const tone = this.toneFor(side, false);
      this.line(text, tone);
      return { tone, goal: false, label: "Atajada", text };
    }
    const label = result === "post" ? "¡Al palo!" : result === "bar" ? "Sobre el travesaño" : "Tiro afuera";
    const text =
      result === "post"
        ? `${name} ${verb} y la pelota pega en el palo.`
        : result === "bar"
          ? `${name} ${verb} y se va por encima del travesaño.`
          : `${name} ${verb} y se va afuera.`;
    this.ev("shot", text, { clubId, playerId: shooter.id });
    const tone = this.toneFor(side, false);
    this.line(text, tone);
    return { tone, goal: false, label, text };
  }

  // ---------- Armado de situaciones ----------

  private makeSituation(side: Side, kind: ThreatKind): Situation {
    const def = this.other(side);
    const userAttacks = side === this.user;
    const keeper = this.keeperOf(def);
    const base = { minute: this.minute, attacker: side, userAttacks, keeper } as const;
    switch (kind) {
      case "freekick": {
        const taker = [...this.pitch[side].filter(OUT)].sort(
          (a, b) => b.attrs.sho * 0.6 + b.attrs.pas * 0.4 - (a.attrs.sho * 0.6 + a.attrs.pas * 0.4),
        )[0]!;
        return { ...base, kind, title: "¡Tiro libre!", prompt: `Falta peligrosa. Patea ${lastName(taker.name)}.`, actor: taker, miss: 0.28, save: 0.04 };
      }
      case "penalty": {
        const taker = [...this.pitch[side].filter(OUT)].sort((a, b) => b.attrs.sho + b.form * 2 - (a.attrs.sho + a.form * 2))[0]!;
        return { ...base, kind, title: "¡Penal!", prompt: `Va a patear ${lastName(taker.name)}.`, actor: taker, miss: -0.14, save: -0.12 };
      }
      case "through": {
        const passer = this.pickWeighted(this.group(side, ["CM", "CAM", "CDM", "LW", "RW"]), (p) => Math.pow(p.attrs.pas, 2));
        const receiver = this.pickWeighted(
          this.without(this.group(side, ["ST", "LW", "RW", "CAM"]), passer.id),
          (p) => Math.pow(p.attrs.pac, 2),
        );
        return { ...base, kind, title: "¡Pase filtrado!", prompt: `${lastName(passer.name)} tiene espacio para habilitar a ${lastName(receiver.name)}.`, actor: passer, target: receiver };
      }
      case "cross": {
        const crosser = this.pickWeighted(this.group(side, ["LW", "RW", "LB", "RB", "CM"]), (p) => Math.pow(p.attrs.pas, 2));
        const header = this.pickWeighted(
          this.without(this.group(side, ["ST", "CAM", "LW", "RW"]), crosser.id),
          (p) => Math.pow(p.attrs.sho * 0.5 + p.attrs.phy * 0.5, 2),
        );
        return { ...base, kind, title: "¡Centro al área!", prompt: `${lastName(crosser.name)} levanta la cabeza. Espera ${lastName(header.name)}.`, actor: crosser, target: header };
      }
      case "oneOnOne": {
        const a = this.pickWeighted(this.group(side, ["ST", "LW", "RW", "CAM"]), (p) => Math.pow(p.attrs.pac + p.attrs.dri, 2));
        return { ...base, kind, title: "¡Uno contra uno!", prompt: `${lastName(a.name)} encara con un defensor y el arquero cerca.`, actor: a, target: this.defender(def) };
      }
      default: {
        const s = this.shooter(side);
        return { ...base, kind: "chance", title: "¡Oportunidad de gol!", prompt: `${lastName(s.name)} queda con la pelota para definir.`, actor: s };
      }
    }
  }

  private makeDefense(threat: ThreatKind): Situation {
    const atk = this.other(this.user);
    const attacker = this.shooter(atk);
    const defender = this.defender(this.user);
    const what: Record<ThreatKind, string> = {
      chance: "El rival arma un ataque peligroso",
      through: "Pase filtrado del rival",
      cross: "Centro del rival al área",
      oneOnOne: "El rival encara mano a mano",
      freekick: "Tiro libre del rival",
      penalty: "Penal del rival",
    };
    return {
      kind: "defense",
      minute: this.minute,
      attacker: atk,
      userAttacks: false,
      title: "¡Ataque rival!",
      prompt: `${what[threat]}. ${lastName(defender.name)} puede salir a cortar a ${lastName(attacker.name)}.`,
      actor: defender,
      target: attacker,
      keeper: this.keeperOf(this.user),
      threat,
    };
  }

  /** Penal en contra del usuario: el rival patea solo y el usuario elige hacia dónde se tira su arquero. */
  private makeKeeperPenalty(): Situation {
    const atk = this.other(this.user);
    const taker = [...this.pitch[atk].filter(OUT)].sort((a, b) => b.attrs.sho + b.form * 2 - (a.attrs.sho + a.form * 2))[0]!;
    const keeper = this.keeperOf(this.user);
    return {
      kind: "keeper",
      minute: this.minute,
      attacker: atk,
      userAttacks: false,
      title: "¡Penal en contra!",
      prompt: `Va a patear ${lastName(taker.name)} (${this.short(atk)}). Elegí hacia dónde se tira ${lastName(keeper.name)}.`,
      actor: taker,
      keeper,
      miss: -0.14,
      save: -0.12,
    };
  }

  /** Ajuste (−0,06..+0,06) de las jugadas de equipo según la ventaja de GRL del que ataca. */
  private edgeAdj(side: Side): number {
    return clamp(this.edge[side], -15, 15) * 0.003;
  }

  /**
   * Suceso que depende del GRL. Quién se lo lleva sale de una logística sobre la diferencia (parejo = 50/50).
   * Con GRL parejo no hay goles inevitables; a medida que crece la diferencia, el mejor equipo tiene más
   * penales, errores del arquero rival y goles que no se pueden evitar.
   */
  private fateEvent(): StepResult | null {
    const pHome = 1 / (1 + Math.exp(-this.edge.home / FATE.slope));
    const side: Side = this.rng.chance(pHome) ? "home" : "away";
    const dom = clamp(this.edge[side] / FATE.fullEdge, 0, 1);
    const canUnstoppable = dom > 0.15 && this.unstoppable[side] < FATE.maxUnstoppable && this.pitch[side].length >= 8;
    const kinds: Array<["penalty" | "oneOnOne" | "freekick" | "unstoppable", number]> = [
      ["penalty", 0.25],
      ["oneOnOne", 0.2 + 0.15 * dom],
      ["freekick", 0.15],
      ["unstoppable", canUnstoppable ? 0.3 * dom : 0],
    ];
    const total = kinds.reduce((n, [, w]) => n + w, 0);
    let roll = this.rng.float() * total;
    let pick = kinds[0]![0];
    for (const [k, w] of kinds) {
      roll -= w;
      if (roll <= 0) {
        pick = k;
        break;
      }
    }
    const userSide = side === this.user;
    if (pick === "unstoppable") return { outcome: this.inevitableGoal(side) };
    if (pick === "penalty") {
      this.line(`El árbitro cobra penal para ${this.short(side)}.`, this.toneFor(side, true));
      return userSide ? { situation: this.makeSituation(side, "penalty") } : { situation: this.makeKeeperPenalty() };
    }
    if (pick === "oneOnOne") {
      const gk = this.keeperOf(this.other(side));
      this.line(`Error en la salida de ${this.short(this.other(side))}: ${lastName(gk.name)} y su defensa se confunden.`, this.toneFor(side, true));
      return userSide ? { situation: this.makeSituation(side, "oneOnOne") } : { situation: this.makeDefense("oneOnOne") };
    }
    return userSide ? { situation: this.makeSituation(side, "freekick") } : { outcome: this.autoAttack(this.makeSituation(side, "freekick")) };
  }

  /** Gol que no se puede evitar (golazo, desvío, error grosero): no hay decisión posible. */
  private inevitableGoal(side: Side): Outcome {
    this.unstoppable[side] += 1;
    const scorer = this.shooter(side);
    const gk = this.keeperOf(this.other(side));
    const gkName = lastName(gk.name);
    const flavor = this.rng.pick([
      "un golazo imparable desde afuera del área",
      `tras un desvío que deja sin reacción a ${gkName}`,
      "de cabeza, sin que nadie llegue a cortarla",
      "tras una pared que deja a la defensa mirando",
      `un remate que se le cuela a ${gkName} por el primer palo`,
    ]);
    const s = this.stats[side];
    s.shots += 1;
    s.onTarget += 1;
    this.goals[side] += 1;
    const text = `Gol de ${scorer.name} (${this.short(side)}), ${flavor}`;
    this.ev("goal", text, { clubId: this.clubId(side), playerId: scorer.id });
    const tone = this.toneFor(side, true);
    this.line(`¡GOL! ${text}.`, tone);
    return {
      tone,
      goal: true,
      label: side === this.user ? "¡GOL!" : `Gol de ${this.short(side)}`,
      text: `${text}. No había nada que hacer.`,
    };
  }

  // ---------- Minuto a minuto ----------

  step(): StepResult {
    if (this.status !== "playing") return {};
    this.minute += 1;
    const m = this.minute;
    const out: StepResult = {};

    // Tarjetas y lesiones: ~4 amarillas, ~7% de rojas directas (más las dobles amarillas) y ~30% de partidos con lesión.
    for (const side of ["home", "away"] as const) {
      if (this.pitch[side].length <= 8) continue;
      if (this.rng.chance(0.02)) this.yellow(side);
      if (this.rng.chance(0.0004)) {
        const p = this.pickWeighted(this.pitch[side], (x) => (x.pos === "GK" ? 4 : x.attrs.def + 20));
        this.sendOff(side, p, false);
      }
      if (this.rng.chance(0.0017)) this.injury(side);
    }

    // Suceso de GRL (penal, error del arquero, gol inevitable...): ocupa el minuto y no hay jugada normal.
    let fated = false;
    if (m >= 3 && m < (this.inExtra ? 119 : 89) && this.rng.chance(FATE.perMinute)) {
      const f = this.fateEvent();
      if (f) {
        Object.assign(out, f);
        fated = true;
      }
    }

    const total = this.rate.home + this.rate.away;
    if (fated) {
      // ya pasó algo este minuto
    } else if (m >= 2 && this.rng.chance(total)) {
      const side: Side = this.rng.chance(this.rate.home / total) ? "home" : "away";
      const r = this.rng.float();
      const kind: ThreatKind =
        r < 0.3 ? "chance" : r < 0.52 ? "cross" : r < 0.7 ? "through" : r < 0.82 ? "oneOnOne" : r < 0.98 ? "freekick" : "penalty";
      if (side === this.user) {
        out.situation = this.makeSituation(side, kind);
      } else if (kind === "penalty") {
        // Penal en contra: lo atajás vos (elegís hacia dónde se tira tu arquero).
        out.situation = this.makeKeeperPenalty();
      } else if (
        (kind === "chance" || kind === "cross" || kind === "through" || kind === "oneOnOne") &&
        this.rng.chance(0.65)
      ) {
        out.situation = this.makeDefense(kind);
      } else {
        out.outcome = this.autoAttack(this.makeSituation(side, kind));
      }
    } else if (this.rng.chance(0.4)) {
      out.ambient = this.ambientLine();
    }

    if (m >= (this.inExtra ? 120 : 90)) {
      this.checkEnd();
    } else if (m === 105 && this.inExtra) {
      this.feed.push({ minute: m, text: "105' · Descanso de la prórroga.", tone: "neutral" });
    } else if (m === 45 && !this.htDone) {
      this.status = "ht";
    }
    return out;
  }

  /** Vuelve del descanso. */
  resume() {
    if (this.status !== "ht") return;
    this.htDone = true;
    this.status = "playing";
    this.events.push({ minute: 45, type: "ht", text: "Descanso." });
    this.feed.push({ minute: 45, text: "Descanso.", tone: "neutral" });
  }

  private ambientLine(): string {
    const side: Side = this.rng.chance(this.rate.home / (this.rate.home + this.rate.away)) ? "home" : "away";
    const p = this.rng.pick(this.pitch[side].filter(OUT));
    const lines = [
      `${this.short(side)} toca en el medio buscando espacios.`,
      `${lastName(p.name)} maneja la pelota en tres cuartos.`,
      `Pelota dividida en la mitad de la cancha.`,
      `${this.short(side)} intenta salir jugando desde el fondo.`,
      `${lastName(p.name)} pide la pelota y cambia de frente.`,
      `Ritmo bajo: ${this.short(side)} cuida la posesión.`,
    ];
    const text = this.rng.pick(lines);
    this.line(text, "neutral");
    return `${this.minute}' · ${text}`;
  }

  // ---------- Resolución ----------

  /** Ataque que no pide decisión (rival no interactivo): se resuelve con los atributos de ambos. */
  private autoAttack(sit: Situation): Outcome {
    return this.resolve(sit, this.aiInput(sit));
  }

  private aiInput(sit: Situation): LiveInput {
    switch (sit.kind) {
      case "through":
        return { type: "through", lane: this.rng.pick([0, 1, 2] as const), timing: clamp(0.5 + (this.rng.float() - 0.5) * 0.5, 0, 1) };
      case "cross":
        return { type: "cross", zone: this.rng.pick([0, 1, 2] as const), power: this.rng.int(48, 85) };
      case "oneOnOne":
        return { type: "oneOnOne", choice: this.rng.pick(["dribble", "chip", "shot", "shot"] as const) };
      case "defense":
        return { type: "defense", choice: this.rng.pick(["intercept", "press", "tackle"] as const) };
      case "keeper":
        return { type: "dive", dir: this.rng.pick([0, 1, 2] as const) };
      default:
        return { type: "shot", ...this.aiShotInput() };
    }
  }

  /** Resuelve la decisión del usuario. Si el rival es quien ataca, las jugadas encadenadas se resuelven solas. */
  resolve(sit: Situation, input: LiveInput): Outcome {
    const first = this.resolveInner(sit, input);
    const follow = first.followUp;
    if (!follow || follow.userAttacks || follow.kind === "keeper") {
      this.checkEnd();
      return first;
    }
    const next = this.resolve(follow, this.aiInput(follow));
    return { ...next, text: `${first.text} ${next.text}` };
  }

  private resolveInner(sit: Situation, input: LiveInput): Outcome {
    const side = sit.attacker;
    const defSide = this.other(side);
    const keeper = sit.keeper ?? this.keeperOf(defSide);

    if (sit.kind === "defense" && input.type === "defense") return this.resolveDefense(sit, input);

    // Penal en contra: el rival elige solo hacia dónde patea; el usuario elige hacia dónde se tira su arquero.
    if (sit.kind === "keeper" && input.type === "dive") {
      const shot = this.aiShotInput();
      const r = this.rollShot(sit.actor, keeper, shot.col, shot.row, shot.power, {
        miss: sit.miss,
        save: sit.save,
        penalty: true,
        guess: input.dir,
        edge: this.edge[side],
      });
      return this.applyShot(side, sit.actor, keeper, r, undefined, "patea el penal");
    }

    if ((sit.kind === "chance" || sit.kind === "freekick" || sit.kind === "penalty") && input.type === "shot") {
      let pressure = 0;
      if (sit.kind === "chance") pressure = (this.defLine(defSide) - 70) * 0.002;
      const r = this.rollShot(sit.actor, keeper, input.col, input.row, input.power, {
        miss: (sit.miss ?? 0) + pressure,
        save: sit.save,
        headed: sit.headed,
        penalty: sit.kind === "penalty",
        edge: this.edge[side],
      });
      const verb = sit.kind === "freekick" ? "patea el tiro libre" : sit.kind === "penalty" ? "patea el penal" : sit.headed ? "cabecea" : "define";
      return this.applyShot(side, sit.actor, keeper, r, sit.assist, verb);
    }

    if (sit.kind === "through" && input.type === "through") {
      const passer = sit.actor;
      const receiver = sit.target!;
      const q = clamp(1 - Math.abs(input.timing - 0.5) / 0.3, 0, 1);
      const defender = this.defender(defSide);
      const passSkill = eff(passer, passer.attrs.pas * 0.8 + passer.attrs.dri * 0.2);
      const recvSkill = eff(receiver, receiver.attrs.pac * 0.6 + receiver.attrs.dri * 0.4);
      const defSkill = this.defLine(defSide);
      if (q < 0.12) {
        const early = input.timing < 0.5;
        const text = early
          ? `${lastName(passer.name)} la mete demasiado temprano: ${lastName(receiver.name)} estaba adelantado.`
          : `${lastName(passer.name)} llega tarde y ${lastName(defender.name)} se anticipa.`;
        this.line(text, this.toneFor(side, false));
        return { tone: this.toneFor(side, false), goal: false, label: "Pase fallido", text };
      }
      const p = clamp(0.25 + q * 0.35 + (passSkill - 70) * 0.004 + (recvSkill - defSkill) * 0.004 + (input.lane === 1 ? -0.05 : 0) + this.edgeAdj(side), 0.06, 0.88);
      if (this.rng.chance(p)) {
        const text = `${lastName(passer.name)} habilita a ${lastName(receiver.name)}: queda solo frente al arco.`;
        this.line(text, this.toneFor(side, true));
        const follow: Situation = {
          kind: "chance",
          minute: this.minute,
          attacker: side,
          userAttacks: sit.userAttacks,
          title: "¡Solo frente al arco!",
          prompt: `${lastName(receiver.name)} define tras el pase de ${lastName(passer.name)}.`,
          actor: receiver,
          assist: passer,
          keeper,
          miss: -0.04,
          save: 0.02,
        };
        return { tone: this.toneFor(side, true), goal: false, label: "¡Pase perfecto!", text, followUp: follow };
      }
      const text = `${lastName(defender.name)} corta el pase de ${lastName(passer.name)}.`;
      this.line(text, this.toneFor(side, false));
      return { tone: this.toneFor(side, false), goal: false, label: "Pase fallido", text };
    }

    if (sit.kind === "cross" && input.type === "cross") {
      const crosser = sit.actor;
      const header = sit.target!;
      const defender = this.defender(defSide);
      const powerQ = clamp(1 - Math.abs(input.power - 68) / 55, 0, 1);
      const crossSkill = eff(crosser, crosser.attrs.pas * 0.8 + crosser.attrs.dri * 0.2);
      const zoneArrive = input.zone === 1 ? 0.05 : 0;
      const zoneDuel = input.zone === 1 ? -0.04 : input.zone === 2 ? 0.05 : 0;
      const pArrive = clamp(0.3 + powerQ * 0.38 + (crossSkill - 70) * 0.004 + zoneArrive + this.edgeAdj(side) * 0.5, 0.08, 0.88);
      if (!this.rng.chance(pArrive)) {
        const text =
          input.power > 85
            ? `El centro de ${lastName(crosser.name)} se pasa de largo.`
            : input.power < 45
              ? `El centro de ${lastName(crosser.name)} queda corto y despeja la defensa.`
              : `${lastName(defender.name)} despeja el centro de ${lastName(crosser.name)}.`;
        this.line(text, this.toneFor(side, false));
        return { tone: this.toneFor(side, false), goal: false, label: "Centro fallido", text };
      }
      const headSkill = eff(header, header.attrs.phy * 0.5 + header.attrs.sho * 0.3 + header.attrs.pac * 0.2);
      const defHead = this.defLine(defSide);
      const pDuel = clamp(0.4 + (headSkill - defHead) * 0.006 + zoneDuel + this.edgeAdj(side), 0.1, 0.8);
      if (!this.rng.chance(pDuel)) {
        const text = `${lastName(defender.name)} se impone en el salto frente a ${lastName(header.name)}.`;
        this.line(text, this.toneFor(side, false));
        return { tone: this.toneFor(side, false), goal: false, label: "Duelo perdido", text };
      }
      const hi = this.aiShotInput();
      const r = this.rollShot(header, keeper, hi.col, hi.row, this.rng.int(55, 80), { miss: 0.06, headed: true, edge: this.edge[side] });
      return this.applyShot(side, header, keeper, r, crosser, "cabecea");
    }

    if (sit.kind === "oneOnOne" && input.type === "oneOnOne") {
      const a = sit.actor;
      const d = sit.target ?? this.defender(defSide);
      if (input.choice === "dribble") {
        const mine = eff(a, a.attrs.dri * 0.6 + a.attrs.pac * 0.4);
        const theirs = eff(d, d.attrs.def * 0.6 + d.attrs.pac * 0.2 + d.attrs.phy * 0.2);
        const p = clamp(0.48 + (mine - theirs) * 0.007 + this.edgeAdj(side), 0.12, 0.85);
        if (this.rng.chance(p)) {
          const text = `${lastName(a.name)} deja en el camino a ${lastName(d.name)} y queda mano a mano.`;
          this.line(text, this.toneFor(side, true));
          const follow: Situation = {
            kind: "chance",
            minute: this.minute,
            attacker: side,
            userAttacks: sit.userAttacks,
            title: "¡Mano a mano con el arquero!",
            prompt: `${lastName(a.name)} define.`,
            actor: a,
            keeper,
            miss: 0.02,
            save: -0.02,
          };
          return { tone: this.toneFor(side, true), goal: false, label: "¡Gambeta!", text, followUp: follow };
        }
        const text = `${lastName(d.name)} le gana la pelota a ${lastName(a.name)}.`;
        this.line(text, this.toneFor(side, false));
        return { tone: this.toneFor(side, false), goal: false, label: "Pelota perdida", text };
      }
      if (input.choice === "chip") {
        const mine = eff(a, a.attrs.sho * 0.5 + a.attrs.dri * 0.3 + a.attrs.pac * 0.2);
        const gk = this.gkChipSkill(keeper);
        const p = clamp(0.36 + (mine - gk) * 0.006 + this.edgeAdj(side), 0.1, 0.75);
        if (this.rng.chance(p)) return this.applyShot(side, a, keeper, "goal", undefined, "pica la pelota");
        return this.applyShot(side, a, keeper, this.rng.chance(0.45) ? "bar" : "save", undefined, "pica la pelota");
      }
      // Definir de primera: se abre el tiro con dirección y potencia.
      const follow: Situation = {
        kind: "chance",
        minute: this.minute,
        attacker: side,
        userAttacks: sit.userAttacks,
        title: "¡Definí mano a mano!",
        prompt: `${lastName(a.name)} le pega de primera.`,
        actor: a,
        keeper,
        miss: 0.02,
        save: -0.02,
      };
      return { tone: "neutral", goal: false, label: "Define", text: `${lastName(a.name)} se perfila para definir.`, followUp: follow };
    }

    return { tone: "neutral", goal: false, label: "Sigue el juego", text: "La jugada se diluye." };
  }

  private gkChipSkill(gk: Player): number {
    if (!gk.gk) return eff(gk, gk.ovr * 0.75);
    return eff(gk, (gk.gk.pos + gk.gk.div) / 2);
  }

  private resolveDefense(sit: Situation, input: { choice: "intercept" | "press" | "tackle" }): Outcome {
    const d = sit.actor;
    const a = sit.target!;
    const threat = sit.threat ?? "chance";
    let mine: number;
    let theirs: number;
    let base: number;
    if (input.choice === "intercept") {
      mine = eff(d, d.attrs.def * 0.6 + d.attrs.pac * 0.25 + d.attrs.pas * 0.15);
      theirs = eff(a, a.attrs.dri * 0.4 + a.attrs.pac * 0.3 + a.attrs.pas * 0.3);
      base = 0.42;
    } else if (input.choice === "press") {
      mine = eff(d, d.attrs.def * 0.5 + d.attrs.phy * 0.35 + d.attrs.pac * 0.15);
      theirs = eff(a, a.attrs.dri * 0.4 + a.attrs.phy * 0.35 + a.attrs.pac * 0.25);
      base = 0.4;
    } else {
      mine = eff(d, d.attrs.def * 0.65 + d.attrs.phy * 0.35);
      theirs = eff(a, a.attrs.dri * 0.6 + a.attrs.pac * 0.4);
      base = 0.5;
    }
    // El que ataca con mejor GRL se la pone más difícil al defensor (y al revés).
    const p = clamp(base + (mine - theirs) * 0.008 - this.edgeAdj(sit.attacker) * 1.5, 0.08, 0.88);
    const label =
      input.choice === "intercept" ? "Intercepción" : input.choice === "press" ? "Recuperación" : "Barrida limpia";
    if (this.rng.chance(p)) {
      const text =
        input.choice === "intercept"
          ? `${lastName(d.name)} se anticipa y corta la jugada de ${this.short(sit.attacker)}.`
          : input.choice === "press"
            ? `${lastName(d.name)} presiona a ${lastName(a.name)} y recupera la pelota.`
            : `${lastName(d.name)} se tira a barrer y se la saca limpia a ${lastName(a.name)}.`;
      this.line(text, "good");
      return { tone: "good", goal: false, label, text };
    }
    // Falló: puede ser falta (solo la barrida) y, si no, el ataque rival sigue.
    const foulP = input.choice === "tackle" ? clamp(0.18 + (theirs - mine) * 0.004, 0.08, 0.5) : 0;
    if (foulP && this.rng.chance(foulP)) {
      const atk = sit.attacker;
      const inBox = (threat === "oneOnOne" || threat === "cross" || threat === "chance") && this.rng.chance(0.3);
      let text = `${lastName(d.name)} llega tarde y derriba a ${lastName(a.name)}.`;
      if (this.rng.chance(0.45)) {
        this.stats[this.user].yellows += 1;
        this.ev("yellow", `Amarilla para ${d.name}.`, { clubId: this.clubId(this.user), playerId: d.id });
        text += " Amarilla.";
      }
      this.line(text, "bad");
      if (inBox) {
        // Penal en contra: ahora lo atajás vos.
        return {
          tone: "bad",
          goal: false,
          label: "¡Penal en contra!",
          text: `${text} El árbitro marca penal.`,
          followUp: this.makeKeeperPenalty(),
        };
      }
      const next = this.makeSituation(atk, "freekick");
      const res = this.resolve(next, this.aiInput(next));
      return { ...res, label: `Tiro libre: ${res.label}`, text: `${text} ${res.text}` };
    }
    const failText = `${lastName(d.name)} no llega a cortar la jugada.`;
    const attack = this.makeSituation(sit.attacker, threat);
    const res = this.resolve(attack, this.aiInput(attack));
    return { ...res, label: res.goal ? res.label : "No llegó", text: `${failText} ${res.text}` };
  }

  // ---------- Tarjetas, lesiones y cambios forzados ----------

  /** Sale un jugador de la cancha; si hay suplente y quedan cambios, entra el mejor de su zona. */
  private replace(side: Side, out: Player): Player | undefined {
    const drop = () => {
      this.pitch[side] = this.pitch[side].filter((x) => x.id !== out.id);
      this.refreshRates();
      return undefined;
    };
    const pool = this.benchPool[side];
    if (!pool.length || this.subsIn[side].length >= MAX_SUBS) return drop();
    const eligible = pool.filter((b) => (out.pos === "GK" ? b.pos === "GK" : b.pos !== "GK"));
    const sameLine = eligible.filter((b) => posGroup(b.pos) === posGroup(out.pos));
    const inn = [...(sameLine.length ? sameLine : eligible)].sort((a, b) => b.ovr - a.ovr)[0];
    if (!inn) return drop();
    this.pitch[side] = this.pitch[side].map((x) => (x.id === out.id ? inn : x));
    this.benchPool[side] = pool.filter((b) => b.id !== inn.id);
    this.subsIn[side].push(inn.id);
    const text = `Cambio en ${this.short(side)}: entra ${inn.name}, sale ${out.name}.`;
    this.ev("sub", text, { clubId: this.clubId(side), playerId: inn.id, outPlayerId: out.id });
    this.line(text, "neutral");
    this.refreshRates();
    return inn;
  }

  private yellow(side: Side) {
    const field = this.pitch[side].filter(OUT);
    if (!field.length) return;
    // Quien ya tiene amarilla se cuida: es mucho menos probable que vuelva a verla.
    const p = this.pickWeighted(field, (x) => (x.attrs.def + 30) * (this.yellowsOf.has(x.id) ? 0.2 : 1));
    const n = (this.yellowsOf.get(p.id) ?? 0) + 1;
    this.yellowsOf.set(p.id, n);
    this.stats[side].yellows += 1;
    const tone = side === this.user ? "bad" : "neutral";
    if (n >= 2) {
      const text = `Segunda amarilla para ${p.name}.`;
      this.ev("yellow", text, { clubId: this.clubId(side), playerId: p.id });
      this.line(text, tone);
      this.sendOff(side, p, true);
      return;
    }
    const text = `Amarilla para ${p.name}.`;
    this.ev("yellow", text, { clubId: this.clubId(side), playerId: p.id });
    this.line(text, tone);
  }

  /** Expulsión: el equipo sigue con uno menos y el jugador queda sancionado. */
  private sendOff(side: Side, p: Player, secondYellow: boolean) {
    const r = this.rng.float();
    const ban = secondYellow ? 1 : r < 0.7 ? 1 : r < 0.9 ? 2 : 3;
    this.stats[side].reds += 1;
    this.pitch[side] = this.pitch[side].filter((x) => x.id !== p.id);
    const text = `${secondYellow ? "Doble amarilla y roja" : "Roja directa"} para ${p.name} (${this.short(side)}). ${ban} partido${ban > 1 ? "s" : ""} de sanción. ${this.short(side)} se queda con ${this.pitch[side].length}.`;
    this.ev("red", text, { clubId: this.clubId(side), playerId: p.id, games: ban, secondYellow });
    this.line(`¡EXPULSADO! ${text}`, side === this.user ? "bad" : "good");
    if (p.pos === "GK") {
      // Sin arquero: entra el suplente arquero a costa de un jugador de campo.
      const gk = this.benchPool[side].find((b) => b.pos === "GK");
      const victim = [...this.pitch[side].filter(OUT)].sort((a, b) => a.ovr - b.ovr)[0];
      if (gk && victim && this.subsIn[side].length < MAX_SUBS) {
        this.pitch[side] = this.pitch[side].map((x) => (x.id === victim.id ? gk : x));
        this.benchPool[side] = this.benchPool[side].filter((b) => b.id !== gk.id);
        this.subsIn[side].push(gk.id);
        const sub = `Cambio en ${this.short(side)}: entra el arquero ${gk.name}, sale ${victim.name}.`;
        this.ev("sub", sub, { clubId: this.clubId(side), playerId: gk.id, outPlayerId: victim.id });
        this.line(sub, "neutral");
      }
    }
    this.refreshRates();
  }

  private injury(side: Side) {
    const field = this.pitch[side].filter((x) => OUT(x) && !this.hurt.has(x.id));
    if (!field.length) return;
    const p = this.pickWeighted(field, (x) => 20 + (100 - x.fitness));
    this.hurt.add(p.id);
    const roll = this.rng.float();
    const serious = roll < 0.12;
    const medium = !serious && roll < 0.37;
    const weeks = serious ? this.rng.int(4, 8) : medium ? this.rng.int(2, 3) : 1;
    const text = `${p.name} se duele. ${
      serious ? "Rotura: hay que sustituirlo." : medium ? "Esguince: hay que sustituirlo." : "Golpe: pide el cambio."
    } Baja ${weeks} jornada${weeks > 1 ? "s" : ""}.`;
    this.ev("injury", text, { clubId: this.clubId(side), playerId: p.id, games: weeks });
    this.line(text, side === this.user ? "bad" : "neutral");
    this.replace(side, p);
  }

  // ---------- Prórroga ----------

  /**
   * Cómo sigue al final de un período: fin del partido, prórroga o penales. Se vuelve a evaluar después de
   * cada jugada resuelta, porque un gol sobre la hora puede cambiar el global.
   */
  private checkEnd() {
    if (this.sh || this.minute < (this.inExtra ? 120 : 90)) return;
    if (this.status !== "playing" && this.status !== "ft" && this.status !== "et" && this.status !== "pens") return;
    this.status = this.level() ? (this.inExtra ? "pens" : "et") : "ft";
  }

  private level(): boolean {
    const c = this.ctx.carry;
    if (!c) return false;
    return this.goals.home + c.home === this.goals.away + c.away;
  }

  /** Arranca la prórroga (30 minutos más) después de que el usuario la confirme. */
  startExtraTime() {
    if (this.status !== "et") return;
    this.inExtra = true;
    this.status = "playing";
    const text = "Termina el tiempo reglamentario con la eliminatoria igualada. Hay prórroga.";
    this.events.push({ minute: 90, type: "et", text: `90' · ${text}` });
    this.feed.push({ minute: 90, text: `90' · ${text}`, tone: "neutral" });
  }

  // ---------- Tanda de penales ----------

  get shootoutState() {
    return this.sh;
  }

  /** Arranca la tanda con los que quedaron en cancha. */
  beginShootout() {
    if (this.status !== "pens" || this.sh) return;
    const first: Side = this.rng.chance(0.5) ? "home" : "away";
    this.sh = {
      first,
      next: first,
      takers: {
        home: shootoutTakers(this.ctx.players, this.pitch.home.map((p) => p.id)),
        away: shootoutTakers(this.ctx.players, this.pitch.away.map((p) => p.id)),
      },
      taken: { home: 0, away: 0 },
      score: { home: 0, away: 0 },
      marks: { home: [], away: [] },
      kicks: [],
      winner: null,
    };
    const text = `Tanda de penales. Patea primero ${this.short(first)}.`;
    this.events.push({ minute: 120, type: "pen", text });
    this.feed.push({ minute: 120, text, tone: "neutral" });
  }

  /** Próximo ejecutor de la tanda y, si patea el usuario, la situación para que elija el disparo. */
  shootoutNext(): { side: Side; taker: Player; keeper: Player; userKicks: boolean; situation?: Situation } | null {
    const sh = this.sh;
    if (!sh || sh.winner) return null;
    const side = sh.next;
    const list = sh.takers[side];
    const taker = list.length ? list[sh.taken[side] % list.length]! : this.pitch[side][0];
    if (!taker) return null;
    const keeper = this.keeperOf(this.other(side));
    const userKicks = side === this.user;
    const situation: Situation | undefined = userKicks
      ? {
          kind: "penalty",
          minute: 120,
          attacker: side,
          userAttacks: true,
          title: `Penal ${sh.taken[side] + 1}`,
          prompt: `Te toca patear a ${lastName(taker.name)}. ${this.short(side)} ${sh.score[side]}–${sh.score[this.other(side)]} ${this.short(this.other(side))}.`,
          actor: taker,
          keeper,
          miss: -0.14,
          save: -0.12,
        }
      : undefined;
    return { side, taker, keeper, userKicks, situation };
  }

  /** Ejecuta el próximo penal. Si patea el usuario hay que pasar su disparo; el rival patea solo. */
  shootoutKick(input?: { col: 0 | 1 | 2; row: 0 | 1; power: number }): {
    side: Side;
    taker: Player;
    scored: boolean;
    text: string;
    tone: "good" | "bad";
    done: boolean;
  } | null {
    const nx = this.shootoutNext();
    const sh = this.sh;
    if (!nx || !sh) return null;
    const { side, taker, keeper } = nx;
    const shot = input ?? this.aiShotInput();
    const r = this.rollShot(taker, keeper, shot.col, shot.row, shot.power, { miss: -0.14, save: -0.12, penalty: true });
    const scored = r === "goal";
    const miss = r === "save" ? "saved" : r === "post" ? "post" : "wide";
    sh.taken[side] += 1;
    if (scored) sh.score[side] += 1;
    sh.marks[side].push(scored);
    sh.kicks.push({ side, playerId: taker.id, scored });
    const text = kickText(sh.taken[side], taker, this.short(side), scored, miss, keeper);
    this.events.push({ minute: 120, type: "pen", clubId: this.clubId(side), playerId: taker.id, scored, text });
    const tone = this.toneFor(side, scored);
    this.feed.push({ minute: 120, text, tone });
    sh.winner = shootoutWinner(sh.taken, sh.score);
    if (sh.winner) this.status = "ft";
    else sh.next = this.other(side);
    return { side, taker, scored, text, tone, done: Boolean(sh.winner) };
  }

  // ---------- Final ----------

  finish(): MatchResult {
    const c = this.ctx;
    if (!this.ended) {
      this.ended = true;
      if (!this.htDone) this.events.push({ minute: 45, type: "ht", text: "Descanso." });
      this.events.push({
        minute: this.inExtra ? 120 : 90,
        type: "ft",
        text: `Final: ${c.homeShort} ${this.goals.home}–${this.goals.away} ${c.awayShort}.`,
      });
    }
    this.events.sort((a, b) => a.minute - b.minute || (a.type === "kickoff" ? -1 : 0));
    // La línea de cierre va siempre al final (después de la prórroga y de los penales).
    const ftIdx = this.events.findIndex((e) => e.type === "ft");
    if (ftIdx >= 0) this.events.push(...this.events.splice(ftIdx, 1));
    const poss = clamp(Math.round(50 + (c.homeGrl - c.awayGrl) * 1.15 + this.rng.int(-3, 3)), 28, 72);
    const mk = (side: Side, possession: number): MatchStats => ({
      shots: this.stats[side].shots,
      onTarget: this.stats[side].onTarget,
      possession,
      corners: this.stats[side].corners + this.rng.int(1, 4),
      fouls: this.rng.int(6, 12) + this.stats[side].yellows,
      yellows: this.stats[side].yellows,
      reds: this.stats[side].reds,
    });
    const sh = this.sh;
    const result: MatchResult = {
      fixtureId: c.fixtureId,
      homeId: c.homeId,
      awayId: c.awayId,
      homeGoals: this.goals.home,
      awayGoals: this.goals.away,
      events: this.events,
      homeStats: mk("home", poss),
      awayStats: mk("away", 100 - poss),
      homeLineup: c.homeLineup,
      awayLineup: c.awayLineup,
      homeBench: (c.homeBench ?? []).filter((id) => !c.homeLineup.includes(id)),
      awayBench: (c.awayBench ?? []).filter((id) => !c.awayLineup.includes(id)),
      homeSubsIn: [...this.subsIn.home],
      awaySubsIn: [...this.subsIn.away],
      homeOnPitch: this.pitch.home.map((p) => p.id),
      awayOnPitch: this.pitch.away.map((p) => p.id),
      homeGrl: Math.round(c.homeGrl * 10) / 10,
      awayGrl: Math.round(c.awayGrl * 10) / 10,
    };
    if (this.inExtra) result.extraTime = true;
    if (sh) result.penalties = { home: sh.score.home, away: sh.score.away, kicks: sh.kicks, first: sh.first };
    refreshFinalEvent(result);
    result.ratings = computeRatings({
      players: c.players,
      events: this.events,
      homeId: c.homeId,
      awayId: c.awayId,
      homeGoals: this.goals.home,
      awayGoals: this.goals.away,
      homeLineup: c.homeLineup,
      awayLineup: c.awayLineup,
      rng: this.rng,
    });
    return result;
  }
}

/**
 * Efectos del partido jugado sobre los jugadores (lo mismo que hace `simulateMatch` con la simulación):
 * goles, asistencias, amarillas (sanción a la quinta), rojas (sanción), lesiones, partidos jugados, físico y forma.
 */
export function applyLiveMatchEffects(players: Player[], result: MatchResult, rng: Rng) {
  const byId = new Map(players.map((p) => [p.id, p]));
  // Quien se va por doble amarilla no acumula ninguna de las dos.
  const doubleYellow = new Set(
    result.events.filter((e) => e.type === "red" && e.secondYellow && e.playerId).map((e) => e.playerId!),
  );
  for (const e of result.events) {
    const p = e.playerId ? byId.get(e.playerId) : undefined;
    if (e.type === "goal") {
      const assist = e.assistPlayerId ? byId.get(e.assistPlayerId) : undefined;
      if (p) p.goals += 1;
      if (assist) assist.assists += 1;
    } else if (e.type === "yellow") {
      if (!p || doubleYellow.has(p.id)) continue;
      p.yellows += 1;
      if (p.yellows >= 5) {
        p.suspended = Math.max(p.suspended, 1);
        p.yellows = 0;
      }
    } else if (e.type === "red") {
      if (p) p.suspended = Math.max(p.suspended, e.games ?? 1);
    } else if (e.type === "injury") {
      if (!p) continue;
      const weeks = e.games ?? 1;
      p.injured = Math.max(p.injured, weeks);
      p.fitness = Math.min(p.fitness, weeks >= 4 ? 35 : weeks >= 2 ? 48 : 58);
    }
  }
  for (const id of [...result.homeLineup, ...result.awayLineup]) {
    const p = byId.get(id);
    if (!p) continue;
    p.apps += 1;
    p.fitness = Math.min(p.fitness, clamp(p.fitness - rng.int(4, 9), 42, 100));
    p.form = clamp(p.form + rng.int(-1, 1), -5, 5);
  }
  // Los suplentes que entraron también suman partido y se cansan menos.
  for (const id of [...(result.homeSubsIn ?? []), ...(result.awaySubsIn ?? [])]) {
    const p = byId.get(id);
    if (!p) continue;
    p.apps += 1;
    p.fitness = clamp(p.fitness - rng.int(2, 5), 42, 100);
  }
  // La prórroga cansa a los que siguieron en cancha.
  if (result.extraTime) {
    for (const id of [...(result.homeOnPitch ?? []), ...(result.awayOnPitch ?? [])]) {
      const p = byId.get(id);
      if (p) p.fitness = clamp(p.fitness - rng.int(3, 6), 40, 100);
    }
  }
}
