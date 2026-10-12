import { ArrowLeft, Mic, Newspaper } from "lucide-react";
import { ClubCrest } from "@/components/game/crest";
import { Button } from "@/components/ui/button";
import { clubById } from "@/lib/game/clubs";
import { compLabel } from "@/lib/game/competitions";
import { seasonLabel } from "@/lib/game/format";
import { useGame } from "@/lib/game/store";
import type { PressConference } from "@/lib/game/types";

export function PressConferenceView() {
  const conference = useGame((s) => s.pendingPressConference);
  const answerPressQuestion = useGame((s) => s.answerPressQuestion);
  const finishPressConference = useGame((s) => s.finishPressConference);
  const setScreen = useGame((s) => s.setScreen);

  if (!conference) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-4">
        <p className="text-fg-muted">No hay una conferencia pendiente.</p>
        <Button variant="club" onClick={() => setScreen("office")}>Volver al despacho</Button>
      </main>
    );
  }

  const club = clubById(conference.clubId);
  const opponent = clubById(conference.opponentId);
  const question = conference.questions[conference.questionIndex];
  const previous = conference.responses[conference.responses.length - 1];
  const finished = conference.questionIndex >= conference.questions.length;

  return (
    <main className="min-h-dvh bg-bg px-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <header className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] md:p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-fg-muted">
            <Mic className="size-4 text-primary" />
            Conferencia de prensa
          </div>
          <p className="mt-2 text-xs text-fg-muted">
            {compLabel(conference.competition, club.league)} · {seasonLabel(conference.season)} · {conference.matchTitle}
          </p>
          <div className="mt-5 flex items-center justify-center gap-5">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <ClubCrest club={club} size={44} />
              <span className="text-center text-sm font-medium">{club.name}</span>
            </div>
            <p className="font-display text-4xl font-semibold tabular-nums">{conference.score}</p>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <ClubCrest club={opponent} size={44} />
              <span className="text-center text-sm font-medium">{opponent.name}</span>
            </div>
          </div>
        </header>

        {finished ? (
          <ConferenceSummary conference={conference} onFinish={finishPressConference} onHistory={() => setScreen("press-history")} />
        ) : question ? (
          <>
            <div className="flex items-center justify-between px-1 text-xs text-fg-muted">
              <span>Pregunta {conference.questionIndex + 1} de {conference.questions.length}</span>
              <span className="h-1.5 w-32 overflow-hidden rounded-full bg-elevated">
                <span
                  className="block h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${(conference.questionIndex / conference.questions.length) * 100}%` }}
                />
              </span>
            </div>
            {previous ? <PressReaction response={previous} /> : null}
            <section className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] md:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-primary">{question.journalist} pregunta</p>
              <h1 className="mt-3 font-display text-2xl font-semibold leading-snug md:text-3xl">{question.question}</h1>
              <div className="mt-5 flex flex-col gap-2">
                {question.answers.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => answerPressQuestion(question.id, item.id)}
                    className="flex min-h-14 items-start gap-3 rounded-xl bg-elevated p-4 text-left transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-fg-muted">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-fg-muted">{item.text}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
            <Button variant="ghost" onClick={() => setScreen("press-history")}>
              Ver conferencias anteriores
            </Button>
          </>
        ) : null}
      </div>
    </main>
  );
}

function PressReaction({ response }: { response: PressConference["responses"][number] }) {
  return (
    <aside className="rounded-xl border border-border bg-surface/70 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-muted">Reacción de la prensa</p>
      <p className="mt-1 text-sm">{response.reaction}</p>
    </aside>
  );
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
  return (
    <section className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)] md:p-6">
      <div className="flex items-center gap-2 text-primary">
        <Newspaper className="size-5" />
        <h1 className="font-display text-2xl font-semibold">Así respondió la prensa</h1>
      </div>
      <p className="mt-2 text-sm text-fg-muted">
        Tus declaraciones ya tuvieron efecto. Las relaciones y la confianza cambian de forma gradual.
      </p>
      <ol className="mt-5 flex flex-col gap-3">
        {conference.responses.map((response, index) => (
          <li key={`${response.questionId}-${index}`} className="rounded-xl bg-elevated p-4">
            <p className="text-xs font-medium text-fg-muted">{response.journalist} · {response.question}</p>
            <p className="mt-2 text-sm font-semibold">«{response.answer}»</p>
            <p className="mt-2 text-xs leading-relaxed text-fg-muted">{response.reaction}</p>
            {response.effects.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {response.effects.map((effect, effectIndex) => (
                  <li key={`${effect}-${effectIndex}`} className="rounded-full bg-surface px-3 py-1 text-xs text-fg-muted">
                    {effect}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-fg-muted">Sin cambios directos en las relaciones del club.</p>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button variant="club" size="lg" onClick={onFinish}>Continuar temporada</Button>
        <Button variant="outline" size="lg" onClick={onHistory}>Historial de prensa</Button>
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
        <header>
          <Button variant="ghost" onClick={() => setScreen(pending ? "press" : "office")}>
            <ArrowLeft className="size-4" /> Volver
          </Button>
          <h1 className="mt-3 font-display text-3xl font-semibold">Historial de conferencias</h1>
          <p className="mt-1 text-sm text-fg-muted">Las declaraciones y sus consecuencias quedan guardadas en esta carrera.</p>
        </header>
        {history.length ? (
          history.map((conference) => <HistoryCard key={conference.id} conference={conference} />)
        ) : (
          <section className="rounded-2xl bg-surface p-5 text-sm text-fg-muted shadow-[var(--shadow-border)]">
            Todavía no hay conferencias. Se guardarán aquí después de completar la primera.
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
    <article className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">{club.short} {conference.score} {opponent.short}</h2>
        <span className="text-xs text-fg-muted">{seasonLabel(conference.season)} · {conference.matchTitle}</span>
      </div>
      <p className="mt-1 text-xs text-fg-muted">{compLabel(conference.competition, club.league)}</p>
      <ol className="mt-4 flex flex-col gap-3">
        {conference.responses.map((response, index) => (
          <li key={`${response.questionId}-${index}`} className="border-l-2 border-primary/40 pl-3">
            <p className="text-xs text-fg-muted">{response.journalist}: {response.question}</p>
            <p className="mt-1 text-sm font-medium">«{response.answer}»</p>
            {response.effects.length ? <p className="mt-1 text-xs text-fg-muted">{response.effects.join(" · ")}</p> : null}
          </li>
        ))}
      </ol>
    </article>
  );
}
