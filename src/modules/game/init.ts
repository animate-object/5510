/// Utilities for initializing game state

import { Arrays, Maybe, Result, allPermutations } from "../common";
import { initGlobalLogger } from "../common/log";
import {
  buildSeedFromWordList,
  newGameFromSeed,
  newRng,
  randomNewSeed,
  setGlobalRng,
} from "../common/rng";
import { Grid, newGrid, setTile, setTileInGrid } from "../grid";
import { HandAndBag, drawHand, newBag } from "./bag";
import { BAG_CONFIGS } from "./config/bag";
import { SCORE_CONFIGS } from "./config/score";
import { Letter } from "./letter";
import { TileData, emptyTile, randomBonusTile } from "./tile_data";
import { fetchWordList } from "./word_list_retrieval";

export const DEFAULT_GRID_SIZE = 6;

const OLD_BONUS_TILE_COUNT_BAG = [
  2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 7,
];

const BONUS_TILE_COUNT_BAG = [3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 7];

export const initialGrid = (
  width: number = DEFAULT_GRID_SIZE,
  height: number = DEFAULT_GRID_SIZE,
  bonusTileCount: number = Arrays.chooseOne(
    getFlag("more_bonus_tiles")
      ? BONUS_TILE_COUNT_BAG
      : OLD_BONUS_TILE_COUNT_BAG
  )
): Grid<TileData> => {
  let grid = newGrid(width, height, emptyTile);
  let bonusTilesLeftToPlace = bonusTileCount;

  while (bonusTilesLeftToPlace > 0) {
    const x = Math.floor(nextRandom() * width);
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

const getSeedFromUrl = (): Maybe.Maybe<string> => {
  const url = new URL(window.location.href);
  const maybeSeed = Maybe.fromNullable(url.searchParams.get("seed"));
  return Maybe.map(maybeSeed, (seed) => {
    if (decodeURIComponent(seed) !== seed) {
      // trying to remove a source of cross-browser non-determinism 😮‍💨
      console.warn("Non ASCII seed detected, ignoring");
      window.location.search = "";
      return undefined;
    }
    return seed;
  });
};

const getTimeBasedSeed = (wordList: string[], nWords: number): string => {
  const todayLocalDate = new Date().toLocaleDateString();
  const tmpRng = newRng(todayLocalDate);
  return buildSeedFromWordList(wordList, nWords, tmpRng);
};

const initializeRng = (wordList: string[], nWords: number): void => {
  const todaysSeed = getTimeBasedSeed(wordList, nWords);
  const seedFromUrl = getSeedFromUrl();

  const willUseMsg = !!seedFromUrl ? "Seed from URL" : "Today's seed";

  console.debug(
    "Seed info:\n" +
      `    Today's seed: ${todaysSeed}\n` +
      `    Seed from URL: ${seedFromUrl}\n` +
      `    Will use ${willUseMsg}       `
  );
  log("game.seed", {
    "today's seed": todaysSeed,
    "seed from url": seedFromUrl,
  });

  if (seedFromUrl) {
    setGlobalRng(seedFromUrl);
  } else {
    const url = new URL(window.location.href);
    url.searchParams.set("seed", todaysSeed);
    window.location.href = url.toString();
  }
};

export const drawAllHands = (
  nTurns: number,
  handSize: number
): HandAndBag[] => {
  const hands = [];
  let bag = newBag();

  log("game.hands", {
    State: "Initial",
    "Letter Count": bag.left.vowels.length + bag.left.consonants.length,
    "Vowel Count": bag.left.vowels.length,
    "Consonant Count": bag.left.consonants.length,
  });

  for (let i = 0; i < nTurns; i++) {
    const [hand, updatedBag] = drawHand(handSize, bag);
    hands.push({ hand, bag: updatedBag });
    bag = updatedBag;
    log("game.hands", `Draw #${i + 1} → ${hand.handId}`);
    log("game.hands", {
      State: `After Draw ${i + 1}`,
      "Vowels remaining": updatedBag.left.vowels.length,
      "Consonants remaining": updatedBag.left.consonants.length,
      "Total remaining":
        updatedBag.left.vowels.length + updatedBag.left.consonants.length,
    });
  }

  return hands;
};

interface InitState {
  wordSet: Set<string>;
  grid: Grid<TileData>;
  handAndBagForEachTurn: HandAndBag[];
  nextGame: () => void;
}

interface InitArgs {
  // how many 'boxes' long is each side of the grid
  // e.g. 5 means a 5x5 25-cell grid
  gridSize: number;
  // how many turns the player gets
  nTurns: number;
  // how many tiles are in the player's hand
  handSize: number;
  // how many words are in a seed
  newSeedWordCount: number;

  scoreConfig: Record<Letter, number>;
  bagConfig: Record<Letter, number>;
}

const DEFAULTS: InitArgs = {
  gridSize: 6,
  nTurns: 5,
  handSize: 5,
  newSeedWordCount: 5,
  bagConfig: BAG_CONFIGS.DEFAULT,
  scoreConfig: SCORE_CONFIGS.DEFAULT,
};

export const allWordsForLetters = (
  string: string,
  wordSet: Set<string>
): Record<number, string[]> => {
  const words = allPermutations(string).filter((w) => wordSet.has(w));

  return words.reduce<Record<number, string[]>>((acc, word) => {
    acc[word.length] = [...(acc[word.length] || []), word];
    return acc;
  }, {});
};

export const initDevTools = (wordSet: Set<string>): void => {
  (window as any).wordSet = wordSet;
  (window as any).allWordsForLetters = (string: string) =>
    allWordsForLetters(string, wordSet);
  (window as any).printWords = (string: string) => {
    const allWords = allWordsForLetters(string, wordSet);
    const wordLengths = Object.keys(allWords)
      .map(Number)
      .sort((a, b) => a - b);
    let output = "Valid words of length...\n";
    for (const length of wordLengths) {
      output += `\t${length}: ${allWords[length].join(", ")}\n`;
    }
    console.info(output);
  };
};

export const initializeGameState = async ({
  gridSize,
  nTurns,
  handSize,
  newSeedWordCount,
  ...configs
}: InitArgs = DEFAULTS): Promise<Result.Result<InitState>> => {
  const wordListResult = await fetchWordList();
  if (Result.isFailure(wordListResult)) {
    return wordListResult;
  }

  const wordList = wordListResult.value;
  initializeRng(wordList, newSeedWordCount);

  const grid = initialGrid(gridSize, gridSize);
  const handAndBagForEachTurn = drawAllHands(nTurns, handSize);

  log("config.scores", configs.scoreConfig);
  log("config.bag", configs.bagConfig);

  log("config.wordList", {
    "Word Count": wordList.length,
    ...[6, 5, 4, 3, 2].reduce<Record<string, number>>((acc, n) => {
      acc[`${n} Letter Words`] = wordList.filter((w) => w.length === n).length;
      return acc;
    }, {}),
  });

  const wordSet = new Set(wordList);
  initDevTools(wordSet);

  return Result.success({
    wordSet,
    grid,
    handAndBagForEachTurn,
    nextGame: () => {
      const seed = randomNewSeed(wordList, newSeedWordCount);
      newGameFromSeed(seed);
    },
  });
};
