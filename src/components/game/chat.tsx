import { useEffect, useMemo, useState } from "react";
import { Check, Crown, MessageCircle, Send } from "lucide-react";
import { ClubCrest } from "@/components/game/crest";
import { Negotiation } from "@/components/game/negotiation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { clubById } from "@/lib/game/clubs";
import { formatWage, POS_LABEL, seasonLabel } from "@/lib/game/format";
import { useGame } from "@/lib/game/store";
import type { PlayerChatThread } from "@/lib/game/types";

function tier(value: number) {
  if (value >= 95) return "Leyenda del club";
  if (value >= 80) return "Gran ídolo";
  if (value >= 60) return "Ídolo del club";
  if (value >= 40) return "Apreciado";
  if (value >= 20) return "Querido por algunos";
  return "Poco reconocido";
}

function messageDate(season: number, week: number) {
  return `${seasonLabel(season)} · Jornada ${week + 1}`;
}

export function ChatView() {
  const chats = useGame((s) => s.playerChats ?? []);
  const players = useGame((s) => s.players);
  const clubId = useGame((s) => s.clubId);
  const resolveChoice = useGame((s) => s.resolvePlayerChatChoice);
  const markRead = useGame((s) => s.markPlayerChatRead);
  const addChatNote = useGame((s) => s.addPlayerChatNote);
  const [selectedId, setSelectedId] = useState<string | null>(() => chats[0]?.id ?? null);
  const [renewal, setRenewal] = useState<{ playerId: string; threadId: string } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const selected = chats.find((thread) => thread.id === selectedId) ?? null;
  const player = selected ? players.find((item) => item.id === selected.playerId) : undefined;
  const ownerClub = player ? clubById(player.clubId) : null;

  const ordered = useMemo(() => [...chats].sort((a, b) => b.season - a.season || b.week - a.week), [chats]);

  useEffect(() => {
    if (selected?.unread) markRead(selected.id);
  }, [selected?.id, selected?.unread, markRead]);

  useEffect(() => {
    if (!chats.length) {
      setSelectedId(null);
    } else if (!selectedId || !chats.some((thread) => thread.id === selectedId)) {
      setSelectedId(chats[0]!.id);
    }
  }, [chats, selectedId]);

  function choose(thread: PlayerChatThread, choiceId: string) {
    const result = resolveChoice(thread.id, choiceId);
    if (result.error) {
      setStatus(result.error);
      return;
    }
    setStatus(null);
    if (result.openRenewal && result.playerId) {
      setRenewal({ playerId: result.playerId, threadId: thread.id });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-fg-muted">Vestuario · Mensajes guardados</p>
        <h2 className="mt-1 font-display text-3xl font-semibold">Chat</h2>
        <p className="mt-1 text-sm text-fg-muted">Escuchá a tus jugadores, elegí cómo responder y seguí las promesas que asumiste.</p>
      </header>

      <div className="grid min-h-[560px] gap-3 md:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-display text-lg font-semibold">Conversaciones</h3>
            <span className="text-xs tabular-nums text-fg-muted">{chats.length}</span>
          </div>
          {ordered.length ? (
            <div className="max-h-[42dvh] divide-y divide-border/70 overflow-y-auto md:max-h-[640px]">
              {ordered.map((thread) => {
                const member = players.find((item) => item.id === thread.playerId);
                const club = member ? clubById(member.clubId) : null;
                const latest = thread.messages.at(-1);
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(thread.id);
                      setStatus(null);
                    }}
                    className={cn(
                      "flex min-h-[76px] w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-fg/5",
                      selectedId === thread.id && "bg-fg/7",
                    )}
                  >
                    {club ? <ClubCrest club={club} size={34} /> : <span className="flex size-[34px] items-center justify-center rounded-full bg-fg/8 text-xs">?</span>}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">{member?.name ?? "Jugador no disponible"}</span>
                        {thread.unread ? <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Mensaje sin leer" /> : null}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-fg-muted">{latest?.body ?? "Conversación sin mensajes"}</span>
                      <span className="mt-1 block text-[10px] text-fg-muted">{messageDate(thread.season, thread.week)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <MessageCircle className="size-8 text-fg-muted" />
              <p className="mt-3 font-medium">Todavía no hay mensajes</p>
              <p className="mt-1 text-sm text-fg-muted">Los jugadores podrán escribirte tras partidos o cuando surja una situación importante.</p>
            </div>
          )}
        </aside>

        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
          {selected ? (
            <>
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                {ownerClub ? <ClubCrest club={ownerClub} size={38} /> : <span className="flex size-[38px] items-center justify-center rounded-full bg-fg/8 text-sm">?</span>}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-xl font-semibold">{player?.name ?? "Jugador no disponible"}</h3>
                  <p className="truncate text-xs text-fg-muted">
                    {player ? `${POS_LABEL[player.pos]} · ${ownerClub?.name ?? "Club no disponible"}` : "El futbolista ya no pertenece a esta partida"}
                  </p>
                </div>
                {selected.resolved ? (
                  <span className="flex items-center gap-1 rounded-full bg-good/10 px-2.5 py-1 text-xs text-good">
                    <Check className="size-3.5" /> Respondido
                  </span>
                ) : (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">Pendiente</span>
                )}
              </div>

              {player ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border/70 px-4 py-2 text-xs text-fg-muted">
                  <span>Moral {player.morale}/100</span>
                  <span>Salario {formatWage(player.wage)}</span>
                  <span className="inline-flex items-center gap-1">
                    <Crown className="size-3.5 text-comp-uel" /> {tier(player.fanIdol ?? 0)} · {player.fanIdol ?? 0}/100
                  </span>
                </div>
              ) : null}

              <div className="flex min-h-48 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
                {selected.messages.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      item.sender === "player"
                        ? "self-start rounded-bl-sm bg-elevated"
                        : item.sender === "manager"
                          ? "self-end rounded-br-sm bg-primary/10"
                          : "max-w-full self-center bg-fg/5 text-center text-xs text-fg-muted",
                    )}
                  >
                    {item.sender !== "system" ? (
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-fg-muted">
                        {item.sender === "player" ? player?.name ?? "Jugador" : "Vos"} · {messageDate(item.season, item.week)}
                      </p>
                    ) : null}
                    <p>{item.body}</p>
                  </div>
                ))}
              </div>

              {selected.choices.length && !selected.resolved ? (
                <div className="border-t border-border px-4 py-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-fg-muted">Elegí tu respuesta</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selected.choices.map((choice) => (
                      <Button
                        key={choice.id}
                        variant="outline"
                        className="h-auto min-h-12 justify-start whitespace-normal py-2.5 text-left"
                        disabled={!player || player.clubId !== clubId}
                        onClick={() => choose(selected, choice.id)}
                      >
                        <span className="flex items-start gap-2">
                          <Send className="mt-0.5 size-3.5 shrink-0 text-fg-muted" />
                          <span>{choice.label}</span>
                        </span>
                      </Button>
                    ))}
                  </div>
                  {status ? <p role="status" className="mt-2 text-sm text-bad">{status}</p> : null}
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex min-h-72 flex-1 flex-col items-center justify-center px-6 text-center">
              <MessageCircle className="size-9 text-fg-muted" />
              <p className="mt-3 font-medium">Seleccioná una conversación</p>
              <p className="mt-1 text-sm text-fg-muted">Los mensajes anteriores permanecen guardados durante toda la carrera.</p>
            </div>
          )}
        </section>
      </div>

      {renewal ? (
        <Negotiation
          key={renewal.playerId}
          playerId={renewal.playerId}
          kind="renew"
          onClose={() => setRenewal(null)}
          onDone={(result) => {
            addChatNote(renewal.threadId, result);
            setStatus(result);
          }}
        />
      ) : null}
    </div>
  );
}
