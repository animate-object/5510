import { Maybe } from "../common";
import { StatusMessage } from "../display/QuickStatsPanel";
import { GameCellAndCoords, GameGrid, Letter } from "../game";
import { GridView } from "./GridView";
import { ButtonTile, GridTile, HandTile, HandTilePlaceholder } from "./Tile";
import { Coords } from "./grid";
import { useCallback, useState } from "react";

interface Props {
  grid: GameGrid;
  cellSize: number;
  hand: Letter[];
  onCommitPlay: (word: string, start: Coords, direction: "s" | "e") => boolean;
  onPass: () => void;
  onSetStatus: (status: StatusMessage) => void;
}

const coordsToString = (coords: Coords) => `${coords.x},${coords.y}`;
// const coordsFromString = (str: string) => {
//   const [x, y] = str.split(",").map(Number);
//   return { x, y };
// };

const toIds = (coords: Coords[]) => {
  const ids = coords.map(coordsToString);
  return [...new Set(ids)];
};
// const fromIds = (ids: string[]) => ids.map(coordsFromString);

const hideLettersInPlayFromHand = (
  hand: Letter[],
  lettersInPlay: LetterInPlay[]
) => {
  const handLetters = hand.slice();
  lettersInPlay.forEach(({ letter }) => {
    const index = handLetters.indexOf(letter);
    if (index !== -1) {
      handLetters.splice(index, 1);
    }
  });
  return handLetters;
};

interface PlayDetails {
  word: string;
  start: Coords;
  direction: "s" | "e";
}

const getPlayDirection = (coords: Coords[]): "e" | "s" => {
  const anchor = coords[0];
  return coords.every((c) => c.x === anchor.x) ? "s" : "e";
};

const getPlayDetails = (
  lettersInPlay: LetterInPlay[],
  grid: GameGrid
): Maybe.Maybe<PlayDetails> => {
  const anchorTile = lettersInPlay[0];

  // note this will treat every single letter placement as a
  // down play, but that's fine for now
  const isDownPlay =
    getPlayDirection(lettersInPlay.map((l) => l.coords)) === "s";

  // scan the grid and the letters in play and merge them
  const scanStart = {
    x: isDownPlay ? anchorTile.coords.x : 0,
    y: isDownPlay ? 0 : anchorTile.coords.y,
  };

  const gridCells = grid.walk(scanStart, isDownPlay ? "s" : "e");

  let candidateWords: LetterInPlay[][] = [];
  let nextCandidate: LetterInPlay[] = [];

  for (const cell of gridCells) {
    let letterFromCell, letterFromPlay;
    if ((letterFromCell = cell.cell.data.letter)) {
      nextCandidate.push({ letter: letterFromCell, coords: cell.coords });
    } else if (
      (letterFromPlay = lettersInPlay.find(
        (l) => coordsToString(l.coords) === coordsToString(cell.coords)
      ))
    ) {
      nextCandidate.push(letterFromPlay);
    } else if (nextCandidate.length > 0) {
      candidateWords.push([...nextCandidate]);
      nextCandidate = [];
    }
  }
  if (nextCandidate.length > 0) {
    candidateWords.push([...nextCandidate]);
  }

  // find the word, if any, that contains the anchor tile
  const playedWord = candidateWords.find((w) =>
    w.some((l) => l.coords === anchorTile.coords)
  );

  if (!playedWord) {
    return Maybe.nothing();
  }

  // the word start tile is the 0th element of the played word
  const start = playedWord[0].coords;
  const word = playedWord.map((l) => l.letter).join("");

  return {
    word,
    start,
    direction: isDownPlay ? "s" : "e",
  };
};

type BoardMode = "inactive" | "placing.first" | "placing.more";
type LetterInPlay = { letter: Letter; coords: Coords };

