import { Maybe, Result } from "../common";
import {
  GameCellAndCoords,
  GameGrid,
  PlacementSummary,
  PlayedWord,
  TurnRule,
} from "./game";
import { Letter } from "./letter";
import { Bonus, bonusAbbreviation } from "./tile_data";

interface TurnCandidate {
  kind: "valid" | "invalid";
}

interface InvalidTurn extends TurnCandidate {
  kind: "invalid";
  message: string;
}

interface TurnSummary extends PlacementSummary {
  pointsScored: number;
}

interface ValidTurn extends TurnCandidate {
  kind: "valid";
  summary: TurnSummary;
}

type TurnResult = ValidTurn | InvalidTurn;

function wordId(word: PlayedWord): string {
  const header = `[${word.start.x},${word.start.y},${word.direction}]`;
  const wordSrt = word.word
    .map((l, idx) => {
      const bonus = word.bonuses[idx] ?? "";
      const bonusAbbrev = bonus != "" ? bonusAbbreviation(bonus) : "";
      return `${l}(${bonusAbbrev})`;
    })
    .join(",");
  return `${header}${wordSrt}`;
}

function playedWordFromWalk(
  walk: GameCellAndCoords[],
  direction: "e" | "s"
): PlayedWord {
  const word: Letter[] = [];
  const bonuses: Array<Maybe.Maybe<Bonus>> = [];
  const start = walk[0].coords;

  for (const {
    cell: {
      data: { letter, bonus },
    },
  } of walk) {
    word.push(letter!);
    bonuses.push(bonus);
  }

  return {
    word: word,
    bonuses: bonuses,
    start: start,
    direction: direction,
    raw: word.join(""),
  };
}

function detectWords(
  walk: GameCellAndCoords[],
  direction: "e" | "s"
): PlayedWord[] {
  let words = [];

  let currentWord: Maybe.Maybe<GameCellAndCoords[]> = undefined;
  for (const cellAndCoords of walk) {
    const {
      cell: {
        data: { letter },
      },
    } = cellAndCoords;
    if (letter) {
      if (!currentWord) {
        currentWord = [cellAndCoords];
      } else {
        currentWord.push(cellAndCoords);
      }
    } else {
      if (currentWord && currentWord.length > 1) {
        words.push(playedWordFromWalk(currentWord, direction));
        currentWord = undefined;
      }
      if (currentWord && currentWord.length === 1) {
        currentWord = undefined;
      }
    }
  }

  if (currentWord && currentWord.length > 1) {
    words.push(playedWordFromWalk(currentWord, direction));
  }

  return words;
}

function scanForWords(grid: GameGrid): PlayedWord[] {
  // we can get smarter about this, but for now walk every row and column
  // we can use the grid.walk method from all the 0,y and x,0 cells

  const words: PlayedWord[] = [];

  // iterate from 0..grid.rows.length - 1
  for (let y = 0; y < grid.dimensions.height; y++) {
    const walk = grid.walk({ x: 0, y: y }, "e");
    const detected = detectWords(walk, "e");
    words.push(...detected);
  }

  // iterate from 0..grid.rows[0].length - 1
  for (let x = 0; x < grid.dimensions.width; x++) {
    const walk = grid.walk({ x: x, y: 0 }, "s");
    const detected = detectWords(walk, "s");
    words.push(...detected);
  }

  return words;
}

function summarizePlacement(
  grid: GameGrid,
  nextGrid: GameGrid
): Result.Result<PlacementSummary> {
  const currentWords = scanForWords(grid);
  const nextWords = scanForWords(nextGrid);

  const wordsPlayed = nextWords.filter((word) => {
    return !currentWords.some((cw) => wordId(cw) === wordId(word));
  });

  const lettersPlayed: Letter[] = [];
  for (const [y, row] of grid.rows.entries()) {
    for (const [x, cell] of row.entries()) {
      const nextCell = nextGrid.rows[y][x];
      const nextLetter = nextCell.data.letter;
      const currentLetter = cell.data.letter;

      if (nextLetter && !currentLetter) {
        lettersPlayed.push(nextLetter);
      }
      if (nextLetter && currentLetter && nextLetter !== currentLetter) {
        return Result.failure(`Illegal letter change at (${x},${y})`);
      }
    }
  }

  return Result.success({
    wordsPlayed: wordsPlayed,
    lettersPlayed: lettersPlayed,
  });
}

function scoreValidPlacement(placementSummary: PlacementSummary): TurnSummary {
  return { ...placementSummary, pointsScored: 0 };
}

export function validateTurn(
  grid: GameGrid,
  nextGrid: GameGrid,
  rules: TurnRule[]
): TurnResult {
  const placementResult = summarizePlacement(grid, nextGrid);

  if (Result.isFailure(placementResult)) {
    return {
      kind: "invalid",
      message: placementResult.message || "Invalid turn",
    };
  }

  const placementSummary = placementResult.value;

  for (const rule of rules) {
    const result = rule(placementSummary);
    if (Result.isFailure(result)) {
      return { kind: "invalid", message: result.message || "Invalid turn" };
    }
  }

  return { kind: "valid", summary: scoreValidPlacement(placementSummary) };
}
