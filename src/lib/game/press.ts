import { adjustBoardConfidence } from "./board";
import { clubById } from "./clubs";
import { clamp, uid } from "./format";
import type {
  Competition,
  GameSave,
  MatchResult,
  PressAnswer,
  PressConference,
  PressFrequency,
  PressQuestion,
  PressPromise,
  PressResponse,
} from "./types";

type QuestionKind = "result" | "star" | "poor" | "red" | "injury" | "room" | "board" | "follow-up";

const JOURNALISTS: Record<QuestionKind, string> = {
  result: "Prensa local",
  star: "Televisión",
  poor: "Diario deportivo",
  red: "Radio deportiva",
  injury: "Prensa local",
  room: "Corresponsal",
  board: "Prensa nacional",
  "follow-up": "Periodista en zona mixta",
};

const finite = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

type PressContext = Pick<GameSave, "clubId" | "season" | "week" | "fixtures" | "calendar" | "players"> &
  Partial<Pick<GameSave, "board" | "pressFrequency" | "pressHistory">>;
type PressPromiseContext = Pick<GameSave, "players" | "season" | "week" | "clubId" | "news"> &
  Partial<Pick<GameSave, "pressPromises" | "pressHistory">>;

function answer(
  id: string,
  label: string,
  text: string,
  reaction: string,
  effects: Partial<PressAnswer> = {},
): PressAnswer {
  return {
    id,
    label,
    text,
    reaction,
    boardDelta: effects.boardDelta ?? 0,
    squadBondDelta: effects.squadBondDelta ?? 0,
    ...(effects.playerId ? { playerId: effects.playerId } : {}),
    ...(effects.playerMoraleDelta !== undefined ? { playerMoraleDelta: effects.playerMoraleDelta } : {}),
    ...(effects.playerClubBondDelta !== undefined ? { playerClubBondDelta: effects.playerClubBondDelta } : {}),
    ...(effects.promiseMinutes ? { promiseMinutes: true } : {}),
  };
}

function question(
  id: string,
  kind: QuestionKind,
  prompt: string,
  answers: PressAnswer[],
  playerId?: string,
): PressQuestion {
  return {
    id,
    journalist: JOURNALISTS[kind],
    question: prompt,
    answers,
    ...(playerId ? { playerId } : {}),
  };
}

function variedId(base: string, variant: number) {
  return variant === 0 ? base : `${base}-${variant}`;
}

function pickUnasked(makeQuestion: (variant: number) => PressQuestion, recentIds: Set<string>) {
  for (let variant = 0; variant < 4; variant++) {
    const candidate = makeQuestion(variant);
    if (!recentIds.has(candidate.id)) return candidate;
  }
  return makeQuestion(0);
}

