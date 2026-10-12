import { lazy, Suspense, useEffect } from "react";
import { GameShell } from "@/components/game/shell";
import { isKnownClub } from "@/lib/game/clubs";
import { useGame } from "@/lib/game/store";
import { LanguageEngine } from "@/lib/i18n";

const Academy = lazy(() => import("@/components/game/academy").then((module) => ({ default: module.Academy })));
const AwardsCeremony = lazy(() => import("@/components/game/awards-ceremony").then((module) => ({ default: module.AwardsCeremony })));
const BoardView = lazy(() => import("@/components/game/board").then((module) => ({ default: module.BoardView })));
const Boot = lazy(() => import("@/components/game/boot").then((module) => ({ default: module.Boot })));
const Cabinet = lazy(() => import("@/components/game/cabinet").then((module) => ({ default: module.Cabinet })));
const CalendarView = lazy(() => import("@/components/game/calendar-view").then((module) => ({ default: module.CalendarView })));
const LiveMatchPlay = lazy(() => import("@/components/game/live-match").then((module) => ({ default: module.LiveMatchPlay })));
const MatchLive = lazy(() => import("@/components/game/match-view").then((module) => ({ default: module.MatchLive })));
const MatchPreview = lazy(() => import("@/components/game/match-view").then((module) => ({ default: module.MatchPreview })));
const MatchResultView = lazy(() => import("@/components/game/match-view").then((module) => ({ default: module.MatchResultView })));
const Market = lazy(() => import("@/components/game/market").then((module) => ({ default: module.Market })));
const NewsPaper = lazy(() => import("@/components/game/news-paper").then((module) => ({ default: module.NewsPaper })));
const CareerView = lazy(() => import("@/components/game/career").then((module) => ({ default: module.CareerView })));
const ChatView = lazy(() => import("@/components/game/chat").then((module) => ({ default: module.ChatView })));
const ClubEditor = lazy(() => import("@/components/game/club-editor").then((module) => ({ default: module.ClubEditor })));
const Office = lazy(() => import("@/components/game/office").then((module) => ({ default: module.Office })));
const PressConferenceView = lazy(() => import("@/components/game/press-conference").then((module) => ({ default: module.PressConferenceView })));
const PressHistoryView = lazy(() => import("@/components/game/press-conference").then((module) => ({ default: module.PressHistoryView })));
const GamePopups = lazy(() => import("@/components/game/popups").then((module) => ({ default: module.GamePopups })));
const SackedView = lazy(() => import("@/components/game/sacked").then((module) => ({ default: module.SackedView })));
const SeasonEnd = lazy(() => import("@/components/game/season-end").then((module) => ({ default: module.SeasonEnd })));
const SelectClub = lazy(() => import("@/components/game/select-club").then((module) => ({ default: module.SelectClub })));
const SlotsScreen = lazy(() => import("@/components/game/slots").then((module) => ({ default: module.SlotsScreen })));
const SponsorsView = lazy(() => import("@/components/game/sponsors").then((module) => ({ default: module.SponsorsView })));
const StadiumView = lazy(() => import("@/components/game/stadium").then((module) => ({ default: module.StadiumView })));
const Squad = lazy(() => import("@/components/game/squad").then((module) => ({ default: module.Squad })));
const TableView = lazy(() => import("@/components/game/table-view").then((module) => ({ default: module.TableView })));
const TacticsView = lazy(() => import("@/components/game/tactics-view").then((module) => ({ default: module.TacticsView })));
const TrainView = lazy(() => import("@/components/game/train").then((module) => ({ default: module.TrainView })));

export function GameApp() {
  return (
    <>
      <LanguageEngine />
      <Suspense fallback={<LoadingScreen />}>
        <GameAppInner />
      </Suspense>
    </>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4 text-center text-sm text-fg-muted" role="status">
      Cargando el juego…
    </div>
  );
}

function GameAppInner() {
  const hydrated = useGame((s) => s.hydrated);
  const screen = useGame((s) => s.screen);
  const clubId = useGame((s) => s.clubId);
  const sacked = useGame((s) => Boolean(s.board?.sacked));
  const valid = isKnownClub(clubId);

  useEffect(() => {
    const unsub = useGame.persist.onFinishHydration(() => {
      useGame.getState().setHydrated(true);
    });
    if (useGame.persist.hasHydrated()) useGame.getState().setHydrated(true);
    return unsub;
  }, []);

  if (!hydrated || screen === "boot") {
    return <Boot />;
  }
  if (screen === "club-editor") return <ClubEditor />;
  if (screen === "slots") return <SlotsScreen />;
  if (screen === "select") return <SelectClub />;

  if (!valid) {
    return <SlotsScreen />;
  }

  // El partido que provocó el despido se ve completo; después aparece la pantalla de despido.
  if (screen === "live") {
    return <LiveMatchPlay />;
  }
  if (screen === "match") {
    return <MatchLive />;
  }
  if (screen === "result") {
    return <MatchResultView />;
  }
  if (screen === "press") {
    return <PressConferenceView />;
  }
  if (screen === "press-history") {
    return <PressHistoryView />;
  }
  if (sacked) {
    return <SackedView />;
  }
  if (screen === "preview") {
    return <MatchPreview />;
  }
  if (screen === "awards") {
    return <AwardsCeremony />;
  }
  if (screen === "season-end") {
    return (
      <>
        <SeasonEnd />
        <GamePopups />
      </>
    );
  }

  return (
    <>
      <GameShell>
        {screen === "office" ? <Office /> : null}
        {screen === "career" ? <CareerView /> : null}
        {screen === "chat" ? <ChatView /> : null}
        {screen === "squad" ? <Squad /> : null}
        {screen === "tactics" ? <TacticsView /> : null}
        {screen === "table" ? <TableView /> : null}
        {screen === "calendar" ? <CalendarView /> : null}
        {screen === "market" ? <Market /> : null}
        {screen === "news" ? <NewsPaper /> : null}
        {screen === "cabinet" ? <Cabinet /> : null}
        {screen === "academy" ? <Academy /> : null}
        {screen === "train" ? <TrainView /> : null}
        {screen === "board" ? <BoardView /> : null}
        {screen === "sponsors" ? <SponsorsView /> : null}
        {screen === "stadium" ? <StadiumView /> : null}
      </GameShell>
      <GamePopups />
    </>
  );
}
