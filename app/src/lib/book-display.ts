import { MOODS, type BookCandidate, type Mood } from '@underscore/shared';

/**
 * Turning a `BookCandidate` into the strings and swatch the library home's rows
 * show. Display only — nothing here is persisted or sent back to the server.
 */

/** The design chains descriptors with an interpunct. */
const SEPARATOR = ' · ';

/**
 * Google files categories as taxonomy paths — `"Fiction / Fantasy / General"` —
 * where the useful word is usually the last one that isn't the filler `General`.
 * A bare `["Fiction"]` therefore stays `"Fiction"`, and the path above reads
 * `"Fantasy"`.
 *
 * This is the *display* genre and nothing more. `MoodProfile.genre` is Claude's
 * normalized output and does not exist yet at search time, which is why the row
 * cannot use it.
 */
export function displayGenre(categories: readonly string[]): string | null {
  const segments = categories[0]
    ?.split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment && segment.toLowerCase() !== 'general');

  return segments?.at(-1) ?? null;
}

/**
 * `Author · Year · Genre`, dropping whatever the volume doesn't have so a book
 * with no year or no category still reads as a sentence rather than as gaps.
 */
export function bookMetaLine(book: BookCandidate): string {
  return [book.authors[0], book.publishedYear?.toString(), displayGenre(book.categories)]
    .filter((part): part is string => !!part)
    .join(SEPARATOR);
}

/**
 * `Genre · Year` — the book detail eyebrow.
 *
 * Deliberately not `bookMetaLine`: detail names the author on its own line, so
 * repeating it in the eyebrow would say the same thing twice.
 *
 * Mixed case, unlike every other eyebrow in the app. The design's eyebrow token
 * is a font shorthand and carries no `text-transform` — the uppercase ones are
 * typed that way, and the playlist header uppercases its book title in code,
 * which is what settles it. So this reads `Fantasy · 2020`.
 */
export function bookDetailMetaLine(book: BookCandidate): string {
  return [displayGenre(book.categories), book.publishedYear?.toString()]
    .filter((part): part is string => !!part)
    .join(SEPARATOR);
}

/**
 * Google files descriptions as HTML — `<p>`, `<br>`, `<i>` and the odd entity —
 * which a React Native `Text` renders as literal angle brackets rather than as
 * markup. The detail screen shows the blurb as one paragraph, so tags become
 * whitespace and the run is collapsed.
 */
export function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Last, so an escaped entity (`&amp;lt;`) decodes to the text `&lt;` rather
    // than being unescaped twice into a `<`.
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Which mood swatch stands in when a volume has no cover art.
 *
 * A search hit has no mood — that is Claude's read, and it happens later — so the
 * fallback is picked from the volume id instead. Deterministic on purpose: the
 * same book keeps the same swatch across renders, refetches and sessions, which
 * a random pick would not, and a shelf that reshuffles its colours on every
 * keystroke reads as broken.
 */
export function coverMood(googleBooksId: string): Mood {
  let hash = 0;
  for (const character of googleBooksId) {
    // `| 0` wraps to 32 bits, which is the point: it keeps the running value from
    // drifting into float territory on a long id.
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }
  return MOODS[Math.abs(hash) % MOODS.length];
}
