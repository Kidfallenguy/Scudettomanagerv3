import { CLUBS, clubById, isTradableClub } from "./clubs";
import { applyTerms, clauseOf, ensureTerms, renewedContract } from "./contracts";
import { interestedBuyers, runAiMarket } from "./ai-market";
import { NO_CLUB, canAfford, creditClub, ensureFinance, logTransfer } from "./finance";
import { freeNumber, signFreeAgent } from "./free-agents";
import { ensurePos } from "./positions";
import { isValidLoanOptionPrice } from "./loan-terms";
import {
  SQUAD_FULL_MSG,
  freeAgentSaleBlockReason,
  hasSquadRoom,
  isOwnedAtClub,
  ownPlayers,
  ownershipBlockReason,
  saleBlockReason,
  squadTotal,
} from "./squad-rules";
import { SQUAD_LIMIT, capMarketValue, clamp, formatMoney, playerValue, uid } from "./format";
import { publishNews } from "./news";
import { Rng } from "./rng";
import { generated, resyncStats } from "./squads";
import {
  cachePlayerPortrait,
  WONDERKID_FACE_COUNT,
  wonderkidFaceUrl,
} from "./face-assets";
import { dropFromLineup, sanitizeBench } from "./tactics";
import type {
  ClubId,
  ContractTerms,
  GameSave,
  NewsItem,
  Player,
  TransferOffer,
} from "./types";

function squadOf(save: GameSave, clubId: ClubId) {
  return save.players.filter((p) => p.clubId === clubId);
}

function activeSquad(save: GameSave, clubId: ClubId) {
  return save.players.filter((p) => p.clubId === clubId && !p.loanFrom);
}

function news(
  save: GameSave,
  tone: NewsItem["tone"],
  title: string,
  body: string,
  links: Partial<Pick<NewsItem, "category" | "importance" | "clubIds" | "playerIds" | "offerId" | "action" | "sourceKey">> = {},
) {
  publishNews(save, { tone, title, body, ...links });
}

export function askPrice(p: Player) {
  const from = clubById(p.clubId);
  const listedMod = p.listed ? 0.92 : 1.08;
  return capMarketValue(p.value * (from.prestige > 84 ? 1.1 : 1) * listedMod);
}

export function loanFee(p: Player, seasons: number) {
  return Math.round(p.value * (0.035 + p.ovr / 2500) * seasons);
}

export function ownedByUser(p: Player, clubId: ClubId) {
  return p.clubId === clubId || p.loanFrom === clubId;
}

export function marketPoolFromPlayers(players: Player[], clubId: ClubId) {
  const mine = new Set(
    players.filter((player) => player.clubId === clubId).map((player) => player.name.toLowerCase()),
  );
  return marketPoolExcludingNames(players, clubId, mine);
}

function marketPoolExcludingNames(
  players: Player[],
  clubId: ClubId,
  mine: Set<string>,
) {
  return players.filter((p) => {
    if (p.clubId === clubId) return false;
    if (p.loanFrom) return false;
    if (p.listedForLoan) return false;
    if (p.locked) return false;
    if (!isTradableClub(p.clubId)) return false;
    if (mine.has(p.name.toLowerCase())) return false;
    return true;
  });
}

export function marketPool(save: GameSave) {
  return marketPoolFromPlayers(save.players, save.clubId);
}

/** Todo lo que se puede fichar: jugadores de otros clubes y agentes libres. */
export function fullMarketFromLists(
  players: Player[],
  freeAgents: Player[],
  clubId: ClubId,
) {
  const mine = new Set(
    players.filter((p) => p.clubId === clubId).map((p) => p.name.toLowerCase()),
  );
  const free = freeAgents.filter((p) => !mine.has(p.name.toLowerCase()));
  return [...marketPoolExcludingNames(players, clubId, mine), ...free];
}

export function fullMarket(save: GameSave) {
  return fullMarketFromLists(save.players, save.freeAgents, save.clubId);
}

export function findMarketPlayerInLists(
  players: Player[],
  freeAgents: Player[],
  playerId: string,
) {
  const inClub = players.find((x) => x.id === playerId);
  if (inClub) return { player: inClub, free: false };
  const fa = freeAgents.find((x) => x.id === playerId);
  return fa ? { player: fa, free: true } : null;
}

export function findMarketPlayer(save: GameSave, playerId: string) {
  return findMarketPlayerInLists(save.players, save.freeAgents, playerId);
}