function resultQuestion(userWon: boolean, drew: boolean, variant: number): PressQuestion {
  if (userWon) {
    const prompts = [
      "¿Qué explica la victoria de hoy y qué se lleva el equipo de este partido?",
      "¿Dónde cree que se decidió el partido a favor de su equipo?",
      "¿Qué aspecto de la actuación le deja más conforme después de esta victoria?",
      "¿Qué hizo bien el equipo para llevarse estos tres puntos?",
    ];
    return question(variedId("result-win", variant), "result", prompts[variant]!, [
      answer("team-credit", "Dar mérito al equipo", "El equipo interpretó bien el partido. La victoria es de todos, también de quienes entraron desde el banco.", "La prensa destaca el mensaje colectivo.", { boardDelta: 0.5, squadBondDelta: 1 }),
      answer("keep-grounded", "Mantener los pies en la tierra", "Es un buen resultado, pero no cambia nuestro trabajo. Mañana toca volver a entrenar.", "Una respuesta prudente, sin elevar demasiado las expectativas."),
      answer("raise-target", "Subir la ambición", "Este grupo puede competir por cosas importantes. Tenemos que sostener este nivel, no conformarnos.", "La prensa recoge una declaración ambiciosa.", { boardDelta: 0.5 }),
      answer("own-the-win", "Asumir el protagonismo", "Preparé el partido para competirlo así. Los jugadores ejecutaron el plan y ahora debemos repetirlo.", "El entrenador se atribuye parte del acierto.", { boardDelta: 0.25 }),
    ]);
  }

  if (drew) {
    const prompts = [
      "¿Se va conforme con el empate o siente que dejaron escapar algo?",
      "¿Qué le faltó al equipo para convertir este empate en una victoria?",
      "¿El punto refleja lo que pasó durante el partido?",
      "¿Qué análisis hace del empate y de la actuación del equipo?",
    ];
    return question(variedId("result-draw", variant), "result", prompts[variant]!, [
      answer("draw-responsibility", "Asumir la responsabilidad", "El resultado también es responsabilidad mía. Tenemos que revisar qué nos faltó para ganarlo.", "La respuesta asume el peso del resultado sin señalar culpables.", { boardDelta: 0.5, squadBondDelta: 1 }),
      answer("draw-point", "Valorar el punto", "Sumar siempre importa, sobre todo en un partido tan parejo. Hay cosas para corregir, pero también buenas señales.", "Un análisis equilibrado del resultado.", { boardDelta: 0.25 }),
      answer("draw-frustration", "Mostrar frustración", "Tuvimos opciones para llevarnos los tres puntos. No podemos repetir esos errores en el próximo partido.", "La prensa percibe exigencia en el vestuario.", { boardDelta: -0.25, squadBondDelta: -0.5 }),
      answer("draw-team", "Poner el foco en el grupo", "No es momento de buscar responsables. Lo importante es entender el partido y mejorar como equipo.", "El entrenador protege al plantel.", { squadBondDelta: 1 }),
    ]);
  }

  const prompts = [
    "¿Cómo explica esta derrota y qué necesita corregir el equipo?",
    "¿Qué fue lo que más le costó al equipo en este partido?",
    "¿Dónde estuvo la diferencia que terminó inclinando el resultado?",
    "¿Qué respuesta espera de sus jugadores después de esta derrota?",
  ];
  return question(variedId("result-loss", variant), "result", prompts[variant]!, [
    answer("loss-responsibility", "Asumir la responsabilidad", "La responsabilidad es mía. Tenemos que analizarlo, corregir y volver más fuertes.", "La prensa valora que el entrenador no culpe a sus jugadores.", { boardDelta: 0.75, squadBondDelta: 1.5 }),
    answer("loss-team", "Proteger al vestuario", "No voy a señalar a nadie en público. Perdemos y ganamos como equipo; mañana trabajaremos para mejorar.", "Una defensa pública del plantel.", { boardDelta: 0.25, squadBondDelta: 1 }),
    answer("loss-standards", "Exigir una reacción", "Hoy estuvimos por debajo de lo que este club exige. Cada uno, empezando por mí, tiene que dar más.", "El mensaje marca un límite sin personalizar las críticas.", { boardDelta: 0.25, squadBondDelta: -0.5 }),
    answer("loss-excuse", "Cuestionar el contexto", "Hubo decisiones que nos condicionaron, pero no podemos escondernos detrás de eso: el resultado ya está.", "La referencia al arbitraje genera debate, aunque el entrenador acepta el resultado.", { boardDelta: -0.25 }),
  ]);
}

function playerQuestion(
  kind: "star" | "poor",
  playerId: string,
  playerName: string,
  morale: number,
  allowPromise = true,
): PressQuestion {
  if (kind === "star") {
    const challengeDelta = morale >= 65 ? 1 : -1;
    const starAnswers = [
      answer("praise-player", "Elogiarlo", `${playerName} hizo un gran partido. Se lo ganó con trabajo y ojalá siga así.`, "La prensa destaca el respaldo público al jugador.", { playerId, playerMoraleDelta: 3, playerClubBondDelta: 1 }),
      answer("team-credit", "Compartir el mérito", `${playerName} estuvo muy bien, pero el mérito es de todo el equipo.`, "El entrenador evita personalizar el resultado.", { squadBondDelta: 1 }),
      answer("challenge-player", "Pedirle continuidad", `Tiene calidad y puede dar todavía más. Lo importante es sostener este nivel cada semana.`, "La exigencia se presenta como un desafío para el futbolista.", { playerId, playerMoraleDelta: challengeDelta }),
    ];
    starAnswers.push(
      allowPromise
        ? answer("promise-minutes", "Prometerle continuidad", `Está respondiendo en la cancha y voy a darle más oportunidades.`, "La prensa toma nota de un compromiso concreto con el jugador.", { playerId, playerMoraleDelta: 1, playerClubBondDelta: 1, promiseMinutes: true })
        : answer("protect-star", "Bajar la presión", `No quiero cargarle el resultado a un solo jugador. ${playerName} trabaja para el equipo, como todos.`, "Una respuesta que intenta reducir la atención sobre el futbolista.", { playerId, playerMoraleDelta: 1 }),
    );
    return question(
      `player-star-${playerId}`,
      "star",
      `¿Qué le aporta ${playerName} al equipo y cómo valora su actuación de hoy?`,
      starAnswers,
      playerId,
    );
  }

  return question(
    `player-poor-${playerId}`,
    "poor",
    `¿Le preocupa el partido de ${playerName}? Hubo críticas a su rendimiento.`,
    [
      answer("protect-player", "Respaldarlo", `No voy a juzgar a ${playerName} por un solo partido. Tiene mi confianza y trabajaremos juntos.`, "El entrenador sale en defensa del jugador.", { playerId, playerMoraleDelta: 2, playerClubBondDelta: 1 }),
      answer("private-feedback", "Hablarlo en privado", `Lo analizaremos puertas adentro. Lo importante es que ${playerName} tenga una oportunidad de responder en la cancha.`, "La prensa valora que la crítica no se convierta en un reproche público.", { playerId, playerMoraleDelta: 1 }),
      answer("criticize-player", "Ser crítico", `Hoy ${playerName} no estuvo a la altura. Tiene que reaccionar, como todos nosotros.`, "La crítica pública aumenta la presión sobre el futbolista.", { playerId, playerMoraleDelta: morale < 50 ? -3 : -2, playerClubBondDelta: -1.5, squadBondDelta: -0.5 }),
      answer("selection", "Asumir la decisión", `Yo decidí que jugara y me corresponde ayudarlo a mejorar. No voy a descargar esa responsabilidad sobre él.`, "El entrenador se hace cargo de la elección.", { playerId, playerMoraleDelta: 1, squadBondDelta: 0.75 }),
    ],
    playerId,
  );
}

