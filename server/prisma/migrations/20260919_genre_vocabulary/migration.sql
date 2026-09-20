-- `MoodProfile.genre` is now a closed vocabulary Claude answers in, not whatever Google
-- filed the volume under, and every bookshelf read parses stored profiles back through
-- MoodProfileSchema. Rows written before this carry values like "Media Tie-In" that the
-- enum rejects, which would throw on read — so keep the ones that match a genre,
-- case-insensitively and in the list's own casing, and drop the rest. Nothing renders a
-- stored genre, so a dropped value costs nothing but the parse.
UPDATE "playlist" AS p
SET "moodProfile" = jsonb_set(
  p."moodProfile",
  '{genre}',
  COALESCE(
    (
      SELECT jsonb_agg(g.canonical ORDER BY stored.position)
      FROM jsonb_array_elements_text(p."moodProfile" -> 'genre')
        WITH ORDINALITY AS stored(value, position)
      JOIN (
        VALUES
          ('Literary fiction'), ('Science fiction'), ('Fantasy'), ('Horror'),
          ('Thriller'), ('Mystery'), ('Crime'), ('Romance'), ('Historical fiction'),
          ('Adventure'), ('Dystopian'), ('Magical realism'), ('Gothic'), ('Western'),
          ('Satire'), ('Short stories'), ('Poetry'), ('Graphic novel'),
          ('Young adult'), ('Children''s'), ('Memoir'), ('Biography'), ('History'),
          ('True crime'), ('Essays'), ('Science'), ('Nature writing'), ('Philosophy'),
          ('Psychology'), ('Politics'), ('Travel'), ('Business'), ('Self-help'),
          ('Religion & spirituality'), ('Art & design'), ('Music'), ('Sports'),
          ('Food & cooking')
      ) AS g(canonical) ON lower(stored.value) = lower(g.canonical)
    ),
    '[]'::jsonb
  )
)
WHERE jsonb_typeof(p."moodProfile" -> 'genre') = 'array';
