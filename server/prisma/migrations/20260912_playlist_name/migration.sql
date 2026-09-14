-- Added nullable and backfilled before the NOT NULL: playlists generated before Claude
-- started naming them have no title of their own, and fall back to the book's.
ALTER TABLE "playlist" ADD COLUMN "name" TEXT;

UPDATE "playlist" SET "name" = "book"."title"
FROM "book" WHERE "book"."id" = "playlist"."bookId" AND "playlist"."name" IS NULL;

ALTER TABLE "playlist" ALTER COLUMN "name" SET NOT NULL;
