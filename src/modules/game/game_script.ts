import { Result } from "../common";
import { Coords, setTile, setTilesInGrid } from "../grid";
import { Hand } from "./bag";
import { GameGrid, PlayedWord, TurnRule } from "./game";
import { Bonus, letterTileFromChar } from "./tile_data";
import { validateTurn } from "./turn_processing";
import { baseScore } from "./letter";

interface TurnAttemptArgs {
  word: string;
  start: Coords;
  direction: "e" | "s";
}

interface GameState {
  grid: GameGrid;
  wordSet: Set<string>;
  hand: Hand;
}

const onlyValidWordsRuleFactory = (wordSet: Set<string>): TurnRule => {
  return (summary) => {
    const { wordsPlayed } = summary;
    console.debug("Played words", wordsPlayed);

    const firstInvalidWord = wordsPlayed.find(
      (word) => !wordSet.has(word.raw.toLowerCase())
    );

    if (firstInvalidWord != null) {
      return Result.failure(`Invalid word: "${firstInvalidWord.raw}"`);
    } else {
      return Result.success(undefined);
    }
  };
};

const onlyLettersInHandFactory = (hand: Hand): TurnRule => {
  return (summary) => {
    const { lettersPlayed } = summary;
    const { letters: lettersInHand } = hand;
    console.log({
      lettersPlayed,
      lettersInHand,
    });
    const firstMissingLetter = lettersPlayed.find(
      (letter) => !lettersInHand.includes(letter)
    );
    if (firstMissingLetter != null) {
      return Result.failure(`Letter "${firstMissingLetter}" not in hand.`);
    } else {
      return Result.success(undefined);
    }
  };
};

interface TurnResult {
  gameGrid: GameGrid;
  pointsScored: number;
}

function scoreWord(word: PlayedWord): number {
  let score = 0;
  let wordMultiplier = 1;
  const { word: letters, bonuses } = word;

  letters.forEach((letter, i) => {
    const bonus = bonuses[i];
    const letterMultiplier: number =
      bonus === Bonus.DoubleLetter ? 2 : bonus === Bonus.TripleLetter ? 3 : 1;
    if (bonus === Bonus.DoubleWord) {
      wordMultiplier *= 2;
    } else if (bonus === Bonus.TripleWord) {
      wordMultiplier *= 3;
    }
    score += baseScore(letter) * letterMultiplier;
  });
  return score * wordMultiplier;
}

function scoreTurn(wordsPlayed: PlayedWord[]): number {
  return wordsPlayed.reduce((acc, word) => acc + scoreWord(word), 0);
}

export function attemptTurn(
  hand: Hand,
  grid: GameGrid,
  wordSet: Set<string>,
  word: string,
  start: Coords,
  direction: "e" | "s"
): Result.Result<TurnResult> {
  if (word == null || word === "") {
    return Result.failure("No word entered");
  }
  const wordLength = word.length;
  const availableTiles = grid.walk(start, direction);
  if (availableTiles.length < wordLength) {
    return Result.failure(`Not enough tiles to spell "${word}"`);
  }

  const tileSetters = word.split("").map((letter, i) => {
    const { coords } = availableTiles[i];
    return setTile(coords.x, coords.y, letterTileFromChar(letter));
  });

  const newGridResult = setTilesInGrid(grid, tileSetters);
  if (Result.isFailure(newGridResult)) {
    return newGridResult;
  }
  const newGrid = newGridResult.value;

  const turnResult = validateTurn(grid, newGrid, [
    onlyLettersInHandFactory(hand),
    onlyValidWordsRuleFactory(wordSet),
  ]);

  if (turnResult.kind === "invalid") {
    return Result.failure(turnResult.message);
  } else {
    const score = scoreTurn(turnResult.summary.wordsPlayed);

    return Result.success({
      gameGrid: newGrid,
      pointsScored: score,
    });
  }
}
