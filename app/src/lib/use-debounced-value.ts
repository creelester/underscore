import { useEffect, useState } from 'react';

/**
 * Trails `value` by `delayMs`, resetting the timer on every change so only a
 * settled value comes out.
 *
 * Debouncing here rather than inside the query hook keeps React Query's cache
 * keyed by terms the user actually stopped on — a key per keystroke would fill
 * the cache with prefixes nobody asked for and defeat its own `staleTime`.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}
