import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarClock,
  MessageCircle,
  Mic,
  Newspaper,
  Radio,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ClubCrest } from "@/components/game/crest";
import { PlayerPortrait } from "@/components/game/player-portrait";
import { StadiumIllustration } from "@/components/game/stadium-illustration";
import { Button } from "@/components/ui/button";
import { clubById } from "@/lib/game/clubs";
import { compLabel } from "@/lib/game/competitions";
import { seasonLabel } from "@/lib/game/format";
import { useGame } from "@/lib/game/store";
import type { PressAnswer, PressConference } from "@/lib/game/types";
import { stadiumFor } from "@/lib/game/stadium";

export function PressConferenceView() {
  const conference = useGame((s) => s.pendingPressConference);
  const answerPressQuestion = useGame((s) => s.answerPressQuestion);
  const finishPressConference = useGame((s) => s.finishPressConference);
  const setScreen = useGame((s) => s.setScreen);
  const players = useGame((s) => s.players);
  const pressPromises = useGame((s) => s.pressPromises ?? []);
  const fixtures = useGame((s) => s.fixtures);
  const stadium = useGame((s) => stadiumFor(s).name);

  if (!conference) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-4">
        <p className="text-fg-muted">No hay una conferencia pendiente.</p>
        <Button variant="club" onClick={() => setScreen("office")}>
          Volver al despacho
        </Button>
      </main>
    );
  }

  const club = clubById(conference.clubId);
  const opponent = clubById(conference.opponentId);
  const fixture = fixtures.find((item) => item.id === conference.fixtureId);
  const venue =
    fixture?.homeId === conference.clubId
      ? stadium
      : clubById(fixture?.homeId ?? conference.clubId).stadium;
  const question = conference.questions[conference.questionIndex];
  const previous = conference.responses[conference.responses.length - 1];
  const finished = conference.questionIndex >= conference.questions.length;
  const focusedPlayer = question?.playerId
    ? players.find((player) => player.id === question.playerId)
    : undefined;
  const ownedPlayerIds = new Set(
    players
      .filter((player) => player.clubId === conference.clubId)
      .map((player) => player.id),
  );
  const promisedPlayerIds = new Set(
    pressPromises.map((promise) => promise.playerId),
  );
  const scoreParts = conference.score.match(/^(\d+)\s*[–-]\s*(\d+)$/);
  const homeGoals = scoreParts ? Number(scoreParts[1]) : null;
  const awayGoals = scoreParts ? Number(scoreParts[2]) : null;
  const outcome =
    homeGoals === null || awayGoals === null
      ? "Resultado"
      : homeGoals === awayGoals
        ? "Empate"
        : homeGoals > awayGoals
          ? "Victoria"
          : "Derrota";

  return (
    <main className="min-h-dvh overflow-hidden bg-bg px-4 py-6 md:py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <StadiumIllustration club={club} stadium={venue || club.stadium} />
        <header className="press-card-enter overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-border)]">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-elevated px-4 py-3 md:px-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]">
              <Mic className="size-4 text-primary" />
              Sala de prensa
            </div>
            <span className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              <Radio className="size-3.5" />
              En directo
            </span>
          </div>
          <div className="p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-fg-muted">
              <span>
                {compLabel(conference.competition, club.league)} ·{" "}
                {seasonLabel(conference.season)}
              </span>
              <span>{conference.matchTitle}</span>
            </div>
            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6">
              <div className="flex min-w-0 items-center gap-3">
                <ClubCrest club={club} size={48} />
                <span className="min-w-0 text-sm font-semibold leading-tight md:text-base">
                  {club.name}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <p className="font-display text-4xl font-bold tabular-nums tracking-wide md:text-5xl">
                  {conference.score}
                </p>
                <span
                  className={`mt-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                    outcome === "Victoria"
                      ? "bg-good/15 text-good"
                      : outcome === "Derrota"
                        ? "bg-bad/15 text-bad"
                        : "bg-warn/15 text-warn"
                  }`}
                >
                  {outcome}
                </span>
              </div>
              <div className="flex min-w-0 items-center justify-end gap-3 text-right">
                <span className="min-w-0 text-sm font-semibold leading-tight md:text-base">
                  {opponent.name}
                </span>
                <ClubCrest club={opponent} size={48} />
              </div>
            </div>
          </div>
        </header>

        {finished ? (
          <ConferenceSummary
            conference={conference}
            onFinish={finishPressConference}
            onHistory={() => setScreen("press-history")}
          />
        ) : question ? (
          <>
            <div className="rounded-2xl border border-border bg-surface px-4 py-3">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-fg">Rueda de prensa</span>
                <span className="tabular-nums text-fg-muted">
                  Pregunta {conference.questionIndex + 1} de{" "}
                  {conference.questions.length}
                </span>
              </div>
              <div
                className="mt-3 flex gap-1.5"
                role="progressbar"
                aria-label="Progreso de la conferencia"
                aria-valuemin={0}
                aria-valuemax={conference.questions.length}
                aria-valuenow={conference.questionIndex}
              >
                {conference.questions.map((item, index) => (
                  <span
                    key={item.id}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      index < conference.questionIndex
                        ? "bg-primary"
                        : index === conference.questionIndex
                          ? "bg-primary/55"
                          : "bg-elevated"
                    }`}
                  />
                ))}
              </div>
            </div>
            {previous ? <PressReaction response={previous} /> : null}
            <section
              key={question.id}
              className="press-card-enter rounded-3xl border border-border bg-surface p-4 shadow-[var(--shadow-border)] md:p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Newspaper className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{question.journalist}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-muted">
                    Pregunta de la conferencia
                  </p>
                </div>
                {focusedPlayer ? (
                  <span className="flex max-w-48 min-w-0 items-center gap-2 rounded-full bg-elevated py-1 pl-1 pr-3">
                    <PlayerPortrait
                      player={focusedPlayer}
                      size="row"
                      className="size-8 rounded-full"
                    />
                    <span className="truncate text-xs text-fg-muted">
                      {focusedPlayer.name}
                    </span>
                  </span>
                ) : null}
              </div>
              <h1 className="mt-5 font-display text-2xl font-semibold leading-snug md:text-3xl">
                {question.question}
              </h1>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.14em] text-fg-muted">
                Elegí tu respuesta · impacto posible en la carrera
              </p>
              <div className="mt-5 flex flex-col gap-3">
                {question.answers.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => answerPressQuestion(question.id, item.id)}
                    className="group flex min-h-16 items-start gap-3 rounded-2xl border border-border bg-elevated p-4 text-left transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/5 hover:shadow-[var(--shadow-border-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-0"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface font-display text-base font-bold text-fg-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-fg-muted">
                        {item.text}
                      </span>
                      <span className="mt-3 flex flex-wrap gap-1.5">
                        {answerSignals(
                          item,
                          ownedPlayerIds.has(item.playerId ?? ""),
                          promisedPlayerIds.has(item.playerId ?? ""),
                        ).map(({ label, tone, Icon }) => (
                          <span
                            key={label}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                              tone === "good"
                                ? "bg-good/10 text-good"
                                : tone === "bad"
                                  ? "bg-bad/10 text-bad"
                                  : "bg-surface text-fg-muted"
                            }`}
                          >
                            <Icon className="size-3" />
                            {label}
                          </span>
                        ))}
                      </span>
                    </span>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-fg-subtle transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                  </button>
                ))}
              </div>
            </section>
            <Button
              variant="ghost"
              className="self-center"
              onClick={() => setScreen("press-history")}
            >
              Ver conferencias anteriores
            </Button>
          </>
        ) : null}
      </div>
    </main>
  );
}

