import { PACING_LABELS, type MoodProfile, type Playlist } from '@underscore/shared';

// Display formatting for a scored playlist, the way book-display.ts does it for a volume.

const SEPARATOR = ' · ';

function capitalize(word: string): string {
  return `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`;
}

/** `Melancholy, dreamy · Slow burn` — the read the playlist was built from, said back. */
export function moodSentence(profile: MoodProfile): string {
  const moods = profile.mood.map(capitalize).join(', ');
  const pacing = PACING_LABELS[profile.pacing];

  return moods ? `${moods}${SEPARATOR}${pacing}` : pacing;
}

/** `20 tracks · 1 hr 12 min`. Runtime is information only — nothing is sized to it. */
export function trackSummary(playlist: Playlist): string {
  const count = playlist.tracks.length;
  const tracks = `${count} ${count === 1 ? 'track' : 'tracks'}`;

  return `${tracks}${SEPARATOR}${runtime(playlist.totalRuntimeMs)}`;
}

/** `TESSELLATE · ANNA NOVAK`. Authors are dropped rather than listed — one line to fit. */
export function playlistEyebrow(playlist: Playlist): string {
  return [playlist.book.title, playlist.book.authors[0]]
    .filter((part): part is string => !!part)
    .join(SEPARATOR)
    .toUpperCase();
}

/** `4:12`. Seconds are padded; minutes run past 60 rather than rolling into hours. */
export function trackDuration(durationMs: number): string {
  const totalSeconds = Math.round(durationMs / 1000);
  const seconds = totalSeconds % 60;

  return `${Math.floor(totalSeconds / 60)}:${seconds.toString().padStart(2, '0')}`;
}

function runtime(totalRuntimeMs: number): string {
  const totalMinutes = Math.round(totalRuntimeMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) return `${minutes} min`;
  // No minutes at all reads as a rounder number than the runtime really is, so it stays.
  return `${hours} hr ${minutes} min`;
}
