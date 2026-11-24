import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  BarChart3,
  Briefcase,
  CalendarDays,
  Layers,
  LayoutGrid,
  MoreHorizontal,
  MessageCircle,
  Newspaper,
  Globe2,
  ScrollText,
  Table2,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { ClubCrest } from "@/components/game/crest";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { clubById } from "@/lib/game/clubs";
import { formatMoney, seasonLabel } from "@/lib/game/format";
import { NATIONAL_TEAM_BY_ID } from "@/lib/game/national";
import { useGame } from "@/lib/game/store";
import {
  gameSoundsEnabled,
  playGameSound,
  setGameSoundsEnabled,
} from "@/lib/game/sound";
import type { Screen } from "@/lib/game/types";

const PRIMARY_TABS: Array<{
  id: Screen;
  label: string;
  icon: typeof Briefcase;
}> = [
  { id: "office", label: "Despacho", icon: Briefcase },
  { id: "squad", label: "Plantilla", icon: Users },
  { id: "tactics", label: "Táctica", icon: LayoutGrid },
  { id: "table", label: "Tablas", icon: Table2 },
  { id: "market", label: "Mercado", icon: ArrowRightLeft },
];

const MORE_TABS: Array<{ id: Screen; label: string; icon: typeof Briefcase }> =
  [
    { id: "career", label: "Carrera", icon: ScrollText },
    { id: "news", label: "Noticias", icon: Newspaper },
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "calendar", label: "Calendario", icon: CalendarDays },
    { id: "international", label: "Selecciones", icon: Globe2 },
  ];

const DESKTOP_TABS: Array<{
  id: Screen;
  label: string;
  icon: typeof Briefcase;
}> = [
  PRIMARY_TABS[0]!,
  MORE_TABS[0]!,
  MORE_TABS[1]!,
  MORE_TABS[2]!,
  PRIMARY_TABS[1]!,
  PRIMARY_TABS[2]!,
  PRIMARY_TABS[3]!,
  MORE_TABS[3]!,
  MORE_TABS[4]!,
  PRIMARY_TABS[4]!,
];

const MOBILE_TAB_LABELS: Partial<Record<Screen, string>> = {
  office: "Desp.",
  squad: "Plant.",
  tactics: "Táct.",
  table: "Tabla",
  market: "Merc.",
};

const NATIONAL_TABS: Array<{
  id: Screen;
  label: string;
  icon: typeof Briefcase;
}> = [
  { id: "international", label: "Selecciones", icon: Globe2 },
  { id: "league-ranking", label: "Ranking de ligas", icon: BarChart3 },
];

