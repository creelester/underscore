import { useEffect, useState } from 'react';

/**
 * Trails `value` by `delayMs`, so only a settled value comes out. React Query has no
 * debounce of its own, and a query key per keystroke would fill the cache with prefixes
 * nobody asked for and defeat its `staleTime`.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}
