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
      tabIndex={0}
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
  onNewGame: () => void;
  statusMessage: StatusMessage;
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
}: QuickStatsProps) {
  const copyGameSeedUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("seed", encodeURIComponent(gameSeed));
    navigator.clipboard.writeText(url.toString());
  };

  const panelSections: Record<string, React.ReactNode[]> = {
    links: [
      <PanelItem className="version">V{version}</PanelItem>,
      <PanelItem onClick={() => copyGameSeedUrl()}>Board Link</PanelItem>,
      <PanelItem onClick={() => onNewGame()}>New Game</PanelItem>,
    ],
    stats: [
      <PanelItem>Score: {points}</PanelItem>,
      <PanelItem>
        Turn: {currentTurn}/{totalTurns}
      </PanelItem>,
      <PanelItem>Hands Left: {handsLeft}</PanelItem>,
    ],
    status: [
      <PanelItem
        className={classNames("timer", { "timer-almost-done": timerWarning })}
      >
        {timerDisplay}
      </PanelItem>,
      <PanelItem className={`status-${statusMessage.variant}`}>
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
