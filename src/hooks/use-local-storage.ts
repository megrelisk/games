"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/* Same-tab change notifications (the native `storage` event only fires cross-tab). */
const listeners = new Map<string, Set<() => void>>();
function emit(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parse<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * SSR-safe localStorage state. Returns the fallback on the server and during
 * the first client render, then the stored value — without effects or refs.
 */
export function useLocalStorage<T>(key: string, fallback: T) {
  const subscribe = useCallback(
    (cb: () => void) => {
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key)!.add(cb);
      const onStorage = (e: StorageEvent) => e.key === key && cb();
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.get(key)?.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );

  const raw = useSyncExternalStore(subscribe, () => readRaw(key), () => null);

  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const value = useMemo<T>(() => parse(raw, fallback), [raw, fallback]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = parse(readRaw(key), fallback);
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        /* quota / private mode */
      }
      emit(key);
    },
    [key, fallback],
  );

  return [value, set, hydrated] as const;
}
