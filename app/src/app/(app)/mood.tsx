import {
  BOOK_FORMATS,
  ERAS,
  MAX_MOODS,
  MOODS,
  PACING_LABELS,
  SETTINGS,
  OTHER,
  type BookFormat,
  type Era,
  MoodProfileSchema,
  type Mood,
  type MoodProfile,
  type ReadingContext,
  type Setting,
} from '@underscore/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { BookCover } from '@/components/book-cover';
import { MoodWash } from '@/components/mood-wash';
import { OptionGroup } from '@/components/option-group';
import { ScoringProgress } from '@/components/scoring-progress';
import { OtherInput } from '@/components/other-input';
import { ScoringScreen } from '@/components/scoring-screen';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { useBook } from '@/features/books/use-book';
import { useMoodProfile } from '@/features/mood/use-mood-profile';
import { isApiError } from '@/lib/api-client';
import { MOOD_INK, moodGradient } from '@/lib/gradients';
import { CONTENT_GAP } from '@/lib/theme';

const COVER_WIDTH = 118;
const COVER_HEIGHT = 177;
const COVER_RADIUS = 10;

/** The correctable half of a profile. */
type Correction = Pick<MoodProfile, 'mood' | 'pacing'>;

/** Read off the schema rather than restated, so the pills cannot drift from the wire. */
const PACINGS = MoodProfileSchema.shape.pacing.options;

/** Only `lyrics` has a state worth sending unasked; the rest are absent until answered. */
const NO_CONTEXT: ReadingContext = { lyrics: false };

const capitalize = (word: string) => word[0].toUpperCase() + word.slice(1);

/** The design's `analyzing` steps, which stand in for one request we get no milestones from. */
const ANALYZE_STEPS = [
  'Pulling the book’s details',
  'Reading tone and pacing',
  'Shaping a mood…',
] as const;

