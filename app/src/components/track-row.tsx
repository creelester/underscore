import { type Mood, type Track } from '@underscore/shared';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { moodGradient } from '@/lib/gradients';
import { trackDuration } from '@/lib/playlist-display';
import { MOTION } from '@/lib/theme';

/**
 * One track in a playlist. Not pressable, unlike the design's row: tapping it there opens
 * the in-app player, which the MVP does not have — playback is the hand-off to Spotify.
 * The remove button it also carries waits on the track-removal endpoint.
 *
 * The mood gradient is the fallback, not the default: Spotify resolves album art for
 * every track it matches, and the design's plain swatch was only ever standing in for it.
 * It still covers the load gap and a track that came back without artwork.
 */

const TILE = 42;
const TILE_RADIUS = 6;

export function TrackRow({ track, mood }: { track: Track; mood: Mood }) {
  return (
    <View className="border-border flex-row items-center gap-3 border-b py-[11px]">
      <View
        className="shrink-0 overflow-hidden"
        style={{ width: TILE, height: TILE, borderRadius: TILE_RADIUS }}>
        <LinearGradient {...moodGradient([mood])} style={StyleSheet.absoluteFill} />

        {track.albumArtUrl && (
          <Image
            source={track.albumArtUrl}
            alt=""
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={MOTION.durMed}
            style={StyleSheet.absoluteFill}
          />
        )}
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
