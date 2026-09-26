/**
 * The anchors Claude "suggests" and the Spotify catalogue that resolves them.
 *
 * Imported by `upstream-server.ts`, which serves both ends of that round trip, and by
 * the specs, which assert on the tracks a saved playlist lists — so neither can drift
 * from what the stack actually returns.
 */

/** `ANCHOR_COUNT` in server/src/connectors/prompts.ts — what the prompt asks for. */
export const ANCHOR_COUNT = 30;

export type FixtureAnchor = { artist: string; title: string };

/** Invented names, like the book titles: a live Spotify would resolve none of them. */
export const FIXTURE_ANCHORS: FixtureAnchor[] = Array.from(
  { length: ANCHOR_COUNT },
  (_, index) => ({
    artist: `Fixture Ensemble ${index + 1}`,
    title: `Fixture Movement ${index + 1}`,
  }),
);

/** `search()` in server/src/connectors/spotify.ts sends field filters, not free text. */
const SEARCH_QUERY = /^track:"(?<title>[^"]*)" artist:"(?<artist>[^"]*)"$/;

export function parseSearchQuery(q: string): FixtureAnchor | null {
  const groups = SEARCH_QUERY.exec(q.trim())?.groups;
  return groups ? { artist: groups.artist!, title: groups.title! } : null;
}

/** Distinct per anchor, so `resolveAnchors`' dedupe keeps all thirty. */
function trackId({ artist, title }: FixtureAnchor): string {
  return `e2e-${`${artist} ${title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

/** Only the fields server/src/connectors/spotify.ts reads. */
export function toSpotifyTrack(anchor: FixtureAnchor) {
  return {
    id: trackId(anchor),
    name: anchor.title,
    duration_ms: 180_000,
    artists: [{ name: anchor.artist }],
    // No images: album art would be one more thing for the browser to fetch, and
    // `albumArtUrl` is nullable precisely because Spotify omits it.
    album: { images: [] },
  };
}