function roomQuestion(variant: number): PressQuestion {
  const prompts = [
    "¿Cómo está el vestuario después de este partido?",
    "¿Qué mensaje les dio a sus jugadores al terminar el encuentro?",
    "¿Cómo piensa mantener unido al grupo en este tramo de la temporada?",
    "¿Qué espera del equipo en los próximos días?",
  ];
  return question(variedId("dressing-room", variant), "room", prompts[variant]!, [
    answer("room-together", "Reforzar la unión", "Seguimos juntos. Un resultado no cambia lo que estamos construyendo como grupo.", "El entrenador transmite unidad.", { squadBondDelta: 1.5 }),
    answer("room-standards", "Pedir una reacción", "El grupo sabe que puede hacerlo mejor. Espero una respuesta en el próximo entrenamiento.", "La prensa interpreta un llamado de atención general.", { squadBondDelta: -0.75 }),
    answer("room-own", "Empezar por uno mismo", "El cuerpo técnico también debe revisar sus decisiones. La mejora empieza por todos, incluido yo.", "Una respuesta conciliadora que comparte la responsabilidad.", { boardDelta: 0.25, squadBondDelta: 1 }),
    answer("room-calm", "Bajar el ruido", "No hay ningún problema que resolver por una frase sacada de contexto. Estamos trabajando con normalidad.", "El entrenador intenta cortar las especulaciones.", { squadBondDelta: 0.25 }),
  ]);
}

function boardQuestion(confidence: number, variant: number): PressQuestion {
  const mood = confidence < 45 ? "con la presión sobre su cargo" : "con las expectativas del club";
  const prompts = [
    `¿Cómo piensa responder ${mood} en lo que queda de temporada?`,
    `¿Siente que el proyecto del club le da herramientas para cumplir los objetivos?`,
    `¿Qué balance hace de su trabajo y de las metas que fijó la directiva?`,
    `¿Qué le diría a quienes dudan de que el equipo alcance sus objetivos?`,
  ];
  return question(variedId("club-expectations", variant), "board", prompts[variant]!, [
    answer("board-realistic", "Ser realista", "Vamos partido a partido. El objetivo es competir bien y cumplir lo que acordamos con el club.", "Una respuesta prudente y alineada con el proyecto.", { boardDelta: 0.5 }),
    answer("board-ambition", "Mostrar ambición", "No vinimos a escondernos. Vamos a pelear por nuestros objetivos hasta el final.", "La prensa recoge un mensaje ambicioso.", { boardDelta: 0.5 }),
    answer("board-accountability", "Hablar de trabajo", "La directiva y yo compartimos una hoja de ruta. Mi tarea es que el equipo la represente en la cancha.", "El entrenador respalda el proyecto institucional.", { boardDelta: 0.75 }),
    answer("board-disagree", "Marcar diferencias", "Hay decisiones del club que no dependen de mí. Yo responderé por el equipo y la directiva por sus decisiones.", "La respuesta abre una distancia pública con la dirigencia.", { boardDelta: -1 }),
  ]);
}

