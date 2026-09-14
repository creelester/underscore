import type { BookshelfQuery, BookshelfResponse, Playlist } from "@underscore/shared";
import { ApiError } from "../lib/apiError";
import { prisma } from "../lib/prisma";
import { toApiPlaylist } from "./playlistMapper";

/** Everything a `Playlist` needs, in one round trip rather than one per playlist. */
const withRelations = {
  book: true,
  tracks: { include: { track: true }, orderBy: { position: "asc" } },
} as const;

/**
 * One page of a user's playlists, newest first. The cursor is the last row's id and not
 * its `createdAt`, which is not unique — two playlists scored in the same millisecond
 * would otherwise straddle the page boundary. `id` breaks that tie in the sort too.
 */
export async function listBookshelf(
  userId: string,
  { cursor, limit }: BookshelfQuery,
): Promise<BookshelfResponse> {
  const rows = await prisma.playlist.findMany({
    where: { userId },
    include: withRelations,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    // One past the page, so a next cursor is only claimed when a row actually follows.
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const page = rows.slice(0, limit);

  return {
    playlists: page.map(toApiPlaylist),
    nextCursor: rows.length > limit ? (page.at(-1)?.id ?? null) : null,
  };
}

export async function getPlaylist(userId: string, playlistId: string): Promise<Playlist> {
  const row = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: withRelations,
  });

  if (!row) throw ApiError.playlistNotFound();
  // Distinct from a 404 on purpose: the id is real, the caller just does not own it.
  if (row.userId !== userId) throw ApiError.forbidden();

  return toApiPlaylist(row);
}
