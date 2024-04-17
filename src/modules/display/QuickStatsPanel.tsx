import React from "react";
import "./QuickStatsPanel.css";
import classNames from "classnames";

interface PanelItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const PanelItem = ({
  className,
  children,
  onClick,
  ...rest
}: PanelItemProps): JSX.Element => {
  return (
    <div
      // tabIndex={0}
      role={!!onClick ? "status" : "button"}
      className={classNames("quick-stats-panel-item", className, {
        active: !!onClick,
      })}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
};

export interface StatusMessage {
  message: string;
  variant: "success" | "warning" | "info";
}

interface QuickStatsProps {
  mode: "portrait" | "landscape";
  handsLeft: number;
  currentTurn: number;
  totalTurns: number;
  points: number;
  gameSeed: string;
  version: string;
  timerDisplay: string;
  timerWarning: boolean;
  statusMessage: StatusMessage;
  onNewGame: () => void;
  onOpenMenu?: () => void;
}

export function QuickStatsPanel({
  mode,
  handsLeft,
  currentTurn,
  totalTurns,
  points,
  gameSeed,
  version,
  statusMessage,
  timerWarning,
  timerDisplay,
  onNewGame,
  onOpenMenu,
}: QuickStatsProps) {
  const copyGameSeedUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("seed", encodeURIComponent(gameSeed));
    navigator.clipboard.writeText(url.toString());
  };

  const panelSections: Record<string, React.ReactNode[]> = {
    links: [
      <PanelItem key="version" className="version">
        V{version}
      </PanelItem>,
      <PanelItem key="board-link" onClick={() => copyGameSeedUrl()}>
        Board Link
      </PanelItem>,
      <PanelItem key="new-game" onClick={() => onNewGame()}>
        New Game
      </PanelItem>,
      !!onOpenMenu ? (
        <PanelItem key="menu" onClick={() => onOpenMenu()}>
          ?
        </PanelItem>
      ) : undefined,
    ],
    stats: [
      <PanelItem key="score">Score: {points}</PanelItem>,
      <PanelItem key="turn">
        Turn: {currentTurn}/{totalTurns}
      </PanelItem>,
      <PanelItem key="hands">Hands Left: {handsLeft}</PanelItem>,
    ],
    status: [
      <PanelItem
        key="timer"
        className={classNames("timer", { "timer-almost-done": timerWarning })}
      >
        {timerDisplay}
      </PanelItem>,
      <PanelItem key="status" className={`status-${statusMessage.variant}`}>
        {statusMessage.message}
      </PanelItem>,
    ],
  };

  const order =
    mode === "portrait"
      ? ["links", "stats", "status"]
      : ["status", "stats", "links"];

  return (
    <div
      className={classNames("quick-stats-panel", {
        portrait: mode === "portrait",
        landscape: mode === "landscape",
      })}
    >
      {order.map((section) => (
        <div key={section} className="quick-stats-panel-section">
          {panelSections[section]}
        </div>
      ))}
    </div>
  );
}
