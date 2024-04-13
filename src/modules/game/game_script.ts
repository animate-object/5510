import { Result } from "../common";
import { Coords, setTile, setTilesInGrid } from "../grid";
import { Hand } from "./bag";
import { GameGrid, PlayedWord, TurnRule, describePlayedWord } from "./game";
import { Bonus, letterTileFromChar } from "./tile_data";
import { validateTurn } from "./turn_processing";
import { baseScore } from "./letter";

const atLeastOneWordRule: TurnRule = (summary) => {
  const { wordsPlayed, lettersPlayed } = summary;
  if (wordsPlayed.length === 0) {
    if (lettersPlayed) {
      // edge case, one letter is played and no words are detected
      // but doesn't fail other rules...
      return Result.failure(`${lettersPlayed[0]} is not in the word list.`);
    }
    return Result.failure("No words played");
  } else {
    return Result.success(undefined);
  }
};

const onlyValidWordsRuleFactory = (wordSet: Set<string>): TurnRule => {
  return (summary) => {
    const { wordsPlayed } = summary;
    const firstInvalidWord = wordsPlayed.find(
      (word) => !wordSet.has(word.raw.toLowerCase())
    );

    if (firstInvalidWord != null) {
      return Result.failure(`"${firstInvalidWord.raw}" isn't in the word list`);
    } else {
      return Result.success(undefined);
    }
  };
};

const onlyLettersInHandFactory = (hand: Hand): TurnRule => {
  return (summary) => {
    const { lettersPlayed } = summary;
    const { letters: lettersInHand } = hand;
    const firstMissingLetter = lettersPlayed.find(
      (letter) => !lettersInHand.includes(letter)
    );
    if (firstMissingLetter != null) {
      return Result.failure(`No (${firstMissingLetter}) to play!`);
    } else {
      return Result.success(undefined);
    }
  };
};

interface TurnResult {
  gameGrid: GameGrid;
  pointsScored: number;
  wordsPlayed: number;
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
  const scoredWords = wordsPlayed.map((word) => ({
    word: word,
    score: scoreWord(word),
  }));

  log("game.turn", {
    wordCount: scoredWords.length,
    words: scoredWords.map((w) => `${describePlayedWord(w.word)} → ${w.score}`),
  });

  return scoredWords.reduce((acc, { score }) => acc + score, 0);
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
    return Result.failure(`No room to play "${word}"`);
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
    atLeastOneWordRule,
  ]);

  if (turnResult.kind === "invalid") {
    return Result.failure(turnResult.message);
  } else {
    const score = scoreTurn(turnResult.summary.wordsPlayed);

    return Result.success({
      gameGrid: newGrid,
      pointsScored: score,
      wordsPlayed: turnResult.summary.wordsPlayed.length,
    });
  }
}