/** Cuánto sale el traspaso: los agentes libres no cuestan nada; ceder reventa abarata el precio. */
export function transferFee(p: Player, free: boolean, payClause: boolean, sellOnPct: number) {
  if (free) return 0;
  if (payClause) return clauseOf(p) ?? askPrice(p);
  return Math.round(askPrice(p) * (1 - clamp(sellOnPct, 0, 30) * 0.005));
}

/** Si el jugador tenía % de reventa pactado, el club que lo vendió cobra su parte. */
export function settleSellOn(save: GameSave, p: Player, fee: number, sellerIsUser: boolean) {
  const so = p.sellOn;
  p.sellOn = null;
  if (!so || so.pct <= 0) return fee;
  const cut = Math.round((fee * so.pct) / 100);
  if (so.clubId === save.clubId && !sellerIsUser) {
    save.budget += cut;
    news(
      save,
      "good",
      `Reventa de ${p.name}`,
      `Cobrás ${formatMoney(cut)} (${so.pct}%) por su venta a otro club.`,
    );
    return fee;
  }
  if (sellerIsUser && so.clubId !== save.clubId) {
    news(
      save,
      "neutral",
      `Reventa de ${p.name}`,
      `${clubById(so.clubId).name} se queda ${formatMoney(cut)} (${so.pct}%) de la venta.`,
    );
    return fee - cut;
  }
  return fee;
}

export function loanMarketFromPlayers(players: Player[], clubId: ClubId) {
  const mine = new Set(
    players.filter((p) => p.clubId === clubId).map((p) => p.name.toLowerCase()),
  );
  return players.filter((p) => {
    if (p.clubId === clubId) return false;
    if (p.loanFrom) return false;
    if (p.age > 24) return false;
    if (p.locked) return false;
    if (!isTradableClub(p.clubId)) return false;
    if (mine.has(p.name.toLowerCase())) return false;
    return p.listedForLoan || p.ovr < 78;
  });
}

export function loanMarket(save: GameSave) {
  return loanMarketFromPlayers(save.players, save.clubId);
}

function pushOffer(save: GameSave, offer: TransferOffer) {
  const dup = save.offers.some(
    (o) => o.playerId === offer.playerId && o.fromClubId === offer.fromClubId && o.kind === offer.kind,
  );
  if (dup) return;
  save.offers.push(offer);
}

