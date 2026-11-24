import { memo, useCallback, useMemo, useState, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { ClubCrest } from "@/components/game/crest";
import { PlayerPortrait } from "@/components/game/player-portrait";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { clubById } from "@/lib/game/clubs";
import {
  ROLES,
  ROLE_LABEL,
  buildDemand,
  changedFields,
  clauseOf,
  contractEndLabel,
  moodLabel,
  renewedContract,
  openNegotiation,
  submitOffer,
  suggestedOffer,
  MAX_YEARS,
  type NegotiationCtx,
  type NegotiationKind,
} from "@/lib/game/contracts";
import { FREE_AGENT } from "@/lib/game/free-agents";
import {
  POS_LABEL,
  formatMoney,
  formatWage,
  ovrClass,
} from "@/lib/game/format";
import { useGame } from "@/lib/game/store";
import {
  askPrice,
  findMarketPlayerInLists,
  transferFee,
} from "@/lib/game/transfers";
import type { ContractRole, ContractTerms, Player } from "@/lib/game/types";

const STEPS = [
  250, 500, 1000, 2000, 5000, 10_000, 20_000, 50_000, 100_000, 250_000, 500_000,
  1_000_000, 2_000_000, 5_000_000, 10_000_000,
];

function niceStep(ref: number) {
  const target = Math.max(250, ref * 0.04);
  let best = STEPS[0]!;
  for (const s of STEPS)
    if (Math.abs(s - target) < Math.abs(best - target)) best = s;
  return best;
}

/** Jugadores que se negociaron y cortaron: no vuelven a la mesa hasta la semana siguiente. */
const coolDown = new Map<string, number>();

const YELLOW =
  "bg-comp-uel/20 text-comp-uel shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-comp-uel)_55%,transparent)]";

function Track({ value, reference }: { value: number; reference: number }) {
  const max = Math.max(reference * 2, 1);
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="relative mt-1.5 h-1 rounded-full bg-fg/10">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-fg/45"
        style={{ width: `${pct}%` }}
      />
      <div
        className="absolute -top-0.5 h-2 w-0.5 bg-fg"
        style={{ left: "50%" }}
        title="Valor base"
      />
    </div>
  );
}

function StepBtn({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex size-8 items-center justify-center rounded-md bg-fg/8 text-sm font-medium tabular-nums text-fg hover:bg-fg/14 disabled:opacity-30"
    >
      {label}
    </button>
  );
}

type StepKey =
  | "wage"
  | "signingBonus"
  | "releaseClause"
  | "goalBonus"
  | "assistBonus"
  | "appBonus"
  | "titleBonus";

const Row = memo(function Row({
  label,
  display,
  reference,
  value,
  refValue,
  changed,
  disabled,
  onStep,
  hint,
}: {
  label: string;
  display: string;
  reference?: string;
  value?: number;
  refValue?: number;
  changed: boolean;
  disabled?: boolean;
  onStep: (dir: -5 | -1 | 1 | 5) => void;
  hint?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-surface px-3 py-2.5 transition-colors",
        changed && YELLOW,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-fg-muted">
            {label}
          </p>
          <p className="font-display text-2xl tabular-nums leading-none">
            {display}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <StepBtn label="−−" onClick={() => onStep(-5)} disabled={disabled} />
          <StepBtn label="−" onClick={() => onStep(-1)} disabled={disabled} />
          <StepBtn label="+" onClick={() => onStep(1)} disabled={disabled} />
          <StepBtn label="++" onClick={() => onStep(5)} disabled={disabled} />
        </div>
      </div>
      {value !== undefined && refValue ? (
        <Track value={value} reference={refValue} />
      ) : null}
      {reference || hint ? (
        <p className="mt-1 text-[11px] text-fg-muted">
          {reference ? `Valor base ${reference}` : null}
          {reference && hint ? " · " : null}
          {hint}
        </p>
      ) : null}
    </div>
  );
});

function Optional({
  label,
  on,
  onToggle,
  changed,
  children,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
  changed: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm shadow-[var(--shadow-border)]",
          on ? "bg-fg/8" : "bg-transparent text-fg-muted",
          changed && YELLOW,
        )}
      >
        <span>{label}</span>
        <span className="text-xs">{on ? "Incluida" : "No incluida"}</span>
      </button>
      {on ? children : null}
    </div>
  );
}