function momentQuestion(result: MatchResult, save: Pick<PressContext, "players">, variant: number): PressQuestion {
  const red = result.events.find((event) => event.type === "red");
  if (red) {
    const playerName = save.players.find((player) => player.id === red.playerId)?.name;
    const prompts = playerName
      ? [
          `${playerName} fue expulsado. ¿La jugada condicionó el partido?`,
          `¿Cómo analiza la expulsión de ${playerName} y su impacto en el equipo?`,
          `¿Pudo hacer algo distinto después de la roja a ${playerName}?`,
          `¿Qué les pidió a sus jugadores tras la expulsión de ${playerName}?`,
        ]
      : [
          "¿La expulsión condicionó el partido? ¿Cómo analiza esa jugada?",
          "¿Qué cambió tácticamente después de la tarjeta roja?",
          "¿Cómo valora la decisión arbitral de expulsar a un jugador?",
          "¿Qué les pidió a sus jugadores cuando quedaron en inferioridad?",
        ];
    return question(variedId("red-card", variant), "red", prompts[variant]!, [
      answer("red-team", "Asumirlo como equipo", "La expulsión nos condicionó, pero no explica todo. Tendremos que competir mejor también en inferioridad.", "El entrenador reconoce el impacto sin usarlo como excusa.", { boardDelta: 0.25, squadBondDelta: 0.5 }),
      answer("red-player", "Respaldar al futbolista", "No voy a condenarlo en público. Revisaremos la jugada y hablaremos con él como corresponde.", "El entrenador protege al jugador hasta revisar la acción.", { playerId: red.playerId, playerMoraleDelta: 1, playerClubBondDelta: 0.75 }),
      answer("red-referee", "Cuestionar la decisión", "Desde el banco nos pareció una decisión muy rigurosa. Prefiero verla otra vez antes de decir más.", "La crítica al arbitraje puede alimentar el debate posterior.", { boardDelta: -0.25 }),
      answer("red-standards", "Exigir cuidado", "Tenemos que cuidar mejor nuestras decisiones. No podemos dejar al equipo con uno menos.", "El mensaje pone el acento en la disciplina.", { playerId: red.playerId, playerMoraleDelta: -1, playerClubBondDelta: -0.5 }),
    ], red.playerId);
  }

  const injury = result.events.find((event) => event.type === "injury");
  if (injury) {
    const prompts = [
      "¿Qué puede decir sobre la lesión y cómo afectó al plan del partido?",
      "¿La lesión obligó a cambiar el planteamiento que había preparado?",
      "¿Qué información tiene sobre el jugador que salió lesionado?",
      "¿Le preocupa quedarse sin alternativas en esa posición?",
    ];
    return question(variedId("injury", variant), "injury", prompts[variant]!, [
      answer("injury-support", "Respaldar al jugador", "Lo primero es que se recupere bien. El grupo y el club van a acompañarlo.", "La respuesta prioriza la recuperación del futbolista.", { playerId: injury.playerId, playerMoraleDelta: 2, playerClubBondDelta: 0.75, squadBondDelta: 0.25 }),
      answer("injury-caution", "Esperar los estudios", "Todavía es pronto para dar un diagnóstico. Esperaremos los estudios antes de hablar de plazos.", "El entrenador evita adelantar información médica.", { playerId: injury.playerId, playerMoraleDelta: 1 }),
      answer("injury-team", "Hablar de la plantilla", "Tenemos alternativas y confío en el grupo. No vamos a apurarlo hasta que esté listo.", "Un mensaje que evita presionar al lesionado.", { playerId: injury.playerId, playerMoraleDelta: 1, squadBondDelta: 0.5 }),
      answer("injury-tactical", "Explicar el cambio", "La lesión nos obligó a reajustar, pero no quiero usarla para explicar el resultado.", "El entrenador distingue el contratiempo del análisis colectivo."),
    ], injury.playerId);
  }

  const prompts = [
    "¿Qué aspecto del partido cree que va a revisar primero con el equipo?",
    "¿En qué momento sintió que el partido pedía un ajuste táctico?",
    "¿Qué detalle del juego espera corregir antes del siguiente encuentro?",
    "¿Qué aprendió el equipo de este rival durante el partido?",
  ];
  return question(variedId("tactical-adjustment", variant), "room", prompts[variant]!, [
    answer("review-balance", "Revisar el equilibrio", "Vamos a mirar cómo defendimos y cómo llegamos al área. Las dos cosas importan.", "El entrenador apunta a un análisis global."),
    answer("review-details", "Corregir detalles", "Hay detalles que se deciden en ambas áreas. Los vamos a trabajar sin dramatizar.", "Una respuesta centrada en la preparación."),
    answer("review-ball", "Mejorar con la pelota", "Necesitamos usar mejor la posesión para controlar los momentos del partido.", "El entrenador identifica un aspecto concreto del juego."),
    answer("review-team", "Analizarlo en grupo", "Lo hablaremos con los jugadores antes de sacar conclusiones hacia afuera.", "El entrenador reserva el análisis para el vestuario."),
  ]);
}

