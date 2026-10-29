import {
  ManualBookSchema,
  MoodProfileSchema,
  ReadingContextSchema,
  type GeneratePlaylistRequest,
} from '@underscore/shared';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { z } from 'zod';
import { View } from 'react-native';

import { PlaylistView } from '@/components/playlist-view';
import { ScoringProgress } from '@/components/scoring-progress';
import { ScoringScreen } from '@/components/scoring-screen';
import { Text } from '@/components/ui/text';
import { useBook } from '@/features/books/use-book';
import { useSavedPlaylist } from '@/features/bookshelf/use-saved-playlist';
import { useGeneratePlaylist } from '@/features/playlists/use-generate-playlist';
import { isApiError } from '@/lib/api-client';
import { moodGradient } from '@/lib/gradients';

/**
 * The generation step, and the scored playlist it lands on.
 *
 * The mood screen hands over the profile the user actually saw, corrections included.
 * When it is missing — a deep link, or a reload — the server runs the Mood Engine
 * itself, which is why `moodProfile` is optional on the request.
 *
 * Reached with a `googleBooksId` from the mood screen, a `manualBook` from the by-hand
 * one, or a `bookId` from the mood screen re-scoring a saved book. Exactly one of them.
 */

const GENERATE_STEPS = [
  'Read the book’s register',
  'Matched the mood',
  'Finding the right tracks…',
] as const;

/**
 * Generation runs for a minute or more, so the last step cycles through these rather
 * than sitting still behind the spinner.
 */
const GENERATE_ASIDES = [
  'Auditioning a few opening bars…',
  'Skipping anything too on the nose…',
  'Weighing a track against the last chapter…',
  'Turning down the ones that try too hard…',
  'Listening for the sound between the lines…',
  'Making sure the quiet parts stay quiet…',
  'Sequencing it so it reads in order…',
  'Cutting the one that wanted the spotlight…',
  'Checking nothing breaks the spell…',
  'Letting the ending arrive slowly…',
] as const;

/** A draft that fails to parse is dropped rather than sent — the server can re-derive it. */
function parseDraft<T>(schema: z.ZodType<T>, raw?: string): T | undefined {
  if (!raw) return undefined;
  try {
    return schema.safeParse(JSON.parse(raw)).data;
  } catch {
    return undefined;
  }
}

export default function PlaylistScreen() {
  const {
    googleBooksId = '',
    bookId,
    playlistId = '',
    manualBook: manualBookParam,
    profile,
    context,
  } = useLocalSearchParams<{
    googleBooksId?: string;
    bookId?: string;
    playlistId?: string;
    manualBook?: string;
    profile?: string;
    context?: string;
  }>();

  const { data: book } = useBook(googleBooksId);
  // A re-score's book, already cached by the mood screen that sent it here.
  const { data: rescored } = useSavedPlaylist(playlistId);
  const { mutate, data: playlist, error } = useGeneratePlaylist();

  // Memoised so the effect below is not re-armed by a fresh object on every render.
  const manualBook = useMemo(
    () => parseDraft(ManualBookSchema, manualBookParam),
    [manualBookParam],
  );
  const moodProfile = useMemo(() => parseDraft(MoodProfileSchema, profile), [profile]);
  const readingContext = useMemo(() => parseDraft(ReadingContextSchema, context), [context]);

  // The catalogue's title, or the one the reader typed.
  const scoring = book?.title ?? rescored?.book.title ?? manualBook?.title;

  // Fired from an effect because generation is a write with no user gesture behind it on
  // this screen — the gesture was `Generate playlist →` on the one before. The ref keeps
  // a re-render from starting a second playlist.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || (!googleBooksId && !manualBook && !bookId)) return;
    started.current = true;

    let request: GeneratePlaylistRequest;
    if (bookId) request = { bookId, moodProfile, readingContext };
    else if (manualBook) request = { manualBook, moodProfile, readingContext };
    else request = { googleBooksId, moodProfile, readingContext };
    mutate(request);
  }, [googleBooksId, bookId, manualBook, moodProfile, readingContext, mutate]);

  if (error) {
    const message = isApiError(error) ? error.message : 'Something went wrong.';

    return (
      <ScoringScreen>
        <View className="gap-[10px] pt-2">
          <Text className="font-display text-[19px] leading-[25px] text-foreground">
            We couldn&apos;t score this one.
          </Text>
          <Text className="font-body text-body-sm text-ink-muted">{message}</Text>
        </View>
      </ScoringScreen>
    );
  }

  if (!playlist) {
    return (
      <ScoringScreen>
        <ScoringProgress
          gradient={moodGradient(moodProfile?.mood ?? [])}
          title={scoring ? `Scoring ${scoring}…` : 'Scoring it now…'}
          steps={GENERATE_STEPS}
          asides={GENERATE_ASIDES}
        />
      </ScoringScreen>
    );
  }

  // No `ScoringScreen`: the result's artwork is full-bleed, and that shell owns the
  // screen padding and the back control.
  return <PlaylistView playlist={playlist} />;
}
