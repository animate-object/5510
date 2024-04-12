import React, { useMemo } from "react";

import { Grid, Cell, Coords } from "./grid";

interface Props<T> {
  grid: Grid<T>;
  cellSizePx: number;

  renderCell: (
    cell: Cell<T>,
    coords: Coords,
    cellSizePx: number
  ) => React.ReactNode;
}

export const GridView = <T,>({ grid, cellSizePx, renderCell }: Props<T>) => {
  const gridWidth = grid.dimensions.width;
  const gridstyles = useMemo(() => {
    return {
      display: "grid",
      gridTemplateColumns: `repeat(${gridWidth}, ${cellSizePx}px)`,
    };
  }, [gridWidth, cellSizePx]);
  return (
    <div style={gridstyles}>
      {grid.rows.map((row, y) =>
        row.map((cell, x) => (
          <div
            key={`${x}-${y}`}
            style={{
              width: cellSizePx,
              height: cellSizePx,
            }}
          >
            {renderCell(cell, { x, y }, cellSizePx)}
          </div>
        ))
      )}
    </div>
  );
};
