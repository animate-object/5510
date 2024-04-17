import { useCallback, useRef, useState } from "react";

export function useSet<T>(initialvalue: T[]) {
  // we'll store the values in a Set ref
  // to trigger re-renders when the values change,
  // we'll use a boolean state variable

  const [_, setSwitch] = useState<boolean>(false);

  const set = useRef(new Set<T>(initialvalue));

  const has = useCallback((value: T) => set.current.has(value), [_]);

  const add = useCallback(
    (value: T) => {
      set.current.add(value);
      setSwitch((prev) => !prev);
    },
    [_, setSwitch]
  );
  const addAll = useCallback(
    (values: T[]) => {
      values.forEach((value) => set.current.add(value));
      setSwitch((prev) => !prev);
    },
    [_, setSwitch]
  );

  const remove = useCallback(
    (value: T) => {
      set.current.delete(value);
      setSwitch((prev) => !prev);
    },
    [_, setSwitch]
  );

  return { has, add, addAll, remove } as const;
}
