import { ensureSeasonAwards } from "./awards";
import { nextBoard } from "./board";
import { ensureTerms } from "./contracts";
import { enforceSquadCaps, makeExpirySeller } from "./ai-market";
import { rolloverFinance, seasonBudgetGrant } from "./finance";
import { processExpiries, trimFreeAgents } from "./free-agents";
import { CLUBS, applyDivisions, clubById, domesticIds, emptyLeagueTables, emptyStanding, playableLeague } from "./clubs";
import { applyPromotionRelegation } from "./divisions";
import { isCalendarYearLeague, isEnglishLeague, isPortugueseLeague } from "./competitions";
import { buildSquad } from "./squads";
import { makeName } from "./names";
import { normalizePos, repairPositions } from "./positions";
import { seasonGrowth } from "./potential";
import { Rng } from "./rng";
import { SAUDI_KINGS_CUP_CONFIG, saudiSuperCupTeams } from "./saudi-cups";
import { statsFor } from "./squads";
import { rolloverSponsors, type QualificationComp } from "./sponsors";
import { pickBench, pickXi } from "./tactics";
import { OFFSEASON_DAYS, advanceTraining, trainingPopup } from "./training";
import { resolveLoans, spawnWonderkids } from "./transfers";
import { clamp, playerValue, playerWage, uid } from "./format";
import { assembleContinentals, buildSeasonSchedule, rankedByPrestige, sortTable } from "./world";
import { assembleMundial, intercontinentalPair, isMundialSeason, transatlanticaPair } from "./mundial";
import type { GameSave, Player } from "./types";

function usedNames(players: Player[]) {
  return new Set(players.map((p) => p.name));
}

function retireChance(p: Player, rng: Rng) {
  if (p.age >= 38) return true;
  if (p.age >= 37) return rng.chance(0.72);
  if (p.age >= 36) return rng.chance(0.4);
  if (p.age >= 35) return rng.chance(0.18);
  return false;
}

function makeRegen(retired: Player, rng: Rng, used: Set<string>): Player {
  const age = rng.int(16, 18);
  const ovr = rng.int(58, 68);
  const pot = clamp(Math.max(retired.pot - rng.int(0, 8), ovr + 8) + rng.int(-2, 6), ovr, 98);
  const club = clubById(retired.clubId);
  const name = makeName(rng, retired.nat, used);
  // Misma posición que el retirado; si la suya era inválida se deduce de sus atributos.
  const pos = normalizePos(retired.pos, undefined, retired);
  return {
    id: uid("rg"),
    name,
    nat: retired.nat,
    age,
    pos,
    ovr,
    pot,
    clubId: retired.clubId,
    value: playerValue(ovr, age, pot),
    wage: Math.round(playerWage(ovr, club.prestige) * 0.5),
    contract: 4,
    form: 0,
    fitness: 96,
    morale: 80,
    goals: 0,
    assists: 0,
    apps: 0,
    careerGoals: 0,
    careerAssists: 0,
    careerApps: 0,
    seasonStartOvr: ovr,
    injured: 0,
    yellows: 0,
    listed: false,
    listedForLoan: false,
    loanFrom: null,
    loanSeasons: 0,
    hiddenGem: false,
    ...statsFor(pos, ovr, rng),
    suspended: 0,
    number: rng.int(20, 39),
    locked: Boolean(club.ghost),
  };
}

