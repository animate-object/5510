const _getLog = (): LogData => {
  if (!(window as any).logData) {
    (window as any).logData = {};
  }
  return (window as any).logData;
};

const _getLogEntry = (cat: GlobalLogCat): LogCategoryEntry => {
  if (!_getLog()[cat]) {
    _getLog()[cat] = [];
  }
  return (window as any).logData[cat];
};

const _countLog = (cat: GlobalLogCat | undefined): number => {
  if (!cat) {
    return Object.keys(_getLog()).reduce(
      (acc, key) => acc + _getLogEntry(key as GlobalLogCat).length,
      0
    );
  }
  return _getLogEntry(cat).length;
};

const initGlobalLogger = (): void => {
  (window as any).getLog = _getLog;
  (window as any).countLog = _countLog;
  (window as any).log = (cat: GlobalLogCat, data: Loggable): void => {
    _getLogEntry(cat).push(data);
  };
};

export { initGlobalLogger };