export function processMarketWeek(save: GameSave, rng: Rng) {
  const user = save.clubId;
  // Solo los jugadores PROPIOS reciben ofertas: un cedido (que llegó o que está prestado fuera) no se vende.
  const mine = ownPlayers(save.players, user);

  // Limpieza: partidas viejas pueden traer ofertas de clubes ficticios que no deben existir.
  save.offers = save.offers.filter((o) => o.fromClubId === user || !clubById(o.fromClubId).ghost);
  // Y ofertas colgadas por jugadores que ya no son vendibles por el usuario (cedidos, o que ya se fueron).
  save.offers = save.offers.filter((o) => {
    if (o.toClubId !== user) return true;
    const target = save.players.find((x) => x.id === o.playerId);
    return Boolean(target) && isOwnedAtClub(target!, user);
  });

  for (const p of mine) {
    if (freeAgentSaleBlockReason(p, save.season)) continue;
    // El usuario bloqueó las ofertas por este jugador.
    if (p.noOffers) continue;
    if (p.listedForLoan) {
      if (rng.chance(0.38)) {
        const seasons = p.loanListing?.seasons ?? (rng.chance(0.55) ? 1 : 2);
        const lfee = p.loanListing?.fee ?? loanFee(p, seasons);
        const buyers = interestedBuyers(save, p, lfee, true);
        if (!buyers.length) continue;
        const club = rng.pick(buyers);
        pushOffer(save, {
          id: uid("of"),
          kind: "loan",
          playerId: p.id,
          fromClubId: club.id,
          toClubId: user,
          fee: lfee,
          loanSeasons: seasons,
          loanOptionFee: p.loanListing?.buyOptionFee,
          week: save.week,
          unsolicited: false,
        });
      }
      continue;
    }
    if (p.listed && rng.chance(0.55)) {
      const fee = capMarketValue(askPrice(p) * rng.float() * 0.25 + askPrice(p) * 0.78);
      const buyers = interestedBuyers(save, p, fee);
      if (!buyers.length) continue;
      const club = rng.pick(buyers);
      pushOffer(save, {
        id: uid("of"),
        kind: "buy",
        playerId: p.id,
        fromClubId: club.id,
        toClubId: user,
        fee,
        loanSeasons: 0,
        week: save.week,
        unsolicited: false,
      });
    } else if (!p.listed && p.age <= 29 && (p.ovr >= 82 || p.pot >= 88) && rng.chance(0.08)) {
      const fee = capMarketValue(p.value * (1.05 + rng.float() * 0.25));
      const buyers = interestedBuyers(save, p, fee).filter((c) => c.prestige >= clubById(user).prestige - 6);
      if (!buyers.length) continue;
      const club = rng.pick(buyers);
      pushOffer(save, {
        id: uid("of"),
        kind: "buy",
        playerId: p.id,
        fromClubId: club.id,
        toClubId: user,
        fee,
        loanSeasons: 0,
        week: save.week,
        unsolicited: true,
      });
    }
  }

  const incoming = save.offers.filter((o) => o.toClubId === user && o.week === save.week);
  for (const o of incoming) {
    const p = save.players.find((x) => x.id === o.playerId);
    if (!p) continue;
    const from = clubById(o.fromClubId);
    if (o.kind === "loan") {
      news(
        save,
        "neutral",
        `Cesión: ${from.short} por ${p.name}`,
        `${from.name} ofrece ${formatMoney(o.fee)} por ${o.loanSeasons} temporada${o.loanSeasons > 1 ? "s" : ""}. GRL ${p.ovr} · POT ${p.pot}.`,
        {
          category: "market",
          importance: "medium",
          clubIds: [from.id, save.clubId],
          playerIds: [p.id],
          offerId: o.id,
          action: "market",
          sourceKey: `offer:${o.id}:received`,
        },
      );
    } else {
      news(
        save,
        o.unsolicited ? "neutral" : "good",
        o.unsolicited ? `${from.short} tienta por ${p.name}` : `Oferta por ${p.name}`,
        `${from.name} pone ${formatMoney(o.fee)} por ${p.name}. GRL ${p.ovr} · POT ${p.pot}.`,
        {
          category: "market",
          importance: o.unsolicited ? "high" : "medium",
          clubIds: [from.id, save.clubId],
          playerIds: [p.id],
          offerId: o.id,
          action: "market",
          sourceKey: `offer:${o.id}:received`,
        },
      );
      // Sin popup: las ofertas llegan directo a Mercado → Ofertas (con señalador numérico).
    }
  }

  runAiMarket(save, rng);
}

