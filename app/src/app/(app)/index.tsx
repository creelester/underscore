import { Redirect } from 'expo-router';

/**
 * Where a signed-in session lands. The design's tab 0 is Now, but it has nothing to
 * show until a book is scored, so the app opens on Library — where a score begins.
 *
 * A redirect rather than Library being the group's `index`, so the three tabs keep
 * honest URLs instead of one of them answering to `/`.
 */
export default function AppIndex() {
  return <Redirect href="/library" />;
}
