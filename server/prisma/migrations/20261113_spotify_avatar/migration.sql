-- Nullable: plenty of Spotify accounts have no profile picture.
ALTER TABLE "spotifyConnection" ADD COLUMN "avatarUrl" TEXT;
