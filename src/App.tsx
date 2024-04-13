import "./modules/common/rng.ts";
import { useEffect, useRef, useState, useCallback } from "react";
import "./App.css";
import { GridView } from "./modules/grid";
import {
  GameCellAndCoords,
  GameGrid,
  attemptTurn,
  initializeGameState,
} from "./modules/game";
import { GridTile, HandTile } from "./modules/display";
import { Maybe, Result } from "./modules/common";
import { DirectionArrow } from "./modules/display/DirectionArrow";
import { HandAndBag } from "./modules/game/bag.ts";
import {
  QuickStatsPanel,
  StatusMessage,
} from "./modules/display/QuickStatsPanel.tsx";
import classNames from "classnames";
import { getSeedForDisplay } from "./modules/common/rng.ts";
import { emojiFor } from "./modules/common/emoji.ts";

const TOTAL_TURNS = 5;
const GRID_SIZE = 6;

interface LayoutDetails {
  cellSize: number;
  screenWidth: number;
  screenHeight: number;
  aspectRatio: number;
  isPortrait: boolean;
}

const Status = {
  warning: (message: string): StatusMessage => ({
    message,
    variant: "warning",
  }),
  success: (message: string): StatusMessage => ({
    message: `${emojiFor("success")} ${message}`,
    variant: "success",
  }),
  info: (message: string): StatusMessage => ({
    message,
    variant: "info",
  }),
  error: (message: string): StatusMessage => ({
    message: `${emojiFor("error")} ${message}`,
    variant: "warning",
  }),
};

const computeLayoutDetails = (gridSize: number): LayoutDetails => {
  const gridSizeAccountingForHand = gridSize + 1.25;
  const height = window.innerHeight;
  const width = window.innerWidth;

  const isPortrait = height > width;

  const cellSize = isPortrait
    ? (width * 0.98) / gridSize
    : (height * 0.8) / gridSizeAccountingForHand;

  return {
    cellSize: cellSize,
    screenWidth: width,
    screenHeight: height,
    aspectRatio: width / height,
    isPortrait,
  };
};

export function App() {
  const wordSet = useRef<Set<string>>(new Set());
  const newGame = useRef<VoidFunction>(() => {
    console.warn("New game not ready yet");
  });
  const [handsAndBags, setHandsAndBags] = useState<HandAndBag[]>([]);
  const [turnIdx, setTurnIdx] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [grid, setGrid] = useState<GameGrid>();
  const [points, setPoints] = useState<number>(0);
  const [seed, setSeed] = useState<string>("");
  const [layout, _setLayout] = useState<LayoutDetails>(
    computeLayoutDetails(GRID_SIZE)
  );
  const { cellSize, isPortrait } = layout;
  const [statusMessage, setStatusMessage] = useState<StatusMessage>({
    message: "👋 Double tap to play across",
    variant: "info",
  });

  useEffect(() => {
    initializeGameState().then((result) => {
      if (Result.isSuccess(result)) {
        const { grid, handAndBagForEachTurn, wordList, nextGame } =
          result.value;
        console.log({ grid, handAndBagForEachTurn, wordList, nextGame });
        wordSet.current = new Set(wordList);
        newGame.current = nextGame;
        setGrid(grid);
        setHandsAndBags(handAndBagForEachTurn);
        setLoading(false);
      } else {
        alert(result.message);
      }
    });
  }, []);

  useEffect(() => {
    if (!loading) {
      Maybe.map(getSeedForDisplay(), (seed) => {
        setSeed(seed);
      });
    }
  });

  const nextHand = useCallback(() => {
    setTurnIdx(turnIdx + 1);
  }, [turnIdx, handsAndBags]);

  const setWarning = (message: string) => {
    setStatusMessage(Status.warning(message));
  };
  const setSuccess = (message: string) => {
    setStatusMessage(Status.success(message));
  };
  const setInfo = (message: string) => {
    setStatusMessage(Status.info(message));
  };
  const setError = (message: string) => {
    setStatusMessage(Status.error(message));
  };

  const handAndBag = handsAndBags[turnIdx];
  const hand = handAndBag?.hand;
  const handsLeft = handsAndBags.length - turnIdx;
  const turnsTaken = turnIdx;

  const handleClickTile = (cell: GameCellAndCoords, direction: "s" | "e") => {
    if (grid == null || hand == null) {
      console.warn("Grid or hand not ready yet");
      return;
    }

    if (turnsTaken >= TOTAL_TURNS) {
      setInfo("😎 Game is over! Try 'New game''");
      return;
    }

    const displayDirection = direction === "s" ? "down" : "across";
    const word =
      prompt(`Enter a word to place ${displayDirection}`)?.toUpperCase() || "";
    const result = attemptTurn(
      hand,
      grid,
      wordSet.current,
      word,
      cell.coords,
      direction
    );

    if (word.length === 0) {
      return;
    }

    if (Result.isFailure(result)) {
      console.warn(result.message || "Unknown error");
      if (result.message) {
        setWarning(result.message);
      } else {
        setError("Oops! Something went wrong.");
      }
      return;
    }

    const { pointsScored, gameGrid, wordsPlayed } = result.value;
    setGrid(gameGrid);
    setPoints(points + pointsScored);
    setSuccess(`${wordsPlayed} words played for ${pointsScored} points!`);

    if (handsLeft > 0) {
      nextHand();
    }
  };

  return !loading && grid ? (
    <div
      className={classNames("app", {
        "likely-mobile": isPortrait,
      })}
    >
      <QuickStatsPanel
        mode={isPortrait ? "portrait" : "landscape"}
        handsLeft={handsLeft}
        currentTurn={turnsTaken}
        totalTurns={TOTAL_TURNS}
        points={points}
        gameSeed={seed}
        version="0.1.0"
        onNewGame={newGame.current}
        statusMessage={statusMessage}
      />
      <GridView
        grid={grid}
        cellSizePx={cellSize}
        renderCell={(cell, coords, cellSizePx) => (
          <GridTile
            cell={{ cell, coords }}
            cellSize={cellSizePx}
            onClick={handleClickTile}
          />
        )}
      />
      <div className="hug-bottom">
        <div className="hand">
          {hand?.letters?.map((letter, i) => (
            <HandTile key={i} letter={letter} cellSize={cellSize} />
          ))}
        </div>
      </div>
      <DirectionArrow />
    </div>
  ) : (
    <h1>Loading...</h1>
  );
}
