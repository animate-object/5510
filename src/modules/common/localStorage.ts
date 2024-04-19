import { useState } from "react";

const BASE_KEY = "5510";

const makeKey = (key: string) => `${BASE_KEY}:${key}`;

type LocalStorageValue = string | number | boolean | object | null;

export function get<T extends LocalStorageValue>(
  key: string,
  defaultValue: T
): T {
  const value = localStorage.getItem(makeKey(key));
  if (value === null) {
    return defaultValue;
  }

  return JSON.parse(value) as T;
}

export function set<T extends LocalStorageValue>(key: string, value: T) {
  localStorage.setItem(makeKey(key), JSON.stringify(value));
}
export function remove(key: string) {
  localStorage.removeItem(makeKey(key));
}

interface StorageHook<T extends LocalStorageValue> {
  value: T;
  setValue: (value: T) => void;
  purge: () => void;
}

export function useStorage<T extends LocalStorageValue>(
  key: string,
  defaultValue: T
): StorageHook<T> {
  const getValue = () => get(key, defaultValue);
  const [value, setValue] = useState(getValue);

  const setAndStore = (newValue: T) => {
    setValue(newValue);
    set(key, newValue);
  };

  const purge = () => {
    setValue(defaultValue);
    remove(key);
  };

  return {
    value,
    setValue: setAndStore,
    purge,
  };
}
