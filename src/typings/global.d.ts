declare global {
    var nextRandom: () => number;
    var newRngAndReload = (seed: string | undefined) => null;
}

export {}