import type { Playlist } from '@underscore/shared';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { moodGradient } from '@/lib/gradients';
import { playlistEyebrow, trackSummary } from '@/lib/playlist-display';
import { RADIUS } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

const BAND_HEIGHT = 132;

/** The Now tab's current book: the newest playlist on the shelf. */
export function NowCard({ playlist }: { playlist: Playlist }) {
  const { book } = playlist;

  return (
    <CardShell>
      <LinearGradient {...moodGradient(playlist.moodProfile.mood)} style={{ height: BAND_HEIGHT }} />

      <View className="gap-1.5 px-4 py-4">
        <Text
          numberOfLines={1}
          className="text-ink-faint font-mono text-eyebrow tracking-eyebrow uppercase">
          {playlistEyebrow(playlist)}
        </Text>
        <Text numberOfLines={2} className="text-foreground font-display text-title">
          {book.title}
        </Text>
        <Text numberOfLines={1} className="text-ink-muted font-body text-body-sm">
          {playlist.name} · {trackSummary(playlist)}
        </Text>

        <View className="flex-row gap-2.5 pt-2.5">
          {/* Not the design's in-app player, which the MVP has none of: the playlist's own
              play button is the hand-off to Spotify. */}
          <Button className="flex-1 px-3" onPress={() => router.push(`/playlist/${playlist.id}`)}>
            <Text>Resume</Text>
          </Button>
          {/* The design's `Story turned?`, renamed by Cristina; re-scores this book's own row. */}
          <Button
            variant="secondary"
            className="flex-1 px-3"
            onPress={() => router.push({ pathname: '/mood', params: { playlistId: playlist.id } })}>
            <Text numberOfLines={1} adjustsFontSizeToFit>
              Score again
            </Text>
          </Button>
        </View>
      </View>
    </CardShell>
  );
}

export function NowCardSkeleton() {
  return (
    <CardShell>
      <Skeleton className="rounded-none" style={{ height: BAND_HEIGHT }} />
      <View className="gap-2.5 px-4 py-4">
        <Skeleton className="h-3 w-[44%]" />
        <Skeleton className="h-5 w-[70%]" />
        <Skeleton className="h-3 w-[56%]" />
      </View>
    </CardShell>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  const { shadows } = useTheme();

  // The shadow rides an outer box: `overflow: hidden` for the band's corners would clip it.
  return (
    <View style={{ borderRadius: RADIUS.card, boxShadow: shadows.soft }}>
      <View className="bg-surface border-border rounded-card overflow-hidden border">{children}</View>
    </View>
  );
}
