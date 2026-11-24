import { clubById } from "./clubs";
import { Rng } from "./rng";
import { posGroup } from "./format";
import { axisRatings, benchRating, isUnavailable, pickBench, pickXi } from "./tactics";
import type {
  Fixture,
  MatchEvent,
  MatchResult,
  MatchStats,
  Mentality,
  Player,
} from "./types";

const MENTALITY_MOD: Record<Mentality, { atk: number; def: number }> = {
  defensive: { atk: 0.88, def: 1.12 },
  balanced: { atk: 1, def: 1 },
  attacking: { atk: 1.14, def: 0.9 },
};

/** Cambios máximos por equipo (los programados y los forzados por lesión cuentan igual). */
const MAX_SUBS = 5;

export type MatchPlayerIndex = {
  byId: ReadonlyMap<string, Player>;
  byClub: ReadonlyMap<string, Player[]>;
};

export function indexMatchPlayers(players: Player[]): MatchPlayerIndex {
  const byId = new Map<string, Player>();
  const byClub = new Map<string, Player[]>();
  for (const player of players) {
    byId.set(player.id, player);
    const squad = byClub.get(player.clubId);
    if (squad) squad.push(player);
    else byClub.set(player.clubId, [player]);
  }
  return { byId, byClub };
}

function lastName(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? name;
}

export function autoLineup(
  players: Player[],
  clubId: string,
  playersByClub?: ReadonlyMap<string, Player[]>,
): string[] {
  const squad = playersByClub?.get(clubId) ?? players.filter((p) => p.clubId === clubId);
  return pickXi(squad, "433");
}

/** Banquillo automático de un club (lo usa la IA y el usuario si no eligió suplentes). */
export function autoBench(
  players: Player[],
  clubId: string,
  lineup: string[],
  playersByClub?: ReadonlyMap<string, Player[]>,
): string[] {
  const squad = playersByClub?.get(clubId) ?? players.filter((p) => p.clubId === clubId);
  return pickBench(squad, lineup);
}

export function effectiveOvr(p: Player): number {
  return p.ovr + p.form * 0.5 + (p.fitness - 85) * 0.05 - (isUnavailable(p) ? 8 : 0);
}

/** Squad GRL: every player counts, starters and stars weigh more. */
export function clubQuality(
  players: Player[],
  clubId: string,
  lineup: string[] = [],
  bench?: string[],
  squadOverride?: Player[],
): number {
  const squad = squadOverride ?? players.filter((p) => p.clubId === clubId);
  if (!squad.length) return 60;
  const sorted = [...squad].sort((a, b) => b.ovr - a.ovr);
  let s = 0;
  let w = 0;
  sorted.forEach((p, i) => {
    const weight = i < 11 ? 1 : i < 16 ? 0.45 : 0.12;
    s += p.ovr * weight;
    w += weight;
  });
  const squadScore = s / Math.max(1, w);
  const xi = lineup
    .map((id) => squad.find((p) => p.id === id))
    .filter((p): p is Player => Boolean(p));
  const xiScore = xi.length
    ? xi.reduce((n, p) => n + effectiveOvr(p), 0) / xi.length
    : squadScore;
  const base = xiScore * 0.58 + squadScore * 0.42;
  // Los suplentes pesan poco: un banquillo mejor o peor que el que armaría el cuerpo técnico mueve
  // la media apenas (un banquillo vacío resta un par de puntos como mucho).
  if (!xi.length || !bench) return base;
  const reference = benchRating(squad, pickBench(squad, lineup));
  const chosen = benchRating(squad, bench);
  return base + clampNum((chosen - reference) * 0.12, -2, 0.8);
}

function sampleGoals(lambda: number, rng: Rng): number {
  const lam = Math.max(0.12, lambda);
  const base = Math.floor(lam);
  const frac = lam - base;
  let g = base + (rng.chance(frac) ? 1 : 0);
  if (rng.chance(0.16)) g += 1;
  if (rng.chance(0.1) && g > 0) g -= 1;
  if (rng.chance(0.04)) g += rng.int(0, 1);
  return Math.min(6, Math.max(0, g));
}

