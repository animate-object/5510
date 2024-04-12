import React, { useCallback, useRef } from "react";
import { Angle, Geom } from "../common";

export type ClientPoint = [number, number];

interface DirectionArrowData {
  start: ClientPoint | null;
  end: ClientPoint | null;
  getStart: () =>  ClientPoint | null;
  getEnd: () => ClientPoint | null;
  getAngle: () => Angle | null;
  setStart: (point: ClientPoint | null) => void;
  setEnd: (point: ClientPoint | null) => void;
}

export const DirectionArrowContext = React.createContext<DirectionArrowData>({
  start: null,
  end: null,
  getStart: () => null,
  getEnd: () => null,
  getAngle: () => null,
  setStart: () => {},
  setEnd: () => {},
});

interface Props {
  children: React.ReactNode;
}

export function DirectionArrowProvider({ children }: Props): JSX.Element {
  const [_start, _setStart] = React.useState<ClientPoint | null>(null);
  const [_end, _setEnd] = React.useState<ClientPoint | null>(null);

  const start = useRef<ClientPoint | null>(null);
  const end = useRef<ClientPoint | null>(null);

  const setStart = (point: ClientPoint | null) => {
    start.current = point;
    _setStart(point);
  }

  const setEnd = (point: ClientPoint | null) => {
    end.current = point;
    _setEnd(point);
  }

  const getStart = useCallback(() => start.current, []);
  const getEnd = useCallback(() => end.current, []);
  const getAngle = useCallback(() => {
    if (start.current == null || end.current == null) {
      return null;
    }
    return Geom.angleBetween(start.current, end.current);
  }, []);

  return (
    <DirectionArrowContext.Provider
      value={{
        start: _start,
        end: _end,
        getStart,
        getEnd,
        getAngle,
        setStart,
        setEnd,
      }}
    >
      {children}
    </DirectionArrowContext.Provider>
  );
}
