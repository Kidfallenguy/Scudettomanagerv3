import { STAT_SHORT, getStat, statKeysFor } from "@/lib/game/stats";
import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Crown,
  Sparkles,
  X,
} from "lucide-react";
import { PlayerAwardsSection } from "@/components/game/award-history-view";
import { Negotiation } from "@/components/game/negotiation";
import { PlayerPortrait } from "@/components/game/player-portrait";
import { ClubCrest } from "@/components/game/crest";
import { RenewalCelebration } from "@/components/game/renewal-celebration";
import {
  StatusGlyph,
  absenceStatus,
  outReason,
  statusTag,
  statusWord,
} from "@/components/game/status-icons";
import { bondLabel, clubBondOf, squadBondOf } from "@/lib/game/event-effects";
import { unavailableGames, unavailableReason } from "@/lib/game/tactics";
import {
  ROLE_LABEL,
  clauseOf,
  contractEndLabel,
  isExpiring,
} from "@/lib/game/contracts";
import { clubById } from "@/lib/game/clubs";
import {
  GROUP_LABEL,
  NAT_LABEL,
  POS_LABEL,
  formatMoney,
  formatWage,
  ovrClass,
  posGroup,
} from "@/lib/game/format";
import type {
  LoanListingTerms,
  Player,
  PosGroup,
  TransferRecord,
} from "@/lib/game/types";
import { useGame } from "@/lib/game/store";
import { Rng } from "@/lib/game/rng";
import { isWonderkid } from "@/lib/game/potential";
import { freeAgentSaleBlockReason, squadCount } from "@/lib/game/squad-rules";
import { loanFee, loanRecallCost } from "@/lib/game/transfers";
import { playGameSound } from "@/lib/game/sound";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const GROUPS: Array<PosGroup | "ALL"> = ["ALL", "GK", "DEF", "MID", "FWD"];
const POSITIONS: Array<Player["pos"] | "ALL"> = [
  "ALL",
  "GK",
  "RB",
  "CB",
  "LB",
  "CDM",
  "CM",
  "CAM",
  "RW",
  "LW",
  "ST",
];
const EMPTY_SQUAD_FILTERS = {
  ageMin: "",
  ageMax: "",
  ovrMin: "",
  ovrMax: "",
  valueMin: "",
  valueMax: "",
  pos: "ALL" as Player["pos"] | "ALL",
};

function matchesRange(value: number, min: string, max: string) {
  const lower = min.trim() ? Number(min) : null;
  const upper = max.trim() ? Number(max) : null;
  return (
    (lower === null || !Number.isFinite(lower) || value >= lower) &&
    (upper === null || !Number.isFinite(upper) || value <= upper)
  );
}

function isReadyToRetire(player: Player, season: number) {
  let seed = season * 97 + player.age * 31;
  for (const character of player.id) {
    seed = Math.imul(seed ^ character.charCodeAt(0), 16777619);
  }
  if (player.age >= 38) return true;
  const chance = Math.min(
    0.9,
    Math.max(0.12, (player.age - 31) * 0.16) + (player.ovr <= 65 ? 0.1 : 0),
  );
  return new Rng(seed).chance(chance);
}
type LoanSetupState = {
  playerId: string;
  seasons: LoanListingTerms["seasons"];
  fee: string;
  includeBuyOption: boolean;
  buyOptionFee: string;
};

