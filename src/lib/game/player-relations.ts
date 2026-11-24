import { clubBondOf } from "./event-effects";
import { clamp, uid } from "./format";
import { Rng } from "./rng";
import type {
  GameSave,
  IdolatryRecord,
  MatchResult,
  Player,
  PlayerChatChoice,
  PlayerChatMessage,
  PlayerChatThread,
  PlayerPromise,
  PlayerChatTopic,
} from "./types";

const CHAT_COOLDOWN = 6;
const CHAT_LIMIT = 80;
const MESSAGE_LIMIT = 24;
const IDOL_LIMIT = 240;

const CHAT_ACTIONS: PlayerChatChoice["action"][] = [
  "promise-minutes",
  "compete",
  "reassure",
  "decline",
  "renewal",
  "listen",
  "give-time",
  "team-credit",
  "praise",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

export function normalizePlayerChats(value: unknown): PlayerChatThread[] {
  if (!Array.isArray(value)) return [];
  const threads: PlayerChatThread[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string" || seen.has(item.id) || typeof item.playerId !== "string") continue;
    if (!["minutes", "contract", "reaction", "personal", "positive"].includes(String(item.topic))) continue;
    const messages = Array.isArray(item.messages)
      ? item.messages
          .filter(
            (message): message is PlayerChatMessage =>
              isRecord(message) &&
              typeof message.id === "string" &&
              ["player", "manager", "system"].includes(String(message.sender)) &&
              typeof message.body === "string",
          )
          .slice(-MESSAGE_LIMIT)
      : [];
    const choices = Array.isArray(item.choices)
      ? item.choices
          .filter(
            (choice): choice is PlayerChatChoice =>
              isRecord(choice) &&
              typeof choice.id === "string" &&
              typeof choice.label === "string" &&
              CHAT_ACTIONS.includes(choice.action as PlayerChatChoice["action"]),
          )
          .slice(0, 4)
      : [];
    threads.push({
      id: item.id,
      playerId: item.playerId,
      topic: item.topic as PlayerChatTopic,
      season: finite(item.season, 0),
      week: finite(item.week, 0),
      unread: Boolean(item.unread),
      resolved: Boolean(item.resolved),
      choices,
      messages,
    });
    seen.add(item.id);
  }
  return threads.slice(0, CHAT_LIMIT);
}

export function normalizePlayerPromises(value: unknown): PlayerPromise[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (promise): promise is PlayerPromise =>
      isRecord(promise) &&
      typeof promise.id === "string" &&
      typeof promise.playerId === "string" &&
      typeof promise.threadId === "string" &&
      promise.kind === "minutes" &&
      Number.isFinite(promise.targetApps) &&
      Number.isFinite(promise.deadlineMatch),
  );
}

export function normalizeIdolatryHistory(value: unknown): IdolatryRecord[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is IdolatryRecord =>
        isRecord(entry) &&
        typeof entry.id === "string" &&
        typeof entry.playerId === "string" &&
        typeof entry.reason === "string" &&
        Number.isFinite(entry.delta),
    )
    .slice(-IDOL_LIMIT);
}

