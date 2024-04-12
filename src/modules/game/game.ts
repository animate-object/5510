// foundational types for the game module

import { Maybe, Result } from "../common";
import { Cell, CellAndCoords, Coords, Grid } from "../grid";
import { Bonus, Letter, TileData } from "./tile_data";


export type GameGrid = Grid<TileData>;
export type GameGridData = GameGrid['rows'];
export type GameCell = Cell<TileData>;
export type GameCellAndCoords = CellAndCoords<TileData>;


export interface PlayedWord {
    word: Letter[];
    bonuses: Array<Maybe.Maybe<Bonus>>;
    start: Coords;
    direction: 'e' | 's';
    raw: string;
}

export interface GameState {
    hand: Letter[];
}


export interface PlacementSummary {
    wordsPlayed: PlayedWord[];
    lettersPlayed: Letter[];
}


export type TurnRule = (
    placementSummary: PlacementSummary,
    gameState: GameState,
) => Result.Result<void>;