function followUpQuestion(save: Pick<PressContext, "pressHistory" | "players">): PressQuestion | null {
  const previous = (save.pressHistory ?? []).slice(0, 4);
  for (const conference of previous) {
    const responses = [...conference.responses].reverse();
    const response = responses.find((item) => item.playerId && item.answerId === "criticize-player");
    if (response?.playerId) {
      const player = save.players.find((item) => item.id === response.playerId);
      if (!player) continue;
      return question(
        `follow-up-${response.questionId}`,
        "follow-up",
        `En una conferencia anterior cuestionó públicamente a ${player.name}. ¿Se arrepiente de esas palabras?`,
        [
          answer("apologize-player", "Reconocer el exceso", "Podría haberlo expresado mejor. Hablaré con él y espero que podamos pasar página.", "La prensa destaca un gesto de distensión.", { playerId: player.id, playerMoraleDelta: 2, playerClubBondDelta: 1, squadBondDelta: 0.5 }),
          answer("stand-by-words", "Sostener la crítica", "Mantengo el análisis del partido, aunque mi responsabilidad es ayudarlo a mejorar.", "El entrenador sostiene el fondo de su crítica, pero asume su rol.", { playerId: player.id, playerMoraleDelta: -1 }),
          answer("move-on-player", "Cerrar el tema", "Ya hablamos de eso. Ahora lo importante es el próximo partido y el trabajo del equipo.", "El entrenador evita reabrir la polémica."),
        ],
        player.id,
      );
    }
    const promiseResponse = responses.find((item) => item.playerId && item.answerId === "promise-minutes");
    if (promiseResponse?.playerId) {
      const player = save.players.find((item) => item.id === promiseResponse.playerId);
      if (!player) continue;
      const outcome = promiseResponse.effects.find((effect) => effect.startsWith("Compromiso cumplido:") || effect.startsWith("Compromiso pendiente:"));
      return question(
        `follow-up-promise-${promiseResponse.questionId}`,
        "follow-up",
        outcome
          ? `Prometió más oportunidades a ${player.name}. ¿Qué balance hace de ese compromiso?`
          : `Prometió darle más oportunidades a ${player.name}. ¿Cómo piensa cumplirlo?`,
        [
          answer("promise-explain", outcome?.startsWith("Compromiso cumplido:")
            ? "Explicar la decisión"
            : "Reafirmar el compromiso", `Fue una decisión deportiva. Voy a seguir hablando con ${player.name} con claridad y trabajando para el equipo.`, "La prensa registra una respuesta directa sobre el compromiso.", { boardDelta: 0.25 }),
          answer("promise-private", "Hablarlo en privado", `Prefiero revisar la situación con ${player.name} puertas adentro y no convertirla en un debate público.`, "El entrenador mantiene la conversación en el vestuario.", { playerId: player.id, playerMoraleDelta: 1 }),
          answer("promise-avoid", "Cambiar de tema", "Las decisiones de minutos dependen de cada partido. Ahora prefiero hablar del equipo.", "La respuesta evita dar más detalles sobre lo prometido."),
        ],
        player.id,
      );
    }
  }
  return null;
}

function conferenceImportant(save: Pick<PressContext, "clubId" | "board">, result: MatchResult, competition: Competition, title: string): boolean {
  const club = clubById(save.clubId);
  if (competition !== club.league || /final|semifinal|ascenso|descenso|play-?off/i.test(title)) return true;
  if (result.events.some((event) => event.type === "red")) return true;
  if ((save.board?.confidence ?? 100) < 40) return true;
  const userHome = result.homeId === save.clubId;
  const userGrl = userHome ? result.homeGrl : result.awayGrl;
  const rivalGrl = userHome ? result.awayGrl : result.homeGrl;
  const userGoals = userHome ? result.homeGoals : result.awayGoals;
  const rivalGoals = userHome ? result.awayGoals : result.homeGoals;
  const margin = userGoals - rivalGoals;
  return (rivalGrl - userGrl >= 8 && margin > 0) || margin <= -3 || margin >= 4;
}

