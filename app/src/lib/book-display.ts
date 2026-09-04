import { format, parseISO } from 'date-fns';
import ISO6391 from 'iso-639-1';

import {
  genresFromCategories,
  MOODS,
  type BookCandidate,
  type BookDetail,
  type Mood,
} from '@underscore/shared';

// Display formatting only. `displayGenre` is the exception: it wraps the shared
// `genresFromCategories` so the label on screen and `MoodProfile.genre` are the
// same string by construction.

const SEPARATOR = ' · ';

export function displayGenre(categories: readonly string[]): string | null {
  return genresFromCategories(categories)[0] ?? null;
}

/** `Author · Year · Genre`, dropping what the volume lacks so it reads as a sentence. */
export function bookMetaLine(book: BookCandidate): string {
  return [book.authors[0], book.publishedYear?.toString(), displayGenre(book.categories)]
    .filter((part): part is string => !!part)
    .join(SEPARATOR);
}

/**
 * `Genre · Year` — no author, detail already names it on its own line. Mixed case
 * unlike other eyebrows: the design's eyebrow token carries no `text-transform`.
 */
export function bookDetailMetaLine(book: BookCandidate): string {
  return [displayGenre(book.categories), book.publishedYear?.toString()]
    .filter((part): part is string => !!part)
    .join(SEPARATOR);
}

/** Google sends descriptions as HTML; RN `Text` would render the tags literally. */
export function plainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Last, so `&amp;lt;` decodes to `&lt;` rather than being unescaped twice.
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Mood swatch for a volume with no cover art. A search hit has no mood yet, so it
 * is hashed from the id — deterministic so the swatch survives refetch.
 */
export function coverMood(googleBooksId: string): Mood {
  let hash = 0;
  for (const character of googleBooksId) {
    // `| 0` wraps to 32 bits, keeping a long id out of float territory.
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }
  return MOODS[Math.abs(hash) % MOODS.length];
}

/** Catalogue facts in the design's order; missing rows are dropped, not shown as "—". */
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
 * Output follows the input's precision ("2020", "2020-09", "2020-09-15") rather
 * than inventing a day. `parseISO` not `new Date`, which reads a date-only string
 * as UTC midnight and lands a day early west of Greenwich.
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
 * "en-GB" → "English". `iso-639-1` rather than `Intl.DisplayNames`, which is absent
 * from Hermes on device though present in the web build.
 */
export function formatLanguage(language: string | null): string | null {
  if (!language) return null;

  const code = language.toLowerCase().split('-')[0];
  return ISO6391.getName(code) || language;
}

/** `4.2 · 1204 ratings`. The design groups the count; not worth the machinery here. */
export function formatRating(
  averageRating: number | null,
  ratingsCount: number | null,
): string | null {
  if (!averageRating || !ratingsCount) return null;

  const plural = ratingsCount === 1 ? 'rating' : 'ratings';
  return `${averageRating.toFixed(1)}${SEPARATOR}${ratingsCount} ${plural}`;
}
