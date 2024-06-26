import { Letter } from "../letter";

const DEFAULT_LETTER_SCORES: Record<Letter, number> = {
  A: 1,
  E: 1,
  I: 1,
  O: 1,
  U: 2,

  B: 3,
  C: 5,
  D: 2,
  F: 3,
  G: 3,
  H: 3,
  J: 6,
  K: 5,
  L: 1,
  M: 2,
  N: 1,
  P: 3,
  Q: 8,
  R: 1,
  S: 1,
  T: 1,
  V: 5,
  W: 4,
  X: 7,
  Y: 4,
  Z: 8,
};

const NEXT_LETTER_SCORES: Record<Letter, number> = {
  A: 1,
  E: 1,
  I: 1,
  O: 1,
  U: 2,

  B: 3,
  C: 6,
  D: 2,
  F: 3,
  G: 3,
  H: 3,
  J: 7,
  K: 5,
  L: 1,
  M: 2,
  N: 1,
  P: 3,
  Q: 8,
  R: 1,
  S: 1,
  T: 1,
  V: 5,
  W: 4,
  X: 7,
  Y: 4,
  Z: 8,
};

export const SCORE_CONFIGS: Record<string, Record<Letter, number>> = {
  DEFAULT: NEXT_LETTER_SCORES,
  PREV_DEFAULT1: DEFAULT_LETTER_SCORES,
};
