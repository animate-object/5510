// A simple feature flag system

export enum Flags {
  more_bonus_tiles = "more_bonus_tiles",
  new_scoring_rules = "new_scoring_rules",
}

// maybe someday will take additional
// inputs
type FlagRuleData = {};
type FlagRule = (data: FlagRuleData) => boolean;
type PartialFlags = Partial<Record<Flags, boolean>>;

function afterLocalDate(y: number, m: number, d: number): FlagRule {
  return (_data): boolean => {
    const now = new Date();
    const then = new Date(y, m - 1, d);

    console.log({
      now,
      then,
      past: now > then,
    });
    return now > then;
  };
}

const Rules: Record<Flags, FlagRule> = {
  [Flags.more_bonus_tiles]: afterLocalDate(2024, 4, 15),
  [Flags.new_scoring_rules]: afterLocalDate(2024, 4, 15),
};

function flagStateFromQuery(query: URLSearchParams): PartialFlags {
  const fromQuery = (Object.keys(Flags) as Flags[]).reduce<PartialFlags>(
    (acc, flag) => {
      acc[flag] = query.has(flag);
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

  console.log(finalFlags);

  log("config.flags", finalFlags);

  return finalFlags;
}
