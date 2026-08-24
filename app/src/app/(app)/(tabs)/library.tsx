import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackdrop } from '@/components/app-backdrop';
import { BookCover } from '@/components/book-cover';
import { EmptyLibrary } from '@/components/empty-library';
import { LibraryRow, LibrarySection } from '@/components/library-section';
import { ScreenFade } from '@/components/screen-fade';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Text } from '@/components/ui/text';
import { MIN_QUERY_LENGTH, useBookSearch } from '@/features/books/use-book-search';
import { bookMetaLine } from '@/lib/book-display';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { useTheme } from '@/lib/use-theme';

/**
 * Screen 4 — the handoff's library home. This is the Library tab and the entry
 * point to a new score: there is no separate library grid and no pushed search
 * screen. See "4. Library home (search)" in the handoff README, with
 * `Under Score App.dc.html` authoritative over it.
 *
 * The saved half of the screen is not built. `RECENT` and `YOUR PLAYLISTS` need
 * saved playlists, and nothing can create one until the scoring flow and
 * `GET /api/bookshelf` exist — so today the shelf is empty for everyone and the
 * screen renders its search half. That is a state the design already covers
 * rather than a stand-in: an empty shelf with no query is the heading and the
 * field, and a query goes straight to the Google Books fallback.
 */

/** The handoff's debounce before a query leaves the device for Google Books. */
const GOOGLE_DEBOUNCE_MS = 700;

/** Per the handoff's row spec. */
const COVER_WIDTH = 48;
const COVER_HEIGHT = 70;

/**
 * Hard-coded until `GET /api/bookshelf` exists. Typed rather than left literal so
 * the gating below stays a real rule instead of an expression TypeScript folds
 * away; when the bookshelf lands this becomes the hook's filtered count and
 * nothing else here changes.
 */
const savedMatchCount: number = 0;

/**
 * Distinct from `savedMatchCount`: a shelf with books that none of them match is
 * a search miss, not an empty library, and the two say different things. Same
 * hard-coding, same reason for the explicit type.
 */
const libraryEmpty: boolean = true;

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const settled = useDebouncedValue(trimmed, GOOGLE_DEBOUNCE_MS);

  const longEnough = trimmed.length >= MIN_QUERY_LENGTH;
  // Google is the fallback, not the first stop: it runs only once the shelf has
  // nothing matching what was typed.
  const fallbackActive = settled.length >= MIN_QUERY_LENGTH && savedMatchCount === 0;
  const search = useBookSearch(fallbackActive ? settled : '');
  const googleHits = fallbackActive ? (search.data ?? []) : [];

  // Gated on any non-empty query rather than on `longEnough`, matching the
  // prototype: one character shows the searching state while `MIN_QUERY_LENGTH`
  // still holds the request back, so the screen says it is searching as it waits
  // for a second character.
  const searching =
    !!trimmed && savedMatchCount === 0 && (!longEnough || settled !== trimmed || search.isFetching);
  const failed = fallbackActive && !search.isFetching && search.isError;
  const noResults =
    longEnough && savedMatchCount === 0 && !searching && !failed && googleHits.length === 0;

  const sectionLabel = !trimmed
    ? 'Your playlists'
    : savedMatchCount > 0
      ? 'In your library'
      : searching
        ? 'Searching Google Books…'
        : failed
          ? 'Search unavailable'
          : googleHits.length > 0
            ? 'New · from Google Books'
            : 'No results';

  const showSection = savedMatchCount > 0 || !!trimmed;

  // `libraryEmpty && !q` in the prototype — a query replaces this with the
  // search's own states, so the two are never on screen together.
  const showEmptyLibrary = libraryEmpty && !trimmed;

  return (
    <View
      className="flex-1"
      style={{
        paddingTop: insets.top + 6,
        // No safe-area inset: the tab bar below already applies it, and taking it
        // here too would reserve the home indicator's space twice.
        paddingBottom: 20,
      }}>
      <AppBackdrop />

      <ScreenFade style={styles.content}>
        <View className="px-screen flex-1 gap-4">
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
            {showEmptyLibrary && <EmptyLibrary />}

            {/* `RECENT` — up to three in-progress playlists, current book first —
                slots in here once the bookshelf endpoint exists. */}

            {showSection && (
              <LibrarySection label={sectionLabel}>
                {googleHits.map((book) => (
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
                        width={COVER_WIDTH}
                        height={COVER_HEIGHT}
                      />
                    }
                  />
                ))}
              </LibrarySection>
            )}

            {/* Not a state the handoff specifies, but `/api/books/search` answers 502
                when Google Books is down, and showing "no match" there would blame
                the query for an outage. */}
            {failed && (
              <View className="gap-[10px] px-1 pt-5 pb-1">
                <Text className="text-foreground font-display text-[19px] leading-[25px]">
                  Search is unavailable right now.
                </Text>
                <Text className="text-ink-muted font-body text-body-sm">
                  Google Books didn’t answer. Try again in a moment.
                </Text>
              </View>
            )}

            {noResults && (
              <View className="gap-[10px] px-1 pt-5 pb-1">
                <Text className="text-foreground font-display text-[19px] leading-[25px]">
                  No match for “{trimmed}”.
                </Text>
                <Text className="text-ink-muted font-body text-body-sm">
                  It isn’t in your library, and Google Books came back empty. Add it by hand — title,
                  mood and pacing are all it needs.
                </Text>
              </View>
            )}
          </ScrollView>

        {/* Pinned in this state only — a change from the previous handoff, where the
            by-hand button sat below the list on every state of the screen. */}
          {noResults && (
            <Button variant="secondary" size="lg" onPress={() => router.push('/score-by-hand')}>
              <Plus size={16} strokeWidth={2.2} color={theme.ink} style={styles.plus} />
              <Text>Add manually</Text>
            </Button>
          )}
        </View>
      </ScreenFade>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  plus: { marginRight: 8 },
});
