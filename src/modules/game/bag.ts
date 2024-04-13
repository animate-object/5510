import { Arrays } from "../common";
import { Letter, isConsonant, isVowel } from "./letter";
import { BAG_CONFIGS } from "./config/bag";

export interface Bag {
  drawn: {
    vowels: Letter[];
    consonants: Letter[];
  };
  left: {
    vowels: Letter[];
    consonants: Letter[];
  };
}

export interface Hand {
  size: number;
  letters: Letter[];
  handId: string;
}

export interface HandAndBag {
  hand: Hand;
  bag: Bag;
}

function draw(
  n: number,
  category: "vowels" | "consonants",
  bag: Bag
): [Letter[], Bag] {
  const { drawn, left } = bag;

  const [drawnLetters, remainingLetters] = Arrays.chooseN(left[category], n);

  const newBag = {
    drawn: {
      ...drawn,
      [category]: [...drawn[category], ...drawnLetters],
    },
    left: {
      ...left,
      [category]: remainingLetters,
    },
  };

  return [drawnLetters, newBag];
}

function drawVowels(n: number, bag: Bag): [Letter[], Bag] {
  return draw(n, "vowels", bag);
}

function drawConsonants(n: number, bag: Bag): [Letter[], Bag] {
  return draw(n, "consonants", bag);
}

export function newBag(
  letterCounts: Record<Letter, number> = BAG_CONFIGS.BETTER
): Bag {
  const { vowels, consonants } = Object.entries(letterCounts).reduce(
    (acc, [letter, count]) => {
      return {
        ...acc,
        vowels: [
          ...acc.vowels,
          ...(isVowel(letter as Letter)
            ? Array(count).fill(letter as Letter)
            : []),
        ],
        consonants: [
          ...acc.consonants,
          ...(isConsonant(letter as Letter)
            ? Array(count).fill(letter as Letter)
            : []),
        ],
      };
    },
    { vowels: [], consonants: [] } as Bag["left"]
  );
  const letterData: Bag = {
    drawn: {
      vowels: Arrays.empty<Letter>(),
      consonants: Arrays.empty<Letter>(),
    },
    left: { vowels, consonants },
  };

  return {
    ...letterData,
  };
}

const VOWEL_DIST = [1, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3];

export function drawHand(
  total: number,
  bag: Bag,
  vowelDistribution: number[] = VOWEL_DIST
): [Hand, Bag] {
  let vowelCount = Arrays.chooseOne(vowelDistribution);
  if (vowelCount > total) {
    console.warn("Vowel count exceeds total");
    vowelCount = Math.ceil(total * 0.6);
  }
  const consonantCount = total - vowelCount;
  const [vowels, afterVowels] = drawVowels(vowelCount, bag);
  const [consonants, newBag] = drawConsonants(consonantCount, afterVowels);

  let drawnLetters = [...vowels, ...consonants];
  drawnLetters.sort();

  const hand = {
    size: total,
    letters: [...drawnLetters],
    handId: `hand-${drawnLetters.join("")}`,
  };
  return [hand, newBag];
}
