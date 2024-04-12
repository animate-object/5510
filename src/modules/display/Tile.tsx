import classNames from "classnames";
import { Bonus, Letter, TileData, baseScore } from "../game";
import { Cell as CellT } from "../grid";
import "./Tile.css";
import { HTMLAttributes, useContext } from "react";
import { DirectionArrowContext } from "./DirectionArrowProvider";
import { Geom } from "../common";

interface Props extends HTMLAttributes<HTMLDivElement> {
  content?: string;
  topRightContent?: string;
  cellSize: number;
  className?: string;
}
const BORDER_WIDTH = 1;

const computeSizeAndSpacing = (totalSize: number) => {
  const margin = totalSize * 0.03;
  const size = totalSize - 2 * margin - 2 * BORDER_WIDTH;
  const fontSizePx = size * 0.5;
  return { size, margin, fontSizePx, borderWidth: BORDER_WIDTH };
};

export const BaseTile = ({
  content,
  topRightContent,
  className,
  cellSize,
  ...rest
}: Props) => {
  const { size, margin, fontSizePx, borderWidth } =
    computeSizeAndSpacing(cellSize);
  return (
    <div
      style={{
        width: size,
        height: size,
        margin,
        fontSize: fontSizePx,
        lineHeight: `${size}px`,
        borderWidth: borderWidth,
      }}
      className={classNames("space", className)}
      {...rest}
    >
      {topRightContent && (
        <div className="tile-score-container">
          <div className="tile-score">{topRightContent}</div>
        </div>
      )}
      {content}
    </div>
  );
};

interface ClickableTileProps extends Omit<Props, "onClick"> {
  cell: CellT<TileData>;
  onClick?: (cell: CellT<TileData>, direction: "s" | "e") => void;
}

export const ClickableTile = ({
  className,
  onClick,
  cell,
  ...rest
}: ClickableTileProps) => {
  const directionArrowContext = useContext(DirectionArrowContext);

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (e instanceof TouchEvent) {
      e.preventDefault();
      const touch = e.touches[0];
      directionArrowContext.setEnd([touch.clientX, touch.clientY]);
    } else {
      directionArrowContext.setEnd([e.clientX, e.clientY]);
    }
  };

  const handleMouseDown = (e: React.DragEvent<HTMLDivElement>) => {
    directionArrowContext.setStart([e.clientX, e.clientY]);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    directionArrowContext.setStart([touch.clientX, touch.clientY]);
    window.addEventListener("touchmove", handleMouseMove);
    window.addEventListener("touchend", handleMouseUp);
  };

  const handleMouseUp = (_e: any) => {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);

    const angle = directionArrowContext.getAngle();
    if (onClick && angle != null) {
      const angleD = Geom.toDegrees(angle);

      const labeled = Geom.labelAngle<"e" | "s">(
        angleD,
        {
          e: [
            [0, 45],
            [215, 360],
          ],
          s: [[45, 215]],
        },
        "s"
      );
      onClick(cell, labeled);
    }
    directionArrowContext.setStart(null);
    directionArrowContext.setEnd(null);
  };

  return (
    <BaseTile
      className={className}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      {...rest}
    />
  );
};

interface HandTileProps {
  cellSize: number;
  letter: Letter;
}

export const HandTile = ({ letter, cellSize }: HandTileProps) => {
  return (
    <BaseTile
      content={letter}
      topRightContent={baseScore(letter).toString()}
      cellSize={cellSize}
    />
  );
};

interface LetterTileProps extends ClickableTileProps {
  letter: TileData["letter"];
}

export const LetterTile = ({ letter, ...rest }: LetterTileProps) => {
  const classes = ["letter-tile"];
  if (rest.cell.data.bonus) {
    const bonusClass = getBonusTileProps(rest.cell.data.bonus).className;
    classes.push(bonusClass);
  }
  return (
    <ClickableTile content={letter} className={classNames(classes)} {...rest} />
  );
};

const getBonusTileProps = (
  bonus: Bonus
): { content: string; className: string } => {
  switch (bonus) {
    case Bonus.DoubleLetter:
      return { content: "2L", className: "double-letter" };
    case Bonus.TripleLetter:
      return { content: "3L", className: "triple-letter" };
    case Bonus.DoubleWord:
      return { content: "2W", className: "double-word" };
    case Bonus.TripleWord:
      return { content: "3W", className: "triple-word" };
  }
};

interface BonusTileProps extends ClickableTileProps {
  bonus: Bonus;
}

export const BonusTile = ({ bonus, ...rest }: BonusTileProps) => {
  return <ClickableTile {...getBonusTileProps(bonus)} {...rest} />;
};

export const GridTile = (props: ClickableTileProps) => {
  const { letter, bonus } = props.cell.data;
  if (letter) {
    return (
      <LetterTile
        letter={letter}
        topRightContent={baseScore(letter).toString()}
        {...props}
      />
    );
  }
  if (bonus) {
    return <BonusTile bonus={bonus} {...props} />;
  }
  return <ClickableTile {...props} />;
};