function PressReaction({
  response,
}: {
  response: PressConference["responses"][number];
}) {
  return (
    <aside
      className="press-card-enter rounded-2xl border border-primary/20 bg-primary/5 p-4"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-primary">
        <MessageCircle className="size-4" />
        <p className="text-[11px] font-bold uppercase tracking-[0.14em]">
          La sala reacciona
        </p>
      </div>
      <p className="mt-2 text-sm leading-relaxed">{response.reaction}</p>
      {response.effects.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {response.effects.map((effect, index) => (
            <span
              key={`${effect}-${index}`}
              className="rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] font-medium text-fg-muted"
            >
              {effect}
            </span>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

function answerSignals(
  answer: PressAnswer,
  ownsTargetPlayer: boolean,
  hasActivePromise: boolean,
): Array<{
  label: string;
  tone: "good" | "bad" | "neutral";
  Icon: LucideIcon;
}> {
  const signals: Array<{
    label: string;
    tone: "good" | "bad" | "neutral";
    Icon: LucideIcon;
  }> = [];
  if (answer.boardDelta !== 0) {
    signals.push({
      label: `Directiva ${answer.boardDelta > 0 ? "+" : "−"}`,
      tone: answer.boardDelta > 0 ? "good" : "bad",
      Icon: Building2,
    });
  }
  if (answer.squadBondDelta !== 0) {
    signals.push({
      label: `Vestuario ${answer.squadBondDelta > 0 ? "+" : "−"}`,
      tone: answer.squadBondDelta > 0 ? "good" : "bad",
      Icon: UsersRound,
    });
  }
  if (ownsTargetPlayer && answer.playerMoraleDelta) {
    signals.push({
      label: `Ánimo ${answer.playerMoraleDelta > 0 ? "+" : "−"}`,
      tone: answer.playerMoraleDelta > 0 ? "good" : "bad",
      Icon: UserRound,
    });
  }
  if (ownsTargetPlayer && answer.playerClubBondDelta) {
    signals.push({
      label: `Relación ${answer.playerClubBondDelta > 0 ? "+" : "−"}`,
      tone: answer.playerClubBondDelta > 0 ? "good" : "bad",
      Icon: UserRound,
    });
  }
  if (ownsTargetPlayer && answer.promiseMinutes) {
    signals.push({
      label: hasActivePromise ? "Promesa ya activa" : "Promesa de minutos",
      tone: "neutral",
      Icon: CalendarClock,
    });
  }
  return signals.length
    ? signals
    : [{ label: "Solo cambia el tono", tone: "neutral", Icon: MessageCircle }];
}

function ConferenceSummary({
  conference,
  onFinish,
  onHistory,
}: {
  conference: PressConference;
  onFinish: () => void;
  onHistory: () => void;
}) {
  const answersWithEffects = conference.responses.filter(
    (response) => response.effects.length,
  ).length;
  return (
    <section className="press-card-enter overflow-hidden rounded-3xl border border-border bg-surface shadow-[var(--shadow-border)]">
      <div className="border-b border-border bg-elevated p-5 md:p-6">
        <div className="flex items-center gap-3 text-primary">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/10">
            <Newspaper className="size-5" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em]">
              Titulares del día
            </p>
            <h1 className="font-display text-2xl font-semibold text-fg md:text-3xl">
              Así respondió la prensa
            </h1>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">
          La sala ya tiene el eco de cada respuesta. Revisá qué efectos llegaron
          al vestuario y a la directiva.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-fg-muted">
            {conference.responses.length} respuestas
          </span>
          <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-fg-muted">
            {answersWithEffects} con impacto en la carrera
          </span>
        </div>
      </div>
      <div className="p-4 md:p-6">
        <ol className="flex flex-col gap-3">
          {conference.responses.map((response, index) => (
            <li
              key={`${response.questionId}-${index}`}
              className="rounded-2xl border border-border bg-elevated p-4 md:p-5"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-surface font-display text-sm font-bold text-fg-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-fg-muted">
                    {response.journalist} pregunta
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                    {response.question}
                  </p>
                  <p className="mt-3 text-sm font-semibold leading-relaxed">
                    «{response.answer}»
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-fg-muted">
                    {response.reaction}
                  </p>
                  {response.effects.length ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {response.effects.map((effect, effectIndex) => (
                        <li
                          key={`${effect}-${effectIndex}`}
                          className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-fg-muted"
                        >
                          {effect}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-fg-subtle">
                      Sin cambios directos en las relaciones del club.
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button variant="club" size="lg" onClick={onFinish}>
            Continuar temporada
          </Button>
          <Button variant="outline" size="lg" onClick={onHistory}>
            Historial de prensa
          </Button>
        </div>
      </div>
    </section>
  );
}

export function PressHistoryView() {
  const history = useGame((s) => s.pressHistory ?? []);
  const pending = useGame((s) => s.pendingPressConference);
  const setScreen = useGame((s) => s.setScreen);

  return (
    <main className="min-h-dvh bg-bg px-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <header className="rounded-2xl border border-border bg-surface p-4 md:p-5">
          <Button
            variant="ghost"
            onClick={() => setScreen(pending ? "press" : "office")}
          >
            <ArrowLeft className="size-4" /> Volver
          </Button>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Newspaper className="size-5" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold md:text-3xl">
                Archivo de prensa
              </h1>
              <p className="mt-1 text-sm text-fg-muted">
                Cada declaración y sus consecuencias, guardadas en esta carrera.
              </p>
            </div>
          </div>
        </header>
        {history.length ? (
          history.map((conference) => (
            <HistoryCard key={conference.id} conference={conference} />
          ))
        ) : (
          <section className="rounded-2xl bg-surface p-5 text-sm text-fg-muted shadow-[var(--shadow-border)]">
            Todavía no hay conferencias. Se guardarán aquí después de completar
            la primera.
          </section>
        )}
      </div>
    </main>
  );
}

function HistoryCard({ conference }: { conference: PressConference }) {
  const club = clubById(conference.clubId);
  const opponent = clubById(conference.opponentId);
  return (
    <article className="press-card-enter rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">
          {club.short} {conference.score} {opponent.short}
        </h2>
        <span className="text-xs text-fg-muted">
          {seasonLabel(conference.season)} · {conference.matchTitle}
        </span>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-fg-muted">
        <Newspaper className="size-3.5" />
        {compLabel(conference.competition, club.league)}
      </p>
      <ol className="mt-4 flex flex-col gap-3">
        {conference.responses.map((response, index) => (
          <li
            key={`${response.questionId}-${index}`}
            className="border-l-2 border-primary/40 pl-3"
          >
            <p className="text-xs text-fg-muted">
              {response.journalist}: {response.question}
            </p>
            <p className="mt-1 text-sm font-medium">«{response.answer}»</p>
            {response.effects.length ? (
              <p className="mt-1 text-xs text-fg-muted">
                {response.effects.join(" · ")}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </article>
  );
}
