import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Check,
  Sparkles,
  X,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { ClubCrest } from "@/components/game/crest";
import { PlayerPortrait } from "@/components/game/player-portrait";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Negotiation } from "@/components/game/negotiation";
import { CLUBS, clubById } from "@/lib/game/clubs";
import { clauseOf, contractEndLabel, isExpiring } from "@/lib/game/contracts";
import { FREE_AGENT } from "@/lib/game/free-agents";
import {
  COMP_LABEL,
  GROUP_LABEL,
  NAT_LABEL,
  POS_LABEL,
  formatMoney,
  formatWage,
  ovrClass,
  posGroup,
  seasonLabel,
} from "@/lib/game/format";
import { useGame } from "@/lib/game/store";
import { hasPlayerPhoto } from "@/lib/game/face-assets";
import { playGameSound } from "@/lib/game/sound";
import { isOwnedAtClub } from "@/lib/game/squad-rules";
import {
  isValidLoanOptionPrice,
  loanOptionAskPrice,
  loanOptionCounteroffer,
  maxLoanOptionPrice,
  parseMoneyInput,
} from "@/lib/game/loan-terms";
import {
  askPrice,
  findMarketPlayerInLists,
  fullMarketFromLists,
  loanFee,
  loanMarketFromPlayers,
} from "@/lib/game/transfers";
import type { Player, Pos, PosGroup, TransferRecord } from "@/lib/game/types";

const GROUPS: Array<PosGroup | "ALL"> = ["ALL", "GK", "DEF", "MID", "FWD"];
const POSITIONS: Pos[] = [
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
type Tab = "buy" | "offers" | "loans" | "listed" | "contracts" | "history";
type Scope = "all" | "free" | "listed";
type ClauseFilter = "all" | "with" | "none" | "payable";
type PhotoFilter = "all" | "with" | "without";
type SortKey = "ovr" | "age" | "value" | "wage";

const PAGE_SIZE = 25;
const HISTORY_PAGE = 20;
const MARKET_SEARCH_TEXT = new WeakMap<
  Player,
  { name: string; clubId: string; clubName: string; text: string }
>();

const LEAGUE_LABEL: Record<string, string> = {
  serieA: COMP_LABEL.serieA,
  serieB: COMP_LABEL.serieB,
  premier: COMP_LABEL.premier,
  championship: COMP_LABEL.championship,
  leagueOne: COMP_LABEL.leagueOne,
  leagueTwo: COMP_LABEL.leagueTwo,
  laliga: COMP_LABEL.laliga,
  segunda: COMP_LABEL.segunda,
  primeraFed1: "1ª Federación G1",
  primeraFed2: "1ª Federación G2",
  bundesliga: COMP_LABEL.bundesliga,
  bundesliga2: COMP_LABEL.bundesliga2,
  bundesliga3: COMP_LABEL.bundesliga3,
  ligue1: COMP_LABEL.ligue1,
  ligue2: COMP_LABEL.ligue2,
  ligue3: COMP_LABEL.ligue3,
  argentina: "LPF",
  brasileirao: "Brasileirão",
  brasileiraoB: "Série B",
  primeira: "Primeira Liga",
  primeira2: "Liga Portugal 2",
  europe: "Resto de Europa",
  conmebol: "Sudamérica",
};

interface Filters {
  ovrMin: string;
  ovrMax: string;
  ageMin: string;
  ageMax: string;
  nat: string;
  pos: Pos | "ALL";
  clubId: string;
  league: string;
  clause: ClauseFilter;
  photo: PhotoFilter;
  sort: SortKey;
  dir: "desc" | "asc";
}

const NO_FILTERS: Filters = {
  ovrMin: "",
  ovrMax: "",
  ageMin: "",
  ageMax: "",
  nat: "ALL",
  pos: "ALL",
  clubId: "ALL",
  league: "ALL",
  clause: "all",
  photo: "all",
  sort: "ovr",
  dir: "desc",
};

type MarketMoment =
  | { kind: "sign" | "renew"; player: Player }
  | {
      kind: "sale" | "loan";
      player: Player;
      destination: Player["clubId"];
      fee: number;
      loanSeasons?: number;
      optionFee?: number;
    };

const selectCls =
  "h-10 min-w-0 rounded-xl bg-surface px-2 text-sm shadow-[var(--shadow-border)] outline-none focus:shadow-[var(--shadow-border-hover)]";
const numCls =
  "h-10 w-full min-w-0 rounded-xl bg-surface px-2 text-sm tabular-nums shadow-[var(--shadow-border)] outline-none placeholder:text-fg-subtle focus:shadow-[var(--shadow-border-hover)]";

function marketSearchText(player: Player) {
  const clubName =
    player.clubId === FREE_AGENT ? "" : clubById(player.clubId).name;
  const cached = MARKET_SEARCH_TEXT.get(player);
  if (
    cached?.name === player.name &&
    cached.clubId === player.clubId &&
    cached.clubName === clubName
  ) {
    return cached.text;
  }
  const text = `${player.name.toLowerCase()} ${clubName.toLowerCase()}`;
  MARKET_SEARCH_TEXT.set(player, {
    name: player.name,
    clubId: player.clubId,
    clubName,
    text,
  });
  return text;
}

function pageList(page: number, pages: number): Array<number | "…"> {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: Array<number | "…"> = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pages - 1, page + 1);
  if (from > 2) out.push("…");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < pages - 1) out.push("…");
  out.push(pages);
  return out;
}

