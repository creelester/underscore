import {
  BOOK_FORMATS,
  ERAS,
  MAX_MOODS,
  MOODS,
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
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

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
import { MOOD_INK, PACING_LABELS, moodGradient } from '@/lib/gradients';
import { MOTION, RADIUS } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

/**
 * The mood step — Claude's read said back in one sentence over a gradient panel, with
 * the chips that correct it. Everything above `Fine-tune` is the profile that goes to
 * the Playlist Builder verbatim; everything below is optional context that only shapes
 * the tracks.
 */

/** Wider than the design's 14: with the fine-tune block below it, 14 ran the sections together. */
const CONTENT_GAP = 22;

/** The design's band, used when there is no cover to give the panel a shape of its own. */
const PANEL_HEIGHT = 118;

/** Over a cover the gradient tints rather than replaces it. */
const GRADIENT_OVER_COVER = 0.5;

/** The correctable half of a profile — what `Reset` puts back. */
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
          <Text className="font-display text-[19px] leading-[25px] text-foreground">
            {isMissing ? 'This book has gone missing.' : "We couldn't read this one."}
          </Text>
          <Text className="font-body text-body-sm text-ink-muted">
            {isMissing
              ? 'Google Books no longer lists it. Search again, or add it by hand.'
              : 'The analysis did not come back. Try again in a moment.'}
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

  if (!profile) {
    return (
      <ScoringScreen contentGap={CONTENT_GAP} eyebrow="STEP 02 · MOOD">
        <ScoringProgress
          gradient={gradient}
          title={book ? `Reading ${book.title}…` : 'Reading the book…'}
          steps={ANALYZE_STEPS}
        />
      </ScoringScreen>
    );
  }

  return (
    <ScoringScreen contentGap={CONTENT_GAP} eyebrow="STEP 02 · MOOD">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ gap: CONTENT_GAP }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text className="font-display text-[30px] leading-[34px] tracking-tight text-foreground">
          Here&apos;s how it reads.
        </Text>

        <View
          style={{
            height: PANEL_HEIGHT,
            borderRadius: RADIUS.card,
            overflow: 'hidden',
            boxShadow: shadows.soft,
          }}>
          <LinearGradient {...gradient} style={StyleSheet.absoluteFill} />

          {!!cover && (
            <>
              {/* `contain`, so a jacket keeps its proportions instead of being cropped
                  to the band; the gradient fills what it does not cover. */}
              <Image
                source={cover}
                alt={book?.title}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={MOTION.durMed}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                {...gradient}
                style={[StyleSheet.absoluteFill, { opacity: GRADIENT_OVER_COVER }]}
              />
            </>
          )}
        </View>

        <Text className="font-display text-[19px] leading-[26px] text-foreground">{sentence}</Text>

        {!!profile.summary && (
          <Text className="font-body text-body-sm text-ink-muted">{profile.summary}</Text>
        )}

        <View className="h-px bg-border" />

        <Text className="font-display text-[17px] text-foreground">
          Fine-tune to sharpen the score
        </Text>

        <View className="gap-[9px]">
          <View className="flex-row items-center justify-between">
            <Text className="font-mono text-eyebrow uppercase tracking-eyebrow text-ink-faint">
              Mood
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
              // The profile the user actually saw, corrections included, so generation
              // never runs a second read of the book that could differ from this screen.
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
