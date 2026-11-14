import * as SecureStore from 'expo-secure-store';
import { colorScheme } from 'nativewind';
import { Platform } from 'react-native';

/**
 * The reader's choice from the Settings switch, kept on the device; nothing stored means
 * follow the device. Synchronous so `_layout` can apply it before the splash lifts.
 */

export type ThemeOverride = 'light' | 'dark';

const KEY = 'underscore.theme';

function read(): string | null {
  try {
    return Platform.OS === 'web' ? window.localStorage.getItem(KEY) : SecureStore.getItem(KEY);
  } catch {
    return null;
  }
}

function write(value: ThemeOverride) {
  try {
    if (Platform.OS === 'web') window.localStorage.setItem(KEY, value);
    else SecureStore.setItem(KEY, value);
  } catch {
    // Unpersisted, the choice still holds until the app restarts.
  }
}

export function readThemeOverride(): ThemeOverride | undefined {
  const stored = read();
  return stored === 'light' || stored === 'dark' ? stored : undefined;
}

/** On native this pins `Appearance`, which is exactly what an explicit choice means. */
export function setThemeOverride(value: ThemeOverride) {
  write(value);
  colorScheme.set(value);
}
