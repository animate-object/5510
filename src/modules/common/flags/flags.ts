// A simple feature flag system

export enum Flags {
  cheat_draw_vowels = "cheat_draw_vowels",
  cheat_draw_consonants = "cheat_draw_consonants",
  emoji_share = "emoji_share",
}

const QueryFlagMapping: Partial<Record<Flags, string>> = {
  [Flags.cheat_draw_vowels]: "cdv",
  [Flags.cheat_draw_consonants]: "cdc",
  [Flags.emoji_share]: "es",
};

// maybe someday will take additional
// inputs
type FlagRuleData = {};
type FlagRule = (data: FlagRuleData) => boolean;
type PartialFlags = Partial<Record<Flags, boolean>>;

function afterLocalDate(y: number, m: number, d: number): FlagRule {
  return (_data): boolean => {
    const now = new Date();
    const then = new Date(y, m - 1, d);
    return now > then;
  };
}

const Rules: Record<Flags, FlagRule> = {
  [Flags.cheat_draw_vowels]: () => true,
  [Flags.cheat_draw_consonants]: afterLocalDate(2024, 4, 18),
  [Flags.emoji_share]: () => false,
};

function flagStateFromQuery(query: URLSearchParams): PartialFlags {
  const fromQuery = (Object.keys(Flags) as Flags[]).reduce<PartialFlags>(
    (acc, flag) => {
      const altKey = QueryFlagMapping[flag];
      acc[flag] = query.has(flag) || (!!altKey ? query.has(altKey) : false);
      return acc;
    },
    {}
  );
  return fromQuery;
}

function flagsFromRules(rules: Record<Flags, FlagRule>): PartialFlags {
  return (Object.keys(rules) as Flags[]).reduce<PartialFlags>((acc, flag) => {
    acc[flag] = rules[flag]({});
    return acc;
  }, {});
}

function emptyFlagState(): Record<Flags, boolean> {
  return (Object.keys(Flags) as Flags[]).reduce<Record<Flags, boolean>>(
    (acc, flag) => {
      acc[flag] = false;
      return acc;
    },
    {} as Record<Flags, boolean>
  );
}

export function getFlagState(): Record<Flags, boolean> {
  const query = new URLSearchParams(window.location.search);
  const queryFlags = flagStateFromQuery(query);
  const ruleFlags = flagsFromRules(Rules);

  const finalFlags = {
    ...emptyFlagState(),
    ...ruleFlags,
    ...queryFlags,
  };

  log("config.flags", finalFlags);

  return finalFlags;
}
