import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { BookCover } from '@/components/book-cover';
import { BookFacts } from '@/components/book-facts';
import { ExpandableText } from '@/components/expandable-text';
import { ScoringScreen } from '@/components/scoring-screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useBook } from '@/features/books/use-book';
import { isApiError } from '@/lib/api-client';
import { bookDetailMetaLine, bookFacts, plainText } from '@/lib/book-display';

/**
 * Book detail — the first step of the scoring flow, reached from a search row on
 * the library home. The book and what the catalogue knows about it, then into
 * the mood step.
 *
 * It asks for nothing. The mood controls that briefly lived here now belong to
 * the mood screen, which leaves this screen purely a confirmation that the right
 * book was picked — so `Analyze →` is live the moment it renders.
 */

const COVER_WIDTH = 108;
const COVER_HEIGHT = 158;
/** Book detail draws the cover at 8px, where a library row uses 6px. */
const COVER_RADIUS = 8;

const CONTENT_GAP = 18;

/** The design collapses the blurb to three lines, with `More` to open it out. */
const BLURB_LINES = 3;

export default function BookDetailScreen() {
  const { googleBooksId } = useLocalSearchParams<{ googleBooksId: string }>();
  const { data: book, error } = useBook(googleBooksId);

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
  const facts = bookFacts(book);

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

        {facts.length > 0 && (
          <>
            <View className="bg-border h-px" />
            <BookFacts facts={facts} />
          </>
        )}
      </ScrollView>

      <View className="pt-4">
        <Button
          size="lg"
          onPress={() => router.push({ pathname: '/mood', params: { googleBooksId } })}>
          <Text>Analyze →</Text>
        </Button>
      </View>
    </ScoringScreen>
  );
}
