import { NextRandom, newPrng } from "../vendor/prng";
import { isBadWord } from "./bad_words";
import * as Maybe from "./maybe";

export const newRng = (seed: string): NextRandom => {
  return newPrng(seed);
};

export const setGlobalRng = (seed: string): void => {
  (window as any).nextRandom = newPrng(seed);
};

export const buildSeedFromWordList = (
  wordList: string[],
  nWords: number,
  random: NextRandom
): string => {
  let wordsLeft = nWords;
  const words = [];
  while (wordsLeft > 0) {
    const word = wordList[Math.floor(random() * wordList.length)];
    if (!isBadWord(word)) {
      words.push(word);
      wordsLeft--;
    }
  }
  return words.join("-");
};

export const getSeedForDisplay = (): Maybe.Maybe<string> => {
  const url = new URL(window.location.href);
  const seed = url.searchParams.get("seed");
  return Maybe.fromNullable(seed);
};

export const randomNewSeed = (wordList: string[], nWords: number): string => {
  return buildSeedFromWordList(wordList, nWords, Math.random);
};

export const newGameFromSeed = (seed: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set("seed", seed);
  window.location.href = url.toString();
};
