/// Utilities for initializing game state

import { Arrays, Result } from "../common";
import { Grid, newGrid, setTile, setTileInGrid } from "../grid";
import { TileData, emptyTile, randomBonusTile } from "./tile_data";

export const DEFAULT_GRID_SIZE = 6;

const BONUS_TILE_COUNT_BAG = [
  2, 2, 2, 2, 2,
  3, 3, 3, 3, 3,
  4, 4, 4, 4,
  5, 5, 5,
  6, 6,
  7,
];


export const initialGrid = (
  width: number = DEFAULT_GRID_SIZE,
  height: number = DEFAULT_GRID_SIZE,
  bonusTileCount: number = Arrays.chooseOne(BONUS_TILE_COUNT_BAG),
): Grid<TileData> => {
  let grid = newGrid(width, height, emptyTile);
  let bonusTilesLeftToPlace = bonusTileCount;

  while (bonusTilesLeftToPlace > 0) {
    const x = Math.floor(window.nextRandom() * width);
    const y = Math.floor(nextRandom() * height);

    if (grid.getCellData({ x, y })?.bonus === undefined) {
      const result = setTileInGrid(grid, setTile(x, y, randomBonusTile()));
      if (Result.isSuccess(result)) {
        grid = result.value;
        bonusTilesLeftToPlace--;
      }
    }
  }

  return grid;
};
