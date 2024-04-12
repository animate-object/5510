// foundational types for the game module

import { Maybe, Result } from "../common";
import { Cell, CellAndCoords, Coords, Grid } from "../grid";
import { Letter } from "./letter";
import { Bonus, TileData } from "./tile_data";

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