export function Board({
  grid,
  cellSize,
  hand,
  onCommitPlay,
  onPass,
  onSetStatus,
}: Props): JSX.Element {
  const [hilighted, setHighlighted] = useState<string[]>([]);
  const [mode, setMode] = useState<BoardMode>("inactive");
  const [lettersInPlay, setLettersInPlay] = useState<LetterInPlay[]>([]);
  const [focusedTile, setFocusedTile] = useState<Coords | null>(null);
  const displayHand = hideLettersInPlayFromHand(hand, lettersInPlay);
  const anyHighlighted = hilighted.length > 0;

  // aliasing in case these concepts ever diverge
  const playableTiles = hilighted;

  // there are 6 slots total
  // five occupied by letters in the hand
  // one occupied by the pass button
  // the first played letter is taken up by the commit button
  // after that we need placeholders, up to 4 total
  const placeholderTileCount = Math.max(0, lettersInPlay.length - 1);
  const placeholderTileIds = Array.from({ length: placeholderTileCount }).map(
    (i) => `placeholder-${i}`
  );

  // const addToHighlighted = (coords: Coords[]) => {
  //   const selected = fromIds(hilighted);
  //   setHighlighted(toIds([...selected, ...coords]));
  // };

  const replaceHighlighted = (coords: Coords[]) => {
    setHighlighted(toIds(coords));
  };

  // const highlightTiles = (coords: Coords[]) => {
  //   const ids = coords.map(coordsToString);
  //   const deduped = [...new Set([...hilighted, ...ids])];
  //   setHighlighted(deduped);
  // };

  const focusTile = (coords: Coords) => {
    if (mode === "inactive") {
      setFocusedTile(coords);
    } else if (playableTiles.includes(coordsToString(coords))) {
      setFocusedTile(coords);
    }
  };

  const clearFocusedTile = () => {
    setFocusedTile(null);
  };

  const clearLettersInPlay = () => {
    setLettersInPlay([]);
  };

  const clearHighlighted = () => {
    setHighlighted([]);
  };

  const stageLetterInPlay = (letter: Letter, coords: Coords) => {
    // if the cell is empty
    const cell = grid.getCell(coords);
    if (cell?.cell.data.letter) {
      return;
    }
    if (
      lettersInPlay.some(
        (l) => coordsToString(l.coords) === coordsToString(coords)
      )
    ) {
      return;
    }
    setLettersInPlay([...lettersInPlay, { letter, coords }]);
  };

  const removeLastLetterInPlay = () => {
    const newLettersInPlay = lettersInPlay.slice(0, -1);
    setLettersInPlay(newLettersInPlay);
    if (newLettersInPlay.length === 0) {
      abortPlacement();
    }
  };

  const rowContaining = (coords: Coords): Coords[] => {
    const start = { x: 0, y: coords.y };
    const cells = grid.walk(start, "e");
    return cells.map((cell) => cell.coords);
  };

  const columnContaining = (coords: Coords) => {
    const start = { x: coords.x, y: 0 };
    const cells = grid.walk(start, "s");
    return cells.map((cell) => cell.coords);
  };

  const startPlacement = (cell: GameCellAndCoords) => {
    setMode("placing.first");
    focusTile(cell.coords);

    const row = rowContaining(cell.coords);
    const column = columnContaining(cell.coords);
    replaceHighlighted([...row, ...column]);
  };

  const abortPlacement = () => {
    setMode("inactive");
    clearFocusedTile();
    clearLettersInPlay();
    clearHighlighted();
  };

  const handleClickTile = (cell: GameCellAndCoords) => {
    switch (mode) {
      case "inactive":
        startPlacement(cell);
        break;
      case "placing.first":
        abortPlacement();
        break;
      case "placing.more":
        focusTile(cell.coords);
        break;
    }
  };

  const placeMoreLetters = (letter: Letter, coords: Coords) => {
    stageLetterInPlay(letter, coords);
    if (getPlayDirection([lettersInPlay[0].coords, coords]) === "s") {
      const column = columnContaining(coords);
      replaceHighlighted(column);
    } else {
      const row = rowContaining(coords);
      replaceHighlighted(row);
    }
  };

  const placeFirstLetter = (letter: Letter, coords: Coords) => {
    onSetStatus({ variant: "info", message: "Placing tiles" });
    stageLetterInPlay(letter, coords);
    setMode("placing.more");
  };

  const handleTapHandTile = useCallback(
    (letter: Letter) => {
      switch (mode) {
        case "inactive":
          return;
        case "placing.first":
          placeFirstLetter(letter, focusedTile!);
          return;
        case "placing.more":
          placeMoreLetters(letter, focusedTile!);
          return;
      }
    },
    [mode, focusedTile, stageLetterInPlay]
  );

  return (
    <>
      <GridView
        grid={grid!}
        cellSizePx={cellSize}
        renderCell={(cell, coords, cellSizePx) => {
          const coordsId = coordsToString(coords);
          const isHighlighted = hilighted.includes(coordsId);
          const letterInPlay = lettersInPlay.find(
            ({ coords: letterCoords }) => {
              return coordsToString(letterCoords) === coordsId;
            }
          );

          const displayData = {
            ...cell,
            data: {
              ...cell.data,
              letter: cell.data.letter || letterInPlay?.letter,
            },
          };

          return (
            <GridTile
              hilite={isHighlighted}
              lowlite={anyHighlighted && !isHighlighted}
              focused={
                focusedTile ? coordsId === coordsToString(focusedTile) : false
              }
              cell={{ cell: displayData, coords }}
              cellSize={cellSizePx}
              onClick={handleClickTile}
            />
          );
        }}
      />
      <div className="hand">
        {displayHand?.map((letter, i) => (
          <HandTile
            key={i}
            onClick={handleTapHandTile}
            letter={letter}
            cellSize={cellSize}
          />
        ))}
        {mode === "inactive" && (
          <ButtonTile
            variant="danger"
            content={"⏭"}
            cellSize={cellSize}
            onHoldCancel={() =>
              onSetStatus({
                variant: "info",
                message: "Once more into the frey!",
              })
            }
            onClickAndHold={() => {
              onPass();
              onSetStatus({ variant: "info", message: "Passed turn" });
            }}
            holdDurationS={3}
            onHoldTick={(remainingS) =>
              onSetStatus({
                variant: "warning",
                message: `Passing in ${remainingS}`,
              })
            }
          />
        )}
        {mode === "placing.more" && (
          <>
            {placeholderTileIds.map((id) => (
              <HandTilePlaceholder key={id} cellSize={cellSize} />
            ))}
            <ButtonTile
              variant="primary"
              content={"✔"}
              cellSize={cellSize}
              onClickAndHold={() => {
                const maybePlay = getPlayDetails(lettersInPlay, grid);
                if (Maybe.isNothing(maybePlay)) {
                  console.log("invalid play");
                  return;
                }
                const { word, start, direction } = maybePlay;
                if (onCommitPlay(word, start, direction)) {
                  clearFocusedTile();
                  clearHighlighted();
                  clearLettersInPlay();
                  setMode("inactive");
                }
              }}
              onHoldTick={(remainingS) => {
                onSetStatus({
                  variant: "success",
                  message: `Committing...`,
                });
              }}
              holdDurationS={1}
            />
          </>
        )}
        {mode.startsWith("placing") && (
          <ButtonTile
            variant="secondary"
            content={"␡"}
            cellSize={cellSize}
            onClick={() => {
              removeLastLetterInPlay();
            }}
          />
        )}
      </div>
    </>
  );
}
