export type Point = [number, number];

export interface Angle {
  magnitude: number;
  unit: "rad" | "deg";
}

export function toDegrees(angle: Angle): Angle {
  if (angle.unit === "deg") {
    return angle;
  }
  const asDegrees = (angle.magnitude * 180) / Math.PI;
  const normalized = asDegrees < 0 ? asDegrees + 360 : asDegrees;
  return { magnitude: normalized, unit: "deg" };
}

export function point(x: number, y: number): Point {
  return [x, y];
}

export function addPoints(a: Point, b: Point): Point {
  return [a[0] + b[0], a[1] + b[1]];
}

export function subtractPoints(a: Point, b: Point): Point {
  return [a[0] - b[0], a[1] - b[1]];
}

export function distance(a: Point, b: Point): number {
  const [dx, dy] = subtractPoints(a, b);
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleBetween(a: Point, b: Point): Angle {
  const [dx, dy] = subtractPoints(b, a);
  const magnitude = Math.atan2(dy, dx);
  return { magnitude, unit: "rad" };
}

export function snapAngle(angle: Angle, snap: number): Angle {
  const snappedMagnitude = Math.round(angle.magnitude / snap) * snap;
  return { magnitude: snappedMagnitude, unit: "rad" };
}

export function snapEnd(
  start: Point,
  end: Point,
  snap: number = Math.PI / 12
): Point {
  const angle = angleBetween(start, end);
  const snappedAngle = snapAngle(angle, snap);
  const distanceToEnd = distance(start, end);
  const x = start[0] + distanceToEnd * Math.cos(snappedAngle.magnitude);
  const y = start[1] + distanceToEnd * Math.sin(snappedAngle.magnitude);
  return [x, y];
}

type Range = [number, number];

export function labelAngle<T extends string>(
  angle: Angle,
  labelMap: Record<T, Range[]>,
  defaultLabel: T
): T {
  const degrees = toDegrees(angle).magnitude;
  

  const label = Object.keys(labelMap).reduce((acc, key) => {
    const ranges = labelMap[key as T];
    const inRange = ranges.some(([start, end]) => {
      if (start <= degrees && degrees <= end) {
        return key;
      }
    });
    return inRange ? key : acc;
  });
  return label as T || defaultLabel;
}
