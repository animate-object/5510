import { useContext } from "react";
import { Maybe } from "../common";
import { Bonus, GameGrid } from "../game";
import { StatusMessage } from "./QuickStatsPanel";
import { FlagContext, Flags } from "../common/flags";
import classNames from "classnames";
import "./GameFinishedPanel.css";

interface Props {
  score: number;
  boardLink: string;
  grid: GameGrid;
  onSetStatus: (message: StatusMessage) => void;
  onNewGame: () => void;
}

const mapBonusToSymbol = (bonus: string): string => {
  switch (bonus) {
    case Bonus.DoubleLetter:
      return "🟪";
    case Bonus.TripleLetter:
      return "🟥";
    case Bonus.DoubleWord:
      return "🟨";
    case Bonus.TripleWord:
      return "🟩";
    default:
      return "⬜️";
  }
};

const emojiGrid = (grid: GameGrid): string => {
  return grid.rows
    .map((row) =>
      row
        .map((cell) => Maybe.map(cell.data.bonus, mapBonusToSymbol) || "⬜️")
        .join("")
    )
    .join("\n");
};

const cleanLink = (url: string): string => {
  const urlObj = new URL(url);
  const seed = urlObj.searchParams.get("seed");
  return `${urlObj.origin}${urlObj.pathname}?seed=${seed}`;
};

const shareButtonText = (
  score: number,
  grid: GameGrid,
  link: string,
  includeGrid: boolean
): string => {
  return (
    `Beat my score: ${score}! ` +
    `Play board: ${cleanLink(link)}` +
    (includeGrid ? `\n${emojiGrid(grid)}` : "")
  );
};

export function GameFinishedPanel({
  score,
  boardLink,
  grid,
  onSetStatus,
  onNewGame,
}: Props): JSX.Element {
  const flagStore = useContext(FlagContext);
  const shareText = () =>
    shareButtonText(
      score,
      grid,
      boardLink,
      flagStore.getFlag(Flags.emoji_share)
    );

  const shareViaApi = () => {
    navigator.share({
      text: shareText(),
      url: boardLink,
    });
  };

  const shareViaClipboard = () => {
    navigator.clipboard.writeText(shareText());
    onSetStatus({
      message: "Copied link!",
      variant: "success",
    });
  };

  const handleShare = () => {
    if (navigator.hasOwnProperty("share")) {
      shareViaApi();
    } else {
      shareViaClipboard();
    }
  };

  return (
    <div>
      <button
        className={classNames("button", "play-again-button")}
        onClick={onNewGame}
      >
        Play again
      </button>
      <button
        className={classNames("button", "share-button")}
        onClick={handleShare}
      >
        Challenge a friend!
      </button>
    </div>
  );
}
