import { NextRandom } from "../vendor/prng";

export function array<T>(defaultValue: T, length: number): T[] {
  return Array.from({ length }, () => defaultValue);
}

export function empty<T>(): T[] {
  return [];
}

export function chooseOne<T>(array: T[], random: NextRandom = nextRandom): T {
  return array[Math.floor(random() * array.length)];
}

export function shuffle<T>(array: T[]): T[] {
  return array.sort(() => nextRandom() - 0.5);
}

// Shuffling really burns through the RnG
// offering more chances for non-determinism
// export function chooseNOld<T>(array: T[], n: number): T[] {
//   return shuffle(array).slice(0, n);
// }

export function chooseN<T>(array: T[], n: number): [T[], T[]] {
  let remaining = [...array];
  let result = [];
  while (result.length < n) {
    const idx = Math.floor(nextRandom() * remaining.length);
    result.push(remaining[idx]);
    remaining = [...remaining.slice(0, idx), ...remaining.slice(idx + 1)];
  }
  return [result, remaining];
}
