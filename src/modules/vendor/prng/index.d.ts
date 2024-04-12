type NextRandom = () => number;

type NewPrng = (seed: number | string | undefined) => NextRandom;

declare newPrng: NewPrng

export { newPrng };
export type { NextRandom, NewPrng };