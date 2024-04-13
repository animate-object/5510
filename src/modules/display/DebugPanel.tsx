import { useState, useEffect } from "react";
import "./DebugPanel.css";
import classNames from "classnames";

interface Props {
  open: boolean;
}

interface DebugLogEntryProps {
  idx: number;
  entry: Loggable;
}

interface DebugDictEntryProps extends DebugLogEntryProps {
  entry: LogDict;
}

export const LogIdx = ({ idx }: { idx: number }): JSX.Element => {
  const padZeros = (zeros: number, num: number): string => {
    return num.toString().padStart(zeros, "0");
  };

  return <span className="log-idx">#{padZeros(4, idx)}</span>;
};

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

export function DebugPanel({ open }: Props): JSX.Element {
  const [data, setData] = useState<LogData>({} as LogData);
  const [selectedTab, setSelectedTab] = useState<GlobalLogCat>("rng");

  useEffect(() => {
    setData(getLog());
  }, [open]);

  if (!open) {
    return <></>;
  }
  return (
    <div className="debug-panel">
      <div className="panel-title">Debug Panel</div>
      <div className="panel-tabs">
        {Object.keys(data).map((cat) => (
          <button
            className={classNames({ active: selectedTab === cat })}
            onClick={() => setSelectedTab(cat as GlobalLogCat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {selectedTab && <DebugData data={data[selectedTab]} />}
    </div>
  );
}
