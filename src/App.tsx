import { useEffect, useState } from "react";
import "./App.css";
import { type Grid, GridView, setTilesInGrid, setTile } from "./modules/grid";
import {
  TileData,
  TurnRule,
  fetchWordSet,
  initialGrid,
  letterTileFromChar,
  validateTurn,
} from "./modules/game";
import { Tile } from "./modules/display";
import { Result } from "./modules/common";
import { DirectionArrow } from "./modules/display/DirectionArrow";

export function App() {
  const [grid, setGrid] = useState<Grid<TileData>>(() => initialGrid());
  const [wordSet, setWordSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchWordSet().then((result) => {
      Result.map(result, (words) => {
        setWordSet(new Set(words));
        (window as any).wordSet = words;
      });
    });
  }, []);

  const allWordsAreValidRule: TurnRule = (summary, gameState) => {
    const { wordsPlayed, lettersPlayed } = summary;
    console.log("Played words", wordsPlayed);

    const firstInvalidWord = wordsPlayed.find(
      (word) => !wordSet.has(word.raw.toLowerCase())
    );

    if (firstInvalidWord != null) {
      return Result.failure(`Invalid word: "${firstInvalidWord.raw}"`);
    } else {
      return Result.success(undefined);
    }
  }

  return (
    <div className="app">
      <GridView
        grid={grid}
        cellSizePx={80}
        renderCell={(cell, coords, cellSizePx) => (
          <Tile
            cell={cell}
            size={cellSizePx}
            onClick={(cell, direction) => {
              console.log("Clicked", cell);
              const word = prompt("Enter a word")?.toUpperCase();
              if (word == null || word === "") {
                return;
              }
              // if (!wordSet.has(word.toLowerCase())) {
              //   alert(`"${word}" is not a valid word`);
              //   return;
              // }
              const wordLength = word.length;
              const availableTiles = grid.walk(coords, direction);
              if (availableTiles.length < wordLength) {
                alert(`Not enough tiles to spell "${word}"`);
                return;
              }

              const tileSetters = word.split("").map((letter, i) => {
                const { coords } = availableTiles[i];
                return setTile(coords.x, coords.y, letterTileFromChar(letter));
              });

              // Result.map(setTilesInGrid(grid, tileSetters), setGrid);
              const newGridResult = setTilesInGrid(grid, tileSetters);
              if (Result.isFailure(newGridResult)) {
                alert(newGridResult.message);
                return;
              }
              const newGrid = newGridResult.value;

              const turnResult = validateTurn(grid, newGrid, {hand: []}, [
                allWordsAreValidRule
              ]);

              if (turnResult.kind === "invalid") {
                alert(turnResult.message);
                return;
              } else {
                setGrid(newGrid);
              }
            }}
          />
        )}
      />
      <DirectionArrow />
    </div>
  );
}
