// react context that fetches flag state ONCE
// then exposes a getFlag function for consumers

import React, { useEffect, useRef } from "react";
import { Flags, getFlagState } from "./flags";

interface FlagContextValue {
  getFlag: (flag: Flags) => boolean;
}

export const FlagContext = React.createContext<FlagContextValue>({
  getFlag: () => false,
});

interface Props {
  children: React.ReactNode;
}

export const FlagProvider = ({ children }: Props) => {
  const flagState = useRef<Record<Flags, boolean>>(getFlagState());
  useEffect(() => {
    (window as any).getFlag = (flag: Flags) => flagState.current[flag];
  }, []);

  const getFlag = (flag: Flags) => {
    return flagState.current[flag];
  };

  return (
    <FlagContext.Provider value={{ getFlag }}>{children}</FlagContext.Provider>
  );
};
