import {
  MoodProfileSchema,
  ReadingContextSchema,
  type GeneratePlaylistRequest,
} from '@underscore/shared';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { z } from 'zod';
import { ScrollView, View } from 'react-native';

import { ScoringProgress } from '@/components/scoring-progress';
import { ScoringScreen } from '@/components/scoring-screen';
import { Text } from '@/components/ui/text';
import { useBook } from '@/features/books/use-book';
import { useGeneratePlaylist } from '@/features/playlists/use-generate-playlist';
import { isApiError } from '@/lib/api-client';
import { moodGradient } from '@/lib/gradients';
import { CONTENT_GAP } from '@/lib/theme';

/**
 * The generation step. The design's waiting screen is built; the result it lands on is
 * not, so the tracks are listed as plain text until that screen exists.
 *
 * The mood screen hands over the profile the user actually saw, corrections included.
 * When it is missing — a deep link, or a reload — the server runs the Mood Engine
 * itself, which is why `moodProfile` is optional on the request.
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
  const { googleBooksId, profile, context } = useLocalSearchParams<{
    googleBooksId: string;
    profile?: string;
    context?: string;
  }>();

  const { data: book } = useBook(googleBooksId);
  const { mutate, data: playlist, error } = useGeneratePlaylist();

  // Memoised so the effect below is not re-armed by a fresh object on every render.
  const moodProfile = useMemo(() => parseDraft(MoodProfileSchema, profile), [profile]);
  const readingContext = useMemo(() => parseDraft(ReadingContextSchema, context), [context]);

  // Fired from an effect because generation is a write with no user gesture behind it on
  // this screen — the gesture was `Generate playlist →` on the one before. The ref keeps
  // a re-render from starting a second playlist.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !googleBooksId) return;
    started.current = true;

    const request: GeneratePlaylistRequest = {
      googleBooksId,
      moodProfile,
      readingContext,
    };
    mutate(request);
  }, [googleBooksId, moodProfile, readingContext, mutate]);

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
          title={book ? `Scoring ${book.title}…` : 'Scoring it now…'}
          steps={GENERATE_STEPS}
          asides={GENERATE_ASIDES}
        />
      </ScoringScreen>
    );
  }

  return (
    <ScoringScreen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ gap: CONTENT_GAP }}
        showsVerticalScrollIndicator={false}>
        <Text className="font-display text-[30px] leading-[34px] tracking-tight text-foreground">
          {playlist.name}
        </Text>

        {/* Plain text until the design's result screen is built. */}
        <View className="gap-2">
          {playlist.tracks.map(({ track, position }) => (
            <Text key={position} className="font-body text-body-sm text-ink-muted">
              {track.name} - {track.artist}
            </Text>
          ))}
        </View>

        {playlist.isTooShort && (
          <Text className="font-body text-body-sm text-ink-faint">
            A smaller playlist than usual — fewer tracks than expected turned up on Spotify.
          </Text>
        )}
      </ScrollView>
    </ScoringScreen>
  );
}
