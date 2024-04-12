import { SCORE_CONFIGS } from "./config/score";

export enum Letter {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  E = "E",
  F = "F",
  G = "G",
  H = "H",
  I = "I",
  J = "J",
  K = "K",
  L = "L",
  M = "M",
  N = "N",
  O = "O",
  P = "P",
  Q = "Q",
  R = "R",
  S = "S",
  T = "T",
  U = "U",
  V = "V",
  W = "W",
  X = "X",
  Y = "Y",
  Z = "Z",
}

export function baseScore(
  letter: Letter,
  scoreTable: Record<Letter, number> = SCORE_CONFIGS.DEFAULT
): number {
  return scoreTable[letter];
}

export const isVowel = (letter: Letter): boolean => {
  return "AEIOU".includes(letter);
};

export const isConsonant = (letter: Letter): boolean => {
  return !isVowel(letter);
};
