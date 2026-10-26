import {
  BOOK_FORMATS,
  BY_HAND_GENRES,
  ERAS,
  MAX_GENRES,
  MAX_MANUAL_BOOK_FIELD_LENGTH,
  MAX_MOODS,
  MOODS,
  MoodProfileSchema,
  PACING_LABELS,
  SETTINGS,
  type BookFormat,
  type Era,
  type Genre,
  type ManualBook,
  type Mood,
  type MoodProfile,
  type ReadingContext,
  type Setting,
} from '@underscore/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ChipMultiSelect } from '@/components/chip-multi-select';
import { CoverEmojiField } from '@/components/cover-emoji-field';
import { OptionGroup } from '@/components/option-group';
import { ScoringScreen } from '@/components/scoring-screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { MOOD_INK, moodGradient } from '@/lib/gradients';
import { CONTENT_GAP } from '@/lib/theme';

/**
 * Scoring a book the catalogue never had. The reader states what the Mood Engine would
 * otherwise read off a volume, so nothing here is analysed — the CTA goes straight to
 * generation.
 */

const PACINGS = MoodProfileSchema.shape.pacing.options;

/** Only `lyrics` has a state worth sending unasked; the rest are absent until answered. */
const NO_CONTEXT: ReadingContext = { lyrics: false };

/** The prototype's own starting selection, and what keeps `genre` non-empty from the first paint. */
const SEED_GENRE: Genre = 'Literary fiction';

const capitalize = (word: string) => word[0].toUpperCase() + word.slice(1);

type Draft = {
  title: string;
  author: string;
  coverEmoji?: string;
  genre: Genre[];
  genreOther?: string;
  mood: Mood[];
  moodOther?: string;
  pacing: MoodProfile['pacing'];
};

export default function ScoreByHandScreen() {
  // Seeded from the query the library was searching, as the prototype's `startManual` does.
  const { title } = useLocalSearchParams<{ title?: string }>();

  const [draft, setDraft] = useState<Draft>({
    title: title ?? '',
    author: '',
    genre: [SEED_GENRE],
    mood: [],
    pacing: 'steady',
  });
  const [context, setContext] = useState<ReadingContext>(NO_CONTEXT);

  const set = (next: Partial<Draft>) => setDraft({ ...draft, ...next });
  const setDetail = (next: Partial<ReadingContext>) => setContext({ ...context, ...next });

  const generate = () => {
    const manualBook: ManualBook = {
      title: draft.title.trim() || undefined,
      author: draft.author.trim() || undefined,
      genre: draft.genre,
      coverEmoji: draft.coverEmoji,
    };

    // No `summary`: Claude writes one for a book it was asked to read, and this one it
    // was not. An unpicked mood stays empty rather than defaulting — the prompt renders
    // that as `unspecified` and lets Claude infer it from the title and genre.
    const profile: MoodProfile = {
      genre: draft.genre,
      genreOther: draft.genreOther?.trim() || undefined,
      mood: draft.mood,
      moodOther: draft.moodOther?.trim() || undefined,
      pacing: draft.pacing,
      summary: '',
    };

    router.push({
      pathname: '/playlist',
      params: {
        manualBook: JSON.stringify(manualBook),
        profile: JSON.stringify(profile),
        context: JSON.stringify(context),
      },
    });
  };

  return (
    <ScoringScreen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ gap: CONTENT_GAP }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <CoverEmojiField
          emoji={draft.coverEmoji}
          onChange={(coverEmoji) => set({ coverEmoji })}
          title={draft.title}
          author={draft.author}
          genre={draft.genre[0] ?? SEED_GENRE}
          moods={draft.mood}
        />

        <View className="gap-[9px]">
          <Text className="font-mono text-eyebrow uppercase tracking-eyebrow text-ink-faint">
            Title
          </Text>
          <Input
            value={draft.title}
            onChangeText={(next) => set({ title: next })}
            placeholder="What are you reading?"
            accessibilityLabel="Title"
            maxLength={MAX_MANUAL_BOOK_FIELD_LENGTH}
          />

          <Text className="mt-1 font-mono text-eyebrow uppercase tracking-eyebrow text-ink-faint">
            Author
          </Text>
          <Input
            value={draft.author}
            onChangeText={(next) => set({ author: next })}
            placeholder="Who wrote it?"
            accessibilityLabel="Author"
            maxLength={MAX_MANUAL_BOOK_FIELD_LENGTH}
          />
        </View>

        <ChipMultiSelect
          label="Genre · pick up to three"
          options={BY_HAND_GENRES}
          values={draft.genre}
          onChange={(genre) => set({ genre })}
          max={MAX_GENRES}
          // `ManualBook.genre` is what keeps the profile's genre non-empty, so the last
          // one cannot come off.
          min={1}
          otherValue={draft.genreOther}
          onOtherChange={(genreOther) => set({ genreOther })}
          otherPlaceholder="Which genre?"
        />

        <ChipMultiSelect
          label="Mood · pick up to two"
          options={MOODS}
          values={draft.mood}
          onChange={(mood) => set({ mood })}
          max={MAX_MOODS}
          labelFor={capitalize}
          gradientFor={(mood) => moodGradient([mood])}
          inkFor={(mood) => MOOD_INK[mood]}
          otherValue={draft.moodOther}
          onOtherChange={(moodOther) => set({ moodOther })}
          otherPlaceholder="How does it feel?"
        />

        <OptionGroup
          label="Pacing"
          options={PACINGS}
          value={draft.pacing}
          onChange={(pacing) => pacing && set({ pacing })}
          required
          labelFor={(pacing) => PACING_LABELS[pacing]}
        />

        <View className="h-px bg-border" />

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
        <Button size="lg" onPress={generate}>
          <Text>Generate playlist →</Text>
        </Button>
      </View>
    </ScoringScreen>
  );
}
