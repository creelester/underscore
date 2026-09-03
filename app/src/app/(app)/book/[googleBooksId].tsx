import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { BookCover } from '@/components/book-cover';
import { ExpandableText } from '@/components/expandable-text';
import { OptionGroup } from '@/components/option-group';
import { ProgressSlider } from '@/components/progress-slider';
import { ScoringScreen } from '@/components/scoring-screen';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { useBook } from '@/features/books/use-book';
import { isApiError } from '@/lib/api-client';
import { bookDetailMetaLine, plainText } from '@/lib/book-display';
import {
  FORMAT_LABEL,
  LYRICS_LABEL,
  READING_FORMATS,
  SETTING_LABEL,
  SETTINGS,
  type ReadingFormat,
  type Setting,
} from '@/lib/reading-details';

/**
 * Book detail — the first step of the scoring flow, reached from a search row on
 * the library home. Cover, blurb and the reading position, then into the mood
 * step.
 *
 * Progress is a slider and never a chapter number: the design is explicit that
 * casual readers don't track those, and the caption says roughly is fine.
 */

const COVER_WIDTH = 108;
const COVER_HEIGHT = 158;
/** Book detail draws the cover at 8px, where a library row uses 6px. */
const COVER_RADIUS = 8;

const CONTENT_GAP = 18;

/**
 * How much of the blurb shows before it has to be opened out. Enough to read
 * past Google's award-and-press preamble into the actual description, without
 * the jacket copy burying the controls underneath it.
 */
const BLURB_LINES = 5;

/** A book being started, not resumed — the honest default for a first score. */
const INITIAL_PROGRESS = 0;

export default function BookDetailScreen() {
  const { googleBooksId } = useLocalSearchParams<{ googleBooksId: string }>();
  const { data: book, error } = useBook(googleBooksId);
  const [progress, setProgress] = useState(INITIAL_PROGRESS);
  const [format, setFormat] = useState<ReadingFormat | null>(null);
  const [setting, setSetting] = useState<Setting | null>(null);
  const [isLyricsWelcome, setIsLyricsWelcome] = useState(false);

  if (error) {
    // A volume Google no longer knows is not a retry — say so, rather than
    // inviting one. Anything else reached us as a transport or upstream failure.
    const isMissing = isApiError(error) && error.code === 'BOOK_NOT_FOUND';

    return (
      <ScoringScreen contentGap={CONTENT_GAP}>
        <View className="gap-[10px] pt-2">
          <Text className="text-foreground font-display text-[19px] leading-[25px]">
            {isMissing ? 'This book has gone missing.' : 'This book is unavailable right now.'}
          </Text>
          <Text className="text-ink-muted font-body text-body-sm">
            {isMissing
              ? 'Google Books no longer lists it. Search again, or add it by hand.'
              : 'Try again in a moment.'}
          </Text>
        </View>
      </ScoringScreen>
    );
  }

  // No spinner: arriving from a search row seeds this from cache and paints at
  // once, so the only thing a loading state could do here is flash.
  if (!book) return <ScoringScreen contentGap={CONTENT_GAP} />;

  const author = book.authors.join(', ');
  const meta = bookDetailMetaLine(book);

  return (
    <ScoringScreen contentGap={CONTENT_GAP}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ gap: CONTENT_GAP }}
        showsVerticalScrollIndicator={false}>
        <View className="flex-row items-start gap-[18px]">
          <BookCover
            googleBooksId={book.googleBooksId}
            thumbnailUrl={book.thumbnailUrl}
            title={book.title}
            width={COVER_WIDTH}
            height={COVER_HEIGHT}
            radius={COVER_RADIUS}
          />

          <View className="min-w-0 flex-1 gap-2">
            <Text className="text-foreground font-display text-title">{book.title}</Text>

            {!!author && (
              <Text className="text-ink-muted font-body text-body-sm">{author}</Text>
            )}

            {/* Mixed case, unlike the app's other eyebrows — see `bookDetailMetaLine`. */}
            {!!meta && (
              <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow font-bold">
                {meta}
              </Text>
            )}
          </View>
        </View>

        {!!book.description && (
          <ExpandableText collapsedLines={BLURB_LINES}>
            {plainText(book.description)}
          </ExpandableText>
        )}

        <View className="bg-border h-px" />

        <View className="gap-[14px]">
          <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow font-bold uppercase">
            Where are you?
          </Text>

          <View className="flex-row items-center gap-4">
            <ProgressSlider
              value={progress}
              onValueChange={setProgress}
              accessibilityLabel="Where are you in the book?"
            />
            <Text className="text-foreground font-mono min-w-[44px] text-right text-[15px] font-semibold">
              {progress}%
            </Text>
          </View>

          <Text className="text-ink-faint font-body text-body-sm">
            Roughly is fine. It decides which part of the story gets scored.
          </Text>
        </View>

        <View className="bg-border h-px" />

        <View className="gap-4">
          <OptionGroup
            label={FORMAT_LABEL}
            options={READING_FORMATS}
            value={format}
            onChange={setFormat}
          />

          <OptionGroup
            label={SETTING_LABEL}
            options={SETTINGS}
            value={setting}
            onChange={setSetting}
          />

          <View className="flex-row items-center justify-between gap-4">
            <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow font-bold uppercase">
              {LYRICS_LABEL}
            </Text>
            <Switch
              checked={isLyricsWelcome}
              onCheckedChange={setIsLyricsWelcome}
              accessibilityLabel="Lyrics welcome"
            />
          </View>
        </View>
      </ScrollView>

      <View className="pt-4">
        <Button
          size="lg"
          onPress={() =>
            router.push({
              pathname: '/mood',
              params: {
                googleBooksId: book.googleBooksId,
                progress: String(progress),
                ...(format && { format }),
                ...(setting && { setting }),
                ...(isLyricsWelcome && { lyrics: 'true' }),
              },
            })
          }>
          <Text>Analyze →</Text>
        </Button>
      </View>
    </ScoringScreen>
  );
}
