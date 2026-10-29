import type { Playlist } from '@underscore/shared';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Plus } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BookCover } from '@/components/book-cover';
import { LibraryRow, LibrarySection } from '@/components/library-section';
import { NowCard, NowCardSkeleton } from '@/components/now-card';
import { Text } from '@/components/ui/text';
import { useBookshelf } from '@/features/bookshelf/use-bookshelf';
import { isApiError } from '@/lib/api-client';
import { GRAD_WARM } from '@/lib/gradients';
import { moodSentence } from '@/lib/playlist-display';
import { pressed } from '@/lib/pressed';
import { CONTENT_GAP, RADIUS } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

const ADD_SIZE = 40;
const SECTION_TILE = 46;

export default function NowScreen() {
  const bookshelf = useBookshelf();
  const [current, ...older] = bookshelf.data ?? [];
  // There is no reading progress to cut a book into sections by, so a section is an
  // earlier score of the same book.
  const earlier = current ? older.filter((playlist) => playlist.book.id === current.book.id) : [];

  return (
    <View className="flex-1 gap-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-foreground font-display text-display-md tracking-tight">
          Now playing
        </Text>
        <AddButton />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ gap: CONTENT_GAP }}
        showsVerticalScrollIndicator={false}>
        {bookshelf.isPending && <NowCardSkeleton />}

        {bookshelf.isError && (
          <View className="gap-2.5 pt-2">
            <Text className="text-foreground font-display text-body-lg">
              We couldn&apos;t load your library.
            </Text>
            <Text className="text-ink-muted font-body text-body-sm">
              {isApiError(bookshelf.error) ? bookshelf.error.message : 'Something went wrong.'}
            </Text>
          </View>
        )}

        {bookshelf.isSuccess && !current && (
          <Text className="text-ink-muted font-body text-body">
            Nothing scored yet. Find a book in your library to start one.
          </Text>
        )}

        {current && <NowCard playlist={current} />}

        {earlier.length > 0 && (
          <LibrarySection label="Earlier sections">
            {earlier.map((playlist) => (
              <SectionRow key={playlist.id} playlist={playlist} />
            ))}
          </LibrarySection>
        )}
      </ScrollView>
    </View>
  );
}

function AddButton() {
  const { theme, shadows } = useTheme();

  // The gradient is the laid-out box, not an absolute fill: on iOS that escapes the round clip.
  return (
    <View style={[styles.add, { boxShadow: shadows.glow }]}>
      <Pressable
        role="button"
        aria-label="Score a new book"
        onPress={() => router.navigate('/library')}
        style={pressed}>
        <LinearGradient {...GRAD_WARM} style={styles.add}>
          <Plus size={20} strokeWidth={2.4} color={theme.primaryInk} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function SectionRow({ playlist }: { playlist: Playlist }) {
  const { theme } = useTheme();

  return (
    <LibraryRow
      title={playlist.name}
      meta={moodSentence(playlist.moodProfile)}
      onPress={() => router.push(`/playlist/${playlist.id}`)}
      trailing={<Play size={14} color={theme.inkFaint} fill={theme.inkFaint} />}
      cover={
        <BookCover
          mood={playlist.moodProfile.mood[0]}
          thumbnailUrl={null}
          title={playlist.name}
          width={SECTION_TILE}
          height={SECTION_TILE}
          radius={RADIUS.sm}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  add: {
    width: ADD_SIZE,
    height: ADD_SIZE,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
