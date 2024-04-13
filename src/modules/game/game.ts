// foundational types for the game module

import { Maybe, Result } from "../common";
import { Cell, CellAndCoords, Coords, Grid } from "../grid";
import { Letter } from "./letter";
import { Bonus, TileData, bonusAbbreviation } from "./tile_data";

export type GameGrid = Grid<TileData>;
export type GameGridData = GameGrid["rows"];
export type GameCell = Cell<TileData>;
export type GameCellAndCoords = CellAndCoords<TileData>;

export interface PlayedWord {
  word: Letter[];
  bonuses: Array<Maybe.Maybe<Bonus>>;
  start: Coords;
  direction: "e" | "s";
  raw: string;
}

export interface PlacementSummary {
  wordsPlayed: PlayedWord[];
  lettersPlayed: Letter[];
}

export type TurnRule = (
  placementSummary: PlacementSummary
) => Result.Result<void>;

export const describePlayedWord = (playedWord: PlayedWord): string => {
  const { word, start, direction } = playedWord;

  const letterCoords = word.map((l, i) => {
    const bonus = playedWord.bonuses[i];
    const bonusString =
      Maybe.map(bonus, (b) => `[${bonusAbbreviation(b)}]`) || "";
    return `${l}${bonusString}`;
  });
  const displayDirection = direction === "s" ? "↓" : "→";

  return `[${displayDirection}(${start.x},${start.y})]${letterCoords.join("")}`;
};

export const describeBonusTile = (
  c: GameCellAndCoords
): Maybe.Maybe<string> => {
  const { cell, coords } = c;
  return Maybe.map(
    Maybe.map(cell.data.bonus, bonusAbbreviation),
    (abbrev) => `[(${coords.x},${coords.y})]${abbrev}`
  );
};

export const describeGameGrid = (grid: GameGrid): LogDict => {
  let bonusTiles: GameCellAndCoords[] = [];
  grid.rows.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell.data.bonus) {
        bonusTiles.push({ cell, coords: { x, y } });
      }
    });
  });

  return {
    width: grid.dimensions.width,
    height: grid.dimensions.height,
    "bonus tile count": bonusTiles.length,
    "bonus tiles": bonusTiles
      .map((c) => describeBonusTile(c))
      .filter(Maybe.isJust),
  };
};
