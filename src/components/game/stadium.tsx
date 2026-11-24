import { useState } from "react";
import { ArrowLeft, Building2, Plus, Shield, Sparkles, Ticket, Wrench } from "lucide-react";
import { ClubCrest } from "@/components/game/crest";
import { Button } from "@/components/ui/button";
import { clubById } from "@/lib/game/clubs";
import { compLabel } from "@/lib/game/competitions";
import { formatMoney } from "@/lib/game/format";
import { useGame } from "@/lib/game/store";
import { stadiumFor, stadiumUpgradeQuote, type StadiumExpansionId, type StadiumImprovementId, type StadiumUpgradeId } from "@/lib/game/stadium";

const expansionIds: StadiumExpansionId[] = ["small", "medium", "large", "massive"];
const improvementOptions: Array<{
  id: StadiumImprovementId;
  title: string;
  description: string;
  effect: string;
  icon: typeof Sparkles;
}> = [
  { id: "comfort", title: "Comodidad", description: "Gradas y asientos renovados.", effect: "+7% demanda por nivel", icon: Sparkles },
  { id: "security", title: "Seguridad", description: "Accesos y circulación más seguros.", effect: "+2,5% demanda por nivel", icon: Shield },
  { id: "services", title: "Servicios", description: "Mejores servicios para el público.", effect: "+3,5% de ingresos por entrada", icon: Wrench },
  { id: "vip", title: "Zona VIP", description: "Espacios premium y mejor atención.", effect: "+7,5% de ingresos por entrada", icon: Ticket },
];