export default function MoodScreen() {
  const { googleBooksId } = useLocalSearchParams<{ googleBooksId: string }>();
  const { data: profile, error } = useMoodProfile(googleBooksId);
  // Usually already cached by book detail; the banner just falls back to the swatch.
  const { data: book } = useBook(googleBooksId);

  // Held as an override rather than seeded from the profile, so no effect is needed to
  // resync when the query resolves.
  const [override, setOverride] = useState<Correction | null>(null);
  const [context, setContext] = useState<ReadingContext>(NO_CONTEXT);

  if (error) {
    // A volume Google no longer knows is not worth a retry.
    const isMissing = isApiError(error) && error.code === 'BOOK_NOT_FOUND';

    return (
      <ScoringScreen>
        <View className="gap-[10px] pt-2">
          <Text className="font-display text-[19px] leading-[25px] text-foreground">
            {isMissing ? 'This book has gone missing.' : "We couldn't read this one."}
          </Text>
          <Text className="font-body text-body-sm text-ink-muted">
            {isMissing
              ? "We couldn't find this volume. Search again, or add it by hand."
              : 'There was a problem. Try again in a moment.'}
          </Text>

          {/* TODO(next iteration): offer the mood controls here so a book the catalogue
              has lost can still be scored by hand, rather than sending the user back to
              search. Needs the by-hand screen's genre step, which is not built yet. */}
        </View>
      </ScoringScreen>
    );
  }

  const current: Correction =
    override ??
    (profile ? { mood: profile.mood, pacing: profile.pacing } : { mood: [], pacing: 'steady' });

  const moodLines = [...current.mood.map(capitalize), PACING_LABELS[current.pacing]];

  const toggleMood = (mood: Mood) =>
    setOverride({
      ...current,
      mood: current.mood.includes(mood)
        ? current.mood.filter((selected) => selected !== mood)
        : [...current.mood, mood].slice(-MAX_MOODS),
    });

  const setDetail = (next: Partial<ReadingContext>) => setContext({ ...context, ...next });

  if (!profile) {
    return (
      <ScoringScreen>
        <ScoringProgress
          gradient={moodGradient(current.mood)}
          title={book ? `Reading ${book.title}…` : 'Reading the book…'}
          steps={ANALYZE_STEPS}
        />
      </ScoringScreen>
    );
  }

  return (
    <ScoringScreen>
      <MoodWash moods={current.mood} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ gap: CONTENT_GAP }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="w-full flex-none flex-row gap-3">
          <BookCover
            googleBooksId={googleBooksId}
            thumbnailUrl={book?.thumbnailUrl ?? null}
            title={book?.title ?? ''}
            width={COVER_WIDTH}
            height={COVER_HEIGHT}
            radius={COVER_RADIUS}
          />

          <View className="min-w-0 flex-1 gap-[5px] self-stretch">
            <Text className="font-display text-[22px] leading-[26px] tracking-tight text-foreground">
              {book?.title}
            </Text>

            <Text className="font-body text-body-sm text-foreground opacity-[0.82]">
              {book?.authors.join(', ')}
            </Text>

            <Text className="pt-[2px] font-mono text-eyebrow tracking-eyebrow text-foreground opacity-80">
              {profile.genre[0]}
            </Text>

            <View className="mt-auto gap-[2px]">
              {moodLines.map((line) => (
                <Text
                  key={line}
                  className="font-display text-[15px] leading-[20px] text-foreground opacity-[0.92]">
                  {line}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {!!profile.summary && (
          <Text className="font-body text-body-sm text-ink-muted">{profile.summary}</Text>
        )}

        <View className="h-px bg-border" />

        <Text className="font-display text-[17px] text-foreground">
          Fine-tune to sharpen the score
        </Text>

        <View className="gap-[9px]">
          <Text className="font-mono text-eyebrow uppercase tracking-eyebrow text-ink-faint">
            Mood
          </Text>

          <View className="flex-row flex-wrap gap-[9px]">
            {MOODS.map((mood) => (
              <Chip
                key={mood}
                label={capitalize(mood)}
                isSelected={current.mood.includes(mood)}
                onPress={() => toggleMood(mood)}
                gradient={moodGradient([mood])}
                ink={MOOD_INK[mood]}
              />
            ))}

            <Chip
              label={OTHER}
              isSelected={context.moodOther !== undefined}
              onPress={() =>
                setDetail({
                  moodOther: context.moodOther === undefined ? '' : undefined,
                })
              }
            />
          </View>

          {context.moodOther !== undefined && (
            <OtherInput
              value={context.moodOther}
              onChangeText={(moodOther) => setDetail({ moodOther })}
              placeholder="How does it feel?"
            />
          )}
        </View>

        <OptionGroup
          label="Pacing"
          options={PACINGS}
          value={current.pacing}
          onChange={(pacing) => pacing && setOverride({ ...current, pacing })}
          required
          labelFor={(pacing) => PACING_LABELS[pacing]}
        />

        <View className="flex-row items-center justify-between gap-4">
          <View className="gap-1">
            <Text className="font-mono text-eyebrow uppercase tracking-eyebrow text-ink-faint">
              Lyrics
            </Text>
            <Text className="font-body text-[13px] text-ink-muted">Include music with lyrics</Text>
          </View>
          <Switch
            checked={context.lyrics}
            onCheckedChange={(lyrics) => setDetail({ lyrics })}
            accessibilityLabel="Include music with lyrics"
          />
        </View>

        <OptionGroup
          label="Book format"
          options={BOOK_FORMATS}
          value={context.format}
          onChange={(format?: BookFormat) => setDetail({ format })}
        />

        <OptionGroup
          label="Setting"
          options={SETTINGS}
          value={context.setting}
          onChange={(setting?: Setting) => setDetail({ setting })}
          otherValue={context.settingOther ?? ''}
          onOtherChange={(settingOther) => setDetail({ settingOther })}
          otherPlaceholder="Where is it set?"
        />

        <OptionGroup
          label="Era"
          options={ERAS}
          value={context.era}
          onChange={(era?: Era) => setDetail({ era })}
          otherValue={context.eraOther ?? ''}
          onOtherChange={(eraOther) => setDetail({ eraOther })}
          otherPlaceholder="Which era? e.g. the 1970s"
        />
      </ScrollView>

      <View className="pt-4">
        <Button
          size="lg"
          onPress={() =>
            router.push({
              pathname: '/playlist',
              params: {
                googleBooksId,
                profile: JSON.stringify({ ...profile, ...current }),
                context: JSON.stringify(context),
              },
            })
          }>
          <Text>Generate playlist →</Text>
        </Button>
      </View>
    </ScoringScreen>
  );
}