export function evolveSeason(prev: GameSave): GameSave {
  // Cada slot conserva su propio mapa, mientras que `CLUBS` es global en memoria.
  // Reaplicar el mapa del save evita calcular el cierre con la división de otra carrera.
  applyDivisions(prev.divisions);
  const rng = new Rng(prev.seed + prev.season * 97 + 13);
  const prevLeague = clubById(prev.clubId).league;
  const prevUserLeague = playableLeague(prevLeague);
  const table = sortTable(prev.leagueTables?.[prevUserLeague] ?? prev.standings);
  // El verano también cuenta para un ciclo de entrenamiento en marcha: si termina, se aplica
  // antes de que los jugadores envejezcan.
  const trainingEndedInSummer = advanceTraining(prev, OFFSEASON_DAYS, new Rng(prev.seed + prev.season * 41 + 5), false);

  const used = usedNames(prev.players);
  const nextPlayers: Player[] = [];
  const retired: Player[] = [];

  for (const p of prev.players) {
    const aged = seasonGrowth(p, rng);
    if (retireChance(aged, rng)) {
      retired.push(aged);
      continue;
    }
    nextPlayers.push(aged);
  }

  for (const r of retired) {
    const regen = makeRegen(r, rng, used);
    nextPlayers.push(regen);
  }

  const next: GameSave = {
    ...prev,
    players: nextPlayers,
    news: prev.news.map((item) => ({
      ...item,
      season: item.season ?? prev.season,
    })),
  };

  if (retired.some((p) => p.clubId === prev.clubId || p.loanFrom === prev.clubId)) {
    const names = retired
      .filter((p) => p.clubId === prev.clubId || p.loanFrom === prev.clubId)
      .map((p) => p.name)
      .slice(0, 4);
    next.news.push({
      id: uid("n"),
      week: 0,
      tone: "neutral",
      title: "Retiros",
      body: `${names.join(", ")} cuelgan las botas. Nacen regenerados en la misma posición.`,
    });
  }

  // Clubes que todavía no tienen plantilla (partidas viejas, antes de que la Championship fuera jugable).
  const haveSquad = new Set(next.players.map((p) => p.clubId));
  const missing = CLUBS.filter((c) => (!c.ghost || c.league === "rfef") && !haveSquad.has(c.id));
  if (missing.length) {
    const usedMissing = usedNames(next.players);
    const rngMissing = new Rng(prev.seed + prev.season * 7 + 99);
    for (const c of missing) {
      for (const p of buildSquad(c.id, rngMissing, usedMissing)) next.players.push(p);
    }
  }

  // Ascensos y descensos ingleses (Premier ↔ Championship): antes de armar finanzas, calendario y copas.
  const budgetBeforeMoves = next.budget;
  const popupsBeforeMoves = next.popups.length;
  const divisionMoves = applyPromotionRelegation(next, prev, new Rng(prev.seed + prev.season * 131 + 7));
  applyDivisions(next.divisions);
  const divisionBudgetDelta = next.budget - budgetBeforeMoves;
  // Reconocimiento de fin de temporada de LaLiga Hypermotion: el campeón de la categoría (su premio real es el ascenso).
  {
    const segundaTable = sortTable(prev.leagueTables?.segunda ?? []);
    if (segundaTable.length > 0 && segundaTable.every((r) => r.played > 0)) {
      const champ = segundaTable[0]!.clubId;
      const label = `${prev.season}/${String(prev.season + 1).slice(2)}`;
      next.news.push({
        id: uid("n"),
        week: 0,
        tone: champ === prev.clubId ? "good" : "neutral",
        title: `Campeón de LaLiga Hypermotion ${label}`,
        body: `${clubById(champ).name} gana la categoría y asciende a LaLiga EA Sports.`,
      });
    }
  }
  const divisionPopups = next.popups.slice(popupsBeforeMoves);
  const divisionNews = divisionMoves ? [...next.news] : [];
  if (!next.divisions) next.divisions = undefined;
  const league = clubById(prev.clubId).league;
  const userLeague = playableLeague(league);

  resolveLoans(next);

  // Los agentes libres que nadie fichó envejecen; algunos se retiran.
  const agedFree: Player[] = [];
  for (const fa of prev.freeAgents ?? []) {
    const aged = seasonGrowth(fa, rng);
    aged.contract = 0;
    if (retireChance(aged, rng)) continue;
    agedFree.push(aged);
  }
  next.freeAgents = agedFree;

  // Contratos que vencen: el usuario los pierde si no renovó; la IA renueva o libera.
  processExpiries(next, rng, { sell: makeExpirySeller(next, rng) });
  // Las cesiones que vuelven pueden pasar el tope de 40: la IA suelta sobrantes.
  enforceSquadCaps(next);
  trimFreeAgents(next);
  // Clubes con plantilla provisional: si se quedaron sin jugadores (retiros, ventas...), se rearma la plantilla.
  {
    const staffed = new Set(next.players.map((p) => p.clubId));
    const usedProv = usedNames(next.players);
    const rngProv = new Rng(prev.seed + prev.season * 53 + 17);
    for (const c of CLUBS) {
      if (!c.provisional || staffed.has(c.id)) continue;
      for (const p of buildSquad(c.id, rngProv, usedProv)) next.players.push(p);
    }
  }
  // Nuevo año fiscal: ingresos frescos y masa salarial recalculada para cada club.
  rolloverFinance(next);
  next.players = next.players.map(ensureTerms);
  next.freeAgents = next.freeAgents.map(ensureTerms);
  // Red de seguridad: ningún jugador (ni libre) arranca la temporada sin posición válida.
  repairPositions(next.players);
  repairPositions(next.freeAgents);

  spawnWonderkids(next, rng, used);

  const assembled = assembleContinentals(prev.leagueTables, rng, prev.lastChampions.coppa);

  let supercoppa: [string, string] | null = null;
  let supercoppaFour: string[] | null = null;
  const scu = prev.lastChampions.scudetto ?? table[0]?.clubId ?? null;
  const cop = prev.lastChampions.coppa ?? table[1]?.clubId ?? null;
  const runner = prev.lastChampions.coppaRunnerUp ?? null;

  if (league === "argentina") {
    // Con ascensos y descensos la tabla del usuario puede ser la de la Primera Nacional (si acaba de ascender): los
    // cuatro de la Supercopa salen de la tabla de la Liga Profesional y solo cuentan clubes que siguen en ella.
    const lp = new Set(domesticIds("argentina"));
    const lpTable = sortTable(prev.leagueTables?.argentina ?? [])
      .map((r) => r.clubId)
      .filter((id) => lp.has(id));
    const ranked = lpTable.length ? lpTable : table.map((r) => r.clubId).filter((id) => lp.has(id));
    const used = new Set<string>();
    const four: string[] = [];
    for (const id of [cop, runner]) {
      if (id && lp.has(id) && !used.has(id)) {
        four.push(id);
        used.add(id);
      }
    }
    for (const id of ranked) {
      if (four.length >= 4) break;
      if (used.has(id)) continue;
      four.push(id);
      used.add(id);
    }
    if (four.length === 4) supercoppaFour = four;
  } else if (isEnglishLeague(league)) {
    // Community Shield: campeón de la Premier vs ganador de la FA Cup; la juega solo la Premier.
    if (league === "premier") {
      const pt = sortTable(prev.leagueTables?.premier ?? []);
      const champ = pt[0]?.clubId ?? null;
      const fa = prev.lastChampions.coppa ?? null;
      if (champ && fa && champ !== fa) supercoppa = [champ, fa];
      else if (champ && pt[1] && champ !== pt[1].clubId) supercoppa = [champ, pt[1].clubId];
    }
  } else if (league === "leagueOne") {
    // La League One todavía no juega copas ni la Community Shield: solo su liga.
    supercoppa = null;
  } else if (league === "segunda" || league === "primeraFed1" || league === "primeraFed2" || league === "primeraNacional" || league === "primeraBMetro" || league === "argentinaCuarta" || league === "argentinaQuinta" || league === "promocionalAmateur") {
    // LaLiga Hypermotion y la Primera Nacional no juegan la Supercopa (como la Championship con la Community Shield).
  } else if (league === "serieB") {
    // La Supercoppa Italiana es solo para la Serie A: el campeón de Serie B no la juega.
    supercoppa = null;
  } else if (isPortugueseLeague(league)) {
    // Supertaça Cândido de Oliveira: campeón de la Primeira Liga vs. ganador de la Taça de Portugal (aunque sea de la Liga
    // Portugal 2 o recién descendido). Si el campeón hizo el doble, juega contra el finalista de la Taça (o, sin dato, el
    // subcampeón de liga). La juega la Primeira Liga; un club de la Liga Portugal 2 solo si está en el cruce.
    const pt = sortTable(prev.leagueTables?.primeira ?? []);
    const champ = pt[0]?.clubId ?? null;
    const cupWinner = prev.lastChampions.coppa ?? null;
    let opp: string | null = null;
    if (champ && cupWinner && champ !== cupWinner) opp = cupWinner;
    else if (champ && cupWinner === champ && runner && runner !== champ) opp = runner;
    else if (champ && pt[1] && champ !== pt[1].clubId) opp = pt[1].clubId;
    if (champ && opp) {
      const duel: [string, string] = [champ, opp];
      supercoppa = league === "primeira" || duel.includes(prev.clubId) ? duel : null;
    } else {
      supercoppa = null;
    }
  } else if (league === "brasileiraoB" || league === "brasileiraoC") {
    // La Supercopa do Brasil es solo para la Série A.
    supercoppa = null;
  } else if (league === "bundesliga2") {
    // La DFL-Supercup es solo para la Bundesliga: el campeón de la 2. Bundesliga no la juega.
    supercoppa = null;
  } else if (league === "bundesliga3") {
    // La 3. Liga no juega la DFL-Supercup ni la DFB-Pokal (por ahora solo su liga).
    supercoppa = null;
  } else if (league === "ligue2") {
    // El campeón de Ligue 2 no juega el Trophée des Champions por serlo, pero sí el ganador de la Coupe de France aunque
    // sea de Ligue 2 (o recién descendido): si es el club del usuario, enfrenta al campeón de la Ligue 1.
    const l1 = sortTable(prev.leagueTables?.ligue1 ?? []);
    const l1Champ = l1[0]?.clubId ?? null;
    if (prev.lastChampions.coppa === prev.clubId && l1Champ && l1Champ !== prev.clubId) supercoppa = [l1Champ, prev.clubId];
    else supercoppa = null;
  } else if (league === "bundesliga" && prevUserLeague === "bundesliga2") {
    // El usuario asciende: su DFB-Pokal y su campeón eran de la 2. Bundesliga, así que la DFL-Supercup se juega entre
    // el campeón y el subcampeón de la Bundesliga que acaba de terminar.
    const st = sortTable(prev.leagueTables?.bundesliga ?? []);
    if (st[0] && st[1]) supercoppa = [st[0].clubId, st[1].clubId];
  } else if (league === "ligue1" && prevUserLeague === "ligue2") {
    // El usuario asciende: su campeón era el de la Ligue 2, pero la Coupe de France es de Ligue 1 + Ligue 2: el Trophée des
    // Champions es el campeón de la Ligue 1 vs. el ganador de la Coupe (aunque sea de Ligue 2); si es el mismo club,
    // juega el subcampeón de la Ligue 1.
    const st = sortTable(prev.leagueTables?.ligue1 ?? []);
    const champ = st[0]?.clubId ?? null;
    const cupWinner = prev.lastChampions.coppa ?? null;
    if (champ && cupWinner && champ !== cupWinner) supercoppa = [champ, cupWinner];
    else if (champ && st[1]) supercoppa = [champ, st[1].clubId];
  } else if (league === "brasileirao" && prevUserLeague === "brasileiraoB") {
    // El usuario asciende: su campeón y su Copa do Brasil eran de la Série B / mixtos, así que la Supercopa do Brasil se juega
    // entre el campeón de la Série A que acaba de terminar y el ganador de la Copa do Brasil (o el subcampeón si es el mismo).
    const st = sortTable(prev.leagueTables?.brasileirao ?? []);
    const champ = st[0]?.clubId ?? null;
    const cupWinner = prev.lastChampions.coppa ?? null;
    if (champ && cupWinner && champ !== cupWinner) supercoppa = [champ, cupWinner];
    else if (champ && st[1]) supercoppa = [champ, st[1].clubId];
  } else if (league === "serieA" && prevUserLeague === "serieB") {
    // El usuario asciende: su Coppa Italia y su campeón eran de la Serie B, así que la Supercoppa de la Serie A
    // se juega entre el campeón y el subcampeón de la Serie A que acaba de terminar.
    const st = sortTable(prev.leagueTables?.serieA ?? []);
    if (st[0] && st[1]) supercoppa = [st[0].clubId, st[1].clubId];
  } else if (league === "laliga") {
    // Supercopa de España: campeón de LaLiga EA Sports vs ganador de la Copa del Rey. Con la Segunda en juego hay que mirar
    // la tabla de LaLiga EA Sports (no la del club del usuario: si venía de Hypermotion, `lastChampions` es de esa liga) y el
    // ganador de la Copa solo vale si sigue en LaLiga EA Sports (si bajó o nunca estuvo, entra el subcampeón de liga).
    const liga = sortTable(prev.leagueTables?.laliga ?? []);
    const champ = liga[0]?.clubId ?? scu;
    const cupWinner = cop && clubById(cop).league === "laliga" ? cop : null;
    if (champ && cupWinner && champ !== cupWinner) supercoppa = [champ, cupWinner];
    else {
      const runnerUp = liga.find((r) => r.clubId !== champ)?.clubId ?? table[1]?.clubId;
      if (champ && runnerUp && champ !== runnerUp) supercoppa = [champ, runnerUp];
    }
  } else {
    if (scu && cop && scu !== cop) supercoppa = [scu, cop];
    else if (scu && table[1] && scu !== table[1].clubId) supercoppa = [scu, table[1].clubId];
  }

  let mundialGroups: string[][] = [];
  const mundial = !isMundialSeason(prev.season + 1)
    ? { teams: [] as string[], groups: [] as string[][] }
    : assembleMundial({
        rng: new Rng(prev.seed + prev.season * 17 + 9091),
        uclTeams: prev.uclGroups?.flat() ?? assembled.uclGroups.flat(),
        uelTeams: prev.uelTeams ?? assembled.uelTeams,
        ueclTeams: prev.ueclTeams ?? assembled.ueclTeams,
        libTeams: prev.libGroups?.flat() ?? assembled.libGroups.flat(),
        sudTeams: prev.sudTeams ?? assembled.sudTeams,
        lastChampions: prev.lastChampions,
        save: prev,
      });
  mundialGroups = mundial.groups;

  const intercontinental = intercontinentalPair(prev.lastChampions, {
    ucl: rankedByPrestige(assembled.uclGroups.flat()),
    lib: rankedByPrestige(assembled.libGroups.flat()),
  });
  const transatlantica = transatlanticaPair(
    prev.lastChampions,
    {
      uel: rankedByPrestige(assembled.uelTeams),
      sud: rankedByPrestige(assembled.sudTeams),
    },
    intercontinental,
  );

  const { fixtures, calendar } = buildSeasonSchedule({
    clubId: prev.clubId,
    seed: rng.int(1, 1_000_000_000),
    season: prev.season + 1,
    uclGroups: assembled.uclGroups,
    uelTeams: assembled.uelTeams,
    ueclTeams: assembled.ueclTeams,
    libGroups: assembled.libGroups,
    sudTeams: assembled.sudTeams,
    supercoppa,
    supercoppaFour,
    mundialGroups,
    intercontinental,
    transatlantica,
    saudiSuperCupFour: saudiSuperCupTeams(prev.season + 1, prev.leagueTables.saudiProLeague ?? [], prev.lastChampions),
    saudiKingsCupEntrants: SAUDI_KINGS_CUP_CONFIG.entrants,
    saudiKingsCupWeeks: SAUDI_KINGS_CUP_CONFIG.roundWeeks,
    brazilianCupQualifiers: sortTable(prev.leagueTables?.brasileiraoC ?? [])
      .slice(0, 4)
      .map((row) => row.clubId),
  });

  const squad = next.players.filter((p) => p.clubId === prev.clubId);
  next.fixtures = fixtures;
  next.calendar = calendar;
  next.leagueTables = emptyLeagueTables();
  next.standings = next.leagueTables[userLeague];
  next.uclStandings = assembled.uclGroups.flat().map(emptyStanding);
  next.uelStandings = assembled.uelTeams.map(emptyStanding);
  next.ueclStandings = assembled.ueclTeams.map(emptyStanding);
  next.libStandings = assembled.libGroups.flat().map(emptyStanding);
  next.mundialStandings = mundialGroups.flat().map(emptyStanding);
  next.uclGroups = assembled.uclGroups;
  next.uelTeams = assembled.uelTeams;
  next.ueclTeams = assembled.ueclTeams;
  next.libGroups = assembled.libGroups;
  next.sudTeams = assembled.sudTeams;
  next.mundialGroups = mundialGroups;
  const nextLineup = pickXi(squad, prev.tactics.formation);
  next.tactics = {
    ...prev.tactics,
    numberColor: prev.tactics.numberColor ?? "auto",
    lineup: nextLineup,
    bench: pickBench(squad, nextLineup),
  };
  next.budget = prev.budget + divisionBudgetDelta + seasonBudgetGrant(prevLeague);
  next.season = prev.season + 1;
  // Premios de la nueva temporada (vacíos); los de temporadas anteriores se conservan.
  ensureSeasonAwards(next);
  next.week = 1;
  next.cursor = 0;
  next.seasonOver = false;
  next.pendingFixtureId = null;
  next.lastMatch = null;
  next.offers = [];
  next.popups = [...divisionPopups];
  for (const r of trainingEndedInSummer) next.popups.push(trainingPopup(r));
  next.tempLineupBackup = null;
  next.scouts = [];
  next.screen = "office";
  next.seed = rng.int(1, 1_000_000_000);
  next.lastChampions = {
    scudetto: null,
    coppa: null,
    kingsCup: null,
    saudiSuperCup: null,
    kingsCupRunnerUp: null,
    saudiSuperCupRunnerUp: null,
    carabao: null,
    supercoppa: null,
    ucl: null,
    uel: null,
    uecl: null,
    libertadores: null,
    sudamericana: null,
    coppaRunnerUp: null,
    mundial: null,
    intercontinental: null,
    transatlantica: null,
  };
  next.version = 6;
  // Objetivos nuevos para el calendario recién armado; la confianza arrastra a medias.
  next.board = nextBoard(next, prev.board ?? null);

  const uclPlace = assembled.uclGroups.flat().includes(prev.clubId);
  const uelPlace = assembled.uelTeams.includes(prev.clubId);
  const ueclPlace = assembled.ueclTeams.includes(prev.clubId);
  const libPlace = assembled.libGroups.flat().includes(prev.clubId);
  const sudPlace = assembled.sudTeams.includes(prev.clubId);
  const mundialPlace = mundialGroups.flat().includes(prev.clubId);
  const cupLine = isCalendarYearLeague(league) ? (libPlace ? "Clasificado a Libertadores." : sudPlace ? "Clasificado a Sudamericana." : "Sin copa continental: hay que entrar por la tabla o por la copa nacional.") : uclPlace ? "Clasificado a Champions por la tabla." : uelPlace ? "Clasificado a Europa League por la tabla." : ueclPlace ? "Clasificado a Conference por la tabla." : "Sin copa europea: hay que entrar por la tabla.";

  // Patrocinadores: bonus por clasificar, una temporada menos de contrato y pago del año nuevo.
  const qualified: QualificationComp[] = [];
  if (uclPlace) qualified.push("ucl");
  if (uelPlace) qualified.push("uel");
  if (ueclPlace) qualified.push("uecl");
  if (libPlace) qualified.push("libertadores");
  if (sudPlace) qualified.push("sudamericana");
  rolloverSponsors(next, qualified, prev);

  for (const n of divisionNews.reverse()) if (!next.news.includes(n)) next.news.unshift(n);
  next.news.unshift({
    id: uid("n"),
    week: 0,
    tone: "neutral",
    title: isCalendarYearLeague(league) ? `Temporada ${next.season}` : `Temporada ${next.season}/${String(next.season + 1).slice(2)}`,
    body: `${cupLine}${mundialPlace ? " Clasificado al Mundial de Clubes." : ""} El mundo sigue: las ligas y las copas continentales se simulan enteras.`,
  });

  return next;
}
