import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { coverMood } from '@/lib/book-display';
import { moodGradient } from '@/lib/gradients';
import { MOTION } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

/**
 * A book's artwork, or the mood swatch that stands in for it. The gradient sits
 * underneath the image rather than beside it, which also covers the gap while a
 * thumbnail loads and the case where it fails outright.
 */
export function BookCover({
  googleBooksId,
  thumbnailUrl,
  title,
  width,
  height,
  radius = 6,
}: {
  googleBooksId: string;
  thumbnailUrl: string | null;
  title: string;
  width: number;
  height: number;
  radius?: number;
}) {
  const { shadows } = useTheme();

  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        boxShadow: shadows.soft,
      }}>
      <LinearGradient {...moodGradient([coverMood(googleBooksId)])} style={StyleSheet.absoluteFill} />

      {thumbnailUrl && (
        <Image
          source={thumbnailUrl}
          alt={title}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={MOTION.durMed}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
}
