import type { BookDetail, ManualBook, MoodProfileRequest, MoodProfile } from "@underscore/shared";
import { analyzeMood } from "../connectors/anthropic";
import { fetchVolume } from "../connectors/googleBooks";
import { ApiError } from "../lib/apiError";

/**
 * The volume comes back alongside the profile so a caller that also needs the book —
 * generation, which mints the `Book` row from it — does not fetch it twice. Null on the
 * by-hand path, which has no catalogue book behind it at all.
 */
export type MoodEngineResult = {
  profile: MoodProfile;
  book: BookDetail | null;
};

/**
 * The by-hand fallback, for a request that arrives with no profile — a deep link, or a
 * reload. The screen itself always sends one, because the reader picked it.
 */
export function manualProfile(manualBook: ManualBook): MoodProfile {
  return { genre: [...manualBook.genre], mood: [], pacing: "steady", summary: "" };
}

export async function buildMoodProfile(request: MoodProfileRequest): Promise<MoodEngineResult> {
  const book = await fetchVolume(request.googleBooksId);
  if (!book) throw ApiError.bookNotFound();

  return { profile: await analyzeMood(book), book };
}