function attackName(players: Player[], ids: string[], rng: Rng, byId?: ReadonlyMap<string, Player>): Player | undefined {
  const xi = ids.map((id) => byId?.get(id) ?? players.find((p) => p.id === id)).filter((p): p is Player => Boolean(p));
  const atk = xi.filter((p) => p.pos === "ST" || p.pos === "LW" || p.pos === "RW" || p.pos === "CAM");
  const pool = atk.length ? atk : xi.filter((p) => p.pos !== "GK");
  if (!pool.length) return undefined;
  const weights = pool.map((p) => Math.max(8, p.attrs.sho + p.form * 2));
  const total = weights.reduce((s, w) => s + w, 0);
  let roll = rng.float() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return pool[i];
  }
  return pool[0];
}

function midName(players: Player[], ids: string[], rng: Rng, byId?: ReadonlyMap<string, Player>): Player | undefined {
  const xi = ids.map((id) => byId?.get(id) ?? players.find((p) => p.id === id)).filter((p): p is Player => Boolean(p));
  const mid = xi.filter((p) => p.pos === "CM" || p.pos === "CAM" || p.pos === "CDM" || p.pos === "LW" || p.pos === "RW");
  const pool = mid.length ? mid : xi;
  return pool.length ? rng.pick(pool) : undefined;
}

function defName(players: Player[], ids: string[], rng: Rng, byId?: ReadonlyMap<string, Player>): Player | undefined {
  const xi = ids.map((id) => byId?.get(id) ?? players.find((p) => p.id === id)).filter((p): p is Player => Boolean(p));
  const def = xi.filter((p) => p.pos === "CB" || p.pos === "LB" || p.pos === "RB" || p.pos === "GK");
  return (def.length ? rng.pick(def) : xi[0]) ?? undefined;
}

