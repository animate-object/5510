declare global {
  type GameCats =
    | "game.hands"
    | "game.seed"
    | "game.init"
    | "game.turn"
    | "game.stat";
  export type LoggablePrim = string | number | boolean | null | undefined;
  export type LogDictEntry = LoggablePrim | LoggablePrim[];
  export type LogDict = Record<string, LogDictEntry>;
  export type Loggable = LoggablePrim | LogDict;
  export type GlobalLogCat = "rng" | GameCats;

  export type LogCategoryEntry = Loggable[];
  export type LogData = Record<GlobalLogCat, LogCategoryEntry>;

  var nextRandom: () => number;
  var newRngAndReload = (seed: string | undefined) => null;
  var log: (cat: GlobalLogCat, data: Loggable) => void;
  var getLog: () => LogData;
  var getLogEntry: (cat: GlobalLogCat) => LogCategoryEntry;
  var countLog: (cat: GlobalLogCat | undefined) => number;
}

export {};
