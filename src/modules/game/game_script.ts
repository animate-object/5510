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
    "Word Count": scoredWords.length,
    Words: scoredWords.map((w) => `${describePlayedWord(w.word)} → ${w.score}`),
  });

  return scoredWords.reduce((acc, { score }) => acc + score, 0);
}

const applyWordsPlayedBonus = (wordsPlayed: number): number => {
  // const multiplier = Math.max(0.5 * wordsPlayed, 1); // 1 for 1 or 2, 1.5 for 3, 2 for 4, 2.5 for 5, etc.
  // const multiplier = wordsPlayed; // 1 for 1, 2 for 2, 3 for 3, etc.
  // how will this influence the game though?
  // it should be rewording to play many words, but should it be more rewarding than playing a single high-scoring word?

  let multiplier: number;
  if (wordsPlayed === 1) {
    multiplier = 1;
  } else if (wordsPlayed === 2) {
    multiplier = 1.5;
  } else {
    multiplier = Math.min(wordsPlayed, 5) - 1; // 2 for 3, 3 for 4, 4 for 5
  }

  return multiplier;
};

const applyAllLettersPlayedBonus = (
  lettersPlayed: number,
  handSize: number,
  currentTurn: number
): number => {
  log("game.turn", {
    "Letters Played": lettersPlayed,
    "Hand Size": handSize,
    "Current Turn": currentTurn,
  });
  if (lettersPlayed < handSize) {
    return 0;
  }

  return 10 * currentTurn;
};

const scoreTurnNew = (
  wordsPlayed: PlayedWord[],
  nLettersPlayed: number,
  handSize: number,
  currentTurn: number
): number => {
  const baseScore = scoreTurn(wordsPlayed);
  const allLettersBonus = applyAllLettersPlayedBonus(
    nLettersPlayed,
    handSize,
    currentTurn
  );
  const nWordsBonus = applyWordsPlayedBonus(wordsPlayed.length);

  const withTurnBonuses = Math.floor(
    (baseScore + allLettersBonus) * nWordsBonus
  );

  log("game.turn", {
    "All Letters Bonus": allLettersBonus > 0 ? allLettersBonus : "No bonus",
    "Word Count Bonus": nWordsBonus > 1 ? `${nWordsBonus}x` : "No bonus",
    "Base Turn Score": baseScore,
    "Total turn score": withTurnBonuses,
  });

  return withTurnBonuses;
};

interface AttemptTurnArgs {
  hand: Hand;
  grid: GameGrid;
  wordSet: Set<string>;
  word: string;
  start: Coords;
  direction: "e" | "s";
  currentTurn: number;
}

export function attemptTurn({
  hand,
  grid,
  wordSet,
  word,
  start,
  direction,
  currentTurn,
}: AttemptTurnArgs): Result.Result<TurnResult> {
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
    const {
      summary: { wordsPlayed, lettersPlayed },
    } = turnResult;

    const score = scoreTurnNew(
      wordsPlayed,
      lettersPlayed.length,
      hand.letters.length,
      currentTurn
    );

    return Result.success({
      gameGrid: newGrid,
      pointsScored: score,
      wordsPlayed: wordsPlayed.length,
    });
  }
}
