/// Utilities for initializing game state

import { Arrays, Maybe, Result } from "../common";
import {
  buildSeedFromWordList,
  newGameFromSeed,
  newRng,
  randomNewSeed,
  setGlobalRng,
} from "../common/rng";
import { Grid, newGrid, setTile, setTileInGrid } from "../grid";
import { HandAndBag, drawHand, newBag } from "./bag";
import { TileData, emptyTile, randomBonusTile } from "./tile_data";
import { fetchWordList } from "./word_list_retrieval";

export const DEFAULT_GRID_SIZE = 6;

const BONUS_TILE_COUNT_BAG = [
  2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 6, 6, 7,
];

export const initialGrid = (
  width: number = DEFAULT_GRID_SIZE,
  height: number = DEFAULT_GRID_SIZE,
  bonusTileCount: number = Arrays.chooseOne(BONUS_TILE_COUNT_BAG)
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

// initialize everything!
// need one function (composed of many) to:
// - fetch word bank
// - initialize and set global rng
// - initialize grid
// - initialize bag
// - draw all hands
// I'm thinking this function can run in a useEffect in App.tsx
// and set all the state variables
// until this function is done, the app should show a loading screen
//
// I want to use this approach in part because I want to use the word
// bank as input to the rng seed

// let's define component functions and contracts

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
  const todaysDate = new Date().toISOString().split("T")[0];
  const tmpRng = newRng(todaysDate);
  return buildSeedFromWordList(wordList, nWords, tmpRng);
};

const initializeRng = (wordList: string[], nWords: number): void => {
  const todaysSeed = getTimeBasedSeed(wordList, nWords);
  const seedFromUrl = getSeedFromUrl();

  const willUseMsg = !!seedFromUrl ? "Seed from URL" : "Today's seed";

  console.debug(
    "Seed info:\n" +
      `    Today's seed: ${todaysSeed}\n` +
      `    Seed from URL: ${seedFromUrl}` +
      `    Will use ${willUseMsg}       `
  );

  if (seedFromUrl) {
    setGlobalRng(seedFromUrl);
  } else {
    window.location.search = `?seed=${todaysSeed}`;
  }
};

export const drawAllHands = (
  nTurns: number,
  handSize: number
): HandAndBag[] => {
  const hands = [];
  let bag = newBag();

  for (let i = 0; i < nTurns; i++) {
    const [hand, updatedBag] = drawHand(handSize, bag);
    hands.push({ hand, bag: updatedBag });
    bag = updatedBag;
  }

  return hands;
};

interface InitState {
  wordList: string[];
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
}

const DEFAULTS: InitArgs = {
  gridSize: 6,
  nTurns: 5,
  handSize: 5,
  newSeedWordCount: 5,
};

export const initializeGameState = async ({
  gridSize,
  nTurns,
  handSize,
  newSeedWordCount,
}: InitArgs = DEFAULTS): Promise<Result.Result<InitState>> => {
  const wordListResult = await fetchWordList();
  if (Result.isFailure(wordListResult)) {
    return wordListResult;
  }

  const wordList = wordListResult.value;
  initializeRng(wordList, newSeedWordCount);
  const grid = initialGrid(gridSize, gridSize);
  const handAndBagForEachTurn = drawAllHands(nTurns, handSize);

  return Result.success({
    wordList,
    grid,
    handAndBagForEachTurn,
    nextGame: () => {
      const seed = randomNewSeed(wordList, newSeedWordCount);
      newGameFromSeed(seed);
    },
  });
};
