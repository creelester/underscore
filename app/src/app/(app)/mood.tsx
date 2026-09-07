import {
  BOOK_FORMATS,
  ERAS,
  MAX_MOODS,
  MOODS,
  SETTINGS,
  SOMETHING_ELSE,
  type BookFormat,
  type Era,
  MoodProfileSchema,
  type Mood,
  type MoodProfile,
  type ReadingContext,
  type Setting,
} from '@underscore/shared';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { OptionGroup } from '@/components/option-group';
import { OtherInput } from '@/components/other-input';
import { ScoringScreen } from '@/components/scoring-screen';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { useBook } from '@/features/books/use-book';
import { useMoodProfile } from '@/features/mood/use-mood-profile';
import { isApiError } from '@/lib/api-client';
import { MOOD_INK, PACING_LABELS, moodGradient } from '@/lib/gradients';
import { MOTION, RADIUS } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

/**
 * The mood step — Claude's read said back in one sentence over a gradient panel, with
 * the chips that correct it. Everything above `Fine-tune` is the profile that goes to
 * the Playlist Builder verbatim; everything below is optional context that only shapes
 * the tracks.
 */

const CONTENT_GAP = 14;

const PANEL_HEIGHT = 118;

/** Over a cover the gradient tints rather than replaces it. */
const GRADIENT_OVER_COVER = 0.5;

/** The correctable half of a profile — what `Reset` puts back. */
type Correction = Pick<MoodProfile, 'mood' | 'pacing'>;

/** Read off the schema rather than restated, so the pills cannot drift from the wire. */
const PACINGS = MoodProfileSchema.shape.pacing.options;

const NO_CONTEXT: ReadingContext = {
  lyrics: false,
  moodOther: null,
  format: null,
  setting: null,
  settingOther: null,
  era: null,
  eraOther: null,
};

const capitalize = (word: string) => word[0].toUpperCase() + word.slice(1);

function LoadingBody() {
  return (
    <>
      <Skeleton className="rounded-card" style={{ height: PANEL_HEIGHT }} />
      <Skeleton className="h-[19px] w-3/4" />
      <Skeleton className="h-[14px] w-full" />
    </>
  );
}

export default function MoodScreen() {
  const { googleBooksId } = useLocalSearchParams<{ googleBooksId: string }>();
  const { data: profile, error } = useMoodProfile(googleBooksId);
  // Usually already cached by book detail; the panel just falls back to the gradient.
  const { data: book } = useBook(googleBooksId);
  const { shadows } = useTheme();

  // Held as an override rather than seeded from the profile, so `Reset` is dropping it
  // and no effect is needed to resync when the query resolves.
  const [override, setOverride] = useState<Correction | null>(null);
  const [context, setContext] = useState<ReadingContext>(NO_CONTEXT);

  if (error) {
    // A volume Google no longer knows is not worth a retry.
    const isMissing = isApiError(error) && error.code === 'BOOK_NOT_FOUND';

    return (
      <ScoringScreen contentGap={CONTENT_GAP} eyebrow="STEP 02 · MOOD">
        <View className="gap-[10px] pt-2">
          <Text className="text-foreground font-display text-[19px] leading-[25px]">
            {isMissing ? 'This book has gone missing.' : "We couldn't read this one."}
          </Text>
          <Text className="text-ink-muted font-body text-body-sm">
            {isMissing
              ? 'Google Books no longer lists it. Search again, or add it by hand.'
              : 'The analysis did not come back. Try again in a moment.'}
          </Text>
        </View>
      </ScoringScreen>
    );
  }

  const current: Correction = override ??
    (profile ? { mood: profile.mood, pacing: profile.pacing } : { mood: [], pacing: 'steady' });

  const cover = book?.thumbnailUrl;
  const gradient = moodGradient(current.mood);
  const sentence = [...current.mood.map(capitalize), PACING_LABELS[current.pacing]].join(' · ');

  // A third pick drops the oldest rather than being refused: the design's chips give no
  // signal that the cap has been hit, so a dead press would read as a broken control.
  const toggleMood = (mood: Mood) =>
    setOverride({
      ...current,
      mood: current.mood.includes(mood)
        ? current.mood.filter((selected) => selected !== mood)
        : [...current.mood.slice(1 - MAX_MOODS), mood],
    });

  const setDetail = (next: Partial<ReadingContext>) => setContext({ ...context, ...next });

  return (
    <ScoringScreen contentGap={CONTENT_GAP} eyebrow="STEP 02 · MOOD">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ gap: CONTENT_GAP }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text className="text-foreground font-display text-[30px] leading-[34px] tracking-tight">
          Here&apos;s how it reads.
        </Text>

        {!profile ? (
          <LoadingBody />
        ) : (
          <>
            <View
              style={{
                height: PANEL_HEIGHT,
                borderRadius: RADIUS.card,
                overflow: 'hidden',
                boxShadow: shadows.soft,
              }}>
              {!!cover && (
                <Image
                  source={cover}
                  alt={book?.title}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={MOTION.durMed}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <LinearGradient
                {...gradient}
                style={[StyleSheet.absoluteFill, !!cover && { opacity: GRADIENT_OVER_COVER }]}
              />
            </View>

            <Text className="text-foreground font-display text-[19px] leading-[26px]">
              {sentence}
            </Text>

            {!!profile.summary && (
              <Text className="text-ink-muted font-body text-body-sm">{profile.summary}</Text>
            )}

            <View className="bg-border h-px" />

            <Text className="text-foreground font-display text-[17px]">
              Fine-tune to sharpen the score
            </Text>

            <View className="gap-[9px]">
              <View className="flex-row items-center justify-between">
                <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow uppercase">
                  Mood · change if it&apos;s off
                </Text>
                <Button variant="text" size="sm" onPress={() => setOverride(null)}>
                  <Text>Reset</Text>
                </Button>
              </View>

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

                {/* Additive, not a third pick: its text rides in the reading context,
                    so the closed vocabulary behind the gradient stays closed. */}
                <Chip
                  label={SOMETHING_ELSE}
                  isSelected={context.moodOther !== null}
                  onPress={() => setDetail({ moodOther: context.moodOther === null ? '' : null })}
                />
              </View>

              {context.moodOther !== null && (
                <OtherInput
                  value={context.moodOther}
                  onChangeText={(moodOther) => setDetail({ moodOther })}
                  placeholder="How would you put it?"
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
                <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow uppercase">
                  Lyrics
                </Text>
                <Text className="text-ink-muted font-body text-[13px]">
                  Include music with lyrics
                </Text>
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
              onChange={(format: BookFormat | null) => setDetail({ format })}
            />

            <OptionGroup
              label="Setting"
              options={SETTINGS}
              value={context.setting}
              onChange={(setting: Setting | null) => setDetail({ setting })}
              otherValue={context.settingOther ?? ''}
              onOtherChange={(settingOther) => setDetail({ settingOther })}
              otherPlaceholder="Where is it set?"
            />

            <OptionGroup
              label="Era"
              options={ERAS}
              value={context.era}
              onChange={(era: Era | null) => setDetail({ era })}
              otherValue={context.eraOther ?? ''}
              onOtherChange={(eraOther) => setDetail({ eraOther })}
              otherPlaceholder="Which era? e.g. the 1970s"
            />
          </>
        )}
      </ScrollView>

      <View className="pt-4">
        <Button
          size="lg"
          disabled={!profile}
          onPress={() => router.push({ pathname: '/playlist', params: { googleBooksId } })}>
          <Text>Generate playlist →</Text>
        </Button>
      </View>
    </ScoringScreen>
  );
}
