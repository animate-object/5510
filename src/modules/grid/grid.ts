import { Maybe, Result } from "../common";

interface Cell<T> {
  data: T;
}

const cellOf = <T>(data: T): Cell<T> => {
  return { data };
};

type Row<T> = Array<Cell<T>>;
type GridData<T> = Array<Row<T>>;
type ValueFactory<T> = () => T;
type InitialValue<T> = T | ValueFactory<T>;

function initialize<T>(initialValue: InitialValue<T>): T {
  return typeof initialValue === "function"
    ? (initialValue as ValueFactory<T>)()
    : initialValue;
}

function newRow<T>(width: number, initialValue: InitialValue<T>): Row<T> {
  return Array.from({ length: width }, () => cellOf(initialize(initialValue)));
}

const emptyGridData = <T>(
  width: number,
  height: number,
  initialValue: InitialValue<T>
): GridData<T> => {
  return Array.from({ length: height }, () => newRow(width, initialValue));
};

interface Coords {
  x: number;
  y: number;
}

const coords = (x: number, y: number): Coords => {
  return { x, y };
};

export type CellAndCoords<T> = {
  cell: Cell<T>;
  coords: Coords;
};

interface Grid<T> {
  rows: GridData<T>;
  size: number;
  dimensions: {
    width: number;
    height: number;
  };

  getCell(coords: Coords): Maybe.Maybe<CellAndCoords<T>>;
  getCellData(coords: Coords): Maybe.Maybe<T>;
  neighbors: {
    n: (coords: Coords) => Maybe.Maybe<CellAndCoords<T>>;
    s: (coords: Coords) => Maybe.Maybe<CellAndCoords<T>>;
    e: (coords: Coords) => Maybe.Maybe<CellAndCoords<T>>;
    w: (coords: Coords) => Maybe.Maybe<CellAndCoords<T>>;
  };
  walk: (
    start: Coords,
    direction: "n" | "s" | "e" | "w"
  ) => Array<CellAndCoords<T>>;
}

function newGrid<T>(
  width: number,
  height: number,
  initialValue: InitialValue<T>
): Grid<T> {
  const rows = emptyGridData<T>(width, height, initialValue);
  return buildGrid(rows, height, width);
}

function deepCopy<T>(rows: GridData<T>): GridData<T> {
  return rows.map((row) => row.map((cell) => ({ ...cell })));
}

function updateGrid<T>(rows: GridData<T>, previous: Grid<T>): Grid<T> {
  const newRows = Object.is(rows, previous.rows) ? rows : deepCopy(rows);
  return buildGrid(
    newRows,
    previous.dimensions.height,
    previous.dimensions.width
  );
}

type SetTile<T> = { coords: Coords; value: T };

function setTile<T>(x: number, y: number, value: T): SetTile<T> {
  return { coords: { x, y }, value };
}

function setTilesInGrid<T>(
  grid: Grid<T>,
  tiles: Array<SetTile<T>>
): Result.Result<Grid<T>> {
  const newRows = deepCopy(grid.rows);
  tiles.forEach(({ coords: { x, y }, value }) => {
    if (newRows[y] === undefined || newRows[y][x] === undefined) {
      return Result.failure(`Invalid coordinates: (${x}, ${y})`);
    }
    const oldValue = newRows[y][x].data;
    newRows[y][x] = cellOf({ ...oldValue, ...value });
  });
  return Result.success(updateGrid(newRows, grid));
}

function setTileInGrid<T>(
  grid: Grid<T>,
  tile: SetTile<T>
): Result.Result<Grid<T>> {
  return setTilesInGrid(grid, [tile]);
}

function getCell<T>(
  rows: GridData<T>,
  { x, y }: Coords
): Maybe.Maybe<CellAndCoords<T>> {
  if (rows[y] === undefined) {
    return Maybe.nothing();
  }
  return Maybe.map(rows[y][x], (cell) => ({ cell, coords: { x, y } }));
}

function neighbors<T>(rows: GridData<T>): Grid<T>["neighbors"] {
  return {
    n: ({ x, y }: Coords) => getCell(rows, { x, y: y - 1 }),
    s: ({ x, y }: Coords) => getCell(rows, { x, y: y + 1 }),
    e: ({ x, y }: Coords) => getCell(rows, { x: x + 1, y }),
    w: ({ x, y }: Coords) => getCell(rows, { x: x - 1, y }),
  };
}

function walk<T>(
  rows: GridData<T>,
  start: Coords,
  direction: "n" | "s" | "e" | "w"
): Array<CellAndCoords<T>> {
  let current = getCell(rows, start);
  const path = [];
  while (Maybe.isJust(current)) {
    path.push(current);
    current = neighbors(rows)[direction](current.coords);
  }
  return path;
}

const buildGrid = <T>(
  rows: GridData<T>,
  height: number,
  width: number
): Grid<T> => {
  return {
    rows,
    size: height * width,
    dimensions: { width, height },
    getCell: (coords: Coords) => getCell(rows, coords),
    getCellData: (coords: Coords) =>
      Maybe.map(
        getCell(rows, coords),
        (cellAndCoords) => cellAndCoords.cell.data
      ),
    neighbors: neighbors(rows),
    walk: (start: Coords, direction: "n" | "s" | "e" | "w") =>
      walk(rows, start, direction),
  };
};

export type { Cell, Grid, Coords };

export { coords, newGrid, setTile, setTileInGrid, setTilesInGrid };
