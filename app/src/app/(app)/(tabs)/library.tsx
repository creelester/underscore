import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BookCover } from '@/components/book-cover';
import { EmptyLibrary } from '@/components/empty-library';
import { LibraryRow, LibraryRowSkeleton, LibrarySection } from '@/components/library-section';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Text } from '@/components/ui/text';
import { MIN_QUERY_LENGTH, useBookSearch } from '@/features/books/use-book-search';
import { bookMetaLine } from '@/lib/book-display';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { useTheme } from '@/lib/use-theme';

/**
 * The library home — the Library tab and the entry point to a new score. There
 * is no separate library grid and no pushed search screen.
 *
 * The saved half of the screen is not built: `RECENT` and `YOUR PLAYLISTS` need
 * saved playlists, and nothing can create one until the scoring flow and
 * `GET /api/bookshelf` exist. So the shelf is empty for everyone and the screen
 * renders its search half — a state the design already covers rather than a
 * stand-in.
 */

const SEARCH_DEBOUNCE_MS = 700;

const BOOK_COVER_WIDTH = 48;
const BOOK_COVER_HEIGHT = 70;

/**
 * Enough to read as a list without standing in for a count the search has not
 * returned yet — `MAX_RESULTS` allows eight, and eight placeholders would claim
 * a full page every time.
 */
const SKELETON_ROWS = 3;

/**
 * TODO: replace with the filtered count from `GET /api/bookshelf` once the
 * bookshelf endpoint exists. Typed rather than left literal so the gating below
 * stays a real rule instead of an expression TypeScript folds away.
 */
const savedMatchCount: number = 0;

/**
 * TODO: derive from `GET /api/bookshelf` alongside `savedMatchCount`.
 *
 * Distinct from that count: a shelf with books that none of them match is a
 * search miss, not an empty library, and the two say different things.
 */
const isLibraryEmpty: boolean = true;

export default function LibraryScreen() {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const settled = useDebouncedValue(trimmed, SEARCH_DEBOUNCE_MS);

  const isLongEnough = trimmed.length >= MIN_QUERY_LENGTH;
  // The catalogue is the fallback, not the first stop: it runs only once the
  // shelf has nothing matching what was typed.
  const isFallbackActive = settled.length >= MIN_QUERY_LENGTH && savedMatchCount === 0;
  const search = useBookSearch(isFallbackActive ? settled : '');
  const results = isFallbackActive ? (search.data ?? []) : [];

  // Gated on any non-empty query rather than on `isLongEnough`, so one character
  // shows the searching state while `MIN_QUERY_LENGTH` still holds the request
  // back — the screen says it is searching as it waits for a second character.
  const isSearching =
    !!trimmed &&
    savedMatchCount === 0 &&
    (!isLongEnough || settled !== trimmed || search.isFetching);
  const isFailed = isFallbackActive && !search.isFetching && search.isError;
  const isNoMatch =
    isLongEnough && savedMatchCount === 0 && !isSearching && !isFailed && results.length === 0;

  const sectionLabel = !trimmed
    ? 'Your playlists'
    : savedMatchCount > 0
      ? 'In your library'
      : isSearching
        ? 'Searching…'
        : isFailed
          ? 'Search unavailable'
          : results.length > 0
            ? `Found ${results.length} ${results.length === 1 ? 'result' : 'results'}`
            : 'No results';

  // Gated on there being nothing to show rather than on `isSearching` alone, so
  // refining a term keeps the previous rows up until the debounce settles
  // instead of dropping to placeholders between every edit.
  const isSkeletonVisible = isSearching && results.length === 0;

  const isSectionVisible = savedMatchCount > 0 || !!trimmed;
  // A query replaces the empty state with the search's own states, so the two
  // are never on screen together.
  const isEmptyLibraryVisible = isLibraryEmpty && !trimmed;

  return (
    <View className="flex-1 gap-4">
      <Text className="text-foreground font-display text-[28px] leading-[31px] tracking-tight">
        Your library
      </Text>

      <SearchInput
        value={query}
        onChangeText={setQuery}
        onClear={() => setQuery('')}
        placeholder="Search your books, or any book"
        autoCorrect={false}
        returnKeyType="search"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ gap: 20, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {isEmptyLibraryVisible && <EmptyLibrary />}

        {/* `RECENT` — up to three in-progress playlists, current book first —
            slots in here once the bookshelf endpoint exists. */}

        {isSectionVisible && (
          <LibrarySection label={sectionLabel}>
            {isSkeletonVisible &&
              Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <LibraryRowSkeleton key={index} />
              ))}

            {results.map((book) => (
              <LibraryRow
                key={book.googleBooksId}
                title={book.title}
                meta={bookMetaLine(book)}
                onPress={() => router.push(`/book/${book.googleBooksId}`)}
                cover={
                  <BookCover
                    googleBooksId={book.googleBooksId}
                    thumbnailUrl={book.thumbnailUrl}
                    title={book.title}
                    width={BOOK_COVER_WIDTH}
                    height={BOOK_COVER_HEIGHT}
                  />
                }
              />
            ))}
          </LibrarySection>
        )}

        {/* `/api/books/search` answers 502 when the catalogue is down, and
            showing "no match" there would blame the query for an outage. */}
        {isFailed && (
          <View className="gap-[10px] px-1 pt-5 pb-1">
            <Text className="text-foreground font-display text-[19px] leading-[25px]">
              Search is unavailable right now.
            </Text>
            <Text className="text-ink-muted font-body text-body-sm">
              Try again in a moment.
            </Text>
          </View>
        )}

        {isNoMatch && (
          <View className="gap-[10px] px-1 pt-5 pb-1">
            <Text className="text-foreground font-display text-[19px] leading-[25px]">
              No match for “{trimmed}”.
            </Text>
            <Text className="text-ink-muted font-body text-body-sm">
              Add it by hand — title, mood and pacing are all it needs.
            </Text>
          </View>
        )}
      </ScrollView>

      {isNoMatch && (
        <Button variant="secondary" size="lg" onPress={() => router.push('/score-by-hand')}>
          <Plus size={16} strokeWidth={2.2} color={theme.ink} style={styles.plus} />
          <Text>Add manually</Text>
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  plus: { marginRight: 8 },
});
