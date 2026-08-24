import { Redirect } from 'expo-router';

/**
 * Where a signed-in session lands. The design's tab 0 is Now, but Now has
 * nothing to show until a book has been scored, so the app opens on Library —
 * the one tab that is useful from a standing start, since it is also where a new
 * score begins.
 *
 * A redirect rather than making Library the group's `index`, so the three tabs
 * keep honest URLs (`/now`, `/library`, `/profile`) instead of one of them
 * answering to `/`.
 */
export default function AppIndex() {
  return <Redirect href="/library" />;
}
