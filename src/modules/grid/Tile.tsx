import classNames from "classnames";
import { Bonus, GameCellAndCoords, Letter, baseScore } from "../game";
import "./Tile.css";
import { HTMLAttributes, useState } from "react";

interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  content?: React.ReactNode;
  topRightContent?: string;
  cellSize: number;
  className?: string;
  hilite?: boolean;
  lowlite?: boolean;
  focused?: boolean;
}
const BORDER_WIDTH = 2;

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
  lowlite,
  hilite,
  focused,
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
      className={classNames("space", className, {
        "tile-hilite": hilite,
        "tile-lowlite": lowlite,
        "tile-focused": focused,
      })}
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
  onClick?: (cell: GameCellAndCoords) => void;
  className?: string;
}

export const ClickableTile = ({
  className,
  onClick,
  cell,
  ...rest
}: ClickableTileProps) => {
  return (
    <BaseTile
      className={className}
      onClick={() => {
        if (onClick) {
          onClick(cell);
        }
      }}
      {...rest}
    />
  );
};

interface HandTileProps {
  cellSize: number;
  letter: Letter;
  focused?: boolean;
  onClick: (letter: Letter) => void;
}

export const HandTile = ({
  letter,
  cellSize,
  focused,
  onClick,
}: HandTileProps) => {
  return (
    <BaseTile
      focused={focused}
      onClick={() => onClick?.(letter)}
      content={letter}
      topRightContent={baseScore(letter).toString()}
      cellSize={cellSize}
    />
  );
};

export const HandTilePlaceholder = ({ cellSize }: { cellSize: number }) => {
  return <BaseTile className="hand-tile-placeholder" cellSize={cellSize} />;
};

interface LetterTileProps extends ClickableTileProps {
  letter: Letter;
  bonus?: Bonus;
}

export const LetterTile = ({ letter, bonus, ...rest }: LetterTileProps) => {
  const bonusClass = !!bonus ? getBonusTileProps(bonus).className : undefined;
  const classes = ["letter-tile", rest.className, bonusClass];

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
  const { content, className } = getBonusTileProps(bonus);
  return <ClickableTile className={className} content={content} {...rest} />;
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

interface ButtonTileProps extends Props {
  content: React.ReactNode;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onClickAndHold?: () => void;
  onHoldCancel?: () => void;
  onHoldTick?: (remaining: number) => void;
  holdDurationS?: number;
  variant: "primary" | "secondary" | "danger";
}

export const ButtonTile = ({
  onClick,
  onDoubleClick,
  onHoldTick,
  onClickAndHold,
  onHoldCancel,
  holdDurationS,
  variant,
  ...rest
}: ButtonTileProps) => {
  const [timer, setTimer] = useState<number | null>(null);

  const tick = (remainingS: number) => {
    if (remainingS > 0) {
      onHoldTick?.(remainingS);
      setTimer(
        setTimeout(() => {
          tick(remainingS - 1);
        }, 1000)
      );
    } else {
      onClickAndHold?.();
    }
  };

  const handlePressStart = () => {
    if (onClickAndHold && holdDurationS) {
      tick(holdDurationS);
    }
  };

  const handlePressEnd = () => {
    console.log({
      msg: "ButtonTile handlePressEnd",
      timer,
    });
    if (timer) {
      clearTimeout(timer);
      setTimer(null);
      onHoldCancel?.();
    }
  };

  return (
    <BaseTile
      className={`button-tile button-${variant}`}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onClick={!holdDurationS ? onClick : undefined}
      {...rest}
    />
  );
};