export function simulateMatch(
  fixture: Fixture,
  players: Player[],
  opts: {
    seed: number;
    homeLineup?: string[];
    awayLineup?: string[];
    homeBench?: string[];
    awayBench?: string[];
    homeMentality?: Mentality;
    awayMentality?: Mentality;
    /** Puntos de GRL de equipo que suman o restan sucesos y relaciones (preparación, ambiente...). */
    homeBoost?: number;
    awayBoost?: number;
    playerIndex?: MatchPlayerIndex;
  },
): MatchResult {
  const rng = new Rng(opts.seed);
  const homeSquad = opts.playerIndex?.byClub.get(fixture.homeId) ?? players.filter((p) => p.clubId === fixture.homeId);
  const awaySquad = opts.playerIndex?.byClub.get(fixture.awayId) ?? players.filter((p) => p.clubId === fixture.awayId);
  const playerById = opts.playerIndex?.byId;
  const homeLineup = opts.homeLineup?.length === 11 ? opts.homeLineup : autoLineup(players, fixture.homeId, opts.playerIndex?.byClub);
  const awayLineup = opts.awayLineup?.length === 11 ? opts.awayLineup : autoLineup(players, fixture.awayId, opts.playerIndex?.byClub);
  const hm = MENTALITY_MOD[opts.homeMentality ?? "balanced"];
  const am = MENTALITY_MOD[opts.awayMentality ?? "balanced"];
  const home = axisRatings(homeSquad, homeLineup);
  const away = axisRatings(awaySquad, awayLineup);
  const homeClub = clubById(fixture.homeId);
  const awayClub = clubById(fixture.awayId);

  const homeBench = opts.homeBench ?? autoBench(players, fixture.homeId, homeLineup, opts.playerIndex?.byClub);
  const awayBench = opts.awayBench ?? autoBench(players, fixture.awayId, awayLineup, opts.playerIndex?.byClub);
  const homeGrl = clubQuality(players, fixture.homeId, homeLineup, opts.homeBench, homeSquad) + (opts.homeBoost ?? 0);
  const awayGrl = clubQuality(players, fixture.awayId, awayLineup, opts.awayBench, awaySquad) + (opts.awayBoost ?? 0);
  const homeQ = Math.max(52, homeGrl + 1.8);
  const awayQ = Math.max(52, awayGrl);
  const ratio = homeQ / awayQ;
  const axisHome = ((home.attack * hm.atk) / Math.max(52, away.defense * am.def));
  const axisAway = ((away.attack * am.atk) / Math.max(52, home.defense * hm.def));

  const homeLambda = clampNum(1.22 * Math.pow(ratio, 3.15) * Math.pow(axisHome, 0.28), 0.22, 4.6);
  const awayLambda = clampNum(1.02 * Math.pow(1 / ratio, 3.15) * Math.pow(axisAway, 0.28), 0.14, 3.8);

  let homeGoals = sampleGoals(homeLambda, rng);
  let awayGoals = sampleGoals(awayLambda, rng);

  if (homeGrl - awayGrl >= 8 && homeGoals < awayGoals && rng.chance(0.72)) {
    homeGoals = awayGoals + rng.int(1, 2);
  }
  if (awayGrl - homeGrl >= 8 && awayGoals < homeGoals && rng.chance(0.62)) {
    awayGoals = homeGoals + rng.int(1, 2);
  }

  const homeShots = homeGoals + rng.int(4, 11) + Math.round((homeGrl - 72) / 6);
  const awayShots = awayGoals + rng.int(3, 9) + Math.round((awayGrl - 72) / 6);
  const homeOn = Math.min(Math.max(homeGoals, homeShots), homeGoals + rng.int(2, 6));
  const awayOn = Math.min(Math.max(awayGoals, awayShots), awayGoals + rng.int(1, 5));
  const possHome = clampPoss(
    50 + (homeGrl - awayGrl) * 1.15 + (home.midfield - away.midfield) * 0.35 + rng.int(-3, 3),
  );

  const homeStats: MatchStats = {
    shots: Math.max(homeGoals, homeShots),
    onTarget: Math.max(homeGoals, homeOn),
    possession: possHome,
    corners: rng.int(2, 9),
    fouls: rng.int(8, 16),
    yellows: 0,
    reds: 0,
  };
  const awayStats: MatchStats = {
    shots: Math.max(awayGoals, awayShots),
    onTarget: Math.max(awayGoals, awayOn),
    possession: 100 - possHome,
    corners: rng.int(1, 7),
    fouls: rng.int(8, 16),
    yellows: 0,
    reds: 0,
  };

  const events: MatchEvent[] = [
    {
      minute: 0,
      type: "kickoff",
      text: `Arranca el partido en ${homeClub.stadium}.`,
    },
  ];

  const minutesFor = (n: number) => {
    const set = new Set<number>();
    const count = Math.max(0, n);
    while (set.size < count) set.add(rng.int(4, 90));
    return [...set].sort((a, b) => a - b);
  };

  const goalMinutesHome = minutesFor(homeGoals);
  const goalMinutesAway = minutesFor(awayGoals);
  const extraShotsHome = minutesFor(Math.max(0, homeStats.shots - homeGoals));
  const extraShotsAway = minutesFor(Math.max(0, awayStats.shots - awayGoals));

  type Timed = { minute: number; run: () => void };
  const timed: Timed[] = [];

  // Once en cancha en cada momento: arranca con los titulares y los cambios lo van modificando.
  const cur = { home: [...homeLineup], away: [...awayLineup] };
  const byId = (id: string) => playerById?.get(id) ?? players.find((x) => x.id === id);
  const benchPool = {
    home: homeBench.map(byId).filter((p): p is Player => Boolean(p) && !homeLineup.includes(p!.id) && !isUnavailable(p!)),
    away: awayBench.map(byId).filter((p): p is Player => Boolean(p) && !awayLineup.includes(p!.id) && !isUnavailable(p!)),
  };
  const subsIn = { home: [] as string[], away: [] as string[] };

  /** Hace un cambio. Sin `outId`, sale el más cansado de campo. Devuelve false si no se pudo. */
  const doSub = (side: "home" | "away", minute: number, outId?: string): boolean => {
    const pool = benchPool[side];
    if (!pool.length || subsIn[side].length >= MAX_SUBS) return false;
    const onPitch = cur[side].map(byId).filter((p): p is Player => Boolean(p));
    let out = outId ? onPitch.find((p) => p.id === outId) : undefined;
    if (!out) {
      const tired = onPitch
        .filter((p) => p.pos !== "GK" && !subsIn[side].includes(p.id))
        .sort((a, b) => a.fitness - b.fitness);
      if (!tired.length) return false;
      out = rng.pick(tired.slice(0, 4));
    }
    const eligible = pool.filter((b) => (out!.pos === "GK" ? b.pos === "GK" : b.pos !== "GK"));
    const sameLine = eligible.filter((b) => posGroup(b.pos) === posGroup(out!.pos));
    const inn = [...(sameLine.length ? sameLine : eligible)].sort((a, b) => b.ovr - a.ovr)[0];
    if (!inn) return false;
    const idx = cur[side].indexOf(out.id);
    if (idx < 0) return false;
    cur[side] = cur[side].map((id, i) => (i === idx ? inn.id : id));
    benchPool[side] = pool.filter((b) => b.id !== inn.id);
    subsIn[side].push(inn.id);
    const club = clubById(side === "home" ? fixture.homeId : fixture.awayId);
    events.push({
      minute,
      type: "sub",
      clubId: club.id,
      playerId: inn.id,
      outPlayerId: out.id,
      text: `${minute}' · Cambio en ${club.short}: entra ${inn.name}, sale ${out.name}.`,
    });
    return true;
  };

  // Cambios programados: entre 3 y 5 por equipo, en la segunda parte.
  for (const side of ["home", "away"] as const) {
    const n = Math.min(rng.int(3, 5), benchPool[side].length);
    const mins = new Set<number>();
    while (mins.size < n) mins.add(rng.int(46, 86));
    for (const m of [...mins].sort((a, b) => a - b)) {
      timed.push({ minute: m, run: () => void doSub(side, m) });
    }
  }

  const pushGoal = (minute: number, clubId: string, side: "home" | "away") => {
    timed.push({
      minute,
      run: () => {
        const lineup = cur[side];
        const scorer = attackName(players, lineup, rng, playerById);
        const assist = rng.chance(0.62) ? midName(players, lineup, rng, playerById) : undefined;
        const club = clubById(clubId);
        let text = scorer
          ? `Gol de ${scorer.name} (${club.short})`
          : `Gol de ${club.short}`;
        if (assist && assist.id !== scorer?.id) {
          text += `, asistencia de ${lastName(assist.name)}`;
        }
        if (rng.chance(0.22)) text += ". Qué definición.";
        events.push({
          minute,
          type: "goal",
          clubId,
          playerId: scorer?.id,
          assistPlayerId: assist && assist.id !== scorer?.id ? assist.id : undefined,
          text: `${minute}' · ${text}`,
        });
        if (scorer) scorer.goals += 1;
        if (assist && assist.id !== scorer?.id) assist.assists += 1;
      },
    });
  };

  for (const m of goalMinutesHome) pushGoal(m, fixture.homeId, "home");
  for (const m of goalMinutesAway) pushGoal(m, fixture.awayId, "away");

  const shotLines = [
    (p: string, c: string) => `${p} prueba desde fuera del área. ${c} se defiende.`,
    (p: string) => `Centro peligroso y ${p} cabecea desviado.`,
    (p: string) => `${p} se interna y dispara. Atrapa el portero.`,
    (p: string) => `Regate de ${p} y el disparo se va cerca del palo.`,
  ];

  for (const m of extraShotsHome) {
    timed.push({
      minute: m,
      run: () => {
        const p = attackName(players, cur.home, rng, playerById);
        const on = rng.chance(0.38);
        if (on) {
          const gk = defName(players, cur.away, rng, playerById);
          events.push({
            minute: m,
            type: "save",
            clubId: fixture.homeId,
            playerId: p?.id,
            text: `${m}' · ${p ? p.name : homeClub.short} dispara y ${gk ? lastName(gk.name) : "el portero"} responde.`,
          });
        } else {
          events.push({
            minute: m,
            type: "shot",
            clubId: fixture.homeId,
            playerId: p?.id,
            text: `${m}' · ${rng.pick(shotLines)(p ? lastName(p.name) : homeClub.short, awayClub.short)}`,
          });
        }
      },
    });
  }
  for (const m of extraShotsAway) {
    timed.push({
      minute: m,
      run: () => {
        const p = attackName(players, cur.away, rng, playerById);
        const on = rng.chance(0.38);
        if (on) {
          const gk = defName(players, cur.home, rng, playerById);
          events.push({
            minute: m,
            type: "save",
            clubId: fixture.awayId,
            playerId: p?.id,
            text: `${m}' · ${p ? p.name : awayClub.short} dispara y ${gk ? lastName(gk.name) : "el portero"} responde.`,
          });
        } else {
          events.push({
            minute: m,
            type: "shot",
            clubId: fixture.awayId,
            playerId: p?.id,
            text: `${m}' · ${rng.pick(shotLines)(p ? lastName(p.name) : awayClub.short, homeClub.short)}`,
          });
        }
      },
    });
  }

  // ---------- Tarjetas y lesiones ----------
  const matchYellows = new Map<string, number>();
  const hurt = new Set<string>();
  const sideStats = (side: "home" | "away") => (side === "home" ? homeStats : awayStats);
  const clubOf = (side: "home" | "away") => (side === "home" ? fixture.homeId : fixture.awayId);
  const outfieldOf = (side: "home" | "away") =>
    cur[side].map(byId).filter((x): x is Player => x !== undefined && x.pos !== "GK");
  const pickWeighted = (list: Player[], w: (p: Player) => number): Player | undefined => {
    if (!list.length) return undefined;
    const ws = list.map((p) => Math.max(1, w(p)));
    let roll = rng.float() * ws.reduce((t, x) => t + x, 0);
    for (let i = 0; i < list.length; i++) {
      roll -= ws[i]!;
      if (roll <= 0) return list[i];
    }
    return list[0];
  };

  /** Expulsión: sale de la cancha (el equipo sigue con diez) y queda sancionado. */
  const sendOff = (side: "home" | "away", p: Player, minute: number, secondYellow: boolean) => {
    sideStats(side).reds += 1;
    const r = rng.float();
    const ban = secondYellow ? 1 : r < 0.7 ? 1 : r < 0.9 ? 2 : 3;
    p.suspended = Math.max(p.suspended, ban);
    cur[side] = cur[side].filter((id) => id !== p.id);
    const club = clubById(clubOf(side));
    events.push({
      minute,
      type: "red",
      clubId: club.id,
      playerId: p.id,
      games: ban,
      secondYellow,
      text: `${minute}' · ${secondYellow ? "Doble amarilla y roja" : "Roja directa"} para ${p.name} (${club.short}). ${ban} partido${ban > 1 ? "s" : ""} de sanción. ${club.short} se queda con ${cur[side].length}.`,
    });
    if (p.pos === "GK") {
      // Se fue el arquero: si hay suplente arquero entra a costa de un jugador de campo.
      const gk = benchPool[side].find((b) => b.pos === "GK");
      const victim = [...outfieldOf(side)].sort((a, b) => a.ovr - b.ovr)[0];
      if (gk && victim && subsIn[side].length < MAX_SUBS) {
        cur[side] = cur[side].filter((id) => id !== victim.id).concat(gk.id);
        benchPool[side] = benchPool[side].filter((b) => b.id !== gk.id);
        subsIn[side].push(gk.id);
        events.push({
          minute,
          type: "sub",
          clubId: club.id,
          playerId: gk.id,
          outPlayerId: victim.id,
          text: `${minute}' · Cambio en ${club.short}: entra el arquero ${gk.name}, sale ${victim.name}.`,
        });
      }
    }
  };

  const giveYellow = (side: "home" | "away", minute: number) => {
    // Quien ya tiene amarilla se cuida: es mucho menos probable que vuelva a verla.
    const p = pickWeighted(outfieldOf(side), (x) => (x.attrs.def + 30) * (matchYellows.has(x.id) ? 0.2 : 1));
    const clubId = clubOf(side);
    sideStats(side).yellows += 1;
    if (!p) {
      events.push({ minute, type: "yellow", clubId, text: `${minute}' · Amarilla para ${clubById(clubId).short}.` });
      return;
    }
    const n = (matchYellows.get(p.id) ?? 0) + 1;
    matchYellows.set(p.id, n);
    if (n >= 2) {
      // Segunda amarilla: roja. La primera deja de contar para la acumulación.
      p.yellows = Math.max(0, p.yellows - 1);
      events.push({
        minute,
        type: "yellow",
        clubId,
        playerId: p.id,
        text: `${minute}' · Segunda amarilla para ${p.name}.`,
      });
      sendOff(side, p, minute, true);
      return;
    }
    p.yellows += 1;
    if (p.yellows >= 5) {
      p.suspended = Math.max(p.suspended, 1);
      p.yellows = 0;
      events.push({
        minute,
        type: "yellow",
        clubId,
        playerId: p.id,
        text: `${minute}' · Amarilla para ${p.name}. Acumula 5: un partido de sanción.`,
      });
      return;
    }
    events.push({ minute, type: "yellow", clubId, playerId: p.id, text: `${minute}' · Amarilla para ${p.name}.` });
  };

  // Entre 2 y 5 amarillas por partido (repartidas entre los dos equipos).
  for (const m of minutesFor(rng.int(2, 5))) {
    timed.push({ minute: m, run: () => giveYellow(rng.chance(0.5) ? "home" : "away", m) });
  }

  // Roja directa: ~7% de los partidos (las dobles amarillas se suman aparte).
  if (rng.chance(0.07)) {
    const m = rng.int(8, 88);
    timed.push({
      minute: m,
      run: () => {
        const side = rng.chance(0.5) ? "home" : "away";
        const p = pickWeighted(
          cur[side].map(byId).filter((x): x is Player => x !== undefined),
          (x) => (x.pos === "GK" ? 4 : x.attrs.def + 20),
        );
        if (p) sendOff(side, p, m, false);
      },
    });
  }

  // Lesiones: ~30% de los partidos tienen al menos una (los más cansados se lesionan más).
  const injuryCount = rng.chance(0.3) ? (rng.chance(0.12) ? 2 : 1) : 0;
  for (let i = 0; i < injuryCount; i++) {
    const m = rng.int(12, 84);
    timed.push({
      minute: m,
      run: () => {
        const side = rng.chance(0.5) ? "home" : "away";
        const p = pickWeighted(
          outfieldOf(side).filter((x) => !hurt.has(x.id)),
          (x) => 20 + (100 - x.fitness),
        );
        if (!p) return;
        hurt.add(p.id);
        const roll = rng.float();
        const serious = roll < 0.12;
        const medium = !serious && roll < 0.37;
        const weeks = serious ? rng.int(4, 8) : medium ? rng.int(2, 3) : 1;
        p.injured = Math.max(p.injured, weeks);
        p.fitness = Math.min(p.fitness, serious ? 35 : medium ? 48 : 58);
        events.push({
          minute: m,
          type: "injury",
          clubId: p.clubId,
          playerId: p.id,
          games: weeks,
          text: `${m}' · ${p.name} se duele. ${
            serious ? "Rotura: hay que sustituirlo." : medium ? "Esguince: hay que sustituirlo." : "Golpe: pide el cambio."
          } Baja ${weeks} jornada${weeks > 1 ? "s" : ""}.`,
        });
        // Si hay banco y cambios, sale en el acto; si no, el equipo sigue con diez.
        if (!doSub(side, m, p.id)) cur[side] = cur[side].filter((id) => id !== p.id);
      },
    });
  }

  timed.sort((a, b) => a.minute - b.minute);
  let ht = false;
  for (const t of timed) {
    if (!ht && t.minute >= 45) {
      events.push({
        minute: 45,
        type: "ht",
        text: "Descanso.",
      });
      ht = true;
    }
    t.run();
  }
  if (!ht) {
    events.push({ minute: 45, type: "ht", text: "Descanso." });
  }
  events.push({
    minute: 90,
    type: "ft",
    text: `Final: ${homeClub.short} ${homeGoals}–${awayGoals} ${awayClub.short}.`,
  });

  events.sort((a, b) => a.minute - b.minute || (a.type === "kickoff" ? -1 : 0));

  for (const id of [...homeLineup, ...awayLineup]) {
    const p = players.find((x) => x.id === id);
    if (p) {
      p.apps += 1;
      p.fitness = clampNum(p.fitness - rng.int(4, 9), 42, 100);
      p.form = clampNum(p.form + rng.int(-1, 1), -5, 5);
    }
  }
  // Los suplentes que entraron también suman partido y se cansan menos.
  for (const id of [...subsIn.home, ...subsIn.away]) {
    const p = players.find((x) => x.id === id);
    if (p) {
      p.apps += 1;
      p.fitness = clampNum(p.fitness - rng.int(2, 5), 42, 100);
    }
  }

  const ratings = computeRatings({
    players,
    events,
    homeId: fixture.homeId,
    awayId: fixture.awayId,
    homeGoals,
    awayGoals,
    homeLineup,
    awayLineup,
    rng,
  });

  return {
    fixtureId: fixture.id,
    homeId: fixture.homeId,
    awayId: fixture.awayId,
    homeGoals,
    awayGoals,
    ratings,
    events,
    homeStats,
    awayStats,
    homeLineup,
    awayLineup,
    homeBench: homeBench.filter((id) => !homeLineup.includes(id)),
    awayBench: awayBench.filter((id) => !awayLineup.includes(id)),
    homeSubsIn: subsIn.home,
    awaySubsIn: subsIn.away,
    homeOnPitch: [...cur.home],
    awayOnPitch: [...cur.away],
    homeGrl: Math.round(homeGrl * 10) / 10,
    awayGrl: Math.round(awayGrl * 10) / 10,
  };
}

