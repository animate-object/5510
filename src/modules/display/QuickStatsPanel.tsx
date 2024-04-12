import React from "react";
import "./QuickStatsPanel.css";
import classNames from "classnames";
import { clearSeedAndReload } from "../common/rng";

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

interface QuickStatsProps {
  mode: "portrait" | "landscape";
  handsLeft: number;
  currentTurn: number;
  totalTurns: number;
  points: number;
  gameSeed: string;
}

export function QuickStatsPanel({
  mode,
  handsLeft,
  currentTurn,
  totalTurns,
  points,
  gameSeed,
}: QuickStatsProps) {
  const copyGameSeedUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("seed", encodeURIComponent(gameSeed));
    navigator.clipboard.writeText(url.toString());
  };

  return (
    <div className={
      classNames("quick-stats-panel", {
        portrait: mode === "portrait",
        landscape: mode === "landscape",
      })
    }>
      <div className="quick-stats-panel-section">
        <PanelItem>Score: {points}</PanelItem>
        <PanelItem>
          Turn: {currentTurn}/{totalTurns}
        </PanelItem>
        <PanelItem>Hands Left: {handsLeft}</PanelItem>
      </div>
      <div className="quick-stats-panel-section">
        <PanelItem onClick={() => copyGameSeedUrl()}>Copy Game Link</PanelItem>
        <PanelItem onClick={() => clearSeedAndReload()}>New Game</PanelItem>
      </div>
    </div>
  );
}
