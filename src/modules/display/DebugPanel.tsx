import { useState, useEffect } from "react";
import "./DebugPanel.css";
import classNames from "classnames";
import { Modal } from "./Modal";
import { Storage } from "../common";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface DebugLogEntryProps {
  idx: number;
  entry: Loggable;
}

export const LogIdx = ({ idx }: { idx: number }): JSX.Element => {
  const padZeros = (zeros: number, num: number): string => {
    return num.toString().padStart(zeros, "0");
  };

  return <span className="log-idx">#{padZeros(4, idx)}</span>;
};

interface DebugDictEntryProps extends DebugLogEntryProps {
  entry: LogDict;
}

export const DebugDictEntry = ({
  idx,
  entry,
}: DebugDictEntryProps): JSX.Element => {
  const getValue = (entry: LogDictEntry): React.ReactNode => {
    if (Array.isArray(entry)) {
      return (
        <div>
          {entry.map((item, i) => (
            <div key={i}>{item}</div>
          ))}
        </div>
      );
    }
    if (typeof entry === "boolean") {
      return <span className="debug-boolean">{entry ? "true" : "false"}</span>;
    }
    if (typeof entry === "number") {
      return <span className="debug-number">{entry}</span>;
    }
    if (typeof entry === "string") {
      return <span className="debug-string">{entry}</span>;
    }

    return entry;
  };

  return (
    <div className="debug-log-entry">
      <LogIdx idx={idx} />
      {Object.keys(entry).map((key, i) => (
        <div key={i} className="debug-dict-entry-item">
          <div className="debug-dict-entry-key">{key}:</div>
          <div className="debug-dict-entry-value">{getValue(entry[key])}</div>
        </div>
      ))}
    </div>
  );
};

interface PrimitiveLogEntryProps extends DebugLogEntryProps {
  entry: LoggablePrim;
}

export const PrimitiveLogEntry = ({
  idx,
  entry,
}: PrimitiveLogEntryProps): JSX.Element => {
  const getEntry = (entry: LoggablePrim): React.ReactNode => {
    if (entry == null) {
      return <span className="debug-log-entry">Empty Entry</span>;
    }
    if (typeof entry === "string") {
      return <span className="debug-string">{entry}</span>;
    }
    if (typeof entry === "number") {
      return <span className="debug-number">{entry}</span>;
    }
    if (typeof entry === "boolean") {
      return <span className="debug-boolean">{entry ? "true" : "false"}</span>;
    }
    return <span className="debug-log-entry">Unknown Entry</span>;
  };

  return (
    <div className="debug-log-entry">
      <LogIdx idx={idx} />
      {getEntry(entry)}
    </div>
  );
};

export const DebugLogEntry = ({
  idx,
  entry,
}: DebugLogEntryProps): JSX.Element => {
  if (typeof entry === "object") {
    return <DebugDictEntry idx={idx} entry={entry as LogDict} />;
  }
  return <PrimitiveLogEntry idx={idx} entry={entry as LoggablePrim} />;
};

interface DebugDataProps {
  data: LogCategoryEntry;
}

export const DebugData = ({ data }: DebugDataProps): JSX.Element => {
  return (
    <div className="debug-data">
      {data.map((entry, i) => (
        <DebugLogEntry key={i} idx={i} entry={entry} />
      ))}
    </div>
  );
};

type MoreTabs = "tool.words";

type DebugPanelTabs = GlobalLogCat | MoreTabs;

export const isLogTab = (tab?: string): tab is GlobalLogCat => {
  if (!tab) {
    return false;
  }
  return [
    "game.stat",
    "game.hands",
    "game.seed",
    "game.init",
    "game.turn",
    "game.stat",
    "config.wordList",
    "config.scores",
    "config.bag",
    "config.flags",
    "rng",
  ].includes(tab);
};

export const SpellableWordTool = () => {
  const [letters, setLetters] = useState<string>("");
  const [words, setWords] = useState<Record<number, string[]>>({});
  const handleType = (word: string) => {
    if (word.length > 6) {
      return;
    } else {
      setLetters(word);
      const words = (window as any).allWordsForLetters(
        word.toLocaleLowerCase()
      );
      setWords(words);
    }
  };

  return (
    <div className="word-tool">
      <h2>What can I spell with...</h2>
      <input
        value={letters}
        onChange={(e) => handleType(e.target.value)}
        type="text"
      />
      <div className="word-tool-words">
        {Object.keys(words).map((len_) => {
          const len = parseInt(len_, 10);
          return (
            <div key={len}>
              <b>{len} letter words</b>
              <ul>
                {words[len].map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MORE_TABS: Record<MoreTabs, React.ReactNode> = {
  "tool.words": <SpellableWordTool />,
};

const isMoreTab = (tab: string): tab is MoreTabs => {
  return tab in MORE_TABS;
};

export function DebugPanel({ open, onClose }: Props): JSX.Element {
  const [data, setData] = useState<LogData>({} as LogData);
  // const [selectedTab, setSelectedTab] = UseS<GlobalLogCat>("game.stat");

  const { setValue: setSelectedTab, value: selectedTab } =
    Storage.useStorage<DebugPanelTabs>("debug-panel.tab", "game.stat");

  useEffect(() => {
    setData(getLog());
  }, [open]);

  if (!open) {
    return <></>;
  }

  const getTabs = (data: LogData): DebugPanelTabs[] => {
    let tabKeys = Object.keys(data) as GlobalLogCat[];
    const allKeys = [...tabKeys, ...(Object.keys(MORE_TABS) as MoreTabs[])];
    allKeys.sort();
    return allKeys;
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Debug Panel"
      style={{ transparent: true }}
    >
      <div className="panel-content">
        <div className="panel-tabs">
          {getTabs(data).map((cat) => (
            <button
              key={cat}
              className={classNames({ active: selectedTab === cat })}
              onClick={() => setSelectedTab(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLogTab(selectedTab) && <DebugData data={data[selectedTab]} />}
        {isMoreTab(selectedTab) && MORE_TABS[selectedTab]}
      </div>
    </Modal>
  );
}
