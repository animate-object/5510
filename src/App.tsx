import "./modules/common/rng.ts";
import { useEffect, useRef, useState, useCallback, useContext } from "react";
import "./App.css";
import { GridView } from "./modules/grid";
import {
  GameCellAndCoords,
  GameGrid,
  attemptTurn,
  describeGameGrid,
  initializeGameState,
} from "./modules/game";
import { GridTile, HandTile } from "./modules/display";
import { Maybe, Result } from "./modules/common";
import { HandAndBag } from "./modules/game/bag.ts";
import {
  QuickStatsPanel,
  StatusMessage,
} from "./modules/display/QuickStatsPanel.tsx";
import classNames from "classnames";
import { getSeedForDisplay } from "./modules/common/rng.ts";
import { emojiFor } from "./modules/common/emoji.ts";
import { DebugPanel } from "./modules/display/DebugPanel.tsx";
import { FlagContext } from "./modules/common/flags/FlagContext.tsx";
import { Flags } from "./modules/common/flags/flags.ts";

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
    ? (width * 0.96) / gridSize
    : (height * 0.8) / gridSizeAccountingForHand;

  return {
    cellSize: cellSize,
    screenWidth: width,
    screenHeight: height,
    aspectRatio: width / height,
    isPortrait,
  };
};

const getTimerDisplay = (time: number): string => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return [minutes, seconds].map((n) => n.toString().padStart(2, "0")).join(":");
};

const getQueryParam = (key: string): string | null => {
  const url = new URL(window.location.href);
  return url.searchParams.get(key);
};

export function App() {
  const wordSet = useRef<Set<string>>(new Set());
  const newGame = useRef<VoidFunction>(() => {
    console.warn("New game not ready yet");
  });
  const [debugMode, _setDebugMode] = useState<boolean>(
    getQueryParam("q") != null
  );
  const [handsAndBags, setHandsAndBags] = useState<HandAndBag[]>([]);
  const [turnIdx, setTurnIdx] = useState<number>(0);
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
  const [gameState, setGameState] = useState<
    | "initializing"
    | "error"
    | "playing"
    | "done.playedAllHands"
    | "done.outOfTime"
  >("initializing");
  const [timeRemaining, setTimeRemaining] = useState<number>(10 * 60);
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);
  const flagStore = useContext(FlagContext);
  const displayTime = getTimerDisplay(timeRemaining);

  const currentTurn = Math.min(turnIdx + 1, TOTAL_TURNS);
  const minutesLeft = Math.floor(timeRemaining / 60);

  useEffect(() => {
    initializeGameState().then((result) => {
      if (Result.isSuccess(result)) {
        const {
          grid,
          handAndBagForEachTurn,
          wordSet: wordSet_,
          nextGame,
        } = result.value;
        log("game.init", describeGameGrid(grid));
        wordSet.current = wordSet_;
        newGame.current = nextGame;
        setGrid(grid);
        setHandsAndBags(handAndBagForEachTurn);
        setGameState("playing");
      } else {
        alert(result.message);
      }
    });
  }, []);

  useEffect(() => {
    if (gameState === "playing" && seed === "") {
      Maybe.map(getSeedForDisplay(), (seed) => {
        setSeed(seed);
      });
    }
  }, [gameState, seed]);

  useEffect(() => {
    if (gameState === "playing") {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);

  useEffect(() => {
    if (timeRemaining <= 0 && gameState === "playing") {
      setGameState("done.outOfTime");
    }
  }, [timeRemaining, gameState]);

  useEffect(() => {
    if (turnIdx === TOTAL_TURNS) {
      setGameState("done.playedAllHands");
    }
  }, [turnIdx]);

  useEffect(() => {
    if (gameState.startsWith("done")) {
      const reasonMessage =
        gameState === "done.playedAllHands"
          ? "You played all your hands!"
          : "You ran out of time!";
      const finalScoreMessage = `You scored ${points} points!`;
      const timeRemainingMessage =
        timeRemaining > 0 ? `With ${displayTime} left on the clock.\n` : null;
      const turnsRemainingMessage =
        turnsTaken < TOTAL_TURNS
          ? `You had ${TOTAL_TURNS - turnsTaken} turns left.`
          : null;

      const message =
        "🎉 Game Complete\n" +
        `${reasonMessage}\n` +
        `${finalScoreMessage}\n` +
        `${timeRemainingMessage || turnsRemainingMessage || ""}\n` +
        "Press 'New game' to play again!";
      setTimeout(() => {
        alert(message);
        setSuccess("Game complete!");
      }, 400);
    }
  }, [gameState, points]);

  const nextHand = useCallback(() => {
    setTurnIdx(turnIdx + 1);
  }, [turnIdx, handsAndBags]);

  useEffect(() => {
    log("game.stat", {
      "game state": gameState,
      "turns taken": turnIdx,
      "points scored": points,
      "minutes left": minutesLeft,
    });
  }, [turnIdx, gameState, points, minutesLeft]);

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
  const handsLeft = Math.max(handsAndBags.length - turnIdx - 1, 0);
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
      prompt(`Enter a word to place ${displayDirection}`)
        ?.toUpperCase()
        .trim() || "";

    const result = attemptTurn({
      hand,
      grid,
      wordSet: wordSet.current,
      word,
      start: cell.coords,
      direction,
      currentTurn,
      useNewScoring: flagStore.getFlag(Flags.new_scoring_rules),
    });

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

    nextHand();
  };

  const showGame = [
    "playing",
    "done.playedAllHands",
    "done.outOfTime",
  ].includes(gameState);

  if (!showGame) {
    if (gameState === "initializing") {
      return <h1>Loading...</h1>;
    }
    if (gameState === "error") {
      return <h1>Oops! Something went wrong.</h1>;
    }
  }

  return (
    <div
      className={classNames("app", {
        "likely-mobile": isPortrait,
      })}
    >
      <QuickStatsPanel
        mode={isPortrait ? "portrait" : "landscape"}
        handsLeft={handsLeft}
        currentTurn={currentTurn}
        totalTurns={TOTAL_TURNS}
        points={points}
        gameSeed={seed}
        version="0.3.3"
        timerDisplay={displayTime}
        timerWarning={timeRemaining <= 60}
        statusMessage={statusMessage}
        onNewGame={newGame.current}
      />
      <GridView
        grid={grid!}
        cellSizePx={cellSize}
        renderCell={(cell, coords, cellSizePx) => (
          <GridTile
            cell={{ cell, coords }}
            cellSize={cellSizePx}
            onClick={handleClickTile}
          />
        )}
      />
      {}
      <div className="hand">
        {hand?.letters?.map((letter, i) => (
          <HandTile key={i} letter={letter} cellSize={cellSize} />
        ))}
      </div>
      {debugMode && (
        <>
          <DebugPanel open={showDebugPanel} />
          <div className="debug-panel-toggle">
            <button
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              className="debug-panel-bottom"
            >
              Q
            </button>
          </div>
        </>
      )}
    </div>
  );
}