export function acceptOffer(save: GameSave, offerId: string, keepPct = 0): string | null {
  const offer = save.offers.find((o) => o.id === offerId);
  if (!offer) return "La oferta ya no está.";
  const p = save.players.find((x) => x.id === offer.playerId);
  if (!p) return "Jugador no encontrado.";
  // Solo el club propietario vende: un cedido (llegado de otro club o prestado fuera) no se puede vender
  // ni volver a ceder. La oferta queda inválida y se retira.
  const notOwner = ownershipBlockReason(p, save.clubId);
  if (notOwner) {
    save.offers = save.offers.filter((o) => o.id !== offerId);
    return notOwner;
  }
  // Venta definitiva: además hay que conservar el mínimo de jugadores propios.
  if (offer.kind === "buy") {
    const blocked = saleBlockReason(save, p);
    if (blocked) return blocked;
  }
  if (
    offer.kind === "loan" &&
    typeof offer.loanOptionFee === "number" &&
    !isValidLoanOptionPrice(offer.loanOptionFee, p.value)
  )
    return "La opción de compra debe estar entre 1 y el 150% del valor del jugador.";

  const pct = offer.kind === "buy" ? clamp(Math.round(keepPct), 0, 30) : 0;
  // Quedarte con un % de la próxima venta abarata lo que cobrás hoy (cada 10% = 5%).
  const fee = Math.round(offer.fee * (1 - pct * 0.005));
  // El comprador es un club con presupuesto real: si ya no le alcanza o tiene la plantilla llena, se cae.
  ensureFinance(save);
  const buyerSize = save.players.filter((x) => x.clubId === offer.fromClubId).length;
  if (!canAfford(save, offer.fromClubId, fee)) {
    save.offers = save.offers.filter((o) => o.id !== offerId);
    return `${clubById(offer.fromClubId).name} ya no tiene presupuesto para esta oferta.`;
  }
  if (buyerSize >= SQUAD_LIMIT) {
    save.offers = save.offers.filter((o) => o.id !== offerId);
    return `${clubById(offer.fromClubId).name} tiene la plantilla completa y retiró la oferta.`;
  }
  creditClub(save, offer.fromClubId, -fee);
  save.budget += offer.kind === "buy" ? settleSellOn(save, p, fee, true) : fee;
  logTransfer(save, p, save.clubId, offer.fromClubId, offer.kind === "loan" ? "loan" : "sale", fee);
  save.offers = save.offers.filter((o) => o.id !== offerId && o.playerId !== p.id);
  cachePlayerPortrait(p);

  if (offer.kind === "loan") {
    p.clubId = offer.fromClubId;
    p.loanFrom = save.clubId;
    p.loanSeasons = offer.loanSeasons;
    p.listed = false;
    p.listedForLoan = false;
    p.loanListing = undefined;
    save.loans.push({
      playerId: p.id,
      fromClubId: save.clubId,
      toClubId: offer.fromClubId,
      seasonsLeft: offer.loanSeasons,
      fee: offer.fee,
      buyOptionFee:
        typeof offer.loanOptionFee === "number" &&
        Number.isFinite(offer.loanOptionFee) &&
        offer.loanOptionFee > 0
          ? Math.round(offer.loanOptionFee)
          : undefined,
    });
    const squad = activeSquad(save, save.clubId);
    save.tactics.lineup = dropFromLineup(save.tactics.lineup, save.tactics.formation, p.id, squad);
    save.tactics.bench = sanitizeBench(save.tactics.bench, save.tactics.lineup, squad);
    news(
      save,
      "neutral",
      `${p.name} se va a cesión`,
      `${clubById(offer.fromClubId).name} paga ${formatMoney(offer.fee)} por ${offer.loanSeasons} temporada${offer.loanSeasons > 1 ? "s" : ""}${offer.loanOptionFee ? `, con opción de compra por ${formatMoney(offer.loanOptionFee)}` : ""}.`,
    );
    return null;
  }

  ensurePos(p);
  p.clubId = offer.fromClubId;
  p.listed = false;
  p.listedForLoan = false;
  p.sellOn = pct > 0 ? { clubId: save.clubId, pct } : null;
  news(
    save,
    "neutral",
    `Venta: ${p.name}`,
    `${clubById(offer.fromClubId).name} paga ${formatMoney(fee)}${pct > 0 ? ` y te deja el ${pct}% de la próxima venta` : ""}.`,
  );
  const squad = activeSquad(save, save.clubId);
  save.tactics.lineup = dropFromLineup(save.tactics.lineup, save.tactics.formation, p.id, squad);
  save.tactics.bench = sanitizeBench(save.tactics.bench, save.tactics.lineup, squad);
  return null;
}

export function rejectOffer(save: GameSave, offerId: string) {
  save.offers = save.offers.filter((o) => o.id !== offerId);
}

/** Cierra un fichaje ya negociado: paga traspaso + prima y aplica el contrato. */
export function completeSigning(
  save: GameSave,
  playerId: string,
  terms: ContractTerms,
  payClause: boolean,
): string | null {
  const found = findMarketPlayer(save, playerId);
  if (!found) return "Jugador no encontrado.";
  const { player: p, free } = found;
  if (p.clubId === save.clubId) return "Ya está en tu plantilla.";
  if (p.loanFrom) return "Está a cesión; no se puede comprar así.";
  const names = new Set(
    save.players.filter((x) => x.clubId === save.clubId).map((x) => x.name.toLowerCase()),
  );
  if (names.has(p.name.toLowerCase())) return "Ese jugador ya está en tu club.";
  if (!free && !marketPool(save).some((x) => x.id === p.id)) return "No está disponible.";
  // Los cedidos que llegaron ocupan lugar: el tope cuenta propios + cedidos.
  if (!hasSquadRoom(save.players, save.clubId)) return SQUAD_FULL_MSG;
  if (payClause && !clauseOf(p)) return "Este jugador no tiene cláusula.";

  const fee = transferFee(p, free, payClause, terms.sellOnPct);
  if (save.budget < fee + terms.signingBonus) return "No hay presupuesto para este fichaje.";

  ensurePos(p); // el fichado siempre entra con posición válida
  cachePlayerPortrait(p);
  const from = free ? null : clubById(p.clubId);
  const fromId = p.clubId;
  save.budget -= fee + terms.signingBonus;
  if (!free) creditClub(save, fromId, fee);
  logTransfer(save, p, free ? NO_CLUB : fromId, save.clubId, free ? "free" : payClause ? "clause" : "sale", fee);
  if (free) {
    signFreeAgent(save, p, save.clubId, terms);
  } else {
    if (!payClause && terms.sellOnPct > 0) p.sellOn = { clubId: p.clubId, pct: terms.sellOnPct };
    else p.sellOn = null;
    p.clubId = save.clubId;
    p.listed = false;
    p.listedForLoan = false;
    p.morale = clamp(p.morale + 8, 40, 100);
    applyTerms(p, terms);
  }
  p.value = playerValue(p.ovr, p.age, p.pot, p);
  save.offers = save.offers.filter((o) => o.playerId !== p.id);

  const body = from
    ? `Llega desde ${from.name} por ${formatMoney(fee)}${payClause ? " (cláusula)" : ""}. GRL ${p.ovr} · POT ${p.pot}.`
    : `Firma como agente libre. GRL ${p.ovr} · POT ${p.pot}.`;
  news(save, "good", `Fichaje: ${p.name}`, body);
  save.popups.push({ id: uid("pop"), kind: "info", tone: "good", title: `${p.name} es tuyo`, body });
  return null;
}

