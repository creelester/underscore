import { useEffect, useState } from 'react';

/**
 * Trails `value` by `delayMs`, resetting the timer on every change so only a
 * settled value comes out.
 *
 * React Query has no debounce of its own — its own filter examples put the term
 * straight into the query key — so the term has to settle before it gets there.
 * Doing it here keeps the cache keyed by terms the user actually stopped on; a
 * key per keystroke would fill it with prefixes nobody asked for and defeat its
 * own `staleTime`.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}
