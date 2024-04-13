import { Letter } from "../letter";

const MANY_LETTERS: Record<Letter, number> = Object.keys(Letter).reduce(
  (acc: Record<Letter, number>, letter) => {
    acc[letter as Letter] = 10;
    return acc;
  },
  {} as Record<Letter, number>
);

const BETTER_LETTERS: Record<Letter, number> = {
  A: 5,
  E: 5,
  I: 5,
  O: 5,
  U: 5,

  B: 4,
  C: 2,
  D: 4,
  F: 4,
  G: 4,
  H: 4,
  J: 1,
  K: 3,
  L: 5,
  M: 4,
  N: 5,
  P: 3,
  Q: 1,
  R: 5,
  S: 5,
  T: 5,
  V: 2,
  W: 3,
  X: 1,
  Y: 3,
  Z: 1,
};

export const EVEN_BETTER_LETTERS: Record<Letter, number> = {
  A: 6,
  E: 6,
  I: 6,
  O: 6,
  U: 4,

  B: 4,
  C: 2,
  D: 4,
  F: 4,
  G: 4,
  H: 4,
  J: 1,
  K: 3,
  L: 5,
  M: 4,
  N: 5,
  P: 3,
  Q: 2,
  R: 5,
  S: 5,
  T: 5,
  V: 2,
  W: 3,
  X: 2,
  Y: 3,
  Z: 2,
};

export const BAG_CONFIGS: Record<string, Record<Letter, number>> = {
  TEN_ALL: MANY_LETTERS,
  BETTER: BETTER_LETTERS,
  DEFAULT: EVEN_BETTER_LETTERS,
};
