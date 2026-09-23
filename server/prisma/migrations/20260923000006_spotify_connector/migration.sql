-- CreateTable
CREATE TABLE "spotifyConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spotifyUserId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spotifyConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spotifyAuthState" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "returnUrl" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spotifyAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "spotifyConnection_userId_key" ON "spotifyConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "spotifyAuthState_state_key" ON "spotifyAuthState"("state");

-- CreateIndex
CREATE INDEX "spotifyAuthState_userId_idx" ON "spotifyAuthState"("userId");

-- AddForeignKey
ALTER TABLE "spotifyConnection" ADD CONSTRAINT "spotifyConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spotifyAuthState" ADD CONSTRAINT "spotifyAuthState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
