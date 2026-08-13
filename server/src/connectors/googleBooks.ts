import { z } from "zod";
import type { BookCandidate } from "@underscore/shared";
import { env } from "../config/env";
import { ApiError } from "../lib/apiError";
import { createHttpClient } from "../lib/http";

const client = createHttpClient({
  baseURL: env.GOOGLE_BOOKS_BASE_URL,
  name: "Google Books",
});

/**
 * Only the fields we actually read. Every one is optional because Google omits
 * rather than nulls, and the object stays open (zod's default) so a new upstream
 * field is ignored instead of failing the parse and 502-ing a working search.
 */
const VolumeSchema = z.object({
  id: z.string(),
  volumeInfo: z
    .object({
      title: z.string().optional(),
      authors: z.array(z.string()).optional(),
      description: z.string().optional(),
      categories: z.array(z.string()).optional(),
      pageCount: z.number().optional(),
      imageLinks: z.object({ thumbnail: z.string().optional() }).optional(),
    })
    .optional(),
});

const VolumeListSchema = z.object({
  totalItems: z.number().optional(),
  items: z.array(VolumeSchema).optional(),
});

type Volume = z.infer<typeof VolumeSchema>;

/** Present only when the key is configured — the volumes endpoint is public. */
const apiKeyParam = env.GOOGLE_BOOKS_API_KEY ? { key: env.GOOGLE_BOOKS_API_KEY } : {};

function toCandidate(volume: Volume): BookCandidate | null {
  const info = volume.volumeInfo;
  // A volume with no title has nothing to show in a result row.
  if (!info?.title) return null;

  return {
    googleBooksId: volume.id,
    title: info.title,
    authors: info.authors ?? [],
    description: info.description ?? null,
    // Raw subject strings, stored verbatim — this is Mood Engine input, not the
    // genre we display. MoodProfile.genre is Claude's normalized output.
    categories: info.categories ?? [],
    // Guarded because Google returns 0 for volumes of unknown length, and
    // BookSchema requires a positive integer.
    pageCount: info.pageCount && info.pageCount > 0 ? info.pageCount : null,
    thumbnailUrl: normalizeThumbnail(info.imageLinks?.thumbnail),
  };
}

/**
 * Google hands back `http://` image URLs. iOS App Transport Security blocks
 * those outright, so the cover would silently fail to render on device.
 */
function normalizeThumbnail(url: string | undefined): string | null {
  if (!url) return null;
  return url.replace(/^http:\/\//, "https://");
}

function parseVolumeList(data: unknown): BookCandidate[] {
  const parsed = VolumeListSchema.safeParse(data);
  if (!parsed.success) {
    throw ApiError.upstreamUnavailable(
      "Google Books returned an unrecognized response",
      parsed.error,
    );
  }
  return (parsed.data.items ?? []).map(toCandidate).filter((b): b is BookCandidate => b !== null);
}

/** Free-text search over title and author. An empty array means no match, not an error. */
export async function searchVolumes(q: string): Promise<BookCandidate[]> {
  const response = await client.get("/volumes", {
    params: { q, maxResults: 20, printType: "books", orderBy: "relevance", ...apiKeyParam },
  });
  // The volumes endpoint answers 404 for nothing we send it, but validateStatus
  // in createHttpClient lets 404 through, so this stays defensive.
  if (response.status === 404) return [];
  return parseVolumeList(response.data);
}

/**
 * Single volume by id. Returns null when Google does not know the id, which is
 * what the generation endpoints will turn into BOOK_NOT_FOUND.
 */
export async function fetchVolume(googleBooksId: string): Promise<BookCandidate | null> {
  const response = await client.get(`/volumes/${encodeURIComponent(googleBooksId)}`, {
    params: apiKeyParam,
  });
  if (response.status === 404) return null;

  const parsed = VolumeSchema.safeParse(response.data);
  if (!parsed.success) {
    throw ApiError.upstreamUnavailable(
      "Google Books returned an unrecognized volume",
      parsed.error,
    );
  }
  return toCandidate(parsed.data);
}