export function Negotiation({
  playerId,
  kind,
  onClose,
  onDone,
  onBudgetFailure,
}: {
  playerId: string;
  kind: NegotiationKind;
  onClose: () => void;
  onDone: (msg: string, signedPlayer: Player | null) => void;
  onBudgetFailure?: (
    player: Player,
    required: number,
    available: number,
  ) => void;
}) {
  const save = useGame(
    useShallow((s) => ({
      players: s.players,
      freeAgents: s.freeAgents,
      clubId: s.clubId,
      budget: s.budget,
      slot: s.slot,
      week: s.week,
      season: s.season,
    })),
  );
  const signPlayer = useGame((s) => s.signPlayer);
  const renewPlayer = useGame((s) => s.renewPlayer);
  const players = save.players;
  const freeAgents = save.freeAgents;

  const found = useMemo(
    () =>
      kind === "sign"
        ? findMarketPlayerInLists(players, freeAgents, playerId)
        : null,
    [kind, playerId, players, freeAgents],
  );
  const player = useMemo(
    () =>
      kind === "sign"
        ? found?.player
        : players.find((p) => p.id === playerId),
    [kind, playerId, found, players],
  );
  const freeAgent = kind === "sign" ? Boolean(found?.free) : false;

  const ctx: NegotiationCtx = useMemo(
    () => ({ kind, clubId: save.clubId, freeAgent }),
    [kind, save.clubId, freeAgent],
  );

  // La negociación se arma una vez; no cambia si el estado del juego se actualiza detrás del popup.
  const [setup] = useState(() => {
    if (!player) return null;
    const currentSave = useGame.getState();
    const demand = buildDemand(currentSave, player, ctx);
    const blocked = coolDown.get(`${save.slot}:${player.id}`) === save.week;
    const state = openNegotiation(demand, player, kind);
    if (blocked) {
      state.status = "broken";
      state.message = `${player.name} no quiere volver a hablar hasta la semana que viene.`;
    }
    const start = suggestedOffer(demand);
    if (kind === "renew") start.wage = Math.max(start.wage, player.wage);
    return { demand, state, start };
  });

  const [state, setState] = useState(setup?.state ?? null);
  const [offer, setOffer] = useState<ContractTerms | null>(
    setup?.start ?? null,
  );
  const [touched, setTouched] = useState<Set<keyof ContractTerms>>(new Set());
  const [payClause, setPayClause] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mark = useCallback((k: keyof ContractTerms) => {
    setTouched((current) => {
      if (current.has(k)) return current;
      const next = new Set(current);
      next.add(k);
      return next;
    });
  }, []);
  const patch = useCallback((
    k: keyof ContractTerms,
    v: ContractTerms[keyof ContractTerms],
  ) => {
    mark(k);
    setOffer((current) =>
      current ? ({ ...current, [k]: v } as ContractTerms) : current,
    );
  }, [mark]);
  const stepYears = useCallback((dir: -5 | -1 | 1 | 5) => {
    mark("years");
    setOffer((current) =>
      current
        ? {
            ...current,
            years: Math.max(
              1,
              Math.min(MAX_YEARS, current.years + Math.sign(dir)),
            ),
          }
        : current,
    );
  }, [mark]);
  const reference = setup?.demand.reference;
  const wageStepV = reference ? niceStep(reference.wage) : STEPS[0]!;
  const stepHandlers = useMemo(() => {
    const makeStep = (key: StepKey, step: number) =>
      (dir: -5 | -1 | 1 | 5) => {
        mark(key);
        setOffer((current) =>
          current
            ? ({
                ...current,
                [key]: Math.max(0, Number(current[key] ?? 0) + dir * step),
              } as ContractTerms)
            : current,
        );
      };
    return {
      wage: makeStep("wage", wageStepV),
      signingBonus: makeStep(
        "signingBonus",
        niceStep((reference?.signingBonus ?? 0) * 0.5),
      ),
      releaseClause: makeStep(
        "releaseClause",
        niceStep(reference?.releaseClause ?? 0),
      ),
      goalBonus: makeStep("goalBonus", niceStep(reference?.goalBonus ?? 0)),
      assistBonus: makeStep("assistBonus", niceStep(reference?.assistBonus ?? 0)),
      appBonus: makeStep("appBonus", niceStep(reference?.appBonus ?? 0)),
      titleBonus: makeStep("titleBonus", niceStep(reference?.titleBonus ?? 0)),
    };
  }, [mark, reference, wageStepV]);
  const wageBillBase = useMemo(() => {
    let total = 0;
    for (const p of save.players) {
      if (p.clubId === save.clubId && p.id !== playerId) total += p.wage;
    }
    return total;
  }, [save.players, save.clubId, playerId]);

  if (!player || !setup || !state || !offer) return null;
  const { demand } = setup;
  const ref = demand.reference;
  const club = clubById(save.clubId);
  const from =
    player.clubId === FREE_AGENT || freeAgent ? null : clubById(player.clubId);
  const clause = clauseOf(player);
  const open = state.status === "open";
  const yellow = changedFields(state.lastOffer, state.counter);

  const isYellow = (k: keyof ContractTerms) =>
    open && yellow.has(k) && !touched.has(k);

  const fee =
    kind === "sign"
      ? transferFee(player, freeAgent, payClause, offer.sellOnPct)
      : 0;
  const total = fee + offer.signingBonus;
  const costFor = (terms: ContractTerms) =>
    kind === "sign"
      ? transferFee(player, freeAgent, payClause, terms.sellOnPct) +
        terms.signingBonus
      : 0;
  const overBudgetFor = (terms: ContractTerms) =>
    kind === "sign" && save.budget < costFor(terms);
  const wageBill = wageBillBase + offer.wage;
  const overBudget = save.budget < total;

  const send = () => {
    if (!open) return;
    const next = submitOffer(state, offer, player, demand, ctx);
    setState(next);
    setTouched(new Set());
    setError(null);
    if (next.status === "broken")
      coolDown.set(`${save.slot}:${player.id}`, save.week);
    if (next.status === "open" && next.counter) setOffer(next.counter);
  };

  const finalize = (terms: ContractTerms) => {
    if (overBudgetFor(terms)) {
      if (onBudgetFailure) {
        onBudgetFailure(player, costFor(terms), save.budget);
        return;
      }
      setError(
        `Tu oferta no puede ser alcanzada porque no tienes presupuesto suficiente para este fichaje. Necesitas ${formatMoney(costFor(terms))} y tienes ${formatMoney(save.budget)}.`,
      );
      return;
    }
    const err =
      kind === "sign"
        ? signPlayer(player.id, terms, payClause)
        : renewPlayer(player.id, terms);
    if (err) {
      setError(err);
      return;
    }
    const committedPlayer =
      useGame
        .getState()
        .players.find((candidate) => candidate.id === player.id) ?? player;
    onDone(
      kind === "sign"
        ? `${player.name} firma con tu club.`
        : `${player.name} renueva hasta el 30 jun ${save.season + renewedContract(player, terms.years)}.`,
      committedPlayer,
    );
    onClose();
  };

  const bonusOn = (
    k: "goalBonus" | "assistBonus" | "appBonus" | "titleBonus",
  ) => offer[k] > 0;
  const toggleBonus = (
    k: "goalBonus" | "assistBonus" | "appBonus" | "titleBonus",
    base: number,
  ) => patch(k, bonusOn(k) ? 0 : base);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-elevated shadow-[var(--shadow-border)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto p-4 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <PlayerPortrait player={player} size="list" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-fg-muted">
                  {kind === "renew"
                    ? "Renovación"
                    : freeAgent
                      ? "Agente libre"
                      : "Fichaje"}
                </p>
                <p className="truncate font-display text-3xl font-semibold leading-none">
                  {player.name}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-fg-muted">
                  {from ? <ClubCrest club={from} size={16} /> : null}
                  {POS_LABEL[player.pos]} · {player.age} años · POT {player.pot}
                  {from ? ` · ${from.short}` : ""}
                </p>
              </div>
            </div>
            <p
              className={cn(
                "font-display text-5xl tabular-nums leading-none",
                ovrClass(player.ovr),
              )}
            >
              {player.ovr}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded-full bg-fg/8 px-2 py-1">
              Ronda {Math.min(state.round + (open ? 1 : 0), state.maxRounds)}/
              {state.maxRounds}
            </span>
            <span className="rounded-full bg-fg/8 px-2 py-1">
              {demand.interest === 0
                ? "Sin otros clubes"
                : `${demand.interest} club${demand.interest > 1 ? "es" : ""} interesado${demand.interest > 1 ? "s" : ""}`}
            </span>
            <span className="rounded-full bg-fg/8 px-2 py-1">
              Espera ser {ROLE_LABEL[demand.expectedRole].toLowerCase()}
            </span>
            {kind === "renew" ? (
              <span className="rounded-full bg-fg/8 px-2 py-1">
                Hoy: {formatWage(player.wage)} · vence{" "}
                {contractEndLabel(save.season, player)}
              </span>
            ) : null}
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-fg-muted">
              <span>Satisfacción</span>
              <span>{moodLabel(state.mood)}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-fg/10">
              <div
                className="h-full rounded-full transition-all duration-[var(--motion-slow)]"
                style={{
                  width: `${Math.max(4, state.mood)}%`,
                  background:
                    state.mood >= 75
                      ? "var(--color-good)"
                      : state.mood >= 40
                        ? "var(--color-warn)"
                        : "var(--color-bad)",
                }}
              />
            </div>
          </div>

          <p
            className={cn(
              "mt-3 rounded-xl px-3 py-2 text-sm",
              state.status === "accepted"
                ? "bg-good/15 text-good"
                : state.status === "broken" || state.status === "expired"
                  ? "bg-bad/15 text-bad"
                  : "bg-surface text-fg-muted",
            )}
          >
            {state.message}
          </p>

          {kind === "sign" ? (
            <div className="mt-3 rounded-xl bg-surface px-3 py-2.5 text-sm">
              {freeAgent ? (
                <p className="text-fg-muted">
                  Agente libre: no hay traspaso, solo el contrato y la prima de
                  firma.
                </p>
              ) : (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-fg-muted">
                      Traspaso a {from?.short}
                    </span>
                    <span className="font-display text-2xl tabular-nums">
                      {formatMoney(fee)}
                    </span>
                  </div>
                  {clause ? (
                    <button
                      type="button"
                      onClick={() => setPayClause((v) => !v)}
                      disabled={!open}
                      className={cn(
                        "mt-2 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs shadow-[var(--shadow-border)]",
                        payClause ? "bg-fg/10" : "",
                      )}
                    >
                      <span>Pagar la cláusula de rescisión</span>
                      <span className="tabular-nums">
                        {formatMoney(clause)} · {payClause ? "sí" : "no"}{" "}
                        (pedido {formatMoney(askPrice(player))})
                      </span>
                    </button>
                  ) : (
                    <p className="mt-1 text-[11px] text-fg-muted">
                      Sin cláusula: se paga lo que pide el club.
                    </p>
                  )}
                  {!payClause ? (
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-fg-muted">
                        Reventa para {from?.short}: cada 10% baja el traspaso 5%
                      </span>
                      <span className="flex items-center gap-1">
                        <StepBtn
                          label="−"
                          onClick={() =>
                            patch("sellOnPct", Math.max(0, offer.sellOnPct - 5))
                          }
                          disabled={!open}
                        />
                        <span className="w-10 text-center tabular-nums">
                          {offer.sellOnPct}%
                        </span>
                        <StepBtn
                          label="+"
                          onClick={() =>
                            patch(
                              "sellOnPct",
                              Math.min(30, offer.sellOnPct + 5),
                            )
                          }
                          disabled={!open}
                        />
                      </span>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ) : null}

          <div className="mt-3 flex flex-col gap-2">
            <Row
              label="Sueldo semanal"
              display={formatWage(offer.wage)}
              reference={formatWage(ref.wage)}
              value={offer.wage}
              refValue={ref.wage}
              changed={isYellow("wage")}
              disabled={!open}
              onStep={stepHandlers.wage}
            />
            <Row
              label="Años de contrato"
              display={`${offer.years} año${offer.years > 1 ? "s" : ""} · hasta 30 jun ${save.season + (kind === "renew" ? renewedContract(player, offer.years) : offer.years)}`}
              hint={`Prefiere ${demand.preferredYears}`}
              changed={isYellow("years")}
              disabled={!open}
              onStep={stepYears}
            />
            <Row
              label="Prima de firma"
              display={
                offer.signingBonus > 0
                  ? formatMoney(offer.signingBonus)
                  : "Sin prima"
              }
              reference={formatMoney(ref.signingBonus)}
              value={offer.signingBonus}
              refValue={ref.signingBonus}
              changed={isYellow("signingBonus")}
              disabled={!open}
              onStep={stepHandlers.signingBonus}
            />
          </div>

          <p className="mb-1 mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-fg-muted">
            Cláusulas opcionales
          </p>
          <div className="flex flex-col gap-2">
            <Optional
              label="Cláusula de rescisión"
              on={offer.releaseClause != null}
              onToggle={() =>
                patch(
                  "releaseClause",
                  offer.releaseClause == null ? ref.releaseClause : null,
                )
              }
              changed={isYellow("releaseClause")}
            >
              <Row
                label="Importe"
                display={formatMoney(offer.releaseClause ?? 0)}
                reference={formatMoney(ref.releaseClause)}
                value={offer.releaseClause ?? 0}
                refValue={ref.releaseClause}
                changed={isYellow("releaseClause")}
                disabled={!open}
                hint="Baja: cualquier club con plata se lo lleva. Alta: se queda más caro."
                onStep={stepHandlers.releaseClause}
              />
            </Optional>

            <div
              className={cn(
                "rounded-xl bg-surface px-3 py-2.5",
                isYellow("role") && YELLOW,
              )}
            >
              <p className="text-[11px] uppercase tracking-wide text-fg-muted">
                Rol / minutos prometidos
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <Button
                  size="sm"
                  variant={offer.role == null ? "club" : "ghost"}
                  disabled={!open}
                  onClick={() => patch("role", null)}
                >
                  Sin promesa
                </Button>
                {ROLES.map((r: ContractRole) => (
                  <Button
                    key={r}
                    size="sm"
                    variant={offer.role === r ? "club" : "ghost"}
                    disabled={!open}
                    onClick={() => patch("role", r)}
                  >
                    {ROLE_LABEL[r]}
                  </Button>
                ))}
              </div>
              {offer.role === "starter" ? (
                <p className="mt-1 text-[11px] text-fg-muted">
                  Si lo prometés y no juega, se enoja.
                </p>
              ) : null}
            </div>

            {(
              [
                ["goalBonus", "Bonus por gol", ref.goalBonus],
                ["assistBonus", "Bonus por asistencia", ref.assistBonus],
                ["appBonus", "Bonus por partido jugado", ref.appBonus],
                ["titleBonus", "Bonus por título", ref.titleBonus],
              ] as const
            ).map(([k, label, base]) => (
              <Optional
                key={k}
                label={label}
                on={bonusOn(k)}
                onToggle={() => toggleBonus(k, base)}
                changed={isYellow(k)}
              >
                <Row
                  label="Importe"
                  display={formatMoney(offer[k])}
                  reference={formatMoney(base)}
                  value={offer[k]}
                  refValue={base}
                  changed={isYellow(k)}
                  disabled={!open}
                  onStep={stepHandlers[k]}
                />
              </Optional>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-surface px-3 py-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-fg-muted">Masa salarial {club.short}</span>
              <span className="tabular-nums">{formatWage(wageBill)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-fg-muted">
                Pagás hoy (traspaso + firma)
              </span>
              <span className={cn("tabular-nums", overBudget && "text-bad")}>
                {formatMoney(total)} de {formatMoney(save.budget)}
              </span>
            </div>
          </div>
          {kind === "sign" &&
          (state.status === "accepted"
            ? overBudgetFor(state.lastOffer ?? offer)
            : state.counter
              ? overBudgetFor(state.counter)
              : overBudget) ? (
            <p
              role="alert"
              className="mt-2 rounded-xl border border-bad/25 bg-bad/10 px-3 py-2 text-sm text-bad"
            >
              Tu oferta no puede ser alcanzada porque no tienes presupuesto
              suficiente para este fichaje.
            </p>
          ) : null}
          {error ? <p className="mt-2 text-sm text-bad">{error}</p> : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-border bg-elevated p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {open ? (
            <>
              <Button variant="club" onClick={send}>
                {state.round === 0 ? "Enviar oferta" : "Enviar nueva oferta"}
              </Button>
              {state.counter ? (
                <Button
                  variant="outline"
                  onClick={() => finalize(state.counter!)}
                >
                  Aceptar su contraoferta
                </Button>
              ) : null}
              <Button variant="ghost" onClick={onClose}>
                Retirarme
              </Button>
            </>
          ) : state.status === "accepted" ? (
            <>
              <Button
                variant="club"
                onClick={() => finalize(state.lastOffer ?? offer)}
              >
                Firmar contrato
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Cerrar
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
