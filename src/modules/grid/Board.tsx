import { Maybe } from "../common";
import { StatusMessage } from "../display/QuickStatsPanel";
import { GameCellAndCoords, GameGrid, Letter } from "../game";
import { GridView } from "./GridView";
import { ButtonTile, GridTile, HandTile, HandTilePlaceholder } from "./Tile";
import { Coords } from "./grid";
import { useCallback, useEffect, useState } from "react";

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

const findNextUnoccupiedTile = (
  grid: GameGrid,
  start: Coords,
  direction: "s" | "e"
): Maybe.Maybe<GameCellAndCoords> => {
  let nextUnoccupiedTile: Maybe.Maybe<GameCellAndCoords> = Maybe.nothing();
  let current = start;
  while (!nextUnoccupiedTile) {
    const next = grid.neighbors[direction](current);
    if (!next) {
      break;
    }
    if (!next.cell.data.letter) {
      nextUnoccupiedTile = next;
    }
    current = next.coords;
  }
  return nextUnoccupiedTile;
};

type BoardMode = "inactive" | "placing.first" | "placing.more" | "typing.more";

type LetterInPlay = { letter: Letter; coords: Coords };

type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
type Direction = "n" | "s" | "w" | "e";

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
  const [selectedHandTileIdx, setSelectedHandTileIdx] = useState<number | null>(
    null
  );
  const [shiftKeyPressed, setShiftKeyPressed] = useState(false);
  const [keyboardPlayDirection, setKeyboardPlayDirection] = useState<"s" | "e">(
    "e"
  );
  const displayHand = hideLettersInPlayFromHand(hand, lettersInPlay);
  const anyHighlighted = hilighted.length > 0;
  // aliasing in case these concepts ever diverge
  const playableTiles = hilighted;

  // fill the hand with placeholders as letters are played, accounting
  // for the pass, cancel, and commit buttons
  const placeholderTileCount = Math.max(0, lettersInPlay.length - 1);
  const placeholderTileIds = Array.from({ length: placeholderTileCount }).map(
    (_t, i) => `placeholder-${i}`
  );

  const handleTypeLetter = (letter: Letter) => {
    if (!focusedTile) {
      return;
    }
    if (!displayHand.includes(letter)) {
      console.warn(`Can't play letter not in hand ${letter}`);
      return;
    }
    if (mode === "placing.first") {
      placeFirstLetter(letter, focusedTile);
      const direction = shiftKeyPressed ? "s" : "e";
      setKeyboardPlayDirection(direction);
      setMode("typing.more");
      const nextTile = findNextUnoccupiedTile(grid, focusedTile, direction);
      if (Maybe.isJust(nextTile)) {
        setFocusedTile(nextTile.coords);
      }
    }
    if (mode === "placing.more") {
      // no keyboard controls when touch placement is active
      return;
    }
    if (mode === "typing.more") {
      placeMoreLetters(letter, focusedTile);
      const nextTile = findNextUnoccupiedTile(
        grid,
        focusedTile,
        keyboardPlayDirection
      );
      if (Maybe.isJust(nextTile)) {
        setFocusedTile(nextTile.coords);
      }
    }
  };

  const handleKeyNavigation = (evt: ArrowKey) => {
    const direction = {
      ArrowUp: "n",
      ArrowDown: "s",
      ArrowLeft: "w",
      ArrowRight: "e",
    }[evt] as Direction;

    const cell = grid.neighbors[direction](focusedTile || { x: 0, y: 0 });

    if (cell && ["placing.first", "inactive"].includes(mode)) {
      startPlacement(cell);
    }
  };

  const handleKeyboardEvents = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        setShiftKeyPressed(true);
      }
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
      ) {
        handleKeyNavigation(
          event.key as "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
        );
      }
      // if it's a letter key
      if (event.key.match(/[a-z]/i) && event.key.length === 1) {
        handleTypeLetter(event.key.toUpperCase() as Letter);
      }
      if (event.key === "Enter") {
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
      }
      if (event.key === "Backspace") {
        removeLastLetterInPlay();
      }
      if (event.key === "Escape") {
        abortPlacement();
      }
    },
    [
      focusedTile,
      mode,
      displayHand,
      grid,
      handleTypeLetter,
      handleKeyNavigation,
      keyboardPlayDirection,
      shiftKeyPressed,
    ]
  );

  const handleKeyUpEvents = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Shift") {
        setShiftKeyPressed(false);
      }
    },
    [setShiftKeyPressed]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardEvents);
    window.addEventListener("keyup", (evt) => handleKeyUpEvents(evt));
    return () => {
      window.removeEventListener("keydown", handleKeyboardEvents);
      window.removeEventListener("keyup", handleKeyUpEvents);
    };
  }, [handleKeyboardEvents]);

  const replaceHighlighted = (coords: Coords[]) => {
    setHighlighted(toIds(coords));
  };

  const focusTile = (coords: Coords) => {
    const cellId = coordsToString(coords);
    if (mode.endsWith("more") && playableTiles.includes(cellId)) {
      setFocusedTile(coords);
    } else {
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

  const clearSelectedHandTileIdx = () => {
    setSelectedHandTileIdx(null);
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
    clearSelectedHandTileIdx();
    clearFocusedTile();
  };

  const removeLastLetterInPlay = () => {
    const lastLetter = lettersInPlay[lettersInPlay.length - 1];
    const newLettersInPlay = lettersInPlay.slice(0, -1);
    setLettersInPlay(newLettersInPlay);
    if (newLettersInPlay.length === 0) {
      abortPlacement();
    } else {
      setFocusedTile(lastLetter.coords);
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
    setKeyboardPlayDirection("e");
  };

  const handleClickTile = (cell: GameCellAndCoords) => {
    switch (mode) {
      case "inactive":
        startPlacement(cell);
        if (selectedHandTileIdx != null) {
          placeFirstLetter(displayHand[selectedHandTileIdx], cell.coords);
        }
        break;
      case "placing.first":
        startPlacement(cell);
        break;
      case "placing.more":
        if (selectedHandTileIdx != null) {
          placeMoreLetters(displayHand[selectedHandTileIdx], cell.coords);
        } else {
          focusTile(cell.coords);
        }
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
    (letter: Letter, idx: number) => {
      switch (mode) {
        case "inactive":
          setSelectedHandTileIdx(idx);
          return;
        case "placing.first":
          if (focusedTile) {
            placeFirstLetter(letter, focusedTile!);
          } else {
            setSelectedHandTileIdx(idx);
          }
          return;
        case "placing.more":
          if (focusedTile) {
            placeMoreLetters(letter, focusedTile);
          } else {
            setSelectedHandTileIdx(idx);
          }
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
            onClick={(l) => handleTapHandTile(l, i)}
            letter={letter}
            cellSize={cellSize}
            focused={selectedHandTileIdx === i}
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
                message: "Once more into the fray!",
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
              onHoldTick={(_remainingS) => {
                onSetStatus({
                  variant: "success",
                  message: "Hold to play",
                });
              }}
              onHoldCancel={() => {
                onSetStatus({
                  variant: "info",
                  message: "Think it over 👍",
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
