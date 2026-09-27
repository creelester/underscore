-- The by-hand path has no cover art to fetch, so the reader may set an emoji instead.
-- Nullable rather than defaulted: a Google book has real artwork and never wants one.
ALTER TABLE "book" ADD COLUMN "coverEmoji" TEXT;
