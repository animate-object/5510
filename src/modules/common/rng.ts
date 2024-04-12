import { Maybe } from ".";
import { newPrng } from "../vendor/prng";
import * as Storage from "./localStorage";

type SeedGenerator = () => string;

const quickHashSeed = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString();
};

const newDateSeed = () => {
  return quickHashSeed(Date.now().toString());
};

const getSeedFromUrl = (): Maybe.Maybe<string> => {
  const url = new URL(window.location.href);
  const base64Seed = Maybe.fromNullable(url.searchParams.get("seed"));
  const decoded = Maybe.map(base64Seed, decodeURIComponent);
  return Maybe.map(decoded, atob);
};

const getOrSetRngSeed = (fallbackSeed: SeedGenerator = newDateSeed): string => {
  const key = "rngSeed";

  const existingSeed = Storage.get(key, null);
  if (existingSeed !== null) {
    return existingSeed;
  }
  const newSeed = fallbackSeed();

  Storage.set(key, newSeed);

  return newSeed;
};

export const setGlobalRng = () => {
  console.debug("Setting global RNG");

  const urlSeed = getSeedFromUrl();
  if (Maybe.isJust(urlSeed)) {
    Storage.set("rngSeed", urlSeed);
  }

  const seed = getOrSetRngSeed(undefined);
  (window as any).nextRandom = newPrng(seed);
};

setGlobalRng();

const newRngAndReload = () => {
  Storage.set("rngSeed", newDateSeed());
  window.location.reload();
};

(window as any).newRngAndReload = newRngAndReload;

export const getSeedForDisplay = () => {
  const rawSeed = Storage.get("rngSeed", "No seed set");
  return btoa(rawSeed);
};

export const clearSeedAndReload = () => {
  Storage.remove("rngSeed");
  const url = new URL(window.location.href);
  url.searchParams.delete("seed");
  console.debug({
    msg: "clearing seed",
    url: url.toString(),
    storageValue: Storage.get("rngSeed", "No seed set"),
  });

  window.location.href = url.toString();
  setGlobalRng();
};
