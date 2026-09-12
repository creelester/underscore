import type { Playlist } from '@underscore/shared';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { BookCover } from '@/components/book-cover';
import { EmptyLibrary } from '@/components/empty-library';
import {
  LibraryRow,
  LibraryRowSkeleton,
  LibrarySection,
} from '@/components/library-section';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Text } from '@/components/ui/text';
import { useBookshelf } from '@/features/bookshelf/use-bookshelf';
import {
  MIN_QUERY_LENGTH,
  useBookSearch,
} from '@/features/books/use-book-search';
import { bookMetaLine } from '@/lib/book-display';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { useTheme } from '@/lib/use-theme';

/**
 * The library home and the entry point to a new score; there is no separate grid or
 * pushed search screen. Saved playlists come first — the three newest under `RECENT`,
 * the rest under `YOUR PLAYLISTS` — and Google Books is the fallback, reached only
 * once the shelf has nothing matching the query.
 */

const SEARCH_DEBOUNCE_MS = 700;

const BOOK_COVER_WIDTH = 48;
const BOOK_COVER_HEIGHT = 70;

/** The design's `RECENT`, which holds three rows before the rest spill below it. */
const RECENT_COUNT = 3;

/**
 * Enough to read as a list without standing in for a count the search has not
 * returned yet — `MAX_RESULTS` allows eight, and eight placeholders would claim
 * a full page every time.
 */
const SKELETON_ROWS = 3;

/** `Book · Author`, the design's meta line under a playlist's name. */
function playlistMetaLine(playlist: Playlist): string {
  return [playlist.book.title, playlist.book.authors[0]]
    .filter((part): part is string => !!part)
    .join(' · ');
}

