import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function verify() {
  console.log("🔍 Verifying seeded data...\n");

  // Get counts
  const userCount = await prisma.user.count();
  const bookCount = await prisma.book.count();
  const userBookCount = await prisma.userBook.count();
  const analysisCount = await prisma.bookAnalysis.count();
  const playlistCount = await prisma.playlist.count();
  const trackCount = await prisma.playlistTrack.count();

  console.log("📊 Record Counts:");
  console.log(`  Users: ${userCount}`);
  console.log(`  Books: ${bookCount}`);
  console.log(`  User Books: ${userBookCount}`);
  console.log(`  Book Analyses: ${analysisCount}`);
  console.log(`  Playlists: ${playlistCount}`);
  console.log(`  Playlist Tracks: ${trackCount}\n`);

  // Get sample user with their books
  const sampleUser = await prisma.user.findFirst({
    include: {
      userBooks: {
        include: {
          book: true,
          analysis: true,
          playlists: {
            include: {
              tracks: {
                take: 3,
                orderBy: { position: "asc" },
              },
            },
          },
        },
        take: 1,
      },
    },
  });

  if (sampleUser) {
    console.log("👤 Sample User:");
    console.log(`  Name: ${sampleUser.displayName}`);
    console.log(`  Email: ${sampleUser.email}\n`);

    if (sampleUser.userBooks.length > 0) {
      const userBook = sampleUser.userBooks[0];
      console.log("📖 Sample Book:");
      console.log(`  Title: ${userBook.book.title}`);
      console.log(`  Author: ${userBook.book.authors.join(", ")}`);
      console.log(`  Genres: ${userBook.book.genres.join(", ")}`);
      console.log(`  Status: ${userBook.status}`);
      console.log(`  Progress: ${((userBook.progress || 0) * 100).toFixed(0)}%\n`);

      if (userBook.analysis) {
        console.log("🎭 Analysis:");
        console.log(`  Vibe: ${userBook.analysis.vibe}`);
        console.log(`  Themes: ${userBook.analysis.themes.join(", ")}`);
        console.log(`  Pace: ${userBook.analysis.pace}`);
        console.log(`  Intensity: ${userBook.analysis.intensity}\n`);
      }

      if (userBook.playlists.length > 0) {
        const playlist = userBook.playlists[0];
        console.log("🎵 Playlist:");
        console.log(`  Name: ${playlist.name}`);
        console.log(`  Description: ${playlist.description}`);
        console.log(`  Total Tracks: ${playlist.tracks.length} (showing first 3)`);
        console.log(`  Tracks:`);
        playlist.tracks.forEach((track, idx) => {
          console.log(
            `    ${idx + 1}. "${track.title}" by ${track.artist} (${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, "0")})`
          );
        });
      }
    }
  }

  console.log("\n✅ Verification complete!");
}

verify()
  .catch((error) => {
    console.error("❌ Error verifying data:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
