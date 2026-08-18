import { router } from 'expo-router';
import { useState } from 'react';

/**
 * True when this screen was opened directly rather than reached from inside the app.
 *
 * expo-router registers every file under `app/` as an addressable route, so a deep link,
 * a browser reload or a restored URL can drop someone into the middle of a flow. What
 * that looks like is the flow opening by itself: the stack anchor (the splash) paints for
 * a frame and the deep-linked screen takes over, with no way back to the screen whose
 * button was supposed to be the way in.
 *
 * Arriving from within the app always leaves something to go back to; arriving directly
 * never does — the anchor paints but is not pushed onto the stack. That is the signal.
 * Read once at mount, because it is a fact about how the screen was entered, not a
 * value that changes while it is open.
 */
export function useOpenedDirectly(): boolean {
  const [openedDirectly] = useState(() => !router.canGoBack());
  return openedDirectly;
}
