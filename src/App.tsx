import "./modules/common/rng.ts";
import { useEffect, useRef, useState, useCallback } from "react";
import "./App.css";
import { type Grid, GridView } from "./modules/grid";
import {
  DEFAULT_GRID_SIZE,
  GameCell,
  GameCellAndCoords,
  TileData,
  attemptTurn,
  fetchWordSet,
  initialGrid,
} from "./modules/game";
import { GridTile, HandTile } from "./modules/display";
import { Result } from "./modules/common";
import { DirectionArrow } from "./modules/display/DirectionArrow";
import { Bag, Hand, drawHand, newBag } from "./modules/game/bag.ts";
import { getSeedForDisplay } from "./modules/common/rng.ts";
import { QuickStatsPanel } from "./modules/display/QuickStatsPanel.tsx";
import classNames from "classnames";

const TOTAL_TURNS = 5;

interface LayoutDetails {
  cellSize: number;
  screenWidth: number;
  screenHeight: number;
  aspectRatio: number;
  isPortrait: boolean;
}

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
  const gridSize = DEFAULT_GRID_SIZE;
  const [grid, setGrid] = useState<Grid<TileData>>(() =>
    initialGrid(gridSize, gridSize)
  );
  const wordSet = useRef<Set<string>>(new Set());
  const [bag, setBag] = useState<Bag>(newBag());
  const [hand, setHand] = useState<Hand>({ handId: "-" } as any as Hand);
  const [handsLeft, setHandsLeft] = useState<number>(TOTAL_TURNS);
  const [turnsTaken, setTurnsTaken] = useState<number>(0);
  const [points, setPoints] = useState<number>(0);
  const seedRef = useRef<string>(getSeedForDisplay());
  const layout = useRef<LayoutDetails>(computeLayoutDetails(gridSize));
  const { cellSize, isPortrait } = layout.current;

  useEffect(() => {
    const [firstHand, initialBag] = drawHand(5, bag);
    setHand(firstHand);
    setBag(initialBag);
    setHandsLeft(handsLeft - 1);
  }, []);

  useEffect(() => {
    fetchWordSet().then((result) => {
      Result.map(result, (words) => {
        wordSet.current = new Set(words);
        (window as any).wordSet = words;
      });
    });
  }, []);

  useEffect(() => {
    if (turnsTaken >= TOTAL_TURNS && handsLeft < 1) {
      const message = "Game Complete" + `Points: ${points}`;
      alert(message);
    }
  }, [turnsTaken, handsLeft, points]);

  useEffect(() => {
    console.log({ hand });
  }, [hand.handId]);

  const drawNextHand = useCallback(() => {
    const [hand, updatedBag] = drawHand(5, bag);
    console.log("drawing next hand", hand, updatedBag);
    setHand(hand);
    setBag(updatedBag);
    setHandsLeft(handsLeft - 1);
  }, [bag, handsLeft, hand.handId]);

  const handleClickTile = (cell: GameCellAndCoords, direction: "s" | "e") => {
    if (handsLeft < 1) {
      alert("Game over, start a new game to continue playing.");
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
      alert(result.message);
      return;
    }

    const { pointsScored, gameGrid } = result.value;
    setGrid(gameGrid);
    setPoints(points + pointsScored);

    if (handsLeft > 0) {
      drawNextHand();
    }
    setTurnsTaken(turnsTaken + 1);
  };

  return (
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
        gameSeed={seedRef.current}
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
  );
}
