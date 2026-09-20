import { type Mood, type Track } from '@underscore/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { moodGradient } from '@/lib/gradients';
import { trackDuration } from '@/lib/playlist-display';

/**
 * One track in a playlist. Not pressable, unlike the design's row: tapping it there opens
 * the in-app player, which the MVP does not have — playback is the hand-off to Spotify.
 * The remove button it also carries waits on the track-removal endpoint.
 *
 * The tile stands in for album art the way a mood gradient stands in for a cover
 * elsewhere, alternating across the profile's moods as the design does.
 */

const TILE = 42;
const TILE_RADIUS = 6;

export function TrackRow({ track, mood }: { track: Track; mood: Mood }) {
  return (
    <View className="border-border flex-row items-center gap-3 border-b py-[11px]">
      <View
        className="shrink-0 overflow-hidden"
        style={{ width: TILE, height: TILE, borderRadius: TILE_RADIUS }}>
        <LinearGradient {...moodGradient([mood])} style={{ flex: 1 }} />
      </View>

      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-foreground font-display text-[15px]">
          {track.name}
        </Text>
        <Text numberOfLines={1} className="text-ink-muted font-body text-body-sm">
          {track.artist}
        </Text>
      </View>

      <Text className="text-ink-faint font-mono text-[12px]">
        {trackDuration(track.durationMs)}
      </Text>
    </View>
  );
}