function clampPoss(n: number) {
  return Math.round(Math.max(28, Math.min(72, n)));
}

function clampNum(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/**
 * Notas del partido (estilo Sofascore, 4.0–10.0). Parten de 6.3 y se mueven con el nivel del jugador, el resultado,
 * los goles y asistencias, la valla invicta (portero y defensas), las tarjetas y los minutos jugados.
 */
export function computeRatings(o: {
  players: Player[];
  events: MatchEvent[];
  homeId: string;
  awayId: string;
  homeGoals: number;
  awayGoals: number;
  homeLineup: string[];
  awayLineup: string[];
  rng: Rng;
}): Record<string, number> {
  const { players, events, rng } = o;
  const byId = new Map(players.map((p) => [p.id, p]));
  // Minutos en cancha: los titulares desde el 0 y los suplentes desde que entran; salen por cambio, lesión o roja.
  const from = new Map<string, number>();
  const to = new Map<string, number>();
  for (const id of [...o.homeLineup, ...o.awayLineup]) from.set(id, 0);
  for (const e of events) {
    if (e.type === "sub" && e.playerId && e.outPlayerId) {
      from.set(e.playerId, e.minute);
      to.set(e.outPlayerId, e.minute);
    }
    if (e.type === "red" && e.playerId) to.set(e.playerId, e.minute);
    // Lesionado: sale en ese minuto (si lo cambian, el cambio fija el mismo minuto).
    if (e.type === "injury" && e.playerId && !to.has(e.playerId)) to.set(e.playerId, e.minute);
  }
  const out: Record<string, number> = {};
  for (const [id, start] of from) {
    const p = byId.get(id);
    if (!p) continue;
    const minutes = Math.max(0, (to.get(id) ?? 90) - start);
    const home = p.clubId === o.homeId;
    const gf = home ? o.homeGoals : o.awayGoals;
    const ga = home ? o.awayGoals : o.homeGoals;
    let r = 6.3 + (p.ovr - 72) * 0.012 + (gf > ga ? 0.35 : gf < ga ? -0.3 : 0);
    const mine = events.filter((e) => e.playerId === p.id || e.assistPlayerId === p.id);
    const goals = mine.filter((e) => e.type === "goal" && e.playerId === p.id).length;
    const assists = events.filter((e) => e.type === "goal" && e.assistPlayerId === p.id).length;
    r += Math.min(goals, 3) * (p.pos === "GK" ? 1 : 0.95) + Math.min(assists, 3) * 0.6;
    const solid = minutes >= 60;
    if (p.pos === "GK") r += ga === 0 && solid ? 0.8 : -0.3 * ga + 0.1;
    else if (["CB", "LB", "RB"].includes(p.pos)) r += ga === 0 && solid ? 0.5 : -0.12 * ga;
    else if (p.pos === "CDM") r += ga === 0 && solid ? 0.25 : 0;
    if (mine.some((e) => e.type === "yellow")) r -= 0.3;
    if (mine.some((e) => e.type === "red")) r -= 1.6;
    if (mine.some((e) => e.type === "injury")) r -= 0.2;
    r += (rng.float() - 0.5) * 0.8;
    // Los que juegan poco se quedan cerca de 6.0 salvo que marquen la diferencia.
    if (minutes < 30) r = 6 + (r - 6) * 0.45;
    out[id] = Math.round(Math.max(4, Math.min(10, r)) * 10) / 10;
  }
  return out;
}
