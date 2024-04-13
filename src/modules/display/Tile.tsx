import classNames from "classnames";
import { Bonus, GameCellAndCoords, Letter, baseScore } from "../game";
import "./Tile.css";
import { HTMLAttributes, useCallback, useState } from "react";

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
  cell: GameCellAndCoords;
  onClick?: (cell: GameCellAndCoords, direction: "s" | "e") => void;
  interactionTimeout?: number;
}

export const ClickableTile = ({
  className,
  onClick,
  cell,
  interactionTimeout = 300,
  ...rest
}: ClickableTileProps) => {
  const [lastInteractionTime, setLastInteractionTime] = useState(0);
  const [interactionTimer, setInteractionTimer] = useState<number | null>(null);

  const handleClick = useCallback(
    (direction: "s" | "e") => {
      if (onClick) {
        onClick(cell, direction);
      }
    },
    [onClick, cell]
  );

  const handleInteraction = () => {
    const currentTime = Date.now();
    const elapsedTime = currentTime - lastInteractionTime;

    // Clear previous timer if it exists
    if (interactionTimer) {
      clearTimeout(interactionTimer);
    }

    if (elapsedTime < interactionTimeout) {
      // If the interactions are within the timeout, consider it a double interaction
      handleClick("e");
      setLastInteractionTime(0); // Reset
    } else {
      // Otherwise, start a timer for a potential single interaction
      const timer = setTimeout(() => {
        handleClick("s");
      }, interactionTimeout);
      setInteractionTimer(timer);
      setLastInteractionTime(currentTime);
    }
  };

  return (
    <BaseTile className={className} onClick={handleInteraction} {...rest} />
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
  letter: Letter;
  bonus?: Bonus;
}

export const LetterTile = ({ letter, bonus, ...rest }: LetterTileProps) => {
  const classes = ["letter-tile"];
  if (bonus) {
    const bonusClass = getBonusTileProps(bonus).className;
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
  const {
    cell: { data },
  } = props.cell;
  const { letter, bonus } = data;
  if (letter) {
    return (
      <LetterTile
        letter={letter}
        bonus={bonus}
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
