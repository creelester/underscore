import { MOODS, type BookCandidate, type BookDetail, type Mood } from '@underscore/shared';

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
    { label: 'ISBN-13', value: book.isbn13 },
    { label: 'Rating', value: formatRating(book.averageRating, book.ratingsCount) },
  ];

  return facts.filter((fact): fact is { label: string; value: string } => !!fact.value);
}

/**
 * Google's `publishedDate` carries whatever precision it holds — "2020",
 * "2020-09" or "2020-09-15" — so the output follows the input rather than
 * inventing a day the catalogue never claimed.
 *
 * Parsed by hand rather than through `Date`, which reads a bare "2020-09-15" as
 * UTC midnight and then renders it in the device's zone — a day early for
 * anyone west of Greenwich.
 */
export function formatPublishedDate(publishedDate: string | null): string | null {
  if (!publishedDate) return null;

  const [, year, month, day] =
    publishedDate.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/) ?? [];
  if (!year) return publishedDate;
  if (!month) return year;

  const monthName = MONTHS[Number(month) - 1];
  if (!monthName) return year;

  return day ? `${monthName} ${Number(day)}, ${year}` : `${monthName} ${year}`;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * The languages Google Books actually returns for this catalogue, by ISO-639-1
 * code. Not exhaustive on purpose — an unknown code falls through to itself.
 *
 * A table rather than `Intl.DisplayNames`, which is the obvious tool and does
 * not work here: Hermes ships the constructor but resolves it against a trimmed
 * ICU, so it returned the bare code "en" on device while doing the right thing
 * on web. A wrong answer that never throws is worse than no answer, so the
 * lookup is explicit.
 */
const LANGUAGE_NAMES: Record<string, string> = {
  ar: 'Arabic',
  cs: 'Czech',
  da: 'Danish',
  de: 'German',
  el: 'Greek',
  en: 'English',
  es: 'Spanish',
  fi: 'Finnish',
  fr: 'French',
  he: 'Hebrew',
  hi: 'Hindi',
  hu: 'Hungarian',
  id: 'Indonesian',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  nl: 'Dutch',
  no: 'Norwegian',
  pl: 'Polish',
  pt: 'Portuguese',
  ro: 'Romanian',
  ru: 'Russian',
  sv: 'Swedish',
  th: 'Thai',
  tr: 'Turkish',
  uk: 'Ukrainian',
  vi: 'Vietnamese',
  zh: 'Chinese',
};

/** "en" → "English", and "en-GB" → "English" — the region adds nothing here. */
export function formatLanguage(language: string | null): string | null {
  if (!language) return null;

  const base = language.toLowerCase().split('-')[0];
  return LANGUAGE_NAMES[base] ?? language;
}

/**
 * Thousands separators, done by hand for the same reason `LANGUAGE_NAMES` is a
 * table: Hermes resolves `toLocaleString` against a trimmed ICU, so a grouped
 * number is not something to assume on device.
 */
function group(count: number): string {
  return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** The design's `4.2 · 1,204 ratings`. */
export function formatRating(
  averageRating: number | null,
  ratingsCount: number | null,
): string | null {
  if (!averageRating || !ratingsCount) return null;

  const plural = ratingsCount === 1 ? 'rating' : 'ratings';
  return `${averageRating.toFixed(1)}${SEPARATOR}${group(ratingsCount)} ${plural}`;
}