/** Cierra una renovación ya negociada. */
export function completeRenewal(save: GameSave, playerId: string, terms: ContractTerms): string | null {
  const p = save.players.find((x) => x.id === playerId);
  if (!p || p.clubId !== save.clubId) return "Ese jugador no está en tu club.";
  if (p.loanFrom) return "Es un cedido: su contrato es de otro club.";
  if (save.budget < terms.signingBonus) return "No alcanza para la prima de firma.";
  save.budget -= terms.signingBonus;
  const contract = renewedContract(p, terms.years);
  applyTerms(p, terms);
  p.contract = contract;
  p.morale = clamp(p.morale + 8, 20, 100);
  news(
    save,
    "good",
    `Renovó ${p.name}`,
    `Firma hasta el 30 jun ${save.season + contract} · ${formatMoney(terms.wage)}/sem.`,
  );
  return null;
}

/** La cesión vigente de un jugador tuyo que está prestado a otro club. */
export function outgoingLoan(save: GameSave, p: Player) {
  if (p.loanFrom !== save.clubId || p.clubId === save.clubId) return null;
  return save.loans.find((l) => l.playerId === p.id && l.fromClubId === save.clubId) ?? null;
}

/**
 * Cuánto cuesta traer de vuelta a un cedido: se le compensa al club que lo tiene según lo que le
 * falta de préstamo (la temporada en curso cuenta solo por lo que queda de calendario).
 */
export function loanRecallCost(save: GameSave, p: Player): number | null {
  const loan = outgoingLoan(save, p);
  if (!loan) return null;
  const total = Math.max(1, save.calendar.length);
  const leftOfSeason = clamp(1 - save.cursor / total, 0.15, 1);
  const remaining = Math.max(0, loan.seasonsLeft - 1) + leftOfSeason;
  const raw = Math.max(400_000, p.value * 0.07 * remaining);
  return Math.round(raw / 50_000) * 50_000;
}

/** Ejerce el precio de compra pactado en una cesión que llegó al club del usuario. */
export function exerciseLoanOption(save: GameSave, playerId: string): string | null {
  const p = save.players.find((x) => x.id === playerId);
  if (!p || p.clubId !== save.clubId || !p.loanFrom)
    return "Ese jugador no está cedido en tu club.";
  const loan = save.loans.find(
    (item) => item.playerId === playerId && item.toClubId === save.clubId,
  );
  if (!loan || !loan.buyOptionFee || loan.buyOptionFee <= 0)
    return "Esta cesión no tiene una opción de compra acordada.";
  const fee = loan.buyOptionFee;
  if (save.budget < fee)
    return `No alcanza para ejercer la opción (${formatMoney(fee)}).`;

  const seller = loan.fromClubId;
  save.budget -= fee;
  creditClub(save, seller, fee);
  logTransfer(save, p, seller, save.clubId, "sale", fee);
  p.loanFrom = null;
  p.loanSeasons = 0;
  p.contract = Math.max(1, p.contract);
  save.loans = save.loans.filter((item) => item !== loan);
  news(
    save,
    "good",
    `${p.name} se queda en el club`,
    `Ejerciste la opción de compra por ${formatMoney(fee)} a ${clubById(seller).name}.`,
  );
  return null;
}

