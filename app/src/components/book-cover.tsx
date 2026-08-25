import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { coverMood } from '@/lib/book-display';
import { moodGradient } from '@/lib/gradients';
import { MOTION } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

/**
 * A book's artwork, or the mood swatch that stands in for it.
 *
 * The design draws every cover as a mood gradient and marks that a placeholder
 * to be wired to real imagery, so a volume with a Google thumbnail shows it and
 * everything else falls back to `coverMood`'s deterministic swatch. The gradient
 * sits underneath rather than beside the image, which also covers the gap while
 * a thumbnail loads and the case where it fails outright.
 *
 * Sized by prop because the same cover appears at 48 × 70 in a library row and
 * 108 × 158 on book detail.
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