export function Squad() {
  const clubId = useGame((s) => s.clubId);
  const players = useGame((s) => s.players);
  const loans = useGame((s) => s.loans);
  const toggleListed = useGame((s) => s.toggleListed);
  const toggleLoanListed = useGame((s) => s.toggleLoanListed);
  const exerciseLoanOption = useGame((s) => s.exerciseLoanOption);
  const sellPlayer = useGame((s) => s.sellPlayer);
  const toggleNoOffers = useGame((s) => s.toggleNoOffers);
  const retirePlayer = useGame((s) => s.retirePlayer);
  const setScreen = useGame((s) => s.setScreen);
  const [group, setGroup] = useState<PosGroup | "ALL">("ALL");
  const [wonderkidsOnly, setWonderkidsOnly] = useState(false);
  const [filters, setFilters] = useState(EMPTY_SQUAD_FILTERS);
  const [selected, setSelected] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saleMoment, setSaleMoment] = useState<{
    transfer: TransferRecord;
    player: Player;
  } | null>(null);
  const [renewalMoment, setRenewalMoment] = useState<Player | null>(null);
  const [listingMoment, setListingMoment] = useState<{
    kind: "sale" | "loan";
    player: Player;
  } | null>(null);
  const [renewing, setRenewing] = useState<string | null>(null);
  const [loanSetup, setLoanSetup] = useState<LoanSetupState | null>(null);
  const [loanPurchaseMoment, setLoanPurchaseMoment] = useState<{
    player: Player;
    fee: number;
  } | null>(null);
  const season = useGame((s) => s.season);
  const budget = useGame((s) => s.budget);
  const recallLoan = useGame((s) => s.recallLoan);

  const squad = useMemo(() => {
    const list = players.filter(
      (p) => p.clubId === clubId || p.loanFrom === clubId,
    );
    const grouped =
      group === "ALL" ? list : list.filter((p) => posGroup(p.pos) === group);
    return grouped
      .filter(
        (p) =>
          (filters.pos === "ALL" || p.pos === filters.pos) &&
          (!wonderkidsOnly || isWonderkid(p)) &&
          matchesRange(p.age, filters.ageMin, filters.ageMax) &&
          matchesRange(p.ovr, filters.ovrMin, filters.ovrMax) &&
          matchesRange(p.value, filters.valueMin, filters.valueMax),
      )
      .sort((a, b) => b.ovr - a.ovr);
  }, [players, clubId, group, wonderkidsOnly, filters]);

  const current = squad.find((p) => p.id === selected) ?? null;
  const purchaseOptionFee =
    current?.loanFrom && current.loanFrom !== clubId
      ? (loans.find(
          (loan) => loan.playerId === current.id && loan.toClubId === clubId,
        )?.buyOptionFee ?? null)
      : null;
  // Plantilla = propios + cedidos que llegaron (el tope de 40 los cuenta); los cedidos no se pueden vender.
  const count = useMemo(() => squadCount(players, clubId), [players, clubId]);

  useEffect(() => {
    if (!listingMoment) return;
    const dismiss = () => setListingMoment(null);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    const timer = window.setTimeout(dismiss, 4500);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [listingMoment]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-3xl font-semibold">Plantilla</h2>
          <p className="text-sm text-fg-muted">
            {count.total}/40 en el club ({count.own} propios
            {count.loanedIn
              ? ` + ${count.loanedIn} cedido${count.loanedIn > 1 ? "s" : ""}`
              : ""}
            ) · {squad.length} en vista
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {GROUPS.map((g) => (
              <Button
                key={g}
                size="sm"
                variant={group === g ? "club" : "ghost"}
                onClick={() => setGroup(g)}
              >
                {g === "ALL" ? "Todos" : GROUP_LABEL[g]}
              </Button>
            ))}
            <Button
              size="sm"
              variant={wonderkidsOnly ? "club" : "ghost"}
              aria-pressed={wonderkidsOnly}
              onClick={() => setWonderkidsOnly((current) => !current)}
            >
              <Sparkles className="mr-1.5 size-4" />
              Wonderkids
            </Button>
          </div>
        </div>
      </header>

      <section
        className="grid grid-cols-2 gap-2 rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)] sm:grid-cols-3 md:grid-cols-5"
        aria-label="Filtros de plantilla"
      >
        <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
          Posición
          <select
            className="h-10 min-w-0 rounded-xl bg-elevated px-2 text-sm"
            value={filters.pos}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                pos: event.target.value as Player["pos"] | "ALL",
              }))
            }
          >
            <option value="ALL">Todas</option>
            {POSITIONS.filter((position) => position !== "ALL").map(
              (position) => (
                <option key={position} value={position}>
                  {POS_LABEL[position]}
                </option>
              ),
            )}
          </select>
        </label>
        {(
          [
            ["Edad", "ageMin", "ageMax"],
            ["GRL", "ovrMin", "ovrMax"],
            ["Valor (€)", "valueMin", "valueMax"],
          ] as const
        ).map(([label, minKey, maxKey]) => (
          <fieldset
            key={label}
            className="flex min-w-0 flex-col gap-1 text-[11px] text-fg-muted"
          >
            <legend>{label}</legend>
            <span className="flex gap-1">
              <input
                aria-label={`${label} mínimo`}
                className="h-10 w-full min-w-0 rounded-xl bg-elevated px-2 text-sm tabular-nums"
                type="number"
                min="0"
                placeholder="Mín."
                value={filters[minKey]}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    [minKey]: event.target.value,
                  }))
                }
              />
              <input
                aria-label={`${label} máximo`}
                className="h-10 w-full min-w-0 rounded-xl bg-elevated px-2 text-sm tabular-nums"
                type="number"
                min="0"
                placeholder="Máx."
                value={filters[maxKey]}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    [maxKey]: event.target.value,
                  }))
                }
              />
            </span>
          </fieldset>
        ))}
        <Button
          className="self-end"
          size="sm"
          variant="ghost"
          onClick={() => {
            setGroup("ALL");
            setFilters(EMPTY_SQUAD_FILTERS);
          }}
        >
          Limpiar filtros
        </Button>
      </section>

      <div className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-fg-muted">
              <tr className="border-b border-border">
                <th className="px-3 py-2 font-medium">Jugador</th>
                <th className="px-2 py-2 font-medium">Nº</th>
                <th className="px-2 py-2 font-medium">Pos</th>
                <th className="px-2 py-2 font-medium">Edad</th>
                <th className="px-2 py-2 font-medium">MED</th>
                <th className="hidden px-2 py-2 font-medium sm:table-cell">
                  POT
                </th>
                <th className="hidden px-2 py-2 font-medium md:table-cell">
                  Valor
                </th>
                <th className="px-2 py-2 font-medium">Contrato</th>
              </tr>
            </thead>
            <tbody>
              {squad.map((p) => (
                <tr
                  key={p.id}
                  className={cn(
                    "cursor-pointer border-b border-border/60 hover:bg-fg/4",
                    selected === p.id && "bg-fg/6",
                  )}
                  onClick={() => setSelected(p.id)}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <PlayerPortrait player={p} size="row" />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 font-medium leading-tight">
                          <span className="truncate">{p.name}</span>
                          {p.injured > 0 ? (
                            <StatusGlyph status="injury" />
                          ) : null}
                          {p.suspended > 0 ? (
                            <StatusGlyph status="suspension" />
                          ) : null}
                          {absenceStatus(p) ? (
                            <StatusGlyph status={absenceStatus(p)!} />
                          ) : null}
                        </p>
                        <p className="text-[11px] text-fg-muted">
                          {NAT_LABEL[p.nat] ?? p.nat}
                          {p.injured > 0
                            ? ` · ${statusTag("injury", p.injured)}`
                            : ""}
                          {p.suspended > 0
                            ? ` · ${statusTag("suspension", p.suspended)}`
                            : ""}
                          {absenceStatus(p)
                            ? ` · ${statusTag(absenceStatus(p)!, p.absence!.games)} (${p.absence!.reason})`
                            : ""}
                          {p.listed ? " · en venta" : ""}
                          {p.listedForLoan ? " · a cesión" : ""}
                          {p.noOffers ? " · ofertas bloqueadas" : ""}
                          {p.loanFrom === clubId ? " · cedido" : ""}
                          {p.loanFrom && p.loanFrom !== clubId
                            ? " · cedido in"
                            : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 font-display text-base tabular-nums text-fg-muted">
                    {p.number}
                  </td>
                  <td className="px-2 font-display text-base text-fg-muted">
                    {POS_LABEL[p.pos]}
                  </td>
                  <td className="px-2 tabular-nums text-fg-muted">{p.age}</td>
                  <td
                    className={cn(
                      "px-2 font-display text-lg tabular-nums",
                      ovrClass(p.ovr),
                    )}
                  >
                    {p.ovr}
                    <GrlDelta player={p} />
                  </td>
                  <td className="hidden px-2 tabular-nums text-fg-muted sm:table-cell">
                    {p.pot}
                  </td>
                  <td className="hidden px-2 tabular-nums text-fg-muted md:table-cell">
                    {formatMoney(p.value)}
                  </td>
                  <td
                    className={cn(
                      "px-2 text-xs tabular-nums",
                      isExpiring(p) && !p.loanFrom
                        ? "font-medium text-comp-uel"
                        : "text-fg-muted",
                    )}
                  >
                    {p.loanFrom === clubId
                      ? "Cedido"
                      : `Jun ${season + p.contract}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      </div>

      {current ? (
        <PlayerSheet
          key={current.id}
          player={current}
          onClose={() => setSelected(null)}
          onList={() => {
            toggleListed(current.id);
            if (!current.listed)
              setListingMoment({ kind: "sale", player: current });
          }}
          purchaseOptionFee={purchaseOptionFee}
          onBuyLoanOption={() => {
            if (!current || purchaseOptionFee === null) return;
            const player = current;
            const err = exerciseLoanOption(player.id);
            setMsg(err ?? `${player.name} ya es propiedad del club.`);
            if (!err) {
              playGameSound("sign");
              setLoanPurchaseMoment({ player, fee: purchaseOptionFee });
              setSelected(null);
            }
          }}
          onLoan={() => {
            if (current.listedForLoan) {
              toggleLoanListed(current.id);
              return;
            }
            setLoanSetup({
              playerId: current.id,
              seasons: 1,
              fee: String(loanFee(current, 1)),
              includeBuyOption: false,
              buyOptionFee: String(
                Math.max(
                  250_000,
                  Math.round((current.value * 1.2) / 250_000) * 250_000,
                ),
              ),
            });
          }}
          onBlockOffers={() => toggleNoOffers(current.id)}
          onTrain={() => setScreen("train")}
          season={season}
          recallCost={
            current.loanFrom === clubId && current.clubId !== clubId
              ? loanRecallCost(useGame.getState(), current)
              : null
          }
          budget={budget}
          onRecall={() => {
            const err = recallLoan(current.id);
            setMsg(err ?? `${current.name} vuelve al club.`);
            if (!err) setSelected(null);
          }}
          onRenew={() => setRenewing(current.id)}
          onRetire={() => {
            const retiree = current;
            const error = retirePlayer(retiree.id);
            setMsg(
              error ??
                `${retiree.name} se retiró. Su regen aparecerá en otro club de la misma liga.`,
            );
            if (!error) setSelected(null);
          }}
          onSell={() => {
            const soldPlayer = current;
            const previousTransferIds = new Set(
              useGame.getState().transferLog.map((record) => record.id),
            );
            const err = sellPlayer(soldPlayer.id);
            setMsg(err ?? `${soldPlayer.name} transferido.`);
            if (!err) {
              const transfer = useGame
                .getState()
                .transferLog.find(
                  (record) =>
                    !previousTransferIds.has(record.id) &&
                    record.playerId === current.id &&
                    record.kind === "sale",
                );
              if (transfer) {
                playGameSound("sale");
                setSaleMoment({ transfer, player: soldPlayer });
              }
              setSelected(null);
            }
          }}
        />
      ) : null}
      {loanSetup ? (
        <LoanListingDialog
          player={
            players.find((player) => player.id === loanSetup.playerId) ?? null
          }
          setup={loanSetup}
          onChange={setLoanSetup}
          onCancel={() => setLoanSetup(null)}
          onConfirm={(terms) => {
            const player = players.find(
              (candidate) => candidate.id === loanSetup.playerId,
            );
            if (!player) return;
            toggleLoanListed(player.id, terms);
            setLoanSetup(null);
            setListingMoment({ kind: "loan", player });
          }}
        />
      ) : null}
      {renewing ? (
        <Negotiation
          key={renewing}
          playerId={renewing}
          kind="renew"
          onClose={() => setRenewing(null)}
          onDone={(m, renewedPlayer) => {
            setMsg(m);
            if (renewedPlayer) {
              playGameSound("sign");
              setRenewalMoment(renewedPlayer);
            }
          }}
        />
      ) : null}
      {msg ? <p className="text-sm text-fg-muted">{msg}</p> : null}
      {loanPurchaseMoment ? (
        <div
          className="signing-celebration"
          role="dialog"
          aria-modal="true"
          aria-labelledby="loan-purchase-title"
          onClick={() => setLoanPurchaseMoment(null)}
        >
          <div className="signing-sparks" aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => (
              <span
                key={index}
                className="signing-spark"
                style={{
                  left: `${5 + ((index * 47) % 90)}%`,
                  top: `${(index * 31) % 75}%`,
                  animationDelay: `${(index % 6) * 90}ms`,
                }}
              />
            ))}
          </div>
          <section
            className="signing-card"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Cerrar celebración"
              className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-fg/8 hover:text-fg"
              onClick={() => setLoanPurchaseMoment(null)}
            >
              <X className="size-4" />
            </button>
            <div className="signing-seal" aria-hidden="true">
              <Sparkles className="size-8" />
            </div>
            <PlayerPortrait
              player={loanPurchaseMoment.player}
              size="hero"
              className="mx-auto mt-4"
            />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-club">
              Opción de compra ejercida
            </p>
            <h2
              id="loan-purchase-title"
              className="mt-2 font-display text-4xl font-semibold leading-none"
            >
              {loanPurchaseMoment.player.name}
            </h2>
            <p className="mt-2 text-sm text-fg-muted">
              Se queda en el club por {formatMoney(loanPurchaseMoment.fee)}.
            </p>
          </section>
        </div>
      ) : null}
      {saleMoment ? (
        <div
          className="signing-celebration"
          role="presentation"
          onClick={() => setSaleMoment(null)}
        >
          <div className="signing-sparks" aria-hidden="true">
            {Array.from({ length: 18 }, (_, index) => (
              <span
                key={index}
                className="signing-spark"
                style={{
                  left: `${5 + ((index * 47) % 90)}%`,
                  top: `${(index * 31) % 75}%`,
                  animationDelay: `${(index % 6) * 90}ms`,
                  transform: `rotate(${index * 35}deg)`,
                }}
              />
            ))}
          </div>
          <section
            className="signing-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sale-moment-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              autoFocus
              aria-label="Cerrar celebración de venta"
              className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-fg/8 hover:text-fg"
              onClick={() => setSaleMoment(null)}
            >
              <X className="size-4" />
            </button>
            <div className="signing-seal" aria-hidden="true">
              <Banknote className="size-8" />
            </div>
            <PlayerPortrait
              player={saleMoment.player}
              size="hero"
              className="mx-auto mt-4"
            />
            <p className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-club">
              <Banknote className="size-4" />
              Venta confirmada
              <Banknote className="size-4" />
            </p>
            <h2
              id="sale-moment-title"
              className="mt-2 font-display text-4xl font-semibold leading-none sm:text-5xl"
            >
              {saleMoment.transfer.name}
            </h2>
            <p className="mt-2 text-sm text-fg-muted">
              Traspaso por {formatMoney(saleMoment.transfer.fee)}
            </p>
            <div className="my-5 flex items-center justify-center gap-3 border-y border-border py-4">
              <span className="signing-club-crest">
                <ClubCrest
                  club={clubById(saleMoment.transfer.toId)}
                  size={40}
                />
              </span>
              <div className="text-left">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-fg-muted">
                  Nuevo club
                </p>
                <p className="font-display text-xl font-semibold">
                  {clubById(saleMoment.transfer.toId).name}
                </p>
              </div>
            </div>
            <p className="text-xs text-fg-muted">
              Gracias por su etapa en el club
            </p>
          </section>
        </div>
      ) : null}
      {listingMoment ? (
        <div
          className="signing-celebration"
          role="dialog"
          aria-modal="true"
          aria-labelledby="listing-moment-title"
          onClick={() => setListingMoment(null)}
        >
          <div className="signing-sparks" aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => (
              <span
                key={index}
                className="signing-spark"
                style={{
                  left: `${5 + ((index * 47) % 90)}%`,
                  top: `${(index * 31) % 75}%`,
                  animationDelay: `${(index % 6) * 90}ms`,
                  transform: `rotate(${index * 35}deg)`,
                }}
              />
            ))}
          </div>
          <section
            className="signing-card"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              autoFocus
              aria-label="Cerrar aviso"
              className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-fg/8 hover:text-fg"
              onClick={() => setListingMoment(null)}
            >
              <X className="size-4" />
            </button>
            <div className="signing-seal" aria-hidden="true">
              {listingMoment.kind === "sale" ? (
                <Banknote className="size-8" />
              ) : (
                <Sparkles className="size-8" />
              )}
            </div>
            <PlayerPortrait
              player={listingMoment.player}
              size="hero"
              className="mx-auto mt-4"
            />
            <p className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-club">
              <Sparkles className="size-4" />
              {listingMoment.kind === "sale"
                ? "En el mercado"
                : "Disponible para cesión"}
              <Sparkles className="size-4" />
            </p>
            <h2
              id="listing-moment-title"
              className="mt-2 font-display text-4xl font-semibold leading-tight sm:text-5xl"
            >
              {listingMoment.player.name}
            </h2>
            <p className="mt-3 text-sm text-fg-muted">
              {listingMoment.kind === "sale"
                ? "Su ficha ya está disponible para recibir ofertas de traspaso."
                : "El jugador ya está disponible para recibir ofertas de cesión."}
            </p>
            <div className="my-5 flex items-center justify-center gap-2 border-y border-border py-4 text-sm">
              <span className="text-fg-muted">Valor estimado</span>
              <span className="font-display text-xl tabular-nums">
                {formatMoney(listingMoment.player.value)}
              </span>
            </div>
            {listingMoment.kind === "loan" &&
            listingMoment.player.loanListing ? (
              <p className="mb-4 text-sm text-fg-muted">
                {listingMoment.player.loanListing.seasons} temporada
                {listingMoment.player.loanListing.seasons === 1 ? "" : "s"} ·
                cesión {formatMoney(listingMoment.player.loanListing.fee)}
                {listingMoment.player.loanListing.buyOptionFee
                  ? ` · opción de compra ${formatMoney(listingMoment.player.loanListing.buyOptionFee)}`
                  : ""}
              </p>
            ) : null}
            <Button variant="outline" onClick={() => setListingMoment(null)}>
              Entendido
            </Button>
          </section>
        </div>
      ) : null}
      {renewalMoment ? (
        <RenewalCelebration
          player={renewalMoment}
          onClose={() => setRenewalMoment(null)}
        />
      ) : null}
    </div>
  );
}

function LoanListingDialog({
  player,
  setup,
  onChange,
  onCancel,
  onConfirm,
}: {
  player: Player | null;
  setup: LoanSetupState;
  onChange: (next: LoanSetupState) => void;
  onCancel: () => void;
  onConfirm: (terms: LoanListingTerms) => void;
}) {
  if (!player) return null;
  const defaultFee = loanFee(player, setup.seasons);
  const validFee = Number.isFinite(Number(setup.fee)) && Number(setup.fee) >= 0;
  const validOption =
    !setup.includeBuyOption ||
    (Number.isFinite(Number(setup.buyOptionFee)) &&
      Number(setup.buyOptionFee) > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <section
        className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-elevated p-5 shadow-[var(--shadow-border)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="loan-setup-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h3
          id="loan-setup-title"
          className="font-display text-2xl font-semibold"
        >
          Condiciones de la cesión
        </h3>
        <p className="mt-1 text-sm text-fg-muted">
          Define el plazo, el pago y si aceptas que puedan fichar a{" "}
          {player.name}
          cuando termine la temporada.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {([1, 2, 3] as const).map((seasons) => (
            <Button
              key={seasons}
              size="sm"
              variant={setup.seasons === seasons ? "club" : "ghost"}
              onClick={() =>
                onChange({
                  ...setup,
                  seasons,
                  fee:
                    Number(setup.fee) === loanFee(player, setup.seasons)
                      ? String(loanFee(player, seasons))
                      : setup.fee,
                })
              }
            >
              {seasons} temporada{seasons === 1 ? "" : "s"}
            </Button>
          ))}
        </div>
        <label className="mt-4 block text-sm">
          Precio de la cesión
          <input
            className="mt-1 h-11 w-full rounded-xl bg-surface px-3 tabular-nums shadow-[var(--shadow-border)] outline-none focus:shadow-[var(--shadow-border-hover)]"
            type="number"
            min="0"
            step="250000"
            value={setup.fee}
            onChange={(event) =>
              onChange({ ...setup, fee: event.target.value })
            }
          />
          <span className="mt-1 block text-[11px] text-fg-muted">
            Referencia del juego: {formatMoney(defaultFee)}
          </span>
        </label>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={setup.includeBuyOption}
            onChange={(event) =>
              onChange({ ...setup, includeBuyOption: event.target.checked })
            }
          />
          Permitir que el club receptor lo fiche
        </label>
        {setup.includeBuyOption ? (
          <label className="mt-3 block text-sm">
            Precio acordado si lo quieren fichar
            <input
              className="mt-1 h-11 w-full rounded-xl bg-surface px-3 tabular-nums shadow-[var(--shadow-border)] outline-none focus:shadow-[var(--shadow-border-hover)]"
              type="number"
              min="1"
              step="250000"
              value={setup.buyOptionFee}
              onChange={(event) =>
                onChange({ ...setup, buyOptionFee: event.target.value })
              }
            />
          </label>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="club"
            disabled={!validFee || !validOption}
            onClick={() =>
              onConfirm({
                seasons: setup.seasons,
                fee: Math.round(Number(setup.fee)),
                buyOptionFee: setup.includeBuyOption
                  ? Math.round(Number(setup.buyOptionFee))
                  : undefined,
              })
            }
          >
            Ofrecer cesión
          </Button>
        </div>
      </section>
    </div>
  );
}

/** Cambio de GRL en lo que va de temporada: +N verde, −N rojo, nada si no cambió. Se reinicia al cerrar la temporada. */
export function GrlDelta({
  player,
  className,
}: {
  player: Player;
  className?: string;
}) {
  const diff = player.ovr - (player.seasonStartOvr || player.ovr);
  if (diff === 0) return null;
  const up = diff > 0;
  return (
    <span
      className={cn("ml-1 text-xs font-semibold tabular-nums", className)}
      style={{ color: up ? "var(--color-good)" : "var(--color-bad)" }}
      title={
        up
          ? `Subió ${diff} de GRL esta temporada`
          : `Bajó ${-diff} de GRL esta temporada`
      }
    >
      {up ? `+${diff}` : `−${-diff}`}
    </span>
  );
}

function PlayerSheet({
  player,
  onClose,
  onList,
  onLoan,
  onBlockOffers,
  onSell,
  onTrain,
  onRenew,
  onRetire,
  onRecall,
  onBuyLoanOption,
  purchaseOptionFee,
  recallCost,
  budget,
  season,
}: {
  player: Player;
  onClose: () => void;
  onList: () => void;
  onLoan: () => void;
  onBlockOffers: () => void;
  onSell: () => void;
  onTrain: () => void;
  onRenew: () => void;
  onRetire: () => void;
  onRecall: () => void;
  onBuyLoanOption: () => void;
  purchaseOptionFee: number | null;
  /** Lo que cuesta traerlo de vuelta; null si no es un cedido tuyo. */
  recallCost: number | null;
  budget: number;
  season: number;
}) {
  const idolHistory = useGame((s) => s.idolatryHistory ?? []);
  const clubId = useGame((s) => s.clubId);
  const [retirementChat, setRetirementChat] = useState(false);
  const [retirementAnswer, setRetirementAnswer] = useState<boolean | null>(
    null,
  );
  // Porteros: estadísticas propias (estirada, manejo, saque, reflejos, velocidad, colocación).
  const attrs: Array<[string, number]> = statKeysFor(player.pos).map((k) => [
    STAT_SHORT[k],
    getStat(player, k),
  ]);
  const guest = Boolean(player.loanFrom);
  const saleLock = freeAgentSaleBlockReason(player, season);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <aside
        className="max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-elevated p-4 shadow-[var(--shadow-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <PlayerPortrait player={player} size="hero" />
            <div className="min-w-0">
              <p className="font-display text-3xl font-semibold leading-none">
                {player.name}
              </p>
              <p className="mt-1 text-sm text-fg-muted">
                {POS_LABEL[player.pos]} · {player.age} años ·{" "}
                {NAT_LABEL[player.nat] ?? player.nat}
              </p>
            </div>
          </div>
          <p
            className={cn(
              "font-display text-5xl tabular-nums",
              ovrClass(player.ovr),
            )}
          >
            {player.ovr}
            <GrlDelta player={player} className="align-top text-lg" />
          </p>
        </div>
        {purchaseOptionFee !== null && player.loanFrom !== clubId ? (
          <div className="mt-3 flex flex-col gap-2 rounded-lg bg-surface px-3 py-2">
            <p className="text-xs text-fg-muted">
              Opción de compra acordada con{" "}
              {player.loanFrom
                ? clubById(player.loanFrom).name
                : "el club propietario"}
              . Puedes quedártelo esta temporada por{" "}
              {formatMoney(purchaseOptionFee)}; al terminar la cesión, la opción
              caduca.
            </p>
            <Button
              variant="club"
              disabled={budget < purchaseOptionFee}
              onClick={onBuyLoanOption}
            >
              Fichar por {formatMoney(purchaseOptionFee)}
            </Button>
            {budget < purchaseOptionFee ? (
              <p className="text-[11px] text-bad">No alcanza el presupuesto.</p>
            ) : null}
          </div>
        ) : null}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {attrs.map(([k, v]) => (
            <div
              key={k}
              className="rounded-lg bg-surface px-2 py-2 text-center"
            >
              <p className="text-[10px] uppercase tracking-wide text-fg-muted">
                {k}
              </p>
              <p className="font-display text-xl tabular-nums">{v}</p>
            </div>
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-fg-muted">Valor</dt>
            <dd className="tabular-nums">{formatMoney(player.value)}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Salario</dt>
            <dd className="tabular-nums">{formatWage(player.wage)}</dd>
          </div>
          <div>
            <dt className="text-fg-muted">Contrato</dt>
            <dd className={cn(isExpiring(player) && !guest && "text-comp-uel")}>
              hasta {contractEndLabel(season, player)}
              {isExpiring(player) && !guest ? " · último año" : ""}
            </dd>
          </div>
          <div>
            <dt className="text-fg-muted">Potencial</dt>
            <dd className="tabular-nums">
              {player.pot}
              {player.pot >= 100 ? " · techo" : ""}
            </dd>
          </div>
          <div>
            <dt className="text-fg-muted">Temporada G/A</dt>
            <dd className="tabular-nums">
              {player.goals} / {player.assists}
            </dd>
          </div>
          <div>
            <dt className="text-fg-muted">Carrera G/A</dt>
            <dd className="tabular-nums">
              {player.careerGoals + player.goals} /{" "}
              {player.careerAssists + player.assists}
            </dd>
          </div>
        </dl>
        <section
          className="mt-4 rounded-xl bg-surface px-3.5 py-3"
          aria-label="Idolatría con la hinchada"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-fg-muted">
                <Crown className="size-3.5 text-comp-uel" /> Hinchada
              </p>
              <p className="mt-0.5 font-medium">
                {player.fanIdol === undefined
                  ? 0
                  : player.fanIdol >= 95
                    ? "Leyenda del club"
                    : player.fanIdol >= 80
                      ? "Gran ídolo"
                      : player.fanIdol >= 60
                        ? "Ídolo del club"
                        : player.fanIdol >= 40
                          ? "Apreciado"
                          : player.fanIdol >= 20
                            ? "Querido por algunos"
                            : "Poco reconocido"}
              </p>
            </div>
            <span className="font-display text-2xl tabular-nums">
              {player.fanIdol ?? 0}
              <span className="text-sm text-fg-muted">/100</span>
            </span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-fg/10"
            role="progressbar"
            aria-label={`Idolatría ${player.fanIdol ?? 0} de 100`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={player.fanIdol ?? 0}
          >
            <div
              className="h-full rounded-full bg-comp-uel transition-[width]"
              style={{ width: `${player.fanIdol ?? 0}%` }}
            />
          </div>
          {idolHistory
            .filter((entry) => entry.playerId === player.id)
            .slice(-3)
            .reverse().length ? (
            <div className="mt-2 flex flex-col gap-1 text-[11px] text-fg-muted">
              {idolHistory
                .filter((entry) => entry.playerId === player.id)
                .slice(-3)
                .reverse()
                .map((entry) => (
                  <p key={entry.id}>
                    {entry.delta > 0 ? "+" : ""}
                    {entry.delta} · {entry.reason}
                  </p>
                ))}
            </div>
          ) : (
            <p className="mt-2 text-[11px] text-fg-muted">
              La hinchada irá reconociéndolo según sus actuaciones y logros.
            </p>
          )}
        </section>
        {unavailableReason(player) ? (
          <div
            role="status"
            className="mt-3 flex items-center gap-3 rounded-lg bg-bad/10 px-3 py-2.5 text-sm"
          >
            <StatusGlyph status={unavailableReason(player)!} />
            <p className="min-w-0">
              <span className="font-medium">
                {statusWord(unavailableReason(player)!)}
              </span>
              {outReason(player, unavailableReason(player)!)
                ? ` · ${outReason(player, unavailableReason(player)!)}`
                : ""}
              <span className="block text-xs text-fg-muted">
                Le{" "}
                {unavailableGames(player) === 1
                  ? "queda 1 partido"
                  : `quedan ${unavailableGames(player)} partidos`}{" "}
                de baja. No puede ser titular ni suplente.
              </span>
            </p>
          </div>
        ) : null}
        {!guest && (player.bond || player.valueMod) ? (
          <dl className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-surface px-3 py-2.5 text-sm">
            {player.bond ? (
              <>
                <div>
                  <dt className="text-fg-muted">Relación con el club</dt>
                  <dd>{bondLabel(clubBondOf(player))}</dd>
                </div>
                <div>
                  <dt className="text-fg-muted">Relación con el plantel</dt>
                  <dd>{bondLabel(squadBondOf(player))}</dd>
                </div>
              </>
            ) : null}
            {player.valueMod ? (
              <div className="col-span-2 text-xs text-fg-muted">
                Valor de mercado {player.valueMod.pct > 0 ? "+" : "−"}
                {Math.abs(player.valueMod.pct)}% por {player.valueMod.games}{" "}
                {player.valueMod.games === 1 ? "partido más" : "partidos más"}.
              </div>
            ) : null}
          </dl>
        ) : null}
        <PlayerAwardsSection playerId={player.id} />
        {!guest && player.terms ? (
          <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs text-fg-muted">
            {player.terms.role
              ? `Rol pactado: ${ROLE_LABEL[player.terms.role]}. `
              : ""}
            {clauseOf(player)
              ? `Cláusula ${formatMoney(clauseOf(player)!)}. `
              : "Sin cláusula. "}
            {player.terms.goalBonus > 0
              ? `Gol ${formatMoney(player.terms.goalBonus)}. `
              : ""}
            {player.terms.assistBonus > 0
              ? `Asistencia ${formatMoney(player.terms.assistBonus)}. `
              : ""}
            {player.terms.appBonus > 0
              ? `Partido ${formatMoney(player.terms.appBonus)}. `
              : ""}
            {player.terms.titleBonus > 0
              ? `Título ${formatMoney(player.terms.titleBonus)}. `
              : ""}
            {player.sellOn ? `Reventa ${player.sellOn.pct}%.` : ""}
          </p>
        ) : !guest && clauseOf(player) ? (
          <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs text-fg-muted">
            Cláusula de rescisión {formatMoney(clauseOf(player)!)}.
          </p>
        ) : null}
        {player.noOffers && !guest ? (
          <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs text-fg-muted">
            No te mandarán ofertas por este jugador hasta desactivarla.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {!guest ? (
            <>
              <Button
                variant={isExpiring(player) ? "club" : "outline"}
                onClick={onRenew}
              >
                Renovar contrato
              </Button>
              <Button
                variant="outline"
                disabled={Boolean(saleLock)}
                onClick={onList}
              >
                {player.listed ? "Quitar del mercado" : "Poner en venta"}
              </Button>
              <Button variant="outline" onClick={onLoan}>
                {player.listedForLoan ? "Cancelar cesión" : "Ofrecer cesión"}
              </Button>
              <Button
                variant={player.noOffers ? "club" : "outline"}
                onClick={onBlockOffers}
              >
                {player.noOffers ? "Permitir ofertas" : "Bloquear ofertas"}
              </Button>
              <Button
                variant="outline"
                disabled={Boolean(saleLock)}
                onClick={onSell}
              >
                Vender ahora
              </Button>
              <Button variant="outline" onClick={onTrain}>
                Entrenar
              </Button>
              {player.age > 31 ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setRetirementAnswer(null);
                    setRetirementChat(true);
                  }}
                >
                  SUGERIR RETIRARSE
                </Button>
              ) : null}
            </>
          ) : recallCost !== null ? (
            <div className="flex w-full flex-col gap-2 rounded-lg bg-surface px-3 py-2">
              <p className="text-xs text-fg-muted">
                Cedido en {clubById(player.clubId).name}
                {player.loanSeasons > 0
                  ? ` · le quedan ${player.loanSeasons} temporada${player.loanSeasons > 1 ? "s" : ""}`
                  : ""}
                . No se puede vender hasta que vuelva, o lo rescatás ahora
                pagando una compensación.
              </p>
              <Button
                variant="club"
                disabled={budget < recallCost}
                onClick={onRecall}
              >
                Rescatar de la cesión · {formatMoney(recallCost)}
              </Button>
              {budget < recallCost ? (
                <p className="text-[11px] text-bad">
                  No alcanza el presupuesto.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-fg-muted">
              Cedido: no se vende hasta que vuelva o expire el préstamo.
            </p>
          )}
          {saleLock ? (
            <p className="w-full text-xs text-fg-muted">{saleLock}</p>
          ) : null}
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </aside>
      {retirementChat ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="retirement-chat-title"
          onClick={() => setRetirementChat(false)}
        >
          <section
            className="w-full max-w-md rounded-2xl bg-elevated p-5 shadow-[var(--shadow-border)]"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-xs uppercase tracking-widest text-fg-muted">
              Conversación privada
            </p>
            <h3
              id="retirement-chat-title"
              className="mt-1 font-display text-2xl font-semibold"
            >
              El futuro de {player.name}
            </h3>
            <div className="mt-4 space-y-3 rounded-xl bg-surface p-3 text-sm">
              <p>
                <span className="font-semibold">Vos:</span> «¿Pensaste en
                retirarte al terminar esta temporada?»
              </p>
              {retirementAnswer !== null ? (
                <p className="border-t border-border pt-3">
                  <span className="font-semibold">{player.name}:</span>{" "}
                  {retirementAnswer
                    ? "«Sí. Siento que llegó el momento de dejar el fútbol. Gracias por escucharme.»"
                    : "«Todavía no. Quiero seguir jugando y ayudar al equipo mientras pueda.»"}
                </p>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {retirementAnswer === null ? (
                <Button
                  variant="club"
                  onClick={() =>
                    setRetirementAnswer(isReadyToRetire(player, season))
                  }
                >
                  Preguntarle si piensa retirarse
                </Button>
              ) : retirementAnswer ? (
                <Button variant="club" onClick={onRetire}>
                  Respetar su decisión y confirmar retirada
                </Button>
              ) : (
                <p className="w-full text-sm text-fg-muted">
                  {player.name} seguirá en la plantilla.
                </p>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setRetirementChat(false);
                  setRetirementAnswer(null);
                }}
              >
                {retirementAnswer === null ? "Volver" : "Cerrar conversación"}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
