import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { BookCover } from '@/components/book-cover';
import { ExpandableText } from '@/components/expandable-text';
import { OptionGroup } from '@/components/option-group';
import { ScoringScreen } from '@/components/scoring-screen';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { useBook } from '@/features/books/use-book';
import { isApiError } from '@/lib/api-client';
import { bookDetailMetaLine, plainText } from '@/lib/book-display';
import {
  BOOK_FORMATS,
  ERA_LABEL,
  ERA_OTHER_PLACEHOLDER,
  ERAS,
  FORMAT_LABEL,
  LYRICS_DESCRIPTION,
  LYRICS_LABEL,
  SECTION_SUBTITLE,
  SECTION_TITLE,
  SETTING_LABEL,
  SETTING_OTHER_PLACEHOLDER,
  SETTINGS,
  SOMETHING_ELSE,
  type BookFormat,
  type Era,
  type Setting,
} from '@/lib/reading-details';

/**
 * Book detail — the first step of the scoring flow, reached from a search row on
 * the library home. The book, then the optional context that sharpens the score.
 *
 * Nothing here is required. The design's governing constraint is that the happy
 * path asks for no input beyond naming the book, so every group starts
 * unanswered and `Analyze →` is live from the moment the screen is.
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

export default function BookDetailScreen() {
  const { googleBooksId } = useLocalSearchParams<{ googleBooksId: string }>();
  const { data: book, error } = useBook(googleBooksId);

  const [isLyricsWelcome, setIsLyricsWelcome] = useState(false);
  const [format, setFormat] = useState<BookFormat | null>(null);
  const [setting, setSetting] = useState<Setting | null>(null);
  const [settingOther, setSettingOther] = useState('');
  const [era, setEra] = useState<Era | null>(null);
  const [eraOther, setEraOther] = useState('');

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

  /** Free text only travels with the chip that opened its field. */
  const answered = {
    ...(isLyricsWelcome && { lyrics: 'true' }),
    ...(format && { format }),
    ...(setting && { setting }),
    ...(setting === SOMETHING_ELSE && settingOther && { settingOther }),
    ...(era && { era }),
    ...(era === SOMETHING_ELSE && eraOther && { eraOther }),
  };

  return (
    <ScoringScreen contentGap={CONTENT_GAP}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ gap: CONTENT_GAP }}
        keyboardShouldPersistTaps="handled"
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

            {!!author && <Text className="text-ink-muted font-body text-body-sm">{author}</Text>}

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
          <View className="gap-1">
            <Text className="text-foreground font-display text-[17px]">{SECTION_TITLE}</Text>
            <Text className="text-ink-muted font-body text-body-sm">{SECTION_SUBTITLE}</Text>
          </View>

          <View className="gap-4">
            <View className="flex-row items-center justify-between gap-4">
              <View className="gap-1">
                <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow font-bold uppercase">
                  {LYRICS_LABEL}
                </Text>
                <Text className="text-ink-muted font-body text-body-sm">{LYRICS_DESCRIPTION}</Text>
              </View>
              <Switch
                checked={isLyricsWelcome}
                onCheckedChange={setIsLyricsWelcome}
                accessibilityLabel="Lyrics welcome"
              />
            </View>

            <OptionGroup
              label={FORMAT_LABEL}
              options={BOOK_FORMATS}
              value={format}
              onChange={setFormat}
            />

            <OptionGroup
              label={SETTING_LABEL}
              options={SETTINGS}
              value={setting}
              onChange={setSetting}
              otherValue={settingOther}
              onOtherChange={setSettingOther}
              otherPlaceholder={SETTING_OTHER_PLACEHOLDER}
            />

            <OptionGroup
              label={ERA_LABEL}
              options={ERAS}
              value={era}
              onChange={setEra}
              otherValue={eraOther}
              onOtherChange={setEraOther}
              otherPlaceholder={ERA_OTHER_PLACEHOLDER}
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
              params: { googleBooksId: book.googleBooksId, ...answered },
            })
          }>
          <Text>Analyze →</Text>
        </Button>
      </View>
    </ScoringScreen>
  );
}
