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

export function chooseN<T>(array: T[], n: number): T[] {
  return shuffle(array).slice(0, n);
}
