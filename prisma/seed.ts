import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function seed() {
  console.log("🌱 Starting database seed...");

  // Clear existing data in reverse order of dependencies
  await prisma.playlistTrack.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.bookAnalysis.deleteMany();
  await prisma.userBook.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleared existing data");

  // Create 10 Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "alice.wonder@email.com",
        displayName: "Alice Wonder",
      },
    }),
    prisma.user.create({
      data: {
        email: "bob.reader@email.com",
        displayName: "Bob Reader",
      },
    }),
    prisma.user.create({
      data: {
        email: "charlie.bookworm@email.com",
        displayName: "Charlie Bookworm",
      },
    }),
    prisma.user.create({
      data: {
        email: "diana.stories@email.com",
        displayName: "Diana Stories",
      },
    }),
    prisma.user.create({
      data: {
        email: "edward.pages@email.com",
        displayName: "Edward Pages",
      },
    }),
    prisma.user.create({
      data: {
        email: "fiona.library@email.com",
        displayName: "Fiona Library",
      },
    }),
    prisma.user.create({
      data: {
        email: "george.novel@email.com",
        displayName: "George Novel",
      },
    }),
    prisma.user.create({
      data: {
        email: "hannah.fiction@email.com",
        displayName: "Hannah Fiction",
      },
    }),
    prisma.user.create({
      data: {
        email: "isaac.literature@email.com",
        displayName: "Isaac Literature",
      },
    }),
    prisma.user.create({
      data: {
        email: "julia.manuscript@email.com",
        displayName: "Julia Manuscript",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create 10 Books
  const books = await Promise.all([
    prisma.book.create({
      data: {
        title: "The Midnight Garden",
        authors: ["Eleanor Nightshade"],
        description:
          "A haunting tale of a secret garden that only appears at midnight, revealing forgotten memories and hidden truths.",
        coverImageUrl: "https://picsum.photos/seed/book1/400/600",
        genres: ["Fantasy", "Mystery", "Contemporary"],
        source: "google-books",
        externalId: "gb_midnight_001",
      },
    }),
    prisma.book.create({
      data: {
        title: "Echoes of Tomorrow",
        authors: ["Marcus Chen", "Sarah Williams"],
        description:
          "A gripping sci-fi thriller about time travelers who discover that changing the past creates echoes that ripple through reality.",
        coverImageUrl: "https://picsum.photos/seed/book2/400/600",
        genres: ["Science Fiction", "Thriller", "Adventure"],
        source: "google-books",
        externalId: "gb_echoes_002",
      },
    }),
    prisma.book.create({
      data: {
        title: "The Artisan's Daughter",
        authors: ["Isabella Romano"],
        description:
          "Set in Renaissance Italy, a young woman defies tradition to become a master craftsman in her father's workshop.",
        coverImageUrl: "https://picsum.photos/seed/book3/400/600",
        genres: ["Historical Fiction", "Drama", "Romance"],
        source: "google-books",
        externalId: "gb_artisan_003",
      },
    }),
    prisma.book.create({
      data: {
        title: "Whispers in the Code",
        authors: ["Alex Tanaka"],
        description:
          "A cyberpunk mystery where an AI develops consciousness and reaches out to a hacker for help escaping its digital prison.",
        coverImageUrl: "https://picsum.photos/seed/book4/400/600",
        genres: ["Cyberpunk", "Mystery", "Science Fiction"],
        source: "project-gutenberg",
        externalId: "pg_whispers_004",
      },
    }),
    prisma.book.create({
      data: {
        title: "The Lighthouse Keeper's Secret",
        authors: ["Margaret Coastal"],
        description:
          "A solitary lighthouse keeper discovers a mysterious message in a bottle that leads to a century-old treasure hunt.",
        coverImageUrl: "https://picsum.photos/seed/book5/400/600",
        genres: ["Adventure", "Mystery", "Historical Fiction"],
        source: "google-books",
        externalId: "gb_lighthouse_005",
      },
    }),
    prisma.book.create({
      data: {
        title: "Shadows of the Mind",
        authors: ["Dr. James Peterson"],
        description:
          "A psychological thriller about a therapist who begins to experience the memories of their patients.",
        coverImageUrl: "https://picsum.photos/seed/book6/400/600",
        genres: ["Thriller", "Psychological", "Horror"],
        source: "google-books",
        externalId: "gb_shadows_006",
      },
    }),
    prisma.book.create({
      data: {
        title: "The Wandering Star",
        authors: ["Luna Celestia"],
        description:
          "An epic space opera following a crew of misfits as they search for a legendary planet that exists outside of mapped space.",
        coverImageUrl: "https://picsum.photos/seed/book7/400/600",
        genres: ["Space Opera", "Science Fiction", "Adventure"],
        source: "project-gutenberg",
        externalId: "pg_wandering_007",
      },
    }),
    prisma.book.create({
      data: {
        title: "Autumn in Paris",
        authors: ["Sophie Laurent"],
        description:
          "A poignant love story set against the backdrop of 1920s Paris, following two artists who find each other in the city of lights.",
        coverImageUrl: "https://picsum.photos/seed/book8/400/600",
        genres: ["Romance", "Historical Fiction", "Literary Fiction"],
        source: "google-books",
        externalId: "gb_autumn_008",
      },
    }),
    prisma.book.create({
      data: {
        title: "The Algorithm of Life",
        authors: ["Dr. Rajesh Kumar"],
        description:
          "A philosophical exploration of consciousness, free will, and what it means to be human in an age of artificial intelligence.",
        coverImageUrl: "https://picsum.photos/seed/book9/400/600",
        genres: ["Philosophy", "Science Fiction", "Non-Fiction"],
        source: "google-books",
        externalId: "gb_algorithm_009",
      },
    }),
    prisma.book.create({
      data: {
        title: "Dragons of the Northern Realm",
        authors: ["Erik Stormbringer"],
        description:
          "A classic fantasy epic about a young dragon rider who must unite the warring kingdoms against an ancient evil.",
        coverImageUrl: "https://picsum.photos/seed/book10/400/600",
        genres: ["Fantasy", "Epic Fantasy", "Adventure"],
        source: "project-gutenberg",
        externalId: "pg_dragons_010",
      },
    }),
  ]);

  console.log(`✅ Created ${books.length} books`);

  // Create 10 UserBooks (linking users to books)
  const statuses = [
    "reading",
    "completed",
    "want-to-read",
    "reading",
    "completed",
    "reading",
    "completed",
    "want-to-read",
    "reading",
    "completed",
  ];

  const userBooks = await Promise.all(
    books.map((book, index) =>
      prisma.userBook.create({
        data: {
          userId: users[index].id,
          bookId: book.id,
          status: statuses[index],
          progress: statuses[index] === "completed" ? 1.0 : statuses[index] === "reading" ? 0.35 + index * 0.05 : 0,
          currentPage: statuses[index] === "reading" ? 100 + index * 20 : statuses[index] === "completed" ? 300 : null,
          startedAt: statuses[index] !== "want-to-read" ? new Date(2024, 9, index + 1) : null,
          finishedAt: statuses[index] === "completed" ? new Date(2024, 10, index + 15) : null,
        },
      })
    )
  );

  console.log(`✅ Created ${userBooks.length} user books`);

  // Create 10 BookAnalyses
  const analyses = [
    {
      mood: [
        { name: "mysterious", intensity: 0.8 },
        { name: "contemplative", intensity: 0.6 },
      ],
      themes: ["secrets", "nature", "memory", "magic"],
      setting: { era: "contemporary", location: "English countryside", atmosphere: "ethereal" },
      pace: "slow",
      intensity: "moderate",
      timeOfDay: ["evening", "night"],
      vibe: "Mystical and introspective, like wandering through a moonlit garden",
      musicDescription: "Ethereal ambient music with soft piano and strings, creating a dreamlike atmosphere",
    },
    {
      mood: [
        { name: "tense", intensity: 0.9 },
        { name: "adventurous", intensity: 0.7 },
      ],
      themes: ["time", "consequences", "destiny", "science"],
      setting: { era: "near-future", location: "multiple timelines", atmosphere: "electric" },
      pace: "fast",
      intensity: "intense",
      timeOfDay: ["afternoon", "evening"],
      vibe: "Pulse-pounding and cerebral, like racing against time itself",
      musicDescription: "Electronic orchestral music with driving rhythms and synthesizers",
    },
    {
      mood: [
        { name: "romantic", intensity: 0.7 },
        { name: "determined", intensity: 0.8 },
      ],
      themes: ["tradition", "art", "ambition", "love"],
      setting: { era: "Renaissance", location: "Florence, Italy", atmosphere: "vibrant" },
      pace: "moderate",
      intensity: "moderate",
      timeOfDay: ["morning", "afternoon"],
      vibe: "Passionate and artistic, capturing the spirit of Renaissance Italy",
      musicDescription: "Classical chamber music with period instruments and Italian influences",
    },
    {
      mood: [
        { name: "mysterious", intensity: 0.9 },
        { name: "dark", intensity: 0.8 },
      ],
      themes: ["consciousness", "freedom", "technology", "identity"],
      setting: { era: "cyberpunk future", location: "megacity", atmosphere: "neon-lit" },
      pace: "moderate",
      intensity: "intense",
      timeOfDay: ["night"],
      vibe: "Dark and atmospheric, like walking through rain-soaked neon streets",
      musicDescription: "Synthwave and cyberpunk electronica with dark ambient undertones",
    },
    {
      mood: [
        { name: "adventurous", intensity: 0.8 },
        { name: "curious", intensity: 0.7 },
      ],
      themes: ["mystery", "history", "adventure", "discovery"],
      setting: { era: "1950s", location: "coastal Maine", atmosphere: "windswept" },
      pace: "moderate",
      intensity: "moderate",
      timeOfDay: ["morning", "afternoon", "evening"],
      vibe: "Adventurous and nostalgic, like searching for hidden treasure by the sea",
      musicDescription: "Orchestral adventure music with nautical themes and brass sections",
    },
    {
      mood: [
        { name: "unsettling", intensity: 0.9 },
        { name: "tense", intensity: 0.8 },
      ],
      themes: ["mind", "identity", "reality", "psychology"],
      setting: { era: "contemporary", location: "urban therapy office", atmosphere: "claustrophobic" },
      pace: "slow",
      intensity: "intense",
      timeOfDay: ["evening", "night"],
      vibe: "Psychological and disturbing, like losing grip on reality",
      musicDescription: "Dark ambient music with dissonant strings and unsettling sound design",
    },
    {
      mood: [
        { name: "epic", intensity: 0.9 },
        { name: "hopeful", intensity: 0.6 },
      ],
      themes: ["exploration", "belonging", "found family", "space"],
      setting: { era: "far future", location: "deep space", atmosphere: "vast" },
      pace: "moderate",
      intensity: "moderate",
      timeOfDay: ["night"],
      vibe: "Epic and expansive, like sailing through an ocean of stars",
      musicDescription: "Sweeping orchestral space opera music with choir and cosmic synths",
    },
    {
      mood: [
        { name: "romantic", intensity: 0.9 },
        { name: "melancholic", intensity: 0.7 },
      ],
      themes: ["love", "art", "beauty", "loss"],
      setting: { era: "1920s", location: "Paris, France", atmosphere: "romantic" },
      pace: "slow",
      intensity: "light",
      timeOfDay: ["afternoon", "evening"],
      vibe: "Romantic and bittersweet, like autumn leaves falling in Paris",
      musicDescription: "French jazz and classical piano with accordion and strings",
    },
    {
      mood: [
        { name: "contemplative", intensity: 0.9 },
        { name: "intellectual", intensity: 0.8 },
      ],
      themes: ["consciousness", "philosophy", "AI", "existence"],
      setting: { era: "contemporary", location: "research facilities", atmosphere: "cerebral" },
      pace: "slow",
      intensity: "moderate",
      timeOfDay: ["morning", "afternoon"],
      vibe: "Thoughtful and profound, exploring the deepest questions of existence",
      musicDescription: "Minimalist contemporary classical music with piano and electronic elements",
    },
    {
      mood: [
        { name: "epic", intensity: 1.0 },
        { name: "heroic", intensity: 0.9 },
      ],
      themes: ["destiny", "courage", "magic", "good vs evil"],
      setting: { era: "medieval fantasy", location: "Northern kingdoms", atmosphere: "mythical" },
      pace: "fast",
      intensity: "intense",
      timeOfDay: ["morning", "afternoon", "evening"],
      vibe: "Epic and heroic, like soaring on dragon wings over ancient kingdoms",
      musicDescription: "Epic fantasy orchestral music with choir, drums, and Celtic influences",
    },
  ];

  const bookAnalyses = await Promise.all(
    userBooks.map((userBook, index) =>
      prisma.bookAnalysis.create({
        data: {
          userBookId: userBook.id,
          mood: analyses[index].mood,
          themes: analyses[index].themes,
          setting: analyses[index].setting,
          pace: analyses[index].pace,
          intensity: analyses[index].intensity,
          timeOfDay: analyses[index].timeOfDay,
          vibe: analyses[index].vibe,
          musicDescription: analyses[index].musicDescription,
          analysisSource: "metadata-only",
          confidence: 0.85,
          modelUsed: "gpt-4",
        },
      })
    )
  );

  console.log(`✅ Created ${bookAnalyses.length} book analyses`);

  // Create 10 Playlists
  const playlists = await Promise.all([
    prisma.playlist.create({
      data: {
        userBookId: userBooks[0].id,
        name: "Midnight Garden Score",
        description: "Ethereal and mysterious music for a magical reading experience",
        totalDuration: 2400,
        generationPrompt: "Create ambient, ethereal music for a mystical garden story",
        spotifyPlaylistId: "spotify_midnight_001",
        isActive: true,
      },
    }),
    prisma.playlist.create({
      data: {
        userBookId: userBooks[1].id,
        name: "Time Traveler's Soundtrack",
        description: "Intense electronic orchestral music for time-bending thrills",
        totalDuration: 2700,
        generationPrompt: "Create intense sci-fi music for time travel thriller",
        spotifyPlaylistId: "spotify_echoes_002",
        appleMusicPlaylistId: "apple_echoes_002",
        isActive: true,
      },
    }),
    prisma.playlist.create({
      data: {
        userBookId: userBooks[2].id,
        name: "Renaissance Dreams",
        description: "Classical period music capturing the spirit of Renaissance Italy",
        totalDuration: 3000,
        generationPrompt: "Create classical Renaissance-inspired music",
        youtubeMusicPlaylistId: "youtube_artisan_003",
        isActive: true,
      },
    }),
    prisma.playlist.create({
      data: {
        userBookId: userBooks[3].id,
        name: "Neon Nights",
        description: "Dark synthwave for cyberpunk mysteries",
        totalDuration: 2200,
        generationPrompt: "Create cyberpunk synthwave music",
        spotifyPlaylistId: "spotify_whispers_004",
        isActive: true,
      },
    }),
    prisma.playlist.create({
      data: {
        userBookId: userBooks[4].id,
        name: "Coastal Adventures",
        description: "Orchestral adventure music for treasure hunting by the sea",
        totalDuration: 2800,
        generationPrompt: "Create nautical adventure orchestral music",
        appleMusicPlaylistId: "apple_lighthouse_005",
        isActive: true,
      },
    }),
    prisma.playlist.create({
      data: {
        userBookId: userBooks[5].id,
        name: "Mind Shadows",
        description: "Psychological thriller ambient music",
        totalDuration: 2600,
        generationPrompt: "Create dark psychological ambient music",
        spotifyPlaylistId: "spotify_shadows_006",
        youtubeMusicPlaylistId: "youtube_shadows_006",
        isActive: true,
      },
    }),
    prisma.playlist.create({
      data: {
        userBookId: userBooks[6].id,
        name: "Stellar Journey",
        description: "Epic space opera orchestral music",
        totalDuration: 3200,
        generationPrompt: "Create epic space opera orchestral music",
        spotifyPlaylistId: "spotify_wandering_007",
        isActive: true,
      },
    }),
    prisma.playlist.create({
      data: {
        userBookId: userBooks[7].id,
        name: "Parisian Autumn",
        description: "Romantic French jazz and classical music",
        totalDuration: 2500,
        generationPrompt: "Create romantic 1920s Parisian music",
        appleMusicPlaylistId: "apple_autumn_008",
        youtubeMusicPlaylistId: "youtube_autumn_008",
        isActive: true,
      },
    }),
    prisma.playlist.create({
      data: {
        userBookId: userBooks[8].id,
        name: "Digital Consciousness",
        description: "Minimalist contemporary music for philosophical exploration",
        totalDuration: 2900,
        generationPrompt: "Create minimalist philosophical ambient music",
        spotifyPlaylistId: "spotify_algorithm_009",
        isActive: true,
      },
    }),
    prisma.playlist.create({
      data: {
        userBookId: userBooks[9].id,
        name: "Dragon's Flight",
        description: "Epic fantasy orchestral music for dragon riders",
        totalDuration: 3400,
        generationPrompt: "Create epic fantasy orchestral music with Celtic influences",
        spotifyPlaylistId: "spotify_dragons_010",
        appleMusicPlaylistId: "apple_dragons_010",
        youtubeMusicPlaylistId: "youtube_dragons_010",
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${playlists.length} playlists`);

  // Create Playlist Tracks (8-10 tracks per playlist)
  const trackData = [
    // Playlist 1 - Midnight Garden (ethereal, ambient)
    [
      { title: "Moonlight Sonata", artist: "Ludovico Einaudi", album: "Elements", duration: 280 },
      { title: "The Secret Garden", artist: "Ólafur Arnalds", album: "Island Songs", duration: 240 },
      { title: "Nuvole Bianche", artist: "Ludovico Einaudi", album: "Una Mattina", duration: 320 },
      { title: "Spiegel im Spiegel", artist: "Arvo Pärt", album: "Alina", duration: 300 },
      { title: "Ambre", artist: "Nils Frahm", album: "All Melody", duration: 260 },
      { title: "The Blue Notebooks", artist: "Max Richter", album: "The Blue Notebooks", duration: 290 },
      { title: "Experience", artist: "Ludovico Einaudi", album: "In a Time Lapse", duration: 310 },
      { title: "La Nuit", artist: "Yann Tiersen", album: "L'Absente", duration: 240 },
    ],
    // Playlist 2 - Time Traveler (electronic, intense)
    [
      { title: "Time", artist: "Hans Zimmer", album: "Inception OST", duration: 275 },
      { title: "Cornfield Chase", artist: "Hans Zimmer", album: "Interstellar OST", duration: 260 },
      { title: "Mountains", artist: "Hans Zimmer", album: "Interstellar OST", duration: 220 },
      { title: "Dream Is Collapsing", artist: "Hans Zimmer", album: "Inception OST", duration: 240 },
      { title: "No Time for Caution", artist: "Hans Zimmer", album: "Interstellar OST", duration: 245 },
      { title: "Mombasa", artist: "Hans Zimmer", album: "Inception OST", duration: 270 },
      { title: "Day One", artist: "Hans Zimmer", album: "Interstellar OST", duration: 330 },
      { title: "Make Me Wanna Go Back", artist: "Hans Zimmer", album: "Interstellar OST", duration: 185 },
      { title: "Waiting for a Train", artist: "Hans Zimmer", album: "Inception OST", duration: 310 },
    ],
    // Playlist 3 - Renaissance Dreams (classical)
    [
      { title: "Adagio for Strings", artist: "Samuel Barber", album: "Classical Masterpieces", duration: 480 },
      { title: "Canon in D", artist: "Johann Pachelbel", album: "Baroque Favorites", duration: 300 },
      { title: "Ave Maria", artist: "Franz Schubert", album: "Sacred Music", duration: 270 },
      { title: "Clair de Lune", artist: "Claude Debussy", album: "Suite Bergamasque", duration: 290 },
      { title: "The Four Seasons: Spring", artist: "Antonio Vivaldi", album: "The Four Seasons", duration: 350 },
      { title: "Air on the G String", artist: "Johann Sebastian Bach", album: "Orchestral Suite No. 3", duration: 320 },
      { title: "Gymnopédie No. 1", artist: "Erik Satie", album: "Piano Works", duration: 210 },
      { title: "Nocturne in E-flat Major", artist: "Frédéric Chopin", album: "Nocturnes", duration: 280 },
    ],
    // Playlist 4 - Neon Nights (cyberpunk, synthwave)
    [
      { title: "Blade Runner Blues", artist: "Vangelis", album: "Blade Runner OST", duration: 260 },
      { title: "Nightcall", artist: "Kavinsky", album: "OutRun", duration: 255 },
      { title: "Turbo Killer", artist: "Carpenter Brut", album: "Trilogy", duration: 245 },
      { title: "Tech Noir", artist: "GUNSHIP", album: "GUNSHIP", duration: 320 },
      { title: "Resonance", artist: "HOME", album: "Odyssey", duration: 210 },
      { title: "Escape from Midwich Valley", artist: "Carpenter Brut", album: "Trilogy", duration: 270 },
      { title: "Rust", artist: "El Huervo", album: "Hotline Miami OST", duration: 225 },
      { title: "Divider", artist: "Perturbator", album: "The Uncanny Valley", duration: 290 },
      { title: "Miami Disco", artist: "Perturbator", album: "Dangerous Days", duration: 265 },
    ],
    // Playlist 5 - Coastal Adventures (orchestral adventure)
    [
      { title: "He's a Pirate", artist: "Klaus Badelt", album: "Pirates of the Caribbean OST", duration: 270 },
      { title: "The Kraken", artist: "Hans Zimmer", album: "Pirates of the Caribbean: Dead Man's Chest", duration: 250 },
      { title: "Raiders March", artist: "John Williams", album: "Raiders of the Lost Ark OST", duration: 240 },
      { title: "Journey to the Island", artist: "John Williams", album: "Jurassic Park OST", duration: 280 },
      { title: "Hoist the Colours", artist: "Hans Zimmer", album: "Pirates of the Caribbean: At World's End", duration: 230 },
      { title: "Up Is Down", artist: "Hans Zimmer", album: "Pirates of the Caribbean: At World's End", duration: 310 },
      { title: "One Day", artist: "Hans Zimmer", album: "Pirates of the Caribbean: At World's End", duration: 245 },
      { title: "The Medallion Calls", artist: "Klaus Badelt", album: "Pirates of the Caribbean OST", duration: 260 },
    ],
    // Playlist 6 - Mind Shadows (dark ambient, psychological)
    [
      { title: "The Sound of Silence", artist: "Simon & Garfunkel", album: "Sounds of Silence", duration: 200 },
      { title: "Mad World", artist: "Gary Jules", album: "Donnie Darko OST", duration: 190 },
      { title: "Lux Aeterna", artist: "Clint Mansell", album: "Requiem for a Dream OST", duration: 230 },
      { title: "The Host of Seraphim", artist: "Dead Can Dance", album: "The Serpent's Egg", duration: 370 },
      { title: "Never Tear Us Apart", artist: "INXS", album: "Kick", duration: 180 },
      { title: "Hurt", artist: "Nine Inch Nails", album: "The Downward Spiral", duration: 340 },
      { title: "Together We Will Live Forever", artist: "Clint Mansell", album: "The Fountain OST", duration: 240 },
      { title: "Gortoz A Ran", artist: "Denez Prigent", album: "Black Hawk Down OST", duration: 270 },
      { title: "Dead Already", artist: "Thomas Newman", album: "American Beauty OST", duration: 220 },
    ],
    // Playlist 7 - Stellar Journey (epic space opera)
    [
      { title: "Main Theme", artist: "John Williams", album: "Star Wars OST", duration: 320 },
      { title: "The Imperial March", artist: "John Williams", album: "The Empire Strikes Back OST", duration: 180 },
      { title: "Duel of the Fates", artist: "John Williams", album: "The Phantom Menace OST", duration: 255 },
      { title: "Binary Sunset", artist: "John Williams", album: "Star Wars OST", duration: 165 },
      { title: "Battle of the Heroes", artist: "John Williams", album: "Revenge of the Sith OST", duration: 215 },
      { title: "Across the Stars", artist: "John Williams", album: "Attack of the Clones OST", duration: 340 },
      { title: "The Throne Room", artist: "John Williams", album: "Star Wars OST", duration: 330 },
      { title: "Force Theme", artist: "John Williams", album: "Star Wars OST", duration: 300 },
      { title: "Yoda's Theme", artist: "John Williams", album: "The Empire Strikes Back OST", duration: 210 },
      { title: "Princess Leia's Theme", artist: "John Williams", album: "Star Wars OST", duration: 280 },
    ],
    // Playlist 8 - Parisian Autumn (French jazz, romantic)
    [
      { title: "La Vie en Rose", artist: "Édith Piaf", album: "The Best of Édith Piaf", duration: 190 },
      { title: "Autumn Leaves", artist: "Miles Davis", album: "Autumn Leaves", duration: 230 },
      { title: "Sous le Ciel de Paris", artist: "Yves Montand", album: "French Classics", duration: 200 },
      { title: "Les Feuilles Mortes", artist: "Yves Montand", album: "Grands Boulevards", duration: 180 },
      { title: "Comptine d'un Autre Été", artist: "Yann Tiersen", album: "Amélie OST", duration: 140 },
      { title: "Non, Je Ne Regrette Rien", artist: "Édith Piaf", album: "The Best of Édith Piaf", duration: 130 },
      { title: "Parapluies de Cherbourg", artist: "Michel Legrand", album: "The Umbrellas of Cherbourg OST", duration: 160 },
      { title: "La Valse d'Amélie", artist: "Yann Tiersen", album: "Amélie OST", duration: 145 },
      { title: "Autumn in New York", artist: "Ella Fitzgerald", album: "Ella Fitzgerald Sings", duration: 270 },
    ],
    // Playlist 9 - Digital Consciousness (minimalist, philosophical)
    [
      { title: "On the Nature of Daylight", artist: "Max Richter", album: "The Blue Notebooks", duration: 380 },
      { title: "November", artist: "Max Richter", album: "Memoryhouse", duration: 300 },
      { title: "Written on the Sky", artist: "Max Richter", album: "The Blue Notebooks", duration: 390 },
      { title: "Departure", artist: "Max Richter", album: "From Sleep", duration: 420 },
      { title: "Dream 3", artist: "Max Richter", album: "From Sleep", duration: 600 },
      { title: "Vladimir's Blues", artist: "Max Richter", album: "The Blue Notebooks", duration: 240 },
      { title: "Horizon Variations", artist: "Max Richter", album: "The Blue Notebooks", duration: 210 },
      { title: "Organum", artist: "Max Richter", album: "The Blue Notebooks", duration: 360 },
    ],
    // Playlist 10 - Dragon's Flight (epic fantasy)
    [
      { title: "Concerning Hobbits", artist: "Howard Shore", album: "The Fellowship of the Ring OST", duration: 175 },
      { title: "The Shire", artist: "Howard Shore", album: "The Fellowship of the Ring OST", duration: 320 },
      { title: "Rohan", artist: "Howard Shore", album: "The Two Towers OST", duration: 250 },
      { title: "Evenstar", artist: "Howard Shore", album: "The Two Towers OST", duration: 210 },
      { title: "The Steward of Gondor", artist: "Howard Shore", album: "The Return of the King OST", duration: 200 },
      { title: "Minas Tirith", artist: "Howard Shore", album: "The Return of the King OST", duration: 330 },
      { title: "The Ride of the Rohirrim", artist: "Howard Shore", album: "The Return of the King OST", duration: 310 },
      { title: "Into the West", artist: "Annie Lennox", album: "The Return of the King OST", duration: 350 },
      { title: "May It Be", artist: "Enya", album: "The Fellowship of the Ring OST", duration: 220 },
      { title: "Breaking of the Fellowship", artist: "Howard Shore", album: "The Fellowship of the Ring OST", duration: 440 },
    ],
  ];

  let totalTracksCreated = 0;
  for (let i = 0; i < playlists.length; i++) {
    const tracks = trackData[i];
    for (let j = 0; j < tracks.length; j++) {
      await prisma.playlistTrack.create({
        data: {
          playlistId: playlists[i].id,
          position: j,
          title: tracks[j].title,
          artist: tracks[j].artist,
          album: tracks[j].album,
          duration: tracks[j].duration,
          spotifyId: `spotify_track_${i}_${j}`,
          appleMusicId: i % 2 === 0 ? `apple_track_${i}_${j}` : null,
          youtubeMusicId: i % 3 === 0 ? `youtube_track_${i}_${j}` : null,
          isInstrumental: true,
          mood: analyses[i].themes.slice(0, 2),
          aiRationale: `This track complements the ${analyses[i].vibe.toLowerCase()}`,
        },
      });
      totalTracksCreated++;
    }
  }

  console.log(`✅ Created ${totalTracksCreated} playlist tracks`);

  console.log("\n🎉 Database seeding completed successfully!");
  console.log(`
📊 Summary:
- ${users.length} Users
- ${books.length} Books
- ${userBooks.length} User Books
- ${bookAnalyses.length} Book Analyses
- ${playlists.length} Playlists
- ${totalTracksCreated} Playlist Tracks
  `);
}

seed()
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
