-- CreateEnum
CREATE TYPE "BookSource" AS ENUM ('GOOGLE_BOOKS', 'MANUAL_GENRE');

-- CreateTable
CREATE TABLE "book" (
    "id" TEXT NOT NULL,
    "googleBooksId" TEXT,
    "title" TEXT NOT NULL,
    "authors" TEXT[],
    "description" TEXT,
    "categories" TEXT[],
    "pageCount" INTEGER,
    "thumbnailUrl" TEXT,
    "source" "BookSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "track" (
    "id" TEXT NOT NULL,
    "spotifyTrackId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "albumArtUrl" TEXT,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "track_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "moodProfile" JSONB NOT NULL,
    "totalRuntimeMs" INTEGER NOT NULL,
    "isTooShort" BOOLEAN NOT NULL DEFAULT false,
    "spotifyPlaylistId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlistTrack" (
    "playlistId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isAnchor" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "playlistTrack_pkey" PRIMARY KEY ("playlistId","position")
);

-- CreateIndex
CREATE UNIQUE INDEX "book_googleBooksId_key" ON "book"("googleBooksId");

-- CreateIndex
CREATE UNIQUE INDEX "track_spotifyTrackId_key" ON "track"("spotifyTrackId");

-- CreateIndex
CREATE INDEX "playlist_userId_createdAt_idx" ON "playlist"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "playlist_bookId_idx" ON "playlist"("bookId");

-- CreateIndex
CREATE INDEX "playlistTrack_trackId_idx" ON "playlistTrack"("trackId");

-- AddForeignKey
ALTER TABLE "playlist" ADD CONSTRAINT "playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist" ADD CONSTRAINT "playlist_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlistTrack" ADD CONSTRAINT "playlistTrack_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlistTrack" ADD CONSTRAINT "playlistTrack_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
