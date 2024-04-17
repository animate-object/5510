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

function cheatDraw(
  n: number,
  category: "vowels" | "consonants",
  bag: Bag,
  deduplicationFactor: number = 0.7
): [Letter[], Letter[]] {
  let drawnLetters: Letter[] = [];
  let remainingLetters: Letter[] = bag.left[category];

  let putBackLetters: Letter[] = [];

  let iterations = 0;

  while (drawnLetters.length < n) {
    iterations++;
    const [drawn_, remaining] = Arrays.chooseN<Letter>(remainingLetters, 1);
    const drawn = drawn_[0];

    const nDuplicatesInDrawn = drawnLetters.filter((l) => l === drawn).length;

    // Since the prng can become non-deterministic after many calls,
    // we'll short circuit here -- basically if we've determined once
    // that a letter should be put back, we'll always put it back
    if (putBackLetters.includes(drawn)) {
      log("game.hands", {
        "Skipping previously skipped": drawn,
        "Count of duplicates": nDuplicatesInDrawn,
      });
      continue;
    }

    if (nDuplicatesInDrawn > 0) {
      console.log("Examing duplicate");

      const randomValue = nextRandom();
      const threshold = Math.pow(deduplicationFactor, nDuplicatesInDrawn);

      const keepDuplicate = threshold > randomValue;

      if (keepDuplicate) {
        console.log("keeping duplicate");
        log("game.hands", {
          "Keep duplicate": drawn,
          Threshold: threshold,
          "Random value": randomValue,
          "Count of duplicates": nDuplicatesInDrawn,
        });
        drawnLetters.push(drawn);
        remainingLetters = remaining;
      } else {
        console.log("skipping duplicate");
        log("game.hands", {
          "Skipping duplicate": drawn,
          Threshold: threshold,
          "Random value": randomValue,
          "Count of duplicates": nDuplicatesInDrawn,
        });
        putBackLetters.push(drawn);
      }
    } else {
      drawnLetters.push(drawn);
      remainingLetters = remaining;
    }
    if (iterations > 200) {
      console.warn("Infinite loop detected");
      break;
    }
  }

  return [drawnLetters, remainingLetters];
}

function draw(
  n: number,
  category: "vowels" | "consonants",
  bag: Bag,
  useCheatDraw: boolean = false
): [Letter[], Bag] {
  const { drawn, left } = bag;

  const [drawnLetters, remainingLetters] = useCheatDraw
    ? cheatDraw(n, category, bag)
    : Arrays.chooseN(left[category], n);

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

function drawVowels(
  n: number,
  bag: Bag,
  useCheatDraw: boolean
): [Letter[], Bag] {
  return draw(n, "vowels", bag, useCheatDraw);
}

function drawConsonants(
  n: number,
  bag: Bag,
  useCheatDraw: boolean = false
): [Letter[], Bag] {
  return draw(n, "consonants", bag, useCheatDraw);
}

export function newBag(
  letterCounts: Record<Letter, number> = BAG_CONFIGS.DEFAULT
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

const VOWEL_DIST = [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3];

export function drawHand(
  total: number,
  bag: Bag,
  vowelDistribution: number[] = VOWEL_DIST,
  useCheatDrawForVowels: boolean = false,
  useCheatDrawForConsonants: boolean = false
): [Hand, Bag] {
  let vowelCount = Arrays.chooseOne(vowelDistribution);
  if (vowelCount > total) {
    console.warn("Vowel count exceeds total");
    vowelCount = Math.ceil(total * 0.6);
  }
  const consonantCount = total - vowelCount;
  const [vowels, afterVowels] = drawVowels(
    vowelCount,
    bag,
    useCheatDrawForVowels
  );
  const [consonants, newBag] = drawConsonants(
    consonantCount,
    afterVowels,
    useCheatDrawForConsonants
  );

  let drawnLetters = [...vowels, ...consonants];
  drawnLetters.sort();

  const hand = {
    size: total,
    letters: [...drawnLetters],
    handId: `hand-${drawnLetters.join("")}`,
  };
  return [hand, newBag];
}