export function createPressConference(
  save: PressContext,
  result: MatchResult,
  matchDate: { season: number; week: number } = { season: save.season, week: save.week },
): PressConference | null {
  const frequency: PressFrequency = save.pressFrequency === "important" || save.pressFrequency === "off" ? save.pressFrequency : "every";
  if (frequency === "off") return null;
  const fixture = save.fixtures.find((item) => item.id === result.fixtureId);
  if (!fixture) return null;
  const slot = save.calendar.find((item) => item.fixtures.includes(fixture.id));
  const title = slot?.title ?? "";
  const important = conferenceImportant(save, result, fixture.competition, title);
  if (frequency === "important" && !important) return null;

  const userHome = result.homeId === save.clubId;
  const userGoals = userHome ? result.homeGoals : result.awayGoals;
  const rivalGoals = userHome ? result.awayGoals : result.homeGoals;
  const userWon = userGoals > rivalGoals;
  const drew = userGoals === rivalGoals;
  const opponentId = userHome ? result.awayId : result.homeId;
  const recentIds = new Set(
    (save.pressHistory ?? []).slice(0, 3).flatMap((conference) => conference.questions.map((item) => item.id)),
  );
  const candidates = [
    pickUnasked((variant) => resultQuestion(userWon, drew, variant), recentIds),
    pickUnasked((variant) => momentQuestion(result, save, variant), recentIds),
  ];

  const best = Object.entries(result.ratings ?? {})
    .filter(([id, rating]) => save.players.some((player) => player.id === id && player.clubId === save.clubId) && rating >= 7)
    .sort((a, b) => b[1] - a[1])[0];
  const worst = Object.entries(result.ratings ?? {})
    .filter(([id, rating]) => save.players.some((player) => player.id === id && player.clubId === save.clubId) && rating <= 5.8)
    .sort((a, b) => a[1] - b[1])[0];
  const previousStatement = followUpQuestion(save);
  if (previousStatement) candidates.push(previousStatement);
  if (/final|semifinal/i.test(title)) {
    candidates.push(
      question("season-defining-match", "board", `Después de este partido decisivo, ¿qué significa el resultado para los objetivos del club?`, [
        answer("final-enjoy", "Disfrutar el momento", "Es una noche importante para todos. Mañana veremos cómo seguir, pero hoy hay que valorar lo conseguido.", "El entrenador pone en valor el momento sin prometer de más.", { boardDelta: userWon ? 0.75 : -0.25 }),
        answer("final-next", "Mirar al próximo objetivo", "Esto cuenta, pero no termina nada. Tenemos que recuperar y preparar lo que viene.", "Una respuesta que intenta mantener el foco deportivo.", { boardDelta: 0.5 }),
        answer("final-responsibility", "Asumir el desenlace", "El resultado es responsabilidad de todos, empezando por mí. Vamos a responder como club.", "El entrenador asume el momento ante la prensa.", { boardDelta: 0.75, squadBondDelta: 0.75 }),
        answer("final-club", "Agradecer al club", "El equipo, la afición y el club empujaron juntos. Este resultado nos pertenece a todos.", "El mensaje incluye a la institución y a la hinchada.", { boardDelta: 0.5, squadBondDelta: 1 }),
      ]),
    );
  }
  if (best) {
    const player = save.players.find((item) => item.id === best[0])!;
    candidates.push(playerQuestion("star", player.id, player.name, player.morale, save.season === matchDate.season));
  } else if (worst) {
    const player = save.players.find((item) => item.id === worst[0])!;
    candidates.push(playerQuestion("poor", player.id, player.name, player.morale));
  }
  candidates.push(
    pickUnasked((variant) => boardQuestion(save.board?.confidence ?? 60, variant), recentIds),
    pickUnasked((variant) => roomQuestion(variant), recentIds),
  );
  let questions = candidates.filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);
  const fresh = questions.filter((item) => !recentIds.has(item.id));
  if (fresh.length >= 3) questions = fresh;
  questions = questions.slice(0, important ? 5 : 4);
  if (questions.length < 3) questions = candidates.slice(0, 3);

  return {
    id: uid("press"),
    fixtureId: fixture.id,
    clubId: save.clubId,
    season: matchDate.season,
    week: matchDate.week,
    competition: fixture.competition,
    matchTitle: title || `Partido ${fixture.round}`,
    opponentId,
    score: `${userGoals}–${rivalGoals}`,
    important,
    questions,
    questionIndex: 0,
    responses: [],
  };
}

