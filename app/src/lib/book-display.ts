import { format, parseISO } from 'date-fns';
import ISO6391 from 'iso-639-1';

import {
  genresFromCategories,
  MOODS,
  type BookCandidate,
  type BookDetail,
  type Mood,
} from '@underscore/shared';

/**
 * Turning a book into the strings and swatch the library rows and book detail
 * show. Nothing here is sent back to the server.
 *
 * Formatting only, with one exception worth knowing about: `displayGenre` is a
 * view onto `genresFromCategories`, which is a product rule living in shared
 * because the scored playlist's `MoodProfile.genre` is built from it. The genre
 * on screen and the genre on the profile are the same string by construction.
 */

/** The design chains descriptors with an interpunct. */
const SEPARATOR = ' · ';

/**
 * The one genre a row or eyebrow has space for.
 *
 * Thin wrapper over `genresFromCategories`, which is shared because it is the
 * rule the scored playlist's `MoodProfile.genre` is built from too — the label
 * here and the genre stored on the profile are deliberately the same string.
 */
export function displayGenre(categories: readonly string[]): string | null {
  return genresFromCategories(categories)[0] ?? null;
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

/**
 * The catalogue facts book detail lists under the blurb, as label/value pairs in
 * the design's order.
 *
 * A row is dropped rather than shown empty whenever Google has nothing: half
 * these fields are missing on any given volume, and a table of "—" reads as
 * broken rather than as sparse.
 */
export function bookFacts(book: BookDetail): { label: string; value: string }[] {
  const facts: { label: string; value: string | null }[] = [
    { label: 'Publisher', value: book.publisher },
    { label: 'Published', value: formatPublishedDate(book.publishedDate) },
    { label: 'Length', value: book.pageCount ? `${book.pageCount} pages` : null },
    { label: 'Categories', value: book.categories[0] ?? null },
    { label: 'Language', value: formatLanguage(book.language) },
    { label: 'Rating', value: formatRating(book.averageRating, book.ratingsCount) },
  ];

  return facts.filter((fact): fact is { label: string; value: string } => !!fact.value);
}

/**
 * Google's `publishedDate` carries whatever precision it holds — "2020",
 * "2020-09" or "2020-09-15" — so the output follows the input rather than
 * inventing a day the catalogue never claimed. The precision is read off the
 * string; only the formatting is date-fns' job.
 *
 * `parseISO` rather than `new Date`, which reads a date-only string as UTC
 * midnight and then renders it in the device's zone — a day early for anyone
 * west of Greenwich. date-fns parses it as local, which is what a publication
 * date means.
 */
export function formatPublishedDate(publishedDate: string | null): string | null {
  if (!publishedDate) return null;

  const [, year, month, day] = publishedDate.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/) ?? [];
  if (!year) return publishedDate;
  if (!month) return year;

  const parsed = parseISO(day ? `${year}-${month}-${day}` : `${year}-${month}-01`);
  if (Number.isNaN(parsed.getTime())) return year;

  return format(parsed, day ? 'MMMM d, yyyy' : 'MMMM yyyy');
}

/**
 * "en" → "English", and "en-GB" → "English" — Google sends BCP-47 and the region
 * adds nothing to a one-line fact.
 *
 * `Intl.DisplayNames` is the obvious tool and is simply absent from Hermes: the
 * constructor does not exist on device, though it works in the web build. So the
 * lookup comes from `iso-639-1`, which is a table rather than an ICU binding and
 * therefore behaves the same on both.
 */
export function formatLanguage(language: string | null): string | null {
  if (!language) return null;

  const code = language.toLowerCase().split('-')[0];
  return ISO6391.getName(code) || language;
}

/** The design's `4.2 · 1,204 ratings`. */
export function formatRating(
  averageRating: number | null,
  ratingsCount: number | null,
): string | null {
  if (!averageRating || !ratingsCount) return null;

  const plural = ratingsCount === 1 ? 'rating' : 'ratings';
  return `${averageRating.toFixed(1)}${SEPARATOR}${ratingsCount.toLocaleString('en-US')} ${plural}`;
}