/** A playlist matches on its own name as readily as on the book behind it. */
function matches(playlist: Playlist, query: string): boolean {
  const haystack = [playlist.name, playlist.book.title, ...playlist.book.authors]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

export default function LibraryScreen() {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');

  const trimmed = query.trim();
  const settled = useDebouncedValue(trimmed, SEARCH_DEBOUNCE_MS);

  const bookshelf = useBookshelf();
  const saved = useMemo(() => {
    const playlists = bookshelf.data ?? [];
    const needle = trimmed.toLowerCase();
    return needle ? playlists.filter((playlist) => matches(playlist, needle)) : playlists;
  }, [bookshelf.data, trimmed]);

  // Filtered first, then split: refining a query re-fills `RECENT` from what is left
  // rather than leaving the three newest pinned above rows that match better.
  const recent = saved.slice(0, RECENT_COUNT);
  const rest = saved.slice(RECENT_COUNT);

  const isLongEnough = trimmed.length >= MIN_QUERY_LENGTH;
  // The catalogue is the fallback, and an unloaded shelf is not the same as an empty
  // one: searching Google before it lands would skip over a book already saved.
  const isShelfSettled = !bookshelf.isPending;
  const isFallbackActive =
    isShelfSettled && settled.length >= MIN_QUERY_LENGTH && saved.length === 0;
  const search = useBookSearch(isFallbackActive ? settled : '');
  const results = isFallbackActive ? (search.data ?? []) : [];

  // Any non-empty query, not `isLongEnough`: one character shows the searching state
  // while `MIN_QUERY_LENGTH` still holds the request back.
  const isSearching =
    !!trimmed &&
    saved.length === 0 &&
    (!isShelfSettled || !isLongEnough || settled !== trimmed || search.isFetching);
  const isFailed = isFallbackActive && !search.isFetching && search.isError;
  const isNoMatch =
    isLongEnough &&
    saved.length === 0 &&
    !isSearching &&
    !isFailed &&
    results.length === 0;

  let sectionLabel: string;
  if (!trimmed) {
    sectionLabel = 'Your playlists';
  } else if (saved.length > 0) {
    sectionLabel = 'In your library';
  } else if (isSearching) {
    sectionLabel = 'Searching…';
  } else if (isFailed) {
    sectionLabel = 'Search unavailable';
  } else if (results.length > 0) {
    const plural = results.length === 1 ? 'result' : 'results';
    sectionLabel = `Found ${results.length} ${plural}`;
  } else {
    sectionLabel = 'No results';
  }

  // Gated on there being nothing to show rather than on `isSearching` alone, so
  // refining a term keeps the previous rows up until the debounce settles
  // instead of dropping to placeholders between every edit.
  const isSkeletonVisible =
    (isSearching && results.length === 0) || (!isShelfSettled && !trimmed);

  // A shelf whose every match already fits in `RECENT` leaves nothing below it, so the
  // second section only earns its label once there are rows or a search to report.
  const isSectionVisible =
    rest.length > 0 || isSkeletonVisible || (!!trimmed && saved.length === 0);
  // A query replaces the empty state, so the two are never on screen together.
  const isEmptyLibraryVisible = isShelfSettled && saved.length === 0 && !trimmed;

  return (
    <View className='flex-1 gap-4'>
      <Text className='text-foreground font-display text-[28px] leading-[31px] tracking-tight'>
        Your library
      </Text>

      <SearchInput
        value={query}
        onChangeText={setQuery}
        onClear={() => setQuery('')}
        placeholder='Search your books, or any book'
        autoCorrect={false}
        returnKeyType='search'
      />

      <ScrollView
        className='flex-1'
        contentContainerStyle={{ gap: 20, flexGrow: 1 }}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        {isEmptyLibraryVisible && <EmptyLibrary />}

        {recent.length > 0 && (
          <LibrarySection label='Recent'>
            {recent.map((playlist) => (
              <SavedPlaylistRow key={playlist.id} playlist={playlist} />
            ))}
          </LibrarySection>
        )}

        {isSectionVisible && (
          <LibrarySection label={sectionLabel}>
            {isSkeletonVisible &&
              Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <LibraryRowSkeleton key={index} />
              ))}

            {rest.map((playlist) => (
              <SavedPlaylistRow key={playlist.id} playlist={playlist} />
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

        {/* Search answers 502 when the catalogue is down; "no match" would blame the
            query for an outage. */}
        {isFailed && (
          <View className='gap-[10px] px-1 pt-5 pb-1'>
            <Text className='text-foreground font-display text-[19px] leading-[25px]'>
              Search is unavailable right now.
            </Text>
            <Text className='text-ink-muted font-body text-body-sm'>
              Try again in a moment.
            </Text>
          </View>
        )}

        {isNoMatch && (
          <View className='gap-[10px] px-1 pt-5 pb-1'>
            <Text className='text-foreground font-display text-[19px] leading-[25px]'>
              No match for “{trimmed}”.
            </Text>
            <Text className='text-ink-muted font-body text-body-sm'>
              Add it by hand — title, mood and pacing are all it needs.
            </Text>
          </View>
        )}
      </ScrollView>

      {isNoMatch && (
        <Button
          variant='secondary'
          size='lg'
          onPress={() => router.push('/score-by-hand')}
        >
          <Plus
            size={16}
            strokeWidth={2.2}
            color={theme.ink}
            style={styles.plus}
          />
          <Text>Add manually</Text>
        </Button>
      )}
    </View>
  );
}

function SavedPlaylistRow({ playlist }: { playlist: Playlist }) {
  return (
    <LibraryRow
      title={playlist.name}
      meta={playlistMetaLine(playlist)}
      onPress={() => router.push(`/playlist/${playlist.id}`)}
      cover={
        <BookCover
          mood={playlist.moodProfile.mood[0]}
          thumbnailUrl={playlist.book.thumbnailUrl}
          title={playlist.book.title}
          width={BOOK_COVER_WIDTH}
          height={BOOK_COVER_HEIGHT}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  plus: { marginRight: 8 },
});