export function applyPressAnswer(save: GameSave, selected: PressAnswer): string[] {
  const effects: string[] = [];
  const confidence = adjustBoardConfidence(save, selected.boardDelta, "Conferencia de prensa");
  if (confidence !== 0) {
    effects.push(`Confianza de la directiva ${confidence > 0 ? "+" : "−"}${Math.abs(confidence).toFixed(1)}`);
  }

  if (selected.squadBondDelta !== 0) {
    const players = save.players.filter((player) => player.clubId === save.clubId);
    let total = 0;
    for (const player of players) {
      const bond = player.bond ?? { club: 50, squad: 50 };
      const next = clamp(bond.squad + selected.squadBondDelta, 0, 100);
      total += next - bond.squad;
      player.bond = { ...bond, squad: next };
    }
    const average = players.length ? total / players.length : 0;
    if (average !== 0) effects.push(`Vínculo del vestuario ${average > 0 ? "+" : "−"}${Math.abs(average).toFixed(1)}`);
  }

  if (selected.playerId) {
    const player = save.players.find((item) => item.id === selected.playerId && item.clubId === save.clubId);
    if (player) {
      if (selected.playerMoraleDelta) {
        const before = player.morale;
        player.morale = clamp(before + selected.playerMoraleDelta, 20, 100);
        const delta = player.morale - before;
        if (delta !== 0) effects.push(`Ánimo de ${player.name} ${delta > 0 ? "+" : "−"}${Math.abs(delta)}`);
      }
      if (selected.playerClubBondDelta) {
        const bond = player.bond ?? { club: 50, squad: 50 };
        const next = clamp(bond.club + selected.playerClubBondDelta, 0, 100);
        player.bond = { ...bond, club: next };
        const delta = next - bond.club;
        if (delta !== 0) effects.push(`Relación con ${player.name} ${delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)}`);
      }
      if (
        selected.promiseMinutes &&
        !(save.pressPromises ?? []).some((promise) => promise.playerId === player.id)
      ) {
        const promises = (save.pressPromises ??= []);
        promises.push({
          id: uid("press-promise"),
          playerId: player.id,
          season: save.season,
          deadlineWeek: save.week + 6,
          baselineApps: player.apps,
          targetApps: player.apps + 2,
        });
        effects.push(`Compromiso registrado: darle más oportunidades a ${player.name}`);
      }
    }
  }
  return effects;
}

export function settlePressPromises(save: PressPromiseContext) {
  const promises = save.pressPromises ?? [];
  const pending = [];
  for (const promise of promises) {
    if (save.season < promise.season || (save.season === promise.season && save.week < promise.deadlineWeek)) {
      pending.push(promise);
      continue;
    }
    const player = save.players.find((item) => item.id === promise.playerId && item.clubId === save.clubId);
    const response = (save.pressHistory ?? [])
      .flatMap((conference) => conference.responses)
      .find((item) => item.playerId === promise.playerId && item.answerId === "promise-minutes");
    if (!player) {
      if (response) response.effects.push("Compromiso pendiente: el jugador dejó el club antes del plazo");
      continue;
    }
    const kept = player.apps - promise.baselineApps >= promise.targetApps - promise.baselineApps;
    player.morale = clamp(player.morale + (kept ? 2 : -2), 20, 100);
    const bond = player.bond ?? { club: 50, squad: 50 };
    player.bond = { ...bond, club: clamp(bond.club + (kept ? 1 : -1), 0, 100) };
    if (response) {
      response.effects.push(kept
        ? `Compromiso cumplido: ${player.name} alcanzó las oportunidades acordadas`
        : `Compromiso pendiente: ${player.name} no alcanzó las oportunidades acordadas`);
    }
    save.news.unshift({
      id: uid("n"),
      week: save.week,
      tone: kept ? "good" : "bad",
      title: kept ? `Compromiso cumplido: ${player.name}` : `Compromiso pendiente: ${player.name}`,
      body: kept
        ? `Le diste las oportunidades prometidas. Su ánimo y su relación con el club mejoran.`
        : `No alcanzó las oportunidades que le prometiste. Su ánimo y su relación con el club se resienten.`,
    });
  }
  save.pressPromises = pending;
}

