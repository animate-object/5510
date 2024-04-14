import React from "react";
import { Modal } from "./Modal";
import { BonusTile } from "./Tile";
import { Bonus, GameCellAndCoords } from "../game";

type MenuContentType = "menu" | "rules";

interface SectionProps {
  title: string;
  children: React.ReactNode;
}
function RulesSection({ title, children }: SectionProps): JSX.Element {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

const Scoring = () => {
  return (
    <>
      <p>
        Each letter has a point value. The base point value for each word is the
        sum of the point values for the letter tiles used.
      </p>
      <h3>Bonus Tiles</h3>
      <div style={{ display: "flex" }}>
        {Object.keys(Bonus).map((b) => {
          const cell = {} as GameCellAndCoords;
          return (
            <BonusTile bonus={b as Bonus} key={b} cell={cell} cellSize={60} />
          );
        })}
      </div>
      <p>
        These bonus tiles improve the value of individual words. Letter bonuses
        (2L and 3L) multiply the value of the letter occupying their space. Word
        bonuses (2W and 3W) multiply the value of the entire word.
      </p>
      <p>
        Note these important details about bonuses:
        <ul>
          <li>
            Bonuses are cumulative, e.g. if a word crosses two word bonuses,
            both will apply
          </li>
          <li>Word bonuses are applied after letter bonuses</li>
          <li>
            Bonus tiles apply <b>every turn they are used</b>. A bonus cannot be
            'used up'.
          </li>
        </ul>
      </p>
      <h3>Turn Bonuses</h3>
      <p>In addition to bonus tiles, there two special turn bonuses</p>
      <p>
        <b>
          <i>All letters bonus</i>
        </b>
        &nbsp; If you play all five letters from your hand in one turn, you get
        extra points.
        <ul>
          <li>Turn 1: 10</li>
          <li>Turn 2: 20</li>
          <li>Turn 3: 30</li>
          <li>Turn 4: 40</li>
          <li>Turn 5: 50</li>
        </ul>
      </p>
      <p>
        <b>
          <i>Multi word bonus</i>
        </b>
        &nbsp; You get a bonus for creating multiple words in a single turn.
        <ul>
          <li>2 words: x1.5</li>
          <li>3 words: x2</li>
          <li>4 words: x3</li>
          <li>5 words: x4</li>
        </ul>
      </p>
      <p>That's it!</p>
      <h2>Try to score a lot of points!</h2>
    </>
  );
};

function RulesPanel(): JSX.Element {
  const sections = [
    {
      title: "Basics",
      content: [
        <p key="basics-1">
          Place letters from your hand on the board to spell words. You can form
          words using letters already played. Turns are scored based on the
          value of each letter as well as bonuses.
        </p>,
        <p key="basics-2">
          Each game consists of five hands of five letters. The game is over
          when you play each hand OR when 10 minutes have elapsed since the
          start of the game. That's why the game is called 5x5x10.
        </p>,
      ],
    },
    {
      title: "Scoring",
      content: <Scoring key="scoring" />,
    },
  ];

  return (
    <>
      {sections.map((section) => (
        <RulesSection key={section.title} title={section.title}>
          {section.content}
        </RulesSection>
      ))}
    </>
  );
}

function getContent(menuContent: MenuContentType) {
  switch (menuContent) {
    case "rules":
      return <RulesPanel />;
    default:
      return <div>Menu</div>;
  }
}

function getTitle(menuContent: MenuContentType) {
  switch (menuContent) {
    case "rules":
      return "How to play";
    default:
      return "Menu";
  }
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function MenuModal({ isOpen, onClose }: Props): JSX.Element {
  // eventually will house more but for now just rules
  const [menuContent, _setMenuContent] =
    React.useState<MenuContentType>("rules");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getTitle(menuContent)}>
      <div style={{ overflow: "auto", height: "100%" }}>
        {getContent(menuContent)}
      </div>
    </Modal>
  );
}