function finite(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function gameDate(save: GameSave): number {
  return save.season * 1000 + save.week;
}

function message(save: GameSave, sender: PlayerChatMessage["sender"], body: string): PlayerChatMessage {
  return {
    id: uid("msg"),
    sender,
    body,
    season: save.season,
    week: save.week,
  };
}

function choicesFor(topic: PlayerChatTopic): PlayerChatChoice[] {
  const choices: Record<PlayerChatTopic, PlayerChatChoice[]> = {
    minutes: [
      { id: "promise", label: "Tenés razón, voy a darte más oportunidades.", action: "promise-minutes" },
      { id: "competition", label: "Vas a tener que ganarte el puesto en los entrenamientos.", action: "compete" },
      { id: "confidence", label: "Confío en vos, pero la competencia es fuerte.", action: "reassure" },
      { id: "decline", label: "Por ahora no puedo prometerte más minutos.", action: "decline" },
    ],
    contract: [
      { id: "negotiate", label: "Abramos una negociación formal para renovar.", action: "renewal" },
      { id: "role", label: "Tu salario encaja con tu rol actual.", action: "compete" },
      { id: "wait", label: "Revisemos el presupuesto más adelante.", action: "give-time" },
      { id: "decline", label: "Prefiero esperar antes de negociar.", action: "decline" },
    ],
    reaction: [
      { id: "listen", label: "Entiendo cómo te sentís. Contás con mi apoyo.", action: "listen" },
      { id: "work", label: "Vamos a corregirlo juntos en los entrenamientos.", action: "reassure" },
      { id: "firm", label: "Necesito una respuesta fuerte de todo el equipo.", action: "compete" },
      { id: "decline", label: "No es el momento para hablar de esto.", action: "decline" },
    ],
    personal: [
      { id: "listen", label: "Si necesitás hablar, estoy dispuesto a escucharte.", action: "listen" },
      { id: "support", label: "Tomate un tiempo; contás con el apoyo del club.", action: "give-time" },
      { id: "balance", label: "Te entiendo; coordinemos cómo organizarnos con el equipo.", action: "reassure" },
    ],
    positive: [
      { id: "praise", label: "Gran trabajo. Te lo ganaste.", action: "praise" },
      { id: "team", label: "El mérito es de todo el equipo.", action: "team-credit" },
      { id: "focus", label: "Seguí así, todavía queda mucho por hacer.", action: "reassure" },
    ],
  };
  return choices[topic];
}

function addThread(save: GameSave, player: Player, topic: PlayerChatTopic, body: string): PlayerChatThread | null {
  const chats = (save.playerChats ??= []);
  if (chats.some((thread) => thread.playerId === player.id && !thread.resolved)) return null;
  const date = gameDate(save);
  const last = chats.find((thread) => thread.playerId === player.id);
  if (last && date - (last.season * 1000 + last.week) < CHAT_COOLDOWN) return null;

  const thread: PlayerChatThread = {
    id: uid("chat"),
    playerId: player.id,
    topic,
    season: save.season,
    week: save.week,
    unread: true,
    resolved: false,
    choices: choicesFor(topic),
    messages: [message(save, "player", body)],
  };
  chats.unshift(thread);
  chats.length = Math.min(chats.length, CHAT_LIMIT);
  save.news.unshift({
    id: uid("n"),
    week: save.week,
    tone: topic === "positive" ? "good" : topic === "reaction" ? "bad" : "neutral",
    title: `Mensaje de ${player.name}`,
    body: "Un futbolista te escribió. Podés responder desde Chat.",
  });
  return thread;
}

function updateIdolotry(save: GameSave, player: Player, delta: number, reason: string) {
  const before = clamp(Math.round(player.fanIdol ?? 0), 0, 100);
  const after = clamp(before + delta, 0, 100);
  if (after === before) return;
  player.fanIdol = after;
  const milestones = [
    [20, "Querido por algunos"],
    [40, "Apreciado"],
    [60, "Ídolo del club"],
    [80, "Gran ídolo"],
    [95, "Leyenda del club"],
  ] as const;
  const milestone = milestones.find(
    ([threshold, label]) =>
      before < threshold &&
      after >= threshold &&
      !(save.idolatryHistory ?? []).some((entry) => entry.playerId === player.id && entry.milestone === label),
  );
  const entry: IdolatryRecord = {
    id: uid("idol"),
    playerId: player.id,
    season: save.season,
    week: save.week,
    delta: after - before,
    reason,
    milestone: milestone?.[1],
  };
  const history = (save.idolatryHistory ??= []);
  history.push(entry);
  if (history.length > IDOL_LIMIT) history.splice(0, history.length - IDOL_LIMIT);

  if (milestone) {
    const title = `${player.name}: ${milestone[1].toLowerCase()}`;
    save.popups.push({
      id: uid("pop"),
      kind: "info",
      tone: "good",
      title,
      body: `La hinchada reconoce su trayectoria. Idolatría: ${after}/100.`,
    });
    save.news.unshift({ id: uid("n"), week: save.week, tone: "good", title, body: reason });
  }
}

function appendPromiseUpdate(save: GameSave, threadId: string, player: Player, body: string) {
  const thread = save.playerChats?.find((item) => item.id === threadId);
  if (!thread) return;
  thread.messages.push(message(save, "system", body));
  thread.messages = thread.messages.slice(-MESSAGE_LIMIT);
  thread.unread = true;
  save.news.unshift({
    id: uid("n"),
    week: save.week,
    tone: body.startsWith("Promesa cumplida") ? "good" : "bad",
    title: body.startsWith("Promesa cumplida") ? `Promesa cumplida: ${player.name}` : `Promesa pendiente: ${player.name}`,
    body,
  });
}

function followPromises(save: GameSave) {
  const currentMatch = save.events?.matchIndex ?? save.week;
  const pending: PlayerPromise[] = [];
  for (const promise of save.playerPromises ?? []) {
    const player = save.players.find((item) => item.id === promise.playerId);
    if (!player || player.clubId !== save.clubId || player.loanFrom) continue;
    if (player.apps >= promise.targetApps) {
      appendPromiseUpdate(save, promise.threadId, player, `Promesa cumplida: ${player.name} recibió las oportunidades acordadas.`);
      continue;
    }
    if (currentMatch >= promise.deadlineMatch) {
      player.morale = clamp(player.morale - 8, 20, 100);
      player.bond = {
        club: clamp(clubBondOf(player) - 5, 0, 100),
        squad: player.bond?.squad ?? 70,
      };
      appendPromiseUpdate(save, promise.threadId, player, `Promesa incumplida: ${player.name} esperaba más minutos y no recibió las oportunidades acordadas.`);
      continue;
    }
    pending.push(promise);
  }
  save.playerPromises = pending;
}

function generateChat(save: GameSave, result: MatchResult, rng: Rng) {
  const participatingIds = new Set([
    ...(result.homeId === save.clubId ? result.homeLineup : result.awayLineup),
    ...(result.homeId === save.clubId ? result.homeSubsIn ?? [] : result.awaySubsIn ?? []),
  ]);
  const ratings = result.ratings ?? {};
  const goals = new Map<string, number>();
  const assists = new Map<string, number>();
  for (const event of result.events) {
    if (event.type === "goal" && event.playerId) goals.set(event.playerId, (goals.get(event.playerId) ?? 0) + 1);
    if (event.type === "goal" && event.assistPlayerId) assists.set(event.assistPlayerId, (assists.get(event.assistPlayerId) ?? 0) + 1);
  }

  const squad = save.players.filter((player) => player.clubId === save.clubId && !player.loanFrom);
  const eligible = (player: Player) =>
    !save.playerChats?.some((thread) => thread.playerId === player.id && !thread.resolved) &&
    !save.playerChats?.some((thread) => thread.playerId === player.id && gameDate(save) - (thread.season * 1000 + thread.week) < CHAT_COOLDOWN);
  const ourGoals = result.homeId === save.clubId ? result.homeGoals : result.awayGoals;
  const theirGoals = result.homeId === save.clubId ? result.awayGoals : result.homeGoals;
  const loss = ourGoals < theirGoals;

  const scored = squad
    .filter((player) => participatingIds.has(player.id))
    .map((player) => ({ player, rating: ratings[player.id] ?? 0 }))
    .filter(({ player, rating }) => goals.has(player.id) || assists.has(player.id) || rating >= 8);
  const candidates: Array<{ player: Player; topic: PlayerChatTopic; body: string; chance: number }> = [];

  for (const player of squad.filter(eligible)) {
    const rating = ratings[player.id] ?? 0;
    if (!participatingIds.has(player.id) && player.morale <= 62 && player.apps < Math.max(3, save.week / 3)) {
      candidates.push({
        player,
        topic: "minutes",
        body: `${player.name}: «Míster, estoy teniendo pocas oportunidades. Me gustaría saber qué lugar tengo en el equipo».`,
        chance: 0.17,
      });
    }
    if (player.contract <= 1 && player.age < 35) {
      candidates.push({
        player,
        topic: "contract",
        body: `${player.name}: «Mi contrato entra en su último año. ¿Podemos hablar de mi futuro en el club?».`,
        chance: 0.13,
      });
    }
    if (loss && participatingIds.has(player.id) && (player.morale < 65 || rating < 6.5)) {
      candidates.push({
        player,
        topic: "reaction",
        body: `${player.name}: «La derrota duele. Quería hablar de cómo podemos levantarnos para el próximo partido».`,
        chance: 0.15,
      });
    }
    if (scored.some((item) => item.player.id === player.id)) {
      const goalsText = goals.get(player.id) ? ` y el gol${goals.get(player.id)! > 1 ? "es" : ""}` : "";
      candidates.push({
        player,
        topic: "positive",
        body: `${player.name}: «Me alegra haber podido ayudar${goalsText} al equipo. Gracias por la confianza».`,
        chance: 0.12,
      });
    }
    if (player.bond?.club !== undefined && player.bond.club < 45) {
      candidates.push({
        player,
        topic: "personal",
        body: `${player.name}: «Me está costando encontrar mi lugar en el club. ¿Podemos hablar un momento?».`,
        chance: 0.035,
      });
    }
  }

  const available = candidates.filter((item) => rng.chance(item.chance));
  if (!available.length) return;
  const selected = rng.pick(available);
  addThread(save, selected.player, selected.topic, selected.body);
}

export function processPlayerMatch(save: GameSave, result: MatchResult) {
  followPromises(save);

  const participatingIds = new Set([
    ...(result.homeId === save.clubId ? result.homeLineup : result.awayLineup),
    ...(result.homeId === save.clubId ? result.homeSubsIn ?? [] : result.awaySubsIn ?? []),
  ]);
  const ownScore = result.homeId === save.clubId ? result.homeGoals : result.awayGoals;
  const opponentScore = result.homeId === save.clubId ? result.awayGoals : result.homeGoals;
  const goals = new Map<string, number>();
  const assists = new Map<string, number>();
  for (const event of result.events) {
    if (event.type !== "goal") continue;
    if (event.playerId) goals.set(event.playerId, (goals.get(event.playerId) ?? 0) + 1);
    if (event.assistPlayerId) assists.set(event.assistPlayerId, (assists.get(event.assistPlayerId) ?? 0) + 1);
  }

  for (const player of save.players) {
    if (player.clubId !== save.clubId || !participatingIds.has(player.id)) continue;
    const rating = result.ratings?.[player.id] ?? 0;
    let delta = rating >= 8.8 ? 4 : rating >= 8 ? 2 : rating >= 7 ? 1 : 0;
    delta += Math.min(3, goals.get(player.id) ?? 0);
    delta += Math.min(2, assists.get(player.id) ?? 0);
    if (ownScore > opponentScore && (rating >= 7.5 || goals.has(player.id) || assists.has(player.id))) delta += 1;
    if (ownScore < opponentScore && rating > 0 && rating < 5.6) delta -= 1;
    if (delta) updateIdolotry(save, player, delta, "Actuación destacada con el club");
  }

  const rng = new Rng(save.seed + save.season * 37_117 + save.week * 7_919 + 0x1D01);
  generateChat(save, result, rng);
}

export function creditTitleIdolatry(save: GameSave, trophyName: string) {
  const squad = save.players.filter((player) => player.clubId === save.clubId && player.apps > 0);
  const topContributors = [...squad]
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
    .slice(0, 3);
  const contributors = new Set(topContributors.map((player) => player.id));
  for (const player of squad) {
    updateIdolotry(save, player, contributors.has(player.id) ? 4 : 2, `Participó en la conquista de ${trophyName}`);
  }
}

export function markPlayerChatRead(save: GameSave, threadId: string) {
  const thread = save.playerChats?.find((item) => item.id === threadId);
  if (thread) thread.unread = false;
}

export function appendPlayerChatNote(save: GameSave, threadId: string, body: string) {
  const thread = save.playerChats?.find((item) => item.id === threadId);
  if (!thread) return;
  thread.messages.push(message(save, "system", `Negociación: ${body}`));
  thread.messages = thread.messages.slice(-MESSAGE_LIMIT);
}

export function resolvePlayerChat(
  save: GameSave,
  threadId: string,
  choiceId: string,
): { error: string | null; openRenewal: boolean; playerId?: string } {
  const thread = save.playerChats?.find((item) => item.id === threadId);
  if (!thread || thread.resolved) return { error: "Esta conversación ya fue respondida.", openRenewal: false };
  const choice = thread.choices.find((item) => item.id === choiceId);
  const player = save.players.find((item) => item.id === thread.playerId && item.clubId === save.clubId && !item.loanFrom);
  if (!choice || !player) return { error: "El jugador ya no está disponible para responder.", openRenewal: false };

  const bond = clubBondOf(player);
  const moraleBefore = player.morale;
  const bondBefore = bond;
  const personality = bond >= 80 ? 1 : bond < 35 ? -2 : 0;
  const effects: Record<PlayerChatChoice["action"], { morale: number; bond: number; manager: string; reply: string }> = {
    "promise-minutes": { morale: 7, bond: 4, manager: "Le prometí más oportunidades en los próximos partidos.", reply: "Gracias, míster. Voy a estar preparado cuando me toque." },
    compete: { morale: player.form > 0 ? 2 : -2, bond: 1, manager: "Le expliqué que la competencia por el puesto sigue abierta.", reply: bond < 35 ? "Entiendo, aunque necesito sentir que tengo una oportunidad real." : "Lo entiendo. Voy a trabajar para ganarme el lugar." },
    reassure: { morale: 4, bond: 2, manager: "Le expresé confianza sin prometerle titularidad.", reply: "Me sirve saber que contás conmigo. Voy a seguir trabajando." },
    decline: { morale: -5, bond: -3, manager: "No acepté su pedido por el momento.", reply: bond < 35 ? "La respuesta confirma que no estamos en la misma sintonía." : "No era lo que esperaba, pero voy a respetarlo." },
    renewal: { morale: 5, bond: 3, manager: "Acepté abrir una negociación. El contrato y el salario solo cambiarán si se firma una propuesta.", reply: "Me alegra que podamos sentarnos a hablar de mi futuro." },
    listen: { morale: 6, bond: 4, manager: "Lo escuché y le ofrecí apoyo.", reply: bond < 35 ? "Gracias por escucharme. Espero que esto se traduzca en hechos." : "Gracias, míster. Me ayuda saber que puedo contar con vos." },
    "give-time": { morale: 3, bond: 2, manager: "Le di espacio para acomodar su situación y ofrecí volver a hablar.", reply: "Gracias por entender. Voy a avisarte si necesito algo más." },
    "team-credit": { morale: 3, bond: 2, manager: "Compartí el mérito con todo el equipo.", reply: "Tenés razón, lo importante es que seguimos creciendo juntos." },
    praise: { morale: 6, bond: 3, manager: "Lo felicité por su aporte al equipo.", reply: "Gracias por el reconocimiento. Voy a seguir dando todo." },
  };
  const effect = effects[choice.action];
  const moraleDelta = effect.morale + personality;
  player.morale = clamp(player.morale + moraleDelta, 20, 100);
  player.bond = {
    club: clamp(bond + effect.bond + personality, 0, 100),
    squad: player.bond?.squad ?? 70,
  };

  thread.messages.push(
    message(save, "manager", `${choice.label} ${effect.manager}`),
    message(save, "player", effect.reply),
  );
  thread.messages = thread.messages.slice(-MESSAGE_LIMIT);
  thread.choices = [];
  thread.resolved = true;
  thread.unread = false;

  if (choice.action === "promise-minutes") {
    (save.playerPromises ??= []).push({
      id: uid("promise"),
      playerId: player.id,
      threadId: thread.id,
      kind: "minutes",
      targetApps: player.apps + 2,
      deadlineMatch: (save.events?.matchIndex ?? save.week) + 5,
    });
    thread.messages.push(message(save, "system", `Promesa registrada: al menos 2 apariciones en los próximos 5 partidos del club.`));
  }
  if (choice.action === "renewal") {
    thread.messages.push(message(save, "system", "Abrí la negociación existente. No se aplicará ningún cambio de contrato hasta que ambas partes acepten."));
  }
  const moraleChange = player.morale - moraleBefore;
  const bondChange = clubBondOf(player) - bondBefore;
  const outcome =
    moraleChange > 0
      ? `${player.name} quedó más satisfecho`
      : moraleChange < 0
        ? `${player.name} no quedó conforme`
        : `${player.name} aceptó la respuesta`;
  thread.messages.push(
    message(
      save,
      "system",
      `Resultado: ${outcome}. Moral ${moraleChange > 0 ? "+" : ""}${moraleChange}; relación con el club ${bondChange > 0 ? "+" : ""}${bondChange}.`,
    ),
  );
  return { error: null, openRenewal: choice.action === "renewal", playerId: player.id };
}
