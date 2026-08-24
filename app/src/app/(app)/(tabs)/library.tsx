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

/** 48 × 70 with a 6px radius, per the row spec. */
const COVER_WIDTH = 48;
const COVER_HEIGHT = 70;

/**
 * How many saved playlists match the current query. Hard-coded until
 * `GET /api/bookshelf` exists; typed `number` so the rules below are the real
 * ones rather than expressions TypeScript can fold away.
 *
 * When the bookshelf lands this becomes the hook's filtered count, the `RECENT`
 * section slots in above the one below, and nothing else here has to change:
 * Google is already gated on the shelf coming back empty.
 */
const savedMatchCount: number = 0;

/**
 * Whether the shelf has nothing on it at all. Distinct from `savedMatchCount`,
 * which is how many saved playlists match the *current query* — a shelf with
 * books on it that none of them match is a search miss, not an empty library,
 * and the two states say different things.
 *
 * Hard-coded alongside the count above until `GET /api/bookshelf` exists, and
 * typed `boolean` for the same reason: so the gating below stays a real rule
 * rather than an expression TypeScript folds away.
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

  // Both halves of the wait read as "searching": the debounce not yet caught up
  // with what has been typed, and the request itself in flight.
  //
  // Gated on any non-empty query rather than on `longEnough`, so a single
  // character still shows the labelled searching state the prototype shows —
  // which gates on a non-empty query throughout. `MIN_QUERY_LENGTH` stays on the
  // request itself: one character is still not worth a round trip, so the screen
  // says it is searching while it waits for a second character.
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

  // A section with nothing in it hides, label included.
  const showSection = savedMatchCount > 0 || !!trimmed;

  // `libraryEmpty && !q` in the prototype: the shelf is bare *and* nothing has
  // been typed. A query replaces this with the search's own states, so the two
  // can never be on screen together.
  const showEmptyLibrary = libraryEmpty && !trimmed;

  return (
    <View
      className="flex-1"
      style={{
        paddingTop: insets.top + 6,
        // A flat 20px, per the screen's own `6px 22px 20px`. The safe-area inset
        // belongs to the tab bar below this screen, which already applies it —
        // taking it here too would reserve the home indicator's space twice.
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
            // `flexGrow` so the empty state can take the full scroll area and
            // distribute itself down it, the way the prototype's `height:100%`
            // block does. Without it the container collapses to its content.
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
              {/* The prototype gives the glyph its own 8px margin on top of the
                  button's 8px gap, so the label sits 16px off it. */}
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
