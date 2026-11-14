-- Allowed by default, so existing readers' playlists do not change under them.
ALTER TABLE "user" ADD COLUMN "allowExplicit" BOOLEAN NOT NULL DEFAULT true;