export function GameShell({
  children,
  nationalOnly = false,
}: {
  children: React.ReactNode;
  nationalOnly?: boolean;
}) {
  const [soundOn, setSoundOn] = useState(true);
  const clubId = useGame((s) => s.clubId);
  const screen = useGame((s) => s.screen);
  const setScreen = useGame((s) => s.setScreen);
  const openSlots = useGame((s) => s.openSlots);
  const budget = useGame((s) => s.budget);
  const season = useGame((s) => s.season);
  const nationalManagerId = useGame((s) => s.nationalManagerId ?? null);
  const offers = useGame((s) => s.offers);
  const playerChats = useGame((s) => s.playerChats);
  const news = useGame((s) => s.news);
  const offerCount = useMemo(
    () => offers.filter((offer) => offer.toClubId === clubId).length,
    [offers, clubId],
  );
  const unreadChats = useMemo(
    () => playerChats?.filter((thread) => thread.unread).length ?? 0,
    [playerChats],
  );
  const unreadNews = useMemo(
    () => news?.filter((item) => !item.seen).length ?? 0,
    [news],
  );
  const openNews = useGame((s) => s.openNews);
  const club = clubById(clubId);
  const nationalTeam = nationalManagerId
    ? NATIONAL_TEAM_BY_ID.get(nationalManagerId)
    : undefined;
  const desktopTabs = nationalOnly ? NATIONAL_TABS : DESKTOP_TABS;
  const mobileTabs = nationalOnly ? NATIONAL_TABS : PRIMARY_TABS;

  useEffect(() => {
    setSoundOn(gameSoundsEnabled());
  }, []);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setGameSoundsEnabled(next);
    if (next) playGameSound("sign");
  }

  function navigate(tab: Screen) {
    if (tab === "news") {
      openNews();
      return;
    }
    setScreen(tab);
  }

  return (
    <div
      className="game-shell flex min-h-dvh flex-col bg-bg text-fg"
      style={
        {
          "--club": club.color,
          "--club-secondary": club.color2,
          "--club-fg": luminance(club.color) > 0.62 ? "#141414" : "#fff6f2",
          "--color-primary": club.color,
          "--color-primary-foreground":
            luminance(club.color) > 0.62 ? "#141414" : "#fff6f2",
        } as React.CSSProperties
      }
    >
      <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          {nationalOnly && nationalTeam ? (
            <span className="text-2xl" aria-hidden="true">{nationalTeam.flag}</span>
          ) : (
            <ClubCrest club={club} size={28} />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-semibold leading-tight tracking-wide">
              {nationalOnly
                ? nationalTeam?.name ?? "Selección nacional"
                : club.name}
            </p>
            <p className="text-xs text-fg-muted">
              {nationalOnly ? `DT de selección · ${seasonLabel(season)}` : seasonLabel(season)}
            </p>
          </div>
          {!nationalOnly ? (
            <div className="text-right">
              <p className="font-display text-lg tabular-nums leading-none">
                {formatMoney(budget)}
              </p>
              <p className="text-[11px] text-fg-muted">presupuesto</p>
            </div>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="size-10 shrink-0"
            onClick={toggleSound}
            aria-label={
              soundOn
                ? "Desactivar efectos de sonido"
                : "Activar efectos de sonido"
            }
            aria-pressed={soundOn}
            title={soundOn ? "Sonido activado" : "Sonido desactivado"}
          >
            {soundOn ? (
              <Volume2 className="size-4" />
            ) : (
              <VolumeX className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-10 shrink-0"
            onClick={() => openSlots()}
            aria-label="Partidas guardadas"
          >
            <Layers className="size-4" />
          </Button>
        </div>
        <nav
          aria-label="Navegación principal"
          className="mx-auto hidden max-w-6xl gap-1 px-3 pb-2 lg:flex"
        >
          {desktopTabs.map((tab) => (
            <Button
              key={tab.id}
              variant={screen === tab.id ? "club" : "ghost"}
              size="sm"
              onClick={() => navigate(tab.id)}
              className="h-9 shrink-0"
              aria-current={screen === tab.id ? "page" : undefined}
            >
              <tab.icon />
              {tab.label}
              {tab.id === "chat" && unreadChats > 0 ? (
                <OfferBadge
                  count={unreadChats}
                  label={`${unreadChats} mensajes sin leer`}
                />
              ) : null}
              {tab.id === "news" && unreadNews > 0 ? (
                <OfferBadge
                  count={unreadNews}
                  label={`${unreadNews} noticias nuevas`}
                />
              ) : null}
              {tab.id === "market" && offerCount > 0 ? (
                <OfferBadge
                  count={offerCount}
                  label={`${offerCount} ofertas nuevas`}
                />
              ) : null}
            </Button>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-4 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-8">
        {children}
      </main>

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
      >
        <div className={cn("grid", nationalOnly ? "grid-cols-2" : "grid-cols-6")}>
          {mobileTabs.map((tab) => {
            const active = screen === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navigate(tab.id)}
                aria-label={tab.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs transition-colors",
                  active ? "text-club" : "text-fg-muted",
                )}
              >
                <span className="relative">
                  <tab.icon className="size-5" />
                  {tab.id === "market" && offerCount > 0 ? (
                    <OfferBadge
                      count={offerCount}
                      label={`${offerCount} ofertas nuevas`}
                      className="absolute -right-3 -top-2"
                    />
                  ) : null}
                </span>
                <span className="max-w-full truncate text-[11px] leading-tight">
                  {MOBILE_TAB_LABELS[tab.id] ?? tab.label}
                </span>
              </button>
            );
          })}
          {!nationalOnly ? (
            <MoreMenu
              active={MORE_TABS.some((tab) => screen === tab.id)}
              screen={screen}
              tabs={MORE_TABS}
              unreadChats={unreadChats}
              unreadNews={unreadNews}
              onNavigate={navigate}
            />
          ) : null}
        </div>
      </nav>
    </div>
  );
}

function MoreMenu({
  active,
  screen,
  tabs,
  unreadChats,
  unreadNews,
  onNavigate,
}: {
  active: boolean;
  screen: Screen;
  tabs: Array<{ id: Screen; label: string; icon: typeof Briefcase }>;
  unreadChats: number;
  unreadNews: number;
  onNavigate: (screen: Screen) => void;
}) {
  const unreadCount = unreadChats + unreadNews;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Más secciones"
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs transition-colors",
            active ? "text-club" : "text-fg-muted",
          )}
        >
          <span className="relative">
            <MoreHorizontal className="size-5" />
            {unreadCount > 0 ? (
              <OfferBadge
                count={unreadCount}
                label={`${unreadCount} avisos sin leer`}
                className="absolute -right-3 -top-2"
              />
            ) : null}
          </span>
          <span className="text-[11px] leading-tight">Más</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          side="top"
          sideOffset={8}
          className="z-50 min-w-48 rounded-xl border border-border bg-surface p-1 shadow-lg"
        >
          {tabs.map((tab) => {
            const count =
              tab.id === "news"
                ? unreadNews
                : tab.id === "chat"
                  ? unreadChats
                  : 0;
            return (
              <DropdownMenu.Item
                key={tab.id}
                onSelect={() => onNavigate(tab.id)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 text-sm outline-none transition-colors hover:bg-elevated focus:bg-elevated",
                  screen === tab.id ? "text-fg" : "text-fg-muted",
                )}
              >
                <tab.icon className="size-4" />
                <span className="flex-1">{tab.label}</span>
                {count > 0 ? (
                  <OfferBadge
                    count={count}
                    label={`${count} ${tab.id === "news" ? "noticias nuevas" : "mensajes sin leer"}`}
                  />
                ) : null}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function OfferBadge({
  count,
  label,
  className,
}: {
  count: number;
  label: string;
  className?: string;
}) {
  return (
    <span
      aria-label={label}
      className={cn(
        "inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-medium leading-5 text-primary-foreground",
        className,
      )}
    >
      {count}
    </span>
  );
}

function luminance(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
