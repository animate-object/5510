import { useContext } from "react";
import { DirectionArrowContext } from "./DirectionArrowProvider";
import { Geom } from "../common";

interface Props {
  snapTo?: number;
}

export const DirectionArrow = ({ snapTo }: Props): JSX.Element => {
  const { start, end } = useContext(DirectionArrowContext);

  if (!start || !end) {
    return <></>;
  }

  const displayEnd = snapTo ? Geom.snapEnd(start, end, snapTo) : end;

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <defs>
        <marker
          id="arrow"
          markerWidth="10"
          markerHeight="10"
          refX="8.7"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" />
        </marker>
      </defs>
      <line
        stroke="black"
        strokeWidth="2"
        x1={start[0]}
        y1={start[1]}
        x2={displayEnd[0]}
        y2={displayEnd[1]}
        markerEnd="url(#arrow)"
      />
    </svg>
  );
};