export function StadiumView() {
  const save = useGame((s) => s);
  const setScreen = useGame((s) => s.setScreen);
  const buyUpgrade = useGame((s) => s.buyStadiumUpgrade);
  const setTicketPrice = useGame((s) => s.setStadiumTicketPrice);
  const [notice, setNotice] = useState("");
  const club = clubById(save.clubId);
  const stadium = stadiumFor(save);
  const averageAttendance = stadium.seasonHomeGames
    ? Math.round(stadium.seasonAttendance / stadium.seasonHomeGames)
    : 0;
  const occupancy = stadium.capacity ? Math.min(100, (averageAttendance / stadium.capacity) * 100) : 0;
  const averageRevenue = stadium.seasonHomeGames
    ? Math.round(stadium.seasonRevenue / stadium.seasonHomeGames)
    : 0;
  const purchase = (id: StadiumUpgradeId) => {
    const error = buyUpgrade(id);
    setNotice(error ?? "Mejora financiada. El costo ya se descontó del presupuesto.");
  };

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-fg-muted">Gestión del club</p>
          <h1 className="mt-1 font-display text-4xl font-semibold md:text-5xl">Estadio</h1>
          <p className="mt-2 text-sm text-fg-muted">Invertí con prudencia: una obra cuesta hoy y rinde cuando hay público.</p>
        </div>
        <Button variant="outline" onClick={() => setScreen("office")}><ArrowLeft className="size-4" /> Volver al despacho</Button>
      </header>

      <section className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-border)]">
        <div className="flex flex-wrap items-center gap-4 border-b border-border p-4 md:p-5">
          <ClubCrest club={club} size={48} />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-fg-muted">{club.city}</p>
            <h2 className="truncate font-display text-2xl font-semibold">{stadium.name}</h2>
          </div>
          <div className="rounded-xl bg-elevated px-4 py-2 text-right">
            <p className="text-xs text-fg-muted">Instalaciones</p>
            <p className="font-display text-2xl font-semibold tabular-nums">{stadium.facilitiesLevel}/5</p>
          </div>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-[1.15fr_0.85fr] md:p-5">
          <div className="flex flex-col justify-between rounded-xl bg-elevated p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-fg-muted">Capacidad total</p>
                <p className="font-display text-4xl font-semibold tabular-nums">{stadium.capacity.toLocaleString("es-ES")}</p>
              </div>
              <Building2 className="size-8 text-fg-muted" />
            </div>
            <div className="mt-6 rounded-xl border border-border bg-bg p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-fg-muted">
                <span>Ocupación media esta temporada</span>
                <span className="font-semibold tabular-nums text-fg">{occupancy.toFixed(1)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-surface" role="img" aria-label={`${occupancy.toFixed(1)}% de ocupación media`}>
                <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${occupancy}%` }} />
              </div>
              <p className="mt-2 text-xs text-fg-muted">
                {averageAttendance.toLocaleString("es-ES")} asistentes por partido · {stadium.seasonHomeGames} fechas como local
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric label="Taquilla esta temporada" value={formatMoney(stadium.seasonRevenue)} />
            <Metric label="Promedio por localía" value={formatMoney(averageRevenue)} />
            <Metric label="Precio actual" value={`${formatMoney(stadium.ticketPrice)} / entrada`} />
            <Metric label="Presupuesto disponible" value={formatMoney(save.budget)} />
            <label className="col-span-2 rounded-xl bg-elevated p-3">
              <span className="text-xs text-fg-muted">Precio de entrada · rango permitido €3–€100</span>
              <span className="mt-2 flex items-center gap-3">
                <input
                  aria-label="Precio de entrada"
                  className="min-h-11 w-full"
                  type="range"
                  min={3}
                  max={100}
                  step={1}
                  value={stadium.ticketPrice}
                  style={{ accentColor: "var(--club)" }}
                  onChange={(event) => {
                    const result = setTicketPrice(Number(event.target.value));
                    setNotice(result ?? `Precio actualizado a ${formatMoney(Number(event.target.value))}. La demanda también reacciona al precio.`);
                  }}
                />
                <span className="min-w-14 text-right font-display text-xl tabular-nums">{formatMoney(stadium.ticketPrice)}</span>
              </span>
            </label>
          </div>
        </div>
      </section>

      {save.clubRescue?.status === "active" ? (
        <aside className="rounded-xl border border-border bg-surface p-4 text-sm text-fg-muted" role="note">
          <p className="font-medium text-fg">Salvar el club · deuda pendiente {formatMoney(save.clubRescue.balance)}</p>
          <p className="mt-1">Las obras se pagan ahora con la caja disponible. Reservá fondos para salarios y la próxima cuota; la inversión no garantiza recuperar el gasto esta temporada.</p>
        </aside>
      ) : null}

      <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-fg-muted">Ampliar aforo</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Más plazas, con una inversión real</h2>
          <p className="mt-1 text-sm text-fg-muted">La demanda depende de la afición, la categoría, el rendimiento, el rival y el precio. El estadio no se llena por agrandarlo.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {expansionIds.map((id) => {
            const quote = stadiumUpgradeQuote(stadium, club, id);
            return (
              <article key={id} className="flex flex-col rounded-xl bg-elevated p-4">
                <h3 className="font-display text-xl font-semibold">Ampliación {quote.label.toLowerCase()}</h3>
                <p className="mt-2 text-xs text-fg-muted">Aforo final</p>
                <p className="font-display text-2xl tabular-nums">{quote.finalCapacity.toLocaleString("es-ES")}</p>
                <p className="text-xs text-fg-muted">+{quote.addedCapacity.toLocaleString("es-ES")} plazas · obra inmediata</p>
                <p className="mt-3 flex-1 text-sm">Costo: <strong>{formatMoney(quote.cost)}</strong></p>
                <Button
                  className="mt-3 w-full"
                  variant={quote.maxed || save.budget < quote.cost ? "outline" : "club"}
                  disabled={quote.maxed || save.budget < quote.cost}
                  onClick={() => purchase(id)}
                >
                  {quote.maxed ? "Aforo máximo" : save.budget < quote.cost ? "Fondos insuficientes" : "Financiar obra"}
                </Button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-fg-muted">Instalaciones</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Mejoras con impacto en el público</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {improvementOptions.map((option) => {
            const quote = stadiumUpgradeQuote(stadium, club, option.id);
            return (
              <article key={option.id} className="flex flex-col rounded-xl bg-elevated p-4">
                <div className="flex items-start gap-3">
                  <option.icon className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <h3 className="font-medium">{option.title}</h3>
                      <span className="text-xs tabular-nums text-fg-muted">Nivel {quote.currentLevel}/3</span>
                    </div>
                    <p className="mt-1 text-sm text-fg-muted">{option.description}</p>
                    <p className="mt-2 text-xs text-fg-muted">{option.effect} · {formatMoney(quote.cost)} el próximo nivel</p>
                  </div>
                </div>
                <Button
                  className="mt-4 w-full"
                  variant={quote.maxed || save.budget < quote.cost ? "outline" : "club"}
                  disabled={quote.maxed || save.budget < quote.cost}
                  onClick={() => purchase(option.id)}
                >
                  <Plus className="size-4" />
                  {quote.maxed ? "Nivel máximo" : save.budget < quote.cost ? "Fondos insuficientes" : "Mejorar"}
                </Button>
              </article>
            );
          })}
        </div>
        {notice ? <p className="mt-4 rounded-lg bg-bg px-3 py-2 text-sm text-fg-muted" role="status">{notice}</p> : null}
      </section>

      <section className="rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
        <div className="mb-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-fg-muted">Registro</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Taquillas recientes</h2>
        </div>
        {stadium.matches.length ? (
          <ul className="divide-y divide-border">
            {[...stadium.matches].reverse().slice(0, 8).map((match) => {
              const opponent = clubById(match.opponentId);
              return (
                <li key={match.fixtureId} className="flex items-center gap-3 py-3">
                  <ClubCrest club={opponent} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">vs. {opponent.name}</p>
                    <p className="truncate text-xs text-fg-muted">{compLabel(match.competition, club.league)} · Temporada {match.season}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm tabular-nums">{match.attendance.toLocaleString("es-ES")} espectadores</p>
                    <p className="text-xs text-fg-muted">{formatMoney(match.revenue)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-xl bg-elevated p-4 text-sm text-fg-muted">Cuando juegues en casa, la asistencia y la taquilla aparecerán acá.</p>
        )}
        {stadium.history.length ? (
          <div className="mt-4 border-t border-border pt-4">
            <h3 className="mb-2 text-sm font-medium">Temporadas cerradas</h3>
            <ul className="flex flex-col gap-2">
              {[...stadium.history].reverse().slice(0, 5).map((record) => (
                <li key={record.season} className="flex flex-wrap justify-between gap-2 text-xs text-fg-muted">
                  <span>{record.season} · {record.homeGames} localías · promedio {record.homeGames ? Math.round(record.attendance / record.homeGames).toLocaleString("es-ES") : "0"}</span>
                  <span>{formatMoney(record.revenue)} de taquilla</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-elevated p-3">
      <p className="text-xs text-fg-muted">{label}</p>
      <p className="mt-1 truncate font-display text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
