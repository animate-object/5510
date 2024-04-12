import classNames from "classnames";
import { Bonus, TileData } from "../game";
import { Cell as CellT } from "../grid";
import "./Tile.css";
import { useContext, useState } from "react";
import { DirectionArrowContext } from "./DirectionArrowProvider";
import { Geom } from "../common";

interface Props {
  cell: CellT<TileData>;
  size: number;
  onClick?: (cell: CellT<TileData>, direction: 's'| 'e') => void;
}

interface BaseTileProps extends Props {
  content?: string;
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
  content = "",
  className,
  onClick,
  ...rest
}: BaseTileProps) => {
  const { size, margin, fontSizePx, borderWidth } = computeSizeAndSpacing(
    rest.size
  );
  const directionArrowContext = useContext(DirectionArrowContext)


  const handleMouseMove = (e: MouseEvent) => {
    directionArrowContext.setEnd([e.clientX, e.clientY]);
  }

  const handleMouseDown = (e: React.DragEvent<HTMLDivElement>) => {
    directionArrowContext.setStart([e.clientX, e.clientY]);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  const handleMouseUp = (e: MouseEvent) => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp); 

    const angle = directionArrowContext.getAngle();
    if (onClick && angle != null) {
      const angleD = Geom.toDegrees(angle);

      const labeled = Geom.labelAngle<'e'|'s'>(
        angleD,
        {
          'e': [[0, 45], [215, 360]],
          's': [[45, 215]],
        },
        's'
      );
      console.log ({
        angleD,
        labeled
      })
      onClick(rest.cell, labeled);
    }
    directionArrowContext.setStart(null);
    directionArrowContext.setEnd(null);
  }



  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        width: size,
        height: size,
        margin,
        fontSize: fontSizePx,
        lineHeight: `${size}px`,
        borderWidth: borderWidth,
      }}
      className={classNames("space", className)}
    >
      {content}
    </div>
  );
};

interface LetterTileProps extends Props {
  letter: TileData["letter"];
}

export const LetterTile = ({ letter, ...rest }: LetterTileProps) => {
  const classes = ['letter-tile']
  if (rest.cell.data.bonus) {
    const bonusClass = getBonusTileProps(rest.cell.data.bonus).className;
    classes.push(bonusClass);
  }
  return (
    <BaseTile
      content={letter}
      className={classNames(classes)}
      {...rest}
    />
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

interface BonusTileProps extends Props {
  bonus: Bonus;
}

export const BonusTile = ({ bonus, ...rest }: BonusTileProps) => {
  return <BaseTile {...getBonusTileProps(bonus)} {...rest} />;
};

export const Tile = (props: Props) => {
  const { letter, bonus } = props.cell.data;
  if (letter) {
    return <LetterTile letter={letter} {...props} />;
  }
  if (bonus) {
    return <BonusTile bonus={bonus} {...props} />;
  }
  return <BaseTile {...props} />;
};