function Pager({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (n: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1"
      aria-label="Paginación"
    >
      <Button
        size="sm"
        variant="ghost"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        ‹
      </Button>
      {pageList(page, pages).map((n, i) =>
        n === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-fg-muted">
            …
          </span>
        ) : (
          <Button
            key={n}
            size="sm"
            variant={n === page ? "club" : "ghost"}
            onClick={() => onPage(n)}
          >
            {n}
          </Button>
        ),
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        ›
      </Button>
    </nav>
  );
}

export function Market() {
  const save = useGame(
    useShallow((s) => ({
      clubId: s.clubId,
      players: s.players,
      freeAgents: s.freeAgents,
      budget: s.budget,
      offers: s.offers,
      transferLog: s.transferLog,
      season: s.season,
    })),
  );
  const { clubId, budget } = save;
  const takeOnLoan = useGame((s) => s.takeOnLoan);
  const acceptIncoming = useGame((s) => s.acceptIncoming);
  const rejectIncoming = useGame((s) => s.rejectIncoming);
  const toggleListed = useGame((s) => s.toggleListed);
  const toggleLoanListed = useGame((s) => s.toggleLoanListed);
  const [tab, setTab] = useState<Tab>("buy");
  const [group, setGroup] = useState<PosGroup | "ALL">("ALL");
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q);
  const [msg, setMsg] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [loanYears, setLoanYears] = useState<1 | 2 | 3>(1);
  const [loanBuyOption, setLoanBuyOption] = useState(false);
  const [loanOptionPrice, setLoanOptionPrice] = useState("");
  const [loanCounteroffer, setLoanCounteroffer] = useState<number | null>(null);
  const [scope, setScope] = useState<Scope>("all");
  const [deal, setDeal] = useState<{
    playerId: string;
    kind: "sign" | "renew";
  } | null>(null);
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [histPage, setHistPage] = useState(1);
  const [histScope, setHistScope] = useState<
    "all" | "mine" | "loan" | "sale" | "free"
  >("all");
  const [marketMoment, setMarketMoment] = useState<MarketMoment | null>(null);
  const [budgetAlert, setBudgetAlert] = useState<{
    player: Player;
    required: number;
    available: number;
  } | null>(null);
  const setF = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    setFilters((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!marketMoment) return;
    const dismiss = () => setMarketMoment(null);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    const timer = window.setTimeout(dismiss, 4200);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [marketMoment]);

  useEffect(() => {
    if (!budgetAlert) return;
    const dismiss = () => setBudgetAlert(null);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    const timer = window.setTimeout(dismiss, 6000);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [budgetAlert]);

  const source = useMemo(
    () => {
      if (marketMoment || budgetAlert || (tab !== "buy" && tab !== "loans")) {
        return [];
      }
      return tab === "loans"
        ? loanMarketFromPlayers(save.players, clubId)
        : fullMarketFromLists(save.players, save.freeAgents, clubId);
    },
    [save.players, save.freeAgents, clubId, tab, marketMoment, budgetAlert],
  );

  const natOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of source) if (p.nat) set.add(p.nat);
    return [...set].sort((a, b) =>
      (NAT_LABEL[a] ?? a).localeCompare(NAT_LABEL[b] ?? b, "es"),
    );
  }, [source]);

  const leagueOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of source)
      if (p.clubId !== FREE_AGENT) set.add(clubById(p.clubId).league);
    return [...set];
  }, [source]);

  const clubOptions = useMemo(
    () =>
      CLUBS.filter(
        (c) =>
          !c.ghost &&
          c.id !== clubId &&
          (filters.league === "ALL" || c.league === filters.league),
      ).sort((a, b) => a.name.localeCompare(b.name, "es")),
    [clubId, filters.league],
  );

  const sortedSource = useMemo(() => {
    const key = filters.sort;
    const value = (p: Player) =>
      key === "value" ? p.value : key === "wage" ? p.wage : p[key];
    const sign = filters.dir === "desc" ? -1 : 1;
    return [...source].sort(
      (a, b) => (value(a) - value(b)) * sign || b.ovr - a.ovr,
    );
  }, [source, filters.sort, filters.dir]);

  const payableBudget = filters.clause === "payable" ? budget : null;
  const rows = useMemo(() => {
    let r = sortedSource;
    if (tab === "buy" && scope === "free")
      r = r.filter((p) => p.clubId === FREE_AGENT);
    if (tab === "buy" && scope === "listed") r = r.filter((p) => p.listed);
    if (group !== "ALL") r = r.filter((p) => posGroup(p.pos) === group);
    if (filters.pos !== "ALL") r = r.filter((p) => p.pos === filters.pos);
    if (filters.nat !== "ALL") r = r.filter((p) => p.nat === filters.nat);
    if (filters.league !== "ALL")
      r = r.filter(
        (p) =>
          p.clubId !== FREE_AGENT &&
          clubById(p.clubId).league === filters.league,
      );
    if (filters.clubId !== "ALL")
      r = r.filter((p) => p.clubId === filters.clubId);
    if (filters.photo === "with") r = r.filter(hasPlayerPhoto);
    if (filters.photo === "without") r = r.filter((p) => !hasPlayerPhoto(p));
    const num = (v: string) =>
      v.trim() === "" || Number.isNaN(Number(v)) ? null : Number(v);
    const oMin = num(filters.ovrMin);
    const oMax = num(filters.ovrMax);
    const aMin = num(filters.ageMin);
    const aMax = num(filters.ageMax);
    if (oMin !== null) r = r.filter((p) => p.ovr >= oMin);
    if (oMax !== null) r = r.filter((p) => p.ovr <= oMax);
    if (aMin !== null) r = r.filter((p) => p.age >= aMin);
    if (aMax !== null) r = r.filter((p) => p.age <= aMax);
    if (filters.clause !== "all") {
      r = r.filter((p) => {
        const c = p.clubId === FREE_AGENT ? null : clauseOf(p);
        if (filters.clause === "with") return c !== null;
        if (filters.clause === "none") return c === null;
        return c !== null && payableBudget !== null && c <= payableBudget;
      });
    }
    if (deferredQ.trim()) {
      const t = deferredQ.trim().toLowerCase();
      r = r.filter((player) => marketSearchText(player).includes(t));
    }
    return r;
  }, [sortedSource, tab, scope, group, filters, deferredQ, payableBudget]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const pool = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Cualquier cambio de filtro o pestaña vuelve a la página 1.
  useEffect(() => {
    setPage(1);
  }, [tab, group, q, scope, filters]);
  useEffect(() => {
    setHistPage(1);
  }, [histScope]);

  const activeFilters =
    (filters.ovrMin ? 1 : 0) +
    (filters.ovrMax ? 1 : 0) +
    (filters.ageMin ? 1 : 0) +
    (filters.ageMax ? 1 : 0) +
    (filters.nat !== "ALL" ? 1 : 0) +
    (filters.pos !== "ALL" ? 1 : 0) +
    (filters.clubId !== "ALL" ? 1 : 0) +
    (filters.league !== "ALL" ? 1 : 0) +
    (filters.clause !== "all" ? 1 : 0) +
    (filters.photo !== "all" ? 1 : 0);

  const history = useMemo(() => {
    const log = save.transferLog ?? [];
    return log.filter((t) => {
      if (histScope === "mine") return Boolean(t.user);
      if (histScope === "loan") return t.kind === "loan";
      if (histScope === "sale") return t.kind === "sale" || t.kind === "clause";
      if (histScope === "free")
        return t.kind === "free" || t.kind === "release";
      return true;
    });
  }, [save.transferLog, histScope]);
  const histPages = Math.max(1, Math.ceil(history.length / HISTORY_PAGE));
  const histSafe = Math.min(histPage, histPages);
  const histRows = history.slice(
    (histSafe - 1) * HISTORY_PAGE,
    histSafe * HISTORY_PAGE,
  );

  // Los agentes libres no están en save.players: hay que buscarlos también en la lista de libres.
  const current = useMemo(
    () =>
      picked
        ? (findMarketPlayerInLists(save.players, save.freeAgents, picked)?.player ??
          null)
        : null,
    [picked, save.players, save.freeAgents],
  );
  const defaultLoanOptionFee = current
    ? loanOptionAskPrice(current.value)
    : 0;
  const parsedLoanOptionPrice = parseMoneyInput(
    loanOptionPrice || String(defaultLoanOptionFee),
  );
  const validLoanOptionPrice =
    parsedLoanOptionPrice !== null &&
    current !== null &&
    isValidLoanOptionPrice(parsedLoanOptionPrice, current.value);
  const completeLoanSigning = (optionFee?: number) => {
    if (!current) return;
    const err = takeOnLoan(current.id, loanYears, optionFee);
    setMsg(err ?? `${current.name} llega a cesión.`);
    if (!err) {
      playGameSound("sign");
      setMarketMoment({
        kind: "loan",
        player: current,
        destination: clubId,
        fee: loanFee(current, loanYears),
        loanSeasons: loanYears,
        optionFee,
      });
      setPicked(null);
      setLoanCounteroffer(null);
    }
  };
  // Escaparate y ofertas: solo jugadores propios. Los cedidos no se pueden vender ni ofrecer.
  const mine = useMemo(
    () => save.players.filter((p) => isOwnedAtClub(p, clubId)),
    [save.players, clubId],
  );
  const mineIds = useMemo(() => new Set(mine.map((p) => p.id)), [mine]);
  const mineById = useMemo(() => new Map(mine.map((p) => [p.id, p])), [mine]);
  const listed = useMemo(
    () => mine.filter((p) => p.listed || p.listedForLoan),
    [mine],
  );
  const offers = useMemo(
    () => save.offers.filter((o) => o.toClubId === clubId && mineIds.has(o.playerId)),
    [save.offers, clubId, mineIds],
  );
  const contracts = useMemo(
    () =>
      save.players
        .filter((p) => p.clubId === clubId && !p.loanFrom)
        .sort((a, b) => a.contract - b.contract || b.ovr - a.ovr),
    [save.players, clubId],
  );
  const expiringCount = contracts.filter((p) => isExpiring(p)).length;
  const freeCount = save.freeAgents.length;
  // Un solo bloque por jugador: ofertas ordenadas de mayor a menor precio.
  const offerGroups = useMemo(() => {
    const byPlayer = new Map<string, typeof offers>();
    for (const o of offers) {
      const list = byPlayer.get(o.playerId) ?? [];
      list.push(o);
      byPlayer.set(o.playerId, list);
    }
    return [...byPlayer.entries()]
      .map(([playerId, list]) => ({
        playerId,
        offers: [...list].sort((a, b) => b.fee - a.fee),
      }))
      .sort((a, b) => (b.offers[0]?.fee ?? 0) - (a.offers[0]?.fee ?? 0));
  }, [offers]);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="font-display text-3xl font-semibold">Mercado</h2>
        <p className="text-sm text-fg-muted">
          Caja {formatMoney(budget)} · tope 40 jugadores
        </p>
      </header>
      <div className="flex flex-wrap gap-1">
        {(
          [
            ["buy", "Fichajes"],
            ["offers", "Ofertas"],
            ["loans", "Cesiones"],
            ["listed", "En venta"],
            ["contracts", "Contratos"],
            ["history", "Historial"],
          ] as const
        ).map(([id, label]) => (
          <Button
            key={id}
            size="sm"
            variant={tab === id ? "club" : "ghost"}
            onClick={() => setTab(id)}
          >
            {label}
            {id === "contracts" && expiringCount > 0 ? (
              <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-comp-uel px-1.5 text-[11px] leading-5 text-black">
                {expiringCount}
              </span>
            ) : null}
            {id === "offers" && offers.length > 0 ? (
              <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] leading-5 text-primary-foreground">
                {offers.length}
              </span>
            ) : null}
          </Button>
        ))}
      </div>

      {tab === "offers" ? (
        <ul className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
          {offerGroups.length === 0 ? (
            <li className="px-3 py-4 text-sm text-fg-muted">
              Nadie llama. Pon jugadores en venta o a cesión y espera.
            </li>
          ) : (
            offerGroups.map((g) => {
              const p = mineById.get(g.playerId);
              if (!p) return null;
              const top = g.offers[0]!;
              return (
                <li
                  key={g.playerId}
                  className="border-b border-border/60 px-3 py-3 last:border-0"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-[11px] text-fg-muted">
                        {POS_LABEL[p.pos]} · GRL {p.ovr} · POT {p.pot}
                        {g.offers.length > 1
                          ? ` · ${g.offers.length} ofertas`
                          : ""}
                      </p>
                    </div>
                    <p className="font-display text-2xl tabular-nums">
                      {formatMoney(top.fee)}
                    </p>
                  </div>
                  <ul className="mt-2 flex flex-col gap-2">
                    {g.offers.map((o) => {
                      const from = clubById(o.fromClubId);
                      return (
                        <li
                          key={o.id}
                          className="flex flex-col gap-2 rounded-lg bg-elevated px-3 py-2 sm:flex-row sm:items-center"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <ClubCrest club={from} size={24} />
                            <div className="min-w-0">
                              <p className="truncate text-sm">
                                {from.name} · {formatMoney(o.fee)}
                              </p>
                              <p className="text-[11px] text-fg-muted">
                                {o.kind === "loan"
                                  ? `cesión ${o.loanSeasons} t.${o.loanOptionFee ? ` · opción ${formatMoney(o.loanOptionFee)}` : ""}`
                                  : "compra"}
                                {o.unsolicited ? " · no estaba en venta" : ""}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="club"
                              onClick={() => {
                                const err = acceptIncoming(o.id);
                                setMsg(err ?? "Trato cerrado.");
                                if (!err) {
                                  playGameSound("sale");
                                  setMarketMoment({
                                    kind: o.kind === "loan" ? "loan" : "sale",
                                    player: p,
                                    destination: o.fromClubId,
                                    fee: o.fee,
                                    loanSeasons:
                                      o.kind === "loan"
                                        ? o.loanSeasons
                                        : undefined,
                                    optionFee:
                                      o.kind === "loan"
                                        ? o.loanOptionFee
                                        : undefined,
                                  });
                                }
                              }}
                            >
                              Aceptar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => rejectIncoming(o.id)}
                            >
                              Rechazar
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      {tab === "contracts" ? (
        <ul className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
          {contracts.map((p) => {
            const soon = isExpiring(p);
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 border-b border-border/60 px-3 py-3 last:border-0"
              >
                <PlayerPortrait player={p} size="row" />
                <span
                  className={cn(
                    "w-8 font-display text-lg tabular-nums",
                    ovrClass(p.ovr),
                  )}
                >
                  {p.ovr}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-[11px] text-fg-muted">
                    {POS_LABEL[p.pos]} · {p.age} años · {formatWage(p.wage)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "text-xs tabular-nums",
                      soon ? "font-medium text-comp-uel" : "text-fg-muted",
                    )}
                  >
                    {contractEndLabel(save.season, p)}
                  </p>
                  <p className="text-[11px] text-fg-muted">
                    {soon ? "Último año" : `${p.contract} años`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={soon ? "club" : "ghost"}
                  onClick={() => setDeal({ playerId: p.id, kind: "renew" })}
                >
                  Renovar
                </Button>
              </li>
            );
          })}
          <li className="px-3 py-3 text-[11px] text-fg-muted">
            Si no renovás a quien está en su último año, deja el club libre al
            terminar la temporada.
          </li>
        </ul>
      ) : null}

      {tab === "listed" ? (
        <ul className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
          {listed.length === 0 ? (
            <li className="px-3 py-4 text-sm text-fg-muted">
              Nadie en el escaparate. En plantilla puedes poner a la venta o
              ceder.
            </li>
          ) : (
            listed.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 border-b border-border/60 px-3 py-3 last:border-0"
              >
                <span
                  className={cn(
                    "w-8 font-display text-lg tabular-nums",
                    ovrClass(p.ovr),
                  )}
                >
                  {p.ovr}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-[11px] text-fg-muted">
                    {p.listed ? "En venta" : "A cesión"} ·{" "}
                    {formatMoney(p.value)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    p.listed ? toggleListed(p.id) : toggleLoanListed(p.id)
                  }
                >
                  Quitar
                </Button>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {tab === "history" ? (
        <>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ["all", "Todo"],
                ["mine", "Mi club"],
                ["sale", "Ventas"],
                ["loan", "Cesiones"],
                ["free", "Libres"],
              ] as const
            ).map(([id, label]) => (
              <Button
                key={id}
                size="sm"
                variant={histScope === id ? "club" : "ghost"}
                onClick={() => setHistScope(id)}
              >
                {label}
              </Button>
            ))}
          </div>
          <ul className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
            {histRows.length === 0 ? (
              <li className="px-3 py-4 text-sm text-fg-muted">
                Todavía no hubo movimientos. Avanza semanas: el mercado se
                mueve.
              </li>
            ) : (
              histRows.map((t) => <HistoryRow key={t.id} t={t} />)
            )}
          </ul>
          <p className="text-center text-[11px] text-fg-muted">
            {history.length} movimientos · página {histSafe} de {histPages}
          </p>
          <Pager page={histSafe} pages={histPages} onPage={setHistPage} />
        </>
      ) : null}

      {tab === "buy" || tab === "loans" ? (
        <>
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar jugador o club"
              className="h-11 min-w-0 flex-1 rounded-xl bg-surface px-3 text-sm shadow-[var(--shadow-border)] outline-none placeholder:text-fg-subtle focus:shadow-[var(--shadow-border-hover)]"
            />
            <Button
              size="sm"
              variant={showFilters || activeFilters > 0 ? "club" : "ghost"}
              onClick={() => setShowFilters((v) => !v)}
            >
              Filtros{activeFilters > 0 ? ` (${activeFilters})` : ""}
            </Button>
          </div>
          {tab === "buy" ? (
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                variant={scope === "all" ? "club" : "ghost"}
                onClick={() => setScope("all")}
              >
                Todos
              </Button>
              <Button
                size="sm"
                variant={scope === "free" ? "club" : "ghost"}
                onClick={() => setScope("free")}
              >
                Agentes libres ({freeCount})
              </Button>
              <Button
                size="sm"
                variant={scope === "listed" ? "club" : "ghost"}
                onClick={() => setScope("listed")}
              >
                En venta
              </Button>
            </div>
          ) : null}
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
          </div>

          {showFilters ? (
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface p-3 shadow-[var(--shadow-border)] sm:grid-cols-3">
              <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
                Posición
                <select
                  className={selectCls}
                  value={filters.pos}
                  onChange={(e) => setF("pos", e.target.value as Pos | "ALL")}
                >
                  <option value="ALL">Todas</option>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {POS_LABEL[p]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
                País
                <select
                  className={selectCls}
                  value={filters.nat}
                  onChange={(e) => setF("nat", e.target.value)}
                >
                  <option value="ALL">Todos</option>
                  {natOptions.map((n) => (
                    <option key={n} value={n}>
                      {NAT_LABEL[n] ?? n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
                Liga
                <select
                  className={selectCls}
                  value={filters.league}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      league: e.target.value,
                      clubId: "ALL",
                    }))
                  }
                >
                  <option value="ALL">Todas</option>
                  {leagueOptions.map((l) => (
                    <option key={l} value={l}>
                      {LEAGUE_LABEL[l] ?? l}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
                Club
                <select
                  className={selectCls}
                  value={filters.clubId}
                  onChange={(e) => setF("clubId", e.target.value)}
                >
                  <option value="ALL">Todos</option>
                  {clubOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
                Cláusula
                <select
                  className={selectCls}
                  value={filters.clause}
                  onChange={(e) =>
                    setF("clause", e.target.value as ClauseFilter)
                  }
                >
                  <option value="all">Cualquiera</option>
                  <option value="with">Con cláusula</option>
                  <option value="none">Sin cláusula</option>
                  <option value="payable">Puedo pagarla</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
                Foto del jugador
                <select
                  className={selectCls}
                  value={filters.photo}
                  onChange={(e) =>
                    setF("photo", e.target.value as PhotoFilter)
                  }
                >
                  <option value="all">Todos</option>
                  <option value="with">Con foto real</option>
                  <option value="without">Sin foto real</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[11px] text-fg-muted">
                Ordenar por
                <span className="flex gap-1">
                  <select
                    className={cn(selectCls, "flex-1")}
                    value={filters.sort}
                    onChange={(e) => setF("sort", e.target.value as SortKey)}
                  >
                    <option value="ovr">Overall</option>
                    <option value="age">Edad</option>
                    <option value="value">Valor</option>
                    <option value="wage">Salario</option>
                  </select>
                  <button
                    type="button"
                    className={cn(selectCls, "w-10 shrink-0 text-center")}
                    onClick={() =>
                      setF("dir", filters.dir === "desc" ? "asc" : "desc")
                    }
                    aria-label="Invertir orden"
                  >
                    {filters.dir === "desc" ? "↓" : "↑"}
                  </button>
                </span>
              </label>
              <div className="flex flex-col gap-1 text-[11px] text-fg-muted">
                Overall
                <span className="flex items-center gap-1">
                  <input
                    className={numCls}
                    inputMode="numeric"
                    placeholder="mín"
                    value={filters.ovrMin}
                    onChange={(e) => setF("ovrMin", e.target.value)}
                  />
                  <span>–</span>
                  <input
                    className={numCls}
                    inputMode="numeric"
                    placeholder="máx"
                    value={filters.ovrMax}
                    onChange={(e) => setF("ovrMax", e.target.value)}
                  />
                </span>
              </div>
              <div className="flex flex-col gap-1 text-[11px] text-fg-muted">
                Edad
                <span className="flex items-center gap-1">
                  <input
                    className={numCls}
                    inputMode="numeric"
                    placeholder="mín"
                    value={filters.ageMin}
                    onChange={(e) => setF("ageMin", e.target.value)}
                  />
                  <span>–</span>
                  <input
                    className={numCls}
                    inputMode="numeric"
                    placeholder="máx"
                    value={filters.ageMax}
                    onChange={(e) => setF("ageMax", e.target.value)}
                  />
                </span>
              </div>
              <div className="flex items-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFilters(NO_FILTERS)}
                >
                  Limpiar filtros
                </Button>
              </div>
            </div>
          ) : null}

          <p className="text-[11px] text-fg-muted">
            {rows.length} jugador{rows.length === 1 ? "" : "es"} · página{" "}
            {safePage} de {pages}
          </p>
          <ul className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
            {pool.length === 0 ? (
              <li className="px-3 py-4 text-sm text-fg-muted">
                Ningún jugador cumple esos filtros.
              </li>
            ) : (
              pool.map((p) => (
                <MarketRow
                  key={p.id}
                  player={p}
                  active={picked === p.id}
                  onPick={() => {
                    setPicked(p.id);
                    setLoanBuyOption(false);
                    setLoanOptionPrice("");
                    setLoanCounteroffer(null);
                  }}
                />
              ))
            )}
          </ul>
          <Pager page={safePage} pages={pages} onPage={setPage} />
        </>
      ) : null}

      {current && (tab === "buy" || tab === "loans") ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-bg/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:p-4"
          onClick={() => setPicked(null)}
        >
          <div
            className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-elevated shadow-[var(--shadow-border)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-y-auto p-5 pb-3">
              <div className="flex items-start gap-3">
                <PlayerPortrait player={current} size="list" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-2xl font-semibold leading-tight">
                    {current.name}
                  </p>
                  <p className="mt-1 text-sm text-fg-muted">
                    {POS_LABEL[current.pos]} · {current.age} años · POT{" "}
                    {current.pot} ·{" "}
                    {current.clubId === FREE_AGENT
                      ? "Agente libre"
                      : clubById(current.clubId).name}
                  </p>
                  <p className="mt-1 text-xs text-fg-muted">
                    {formatWage(current.wage)}
                    {current.clubId !== FREE_AGENT && clauseOf(current) !== null
                      ? ` · cláusula ${formatMoney(clauseOf(current) ?? 0)}`
                      : ""}
                    {current.clubId !== FREE_AGENT && clauseOf(current) === null
                      ? " · sin cláusula"
                      : ""}
                  </p>
                </div>
                <p
                  className={cn(
                    "font-display text-4xl tabular-nums",
                    ovrClass(current.ovr),
                  )}
                >
                  {current.ovr}
                </p>
              </div>
              {tab === "loans" ? (
                <div className="mt-3 flex gap-1">
                  {([1, 2, 3] as const).map((years) => (
                    <Button
                      key={years}
                      size="sm"
                      variant={loanYears === years ? "club" : "ghost"}
                      onClick={() => setLoanYears(years)}
                    >
                      {years} temporada{years === 1 ? "" : "s"}
                    </Button>
                  ))}
                </div>
              ) : null}
              {tab === "loans" ? (
                <div className="mt-4 rounded-xl bg-surface p-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={loanBuyOption}
                      onChange={(event) => {
                        setLoanBuyOption(event.target.checked);
                        setLoanCounteroffer(null);
                      }}
                    />
                    Negociar opción de compra
                  </label>
                  {loanBuyOption ? (
                    <label className="mt-3 block text-sm">
                      Precio acordado para ficharlo
                      <input
                        className="mt-1 h-10 w-full rounded-xl bg-elevated px-3 tabular-nums shadow-[var(--shadow-border)] outline-none focus:shadow-[var(--shadow-border-hover)]"
                        type="text"
                        inputMode="decimal"
                        placeholder="Ej.: 850k o 1,2m"
                        value={loanOptionPrice || String(defaultLoanOptionFee)}
                        onChange={(event) => {
                          setLoanOptionPrice(event.target.value);
                          setLoanCounteroffer(null);
                        }}
                      />
                      <span className="mt-1 block text-[11px] text-fg-muted">
                        El club pide {formatMoney(defaultLoanOptionFee)}.
                        Máximo:{" "}
                        {formatMoney(
                          current ? maxLoanOptionPrice(current.value) : 0,
                        )}
                        . Si ofreces menos que el valor actual, podría
                        contraofertar.
                      </span>
                    </label>
                  ) : null}
                </div>
              ) : null}
              {tab === "loans" && loanCounteroffer !== null ? (
                <div className="rounded-xl border border-border bg-surface p-3 text-sm">
                  <p>
                    El club no acepta esa cifra y contraoferta{" "}
                    <strong>{formatMoney(loanCounteroffer)}</strong>, el valor
                    actual del jugador.
                  </p>
                  <Button
                    className="mt-2 w-full"
                    variant="club"
                    onClick={() => completeLoanSigning(loanCounteroffer)}
                  >
                    Aceptar contraoferta
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 border-t border-border bg-elevated p-4">
              {tab === "buy" ? (
                <Button
                  variant="club"
                  onClick={() => {
                    setDeal({ playerId: current.id, kind: "sign" });
                  }}
                >
                  {current.clubId === FREE_AGENT
                    ? "Negociar contrato (libre)"
                    : `Negociar · traspaso ${formatMoney(askPrice(current))}`}
                </Button>
              ) : (
                <Button
                  variant="club"
                  disabled={
                    tab === "loans" && loanBuyOption && !validLoanOptionPrice
                  }
                  onClick={() => {
                    if (loanBuyOption && parsedLoanOptionPrice !== null) {
                      const counteroffer = loanOptionCounteroffer(
                        current.value,
                        parsedLoanOptionPrice,
                      );
                      if (counteroffer !== null) {
                        setLoanCounteroffer(counteroffer);
                        return;
                      }
                    }
                    completeLoanSigning(
                      loanBuyOption ? parsedLoanOptionPrice ?? undefined : undefined,
                    );
                  }}
                >
                  Ceder por {formatMoney(loanFee(current, loanYears))}
                </Button>
              )}
              <Button variant="ghost" onClick={() => setPicked(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {deal ? (
        <Negotiation
          key={`${deal.kind}:${deal.playerId}`}
          playerId={deal.playerId}
          kind={deal.kind}
          onClose={() => setDeal(null)}
          onBudgetFailure={(player, required, available) => {
            setDeal(null);
            setBudgetAlert({ player, required, available });
          }}
          onDone={(m, signedPlayer) => {
            setMsg(m);
            setPicked(null);
            if (signedPlayer) playGameSound("sign");
            setMarketMoment(
              signedPlayer && deal
                ? { kind: deal.kind, player: signedPlayer }
                : null,
            );
          }}
        />
      ) : null}

      {msg ? <p className="text-sm text-fg-muted">{msg}</p> : null}
      {marketMoment ? (
        <div
          className="signing-celebration"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-moment-title"
          onClick={() => setMarketMoment(null)}
        >
          <div className="signing-sparks" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => (
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
              aria-label="Cerrar celebración"
              className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-fg/8 hover:text-fg"
              onClick={() => setMarketMoment(null)}
            >
              <X className="size-4" />
            </button>
            <div className="signing-seal" aria-hidden="true">
              {marketMoment.kind === "sign" || marketMoment.kind === "renew" ? (
                <Check className="size-8" />
              ) : (
                <Banknote className="size-8" />
              )}
            </div>
            <PlayerPortrait
              player={marketMoment.player}
              size="hero"
              className="mx-auto mt-4"
            />
            <p className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-club">
              <Sparkles className="size-4" />
              {marketMoment.kind === "sale"
                ? "Traspaso confirmado"
                : marketMoment.kind === "loan"
                  ? "Cesión confirmada"
                  : marketMoment.kind === "renew"
                    ? "Renovación confirmada"
                    : "Fichaje confirmado"}
              <Sparkles className="size-4" />
            </p>
            <h2
              id="transfer-moment-title"
              className="mt-2 font-display text-4xl font-semibold leading-none sm:text-5xl"
            >
              {marketMoment.player.name}
            </h2>
            <p className="mt-2 text-sm text-fg-muted">
              {marketMoment.kind === "sale"
                ? `Venta por ${formatMoney(marketMoment.fee)}`
                : marketMoment.kind === "loan"
                  ? `Cesión por ${marketMoment.loanSeasons} temporada${marketMoment.loanSeasons === 1 ? "" : "s"} · ${formatMoney(marketMoment.fee)}${marketMoment.optionFee ? ` · opción de compra ${formatMoney(marketMoment.optionFee)}` : ""}`
                  : marketMoment.kind === "renew"
                    ? `Contrato renovado · ${POS_LABEL[marketMoment.player.pos]} · GRL ${marketMoment.player.ovr}`
                    : `${POS_LABEL[marketMoment.player.pos]} · GRL ${marketMoment.player.ovr}`}
            </p>
            <div className="my-5 flex items-center justify-center gap-3 border-y border-border py-4">
              <span className="signing-club-crest">
                <ClubCrest
                  club={clubById(
                    marketMoment.kind === "sale" || marketMoment.kind === "loan"
                      ? marketMoment.destination
                      : clubId,
                  )}
                  size={40}
                />
              </span>
              <div className="text-left">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-fg-muted">
                  {marketMoment.kind === "sale"
                    ? "Nuevo club"
                    : marketMoment.kind === "loan"
                      ? "Se incorpora a"
                      : marketMoment.kind === "renew"
                        ? "Renueva con"
                        : "Nuevo jugador de"}
                </p>
                <p className="font-display text-xl font-semibold">
                  {
                    clubById(
                      marketMoment.kind === "sale" ||
                        marketMoment.kind === "loan"
                        ? marketMoment.destination
                        : clubId,
                    ).name
                  }
                </p>
              </div>
            </div>
            <p className="text-xs text-fg-muted">
              {marketMoment.kind === "sale"
                ? "Gracias por su etapa en el club"
                : marketMoment.kind === "loan"
                  ? "¡Que tenga una gran etapa!"
                  : marketMoment.kind === "renew"
                    ? "Una historia que continúa."
                    : "Bienvenido al equipo"}
            </p>
          </section>
          <span className="sr-only" aria-live="polite">
            {marketMoment.kind === "sale"
              ? `${marketMoment.player.name} transferido a ${clubById(marketMoment.destination).name}.`
              : marketMoment.kind === "loan"
                ? `${marketMoment.player.name} cedido a ${clubById(marketMoment.destination).name}.`
                : marketMoment.kind === "renew"
                  ? `${marketMoment.player.name} renovó contrato con tu club.`
                  : `${marketMoment.player.name} ya es jugador del club.`}
          </span>
        </div>
      ) : null}
      {budgetAlert ? (
        <div
          className="signing-celebration"
          role="dialog"
          aria-modal="true"
          aria-labelledby="budget-alert-title"
          onClick={() => setBudgetAlert(null)}
        >
          <div className="signing-sparks" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => (
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
              aria-label="Cerrar aviso de presupuesto"
              className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-fg/8 hover:text-fg"
              onClick={() => setBudgetAlert(null)}
            >
              <X className="size-4" />
            </button>
            <div
              className="signing-seal text-bad"
              style={{
                borderColor:
                  "color-mix(in oklab, var(--color-bad) 70%, transparent)",
                background:
                  "color-mix(in oklab, var(--color-bad) 18%, var(--color-surface))",
              }}
              aria-hidden="true"
            >
              <AlertTriangle className="size-8" />
            </div>
            <PlayerPortrait
              player={budgetAlert.player}
              size="hero"
              className="mx-auto mt-4"
            />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-bad">
              Fichaje no alcanzable
            </p>
            <h2
              id="budget-alert-title"
              className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl"
            >
              Presupuesto insuficiente
            </h2>
            <p className="mt-3 text-sm text-fg-muted">
              Tu oferta por {budgetAlert.player.name} no puede ser alcanzada: no
              tienes presupuesto suficiente para este fichaje.
            </p>
            <div className="my-5 grid grid-cols-2 gap-3 border-y border-border py-4 text-left text-sm">
              <div>
                <p className="text-xs text-fg-muted">Necesitas</p>
                <p className="font-display text-xl tabular-nums text-bad">
                  {formatMoney(budgetAlert.required)}
                </p>
              </div>
              <div>
                <p className="text-xs text-fg-muted">Presupuesto disponible</p>
                <p className="font-display text-xl tabular-nums">
                  {formatMoney(budgetAlert.available)}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setBudgetAlert(null)}>
              Entendido
            </Button>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function MarketRow({
  player,
  active,
  onPick,
}: {
  player: Player;
  active: boolean;
  onPick: () => void;
}) {
  const free = player.clubId === FREE_AGENT;
  const club = free ? null : clubById(player.clubId);
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        className={cn(
          "flex w-full items-center gap-3 border-b border-border/60 px-3 py-2.5 text-left last:border-0 hover:bg-fg/4",
          active && "bg-fg/6",
        )}
      >
        <PlayerPortrait player={player} size="row" />
        <span
          className={cn(
            "w-8 font-display text-lg tabular-nums",
            ovrClass(player.ovr),
          )}
        >
          {player.ovr}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">
            {player.name}
          </span>
          <span className="text-[11px] text-fg-muted">
            {POS_LABEL[player.pos]} · {player.age} años · POT {player.pot}
            {player.nat ? ` · ${NAT_LABEL[player.nat] ?? player.nat}` : ""}
            {player.listed ? " · en venta" : ""}
          </span>
        </span>
        {club ? (
          <ClubCrest club={club} size={22} />
        ) : (
          <span className="rounded-full bg-comp-uecl/20 px-2 py-0.5 text-[10px] font-medium uppercase text-comp-uecl">
            Libre
          </span>
        )}
        <span className="w-16 text-right text-xs tabular-nums text-fg-muted">
          {free ? "Sin coste" : formatMoney(player.value)}
        </span>
      </button>
    </li>
  );
}

const KIND_LABEL: Record<TransferRecord["kind"], string> = {
  sale: "Venta",
  loan: "Cesión",
  free: "Libre",
  clause: "Cláusula",
  release: "Rescindido",
};

function Side({ id }: { id: string }) {
  if (id === FREE_AGENT) {
    return (
      <span className="rounded-full bg-comp-uecl/20 px-2 py-0.5 text-[10px] font-medium uppercase text-comp-uecl">
        Libre
      </span>
    );
  }
  const club = clubById(id);
  return (
    <span className="flex min-w-0 flex-col items-center gap-0.5">
      <ClubCrest club={club} size={26} />
      <span className="max-w-14 truncate text-[10px] text-fg-muted">
        {club.short}
      </span>
    </span>
  );
}

function HistoryRow({ t }: { t: TransferRecord }) {
  const money =
    t.kind === "free" || t.kind === "release"
      ? "Sin coste"
      : formatMoney(t.fee);
  return (
    <li
      className={cn(
        "flex items-center gap-3 border-b border-border/60 px-3 py-2.5 last:border-0",
        t.user && "bg-fg/4",
      )}
    >
      <span className="flex w-24 shrink-0 items-center justify-between gap-1">
        <Side id={t.fromId} />
        <ArrowRight
          className="size-4 shrink-0 text-fg-muted"
          aria-label="hacia"
        />
        <Side id={t.toId} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          <span
            className={cn("mr-1.5 font-display tabular-nums", ovrClass(t.ovr))}
          >
            {t.ovr}
          </span>
          {t.name}
        </span>
        <span className="text-[11px] text-fg-muted">
          {POS_LABEL[t.pos]} · {seasonLabel(t.season)} · sem. {t.week}
        </span>
      </span>
      <span className="text-right">
        <span
          className={cn(
            "block text-[10px] font-medium uppercase tracking-wide",
            t.kind === "loan"
              ? "text-comp-uel"
              : t.kind === "sale" || t.kind === "clause"
                ? "text-primary"
                : "text-fg-muted",
          )}
        >
          {KIND_LABEL[t.kind]}
        </span>
        <span className="text-xs tabular-nums text-fg-muted">{money}</span>
      </span>
    </li>
  );
}
