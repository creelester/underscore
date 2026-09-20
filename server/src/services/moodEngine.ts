import type { BookDetail, Genre, MoodProfileRequest, MoodProfile } from "@underscore/shared";
import { analyzeMood } from "../connectors/anthropic";
import { fetchVolume } from "../connectors/googleBooks";
import { ApiError } from "../lib/apiError";

/**
 * The volume comes back alongside the profile so a caller that also needs the book —
 * generation, which mints the `Book` row from it — does not fetch it twice. Null on the
 * manual-genre path, which has no book behind it at all.
 */
export type MoodEngineResult = {
  profile: MoodProfile;
  book: BookDetail | null;
};

/** The by-hand fallback: the genre the user picked, no analysis to run. */
function manualProfile(manualGenre: Genre): MoodProfile {
  return { genre: [manualGenre], mood: [], pacing: "steady", summary: "" };
}

export async function buildMoodProfile(request: MoodProfileRequest): Promise<MoodEngineResult> {
  if (!request.googleBooksId) {
    // The request schema refines on exactly one being set, so this is the manual path.
    return { profile: manualProfile(request.manualGenre!), book: null };
  }

  const book = await fetchVolume(request.googleBooksId);
  if (!book) throw ApiError.bookNotFound();

  return { profile: await analyzeMood(book), book };
}