function normalizeAnswer(value: unknown): PressAnswer | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<PressAnswer>;
  if (typeof item.id !== "string" || typeof item.label !== "string" || typeof item.text !== "string" || typeof item.reaction !== "string") return null;
  return {
    id: item.id.slice(0, 80),
    label: item.label.slice(0, 100),
    text: item.text.slice(0, 500),
    reaction: item.reaction.slice(0, 250),
    boardDelta: clamp(finite(item.boardDelta), -2, 2),
    squadBondDelta: clamp(finite(item.squadBondDelta), -3, 3),
    ...(typeof item.playerId === "string" ? { playerId: item.playerId } : {}),
    ...(Number.isFinite(item.playerMoraleDelta) ? { playerMoraleDelta: clamp(item.playerMoraleDelta!, -4, 4) } : {}),
    ...(Number.isFinite(item.playerClubBondDelta) ? { playerClubBondDelta: clamp(item.playerClubBondDelta!, -3, 3) } : {}),
    ...(item.promiseMinutes ? { promiseMinutes: true } : {}),
  };
}

function normalizeResponse(value: unknown): PressResponse | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<PressResponse>;
  if (![item.questionId, item.journalist, item.question, item.answerId, item.answer, item.reaction].every((field) => typeof field === "string")) return null;
  return {
    questionId: item.questionId!,
    journalist: item.journalist!,
    question: item.question!,
    answerId: item.answerId!,
    answer: item.answer!,
    reaction: item.reaction!,
    effects: Array.isArray(item.effects) ? item.effects.filter((effect): effect is string => typeof effect === "string").slice(0, 8) : [],
    ...(typeof item.playerId === "string" ? { playerId: item.playerId } : {}),
  };
}

export function normalizePressConference(value: unknown): PressConference | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<PressConference>;
  if (
    typeof item.id !== "string" ||
    typeof item.fixtureId !== "string" ||
    typeof item.clubId !== "string" ||
    typeof item.competition !== "string" ||
    typeof item.matchTitle !== "string" ||
    typeof item.opponentId !== "string" ||
    typeof item.score !== "string" ||
    !Array.isArray(item.questions)
  ) return null;
  const questions = item.questions
    .filter((entry): entry is PressQuestion => Boolean(entry && typeof entry === "object"))
    .map((entry) => ({
      id: typeof entry.id === "string" ? entry.id.slice(0, 100) : "",
      journalist: typeof entry.journalist === "string" ? entry.journalist.slice(0, 100) : "",
      question: typeof entry.question === "string" ? entry.question.slice(0, 500) : "",
      answers: Array.isArray(entry.answers) ? entry.answers.map(normalizeAnswer).filter((answer): answer is PressAnswer => answer !== null).slice(0, 4) : [],
      ...(typeof entry.playerId === "string" ? { playerId: entry.playerId } : {}),
    }))
    .filter((entry) => entry.id && entry.journalist && entry.question && entry.answers.length >= 3)
    .slice(0, 5);
  if (questions.length < 3) return null;
  const responses = Array.isArray(item.responses)
    ? item.responses.map(normalizeResponse).filter((response): response is PressResponse => response !== null).slice(0, questions.length)
    : [];
  return {
    id: item.id,
    fixtureId: item.fixtureId,
    clubId: item.clubId,
    season: Math.max(0, Math.round(finite(item.season))),
    week: Math.max(0, Math.round(finite(item.week))),
    competition: item.competition,
    matchTitle: item.matchTitle.slice(0, 100),
    opponentId: item.opponentId,
    score: item.score.slice(0, 20),
    important: Boolean(item.important),
    questions,
    questionIndex: clamp(Math.round(finite(item.questionIndex)), responses.length, questions.length),
    responses,
  };
}

export function normalizePressFrequency(value: unknown): PressFrequency {
  return value === "important" || value === "off" ? value : "every";
}

export function normalizePressHistory(value: unknown): PressConference[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizePressConference)
    .filter((conference): conference is PressConference => conference !== null && conference.questionIndex >= conference.questions.length)
    .slice(0, 80);
}

export function normalizePressPromises(value: unknown): PressPromise[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is PressPromise => {
      if (!item || typeof item !== "object") return false;
      const promise = item as Partial<PressPromise>;
      return (
        typeof promise.id === "string" &&
        typeof promise.playerId === "string" &&
        Number.isFinite(promise.season) &&
        Number.isFinite(promise.deadlineWeek) &&
        Number.isFinite(promise.baselineApps) &&
        Number.isFinite(promise.targetApps)
      );
    })
    .map((promise) => ({
      id: promise.id.slice(0, 100),
      playerId: promise.playerId,
      season: Math.max(0, Math.round(promise.season)),
      deadlineWeek: Math.max(0, Math.round(promise.deadlineWeek)),
      baselineApps: Math.max(0, Math.round(promise.baselineApps)),
      targetApps: Math.max(0, Math.round(promise.targetApps)),
    }))
    .slice(0, 40);
}