/** Trae de vuelta a un jugador cedido pagando la compensación. Devuelve un error o null si salió bien. */
export function recallLoanedPlayer(save: GameSave, playerId: string): string | null {
  const p = save.players.find((x) => x.id === playerId);
  if (!p) return "Jugador no encontrado.";
  const loan = outgoingLoan(save, p);
  const cost = loanRecallCost(save, p);
  if (!loan || cost === null) return "Ese jugador no está cedido por tu club.";
  if (!hasSquadRoom(save.players, save.clubId)) return SQUAD_FULL_MSG;
  if (save.budget < cost) return `No alcanza para rescatarlo (${formatMoney(cost)}).`;
  const borrower = loan.toClubId;
  save.budget -= cost;
  creditClub(save, borrower, cost);
  cachePlayerPortrait(p);
  p.clubId = save.clubId;
  p.loanFrom = null;
  p.loanSeasons = 0;
  p.listed = false;
  p.listedForLoan = false;
  freeNumber(p, save.players.filter((x) => x.clubId === save.clubId));
  save.loans = save.loans.filter((l) => l !== loan);
  news(
    save,
    "good",
    `${p.name} vuelve de cesión`,
    `Pagaste ${formatMoney(cost)} a ${clubById(borrower).name} para recuperarlo. GRL ${p.ovr}.`,
  );
  return null;
}

export function resolveLoans(save: GameSave) {
  const kept: GameSave["loans"] = [];
  for (const loan of save.loans) {
    const left = loan.seasonsLeft - 1;
    const p = save.players.find((x) => x.id === loan.playerId);
    if (!p) continue;
    if (left <= 0) {
      const optionFee = loan.buyOptionFee;
      const buyerExercisesOption =
        loan.toClubId !== save.clubId &&
        typeof optionFee === "number" &&
        Number.isFinite(optionFee) &&
        optionFee > 0 &&
        optionFee <= p.value * 1.1 &&
        canAfford(save, loan.toClubId, optionFee);
      if (buyerExercisesOption) {
        cachePlayerPortrait(p);
        creditClub(save, loan.toClubId, -optionFee);
        creditClub(save, loan.fromClubId, optionFee);
        p.clubId = loan.toClubId;
        p.loanFrom = null;
        p.loanSeasons = 0;
        p.listedForLoan = false;
        logTransfer(save, p, loan.fromClubId, loan.toClubId, "sale", optionFee);
        if (loan.fromClubId === save.clubId) {
          news(
            save,
            "good",
            `${p.name} fichado por ${clubById(loan.toClubId).short}`,
            `${clubById(loan.toClubId).name} ejerció la opción de compra por ${formatMoney(optionFee)}.`,
          );
        }
        continue;
      }
      cachePlayerPortrait(p);
      p.clubId = loan.fromClubId;
      p.loanFrom = null;
      p.loanSeasons = 0;
      p.listedForLoan = false;
      if (loan.fromClubId === save.clubId) {
        news(
          save,
          "good",
          `${p.name} vuelve de cesión`,
          `Regresa desde ${clubById(loan.toClubId).name}. GRL ${p.ovr}.`,
        );
      }
    } else {
      p.loanSeasons = left;
      kept.push({ ...loan, seasonsLeft: left });
    }
  }
  save.loans = kept;
}

export function spawnWonderkids(save: GameSave, rng: Rng, used: Set<string>) {
  const n = rng.int(3, 6);
  const clubs = CLUBS.map((c) => c.id);
  const faceRng = new Rng(save.seed + save.season * 7919 + 0xFACE);
  const usedFaceIndexes = new Set<number>();
  for (let i = 0; i < n; i++) {
    const clubId = rng.pick(clubs);
    if (clubById(clubId).ghost) continue;
    if (squadTotal(save.players, clubId) >= SQUAD_LIMIT) continue;
    const pos = rng.pick(["ST", "CAM", "CM", "LW", "RW", "CB", "LB", "RB"] as const);
    const p = generated(clubId, pos, rng.int(200, 9000), clubById(clubId).prestige, rng, used);
    p.age = rng.int(16, 19);
    p.ovr = rng.int(60, 72);
    p.pot = rng.chance(0.15) ? rng.int(92, 98) : rng.int(85, 93);
    p.seasonStartOvr = p.ovr;
    p.hiddenGem = true;
    let faceIndex = faceRng.int(1, WONDERKID_FACE_COUNT);
    while (usedFaceIndexes.has(faceIndex)) {
      faceIndex = faceRng.int(1, WONDERKID_FACE_COUNT);
    }
    usedFaceIndexes.add(faceIndex);
    p.portraitUrl = wonderkidFaceUrl(faceIndex);
    p.value = playerValue(p.ovr, p.age, p.pot, p);
    resyncStats(p, rng);
    save.players.push(ensureTerms(p));
  }
}
