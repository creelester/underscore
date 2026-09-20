import { type Mood } from '@underscore/shared';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { angleToPoints, moodGradient } from '@/lib/gradients';
import { MOTION } from '@/lib/theme';

/**
 * The playlist's artwork: the book's cover, blurred to fill, over the mood gradient that
 * stands in when there is none. Google's thumbnails are 128px wide, so blurred is the
 * only way one can fill a hero — which suits it, since what is wanted here is the book's
 * colours rather than its lettering.
 *
 * Full-bleed is why this screen does not use `ScoringScreen` — that owns the screen
 * padding and the back control, both of which have to sit *on* the artwork here. The
 * back rule is repeated from it rather than shared: one control, two lines.
 */

const HERO_HEIGHT = 280;
const COVER_BLUR = 28;

/** The cover supplies the colour; the gradient keeps it in the app's palette. */
const TINT_OPACITY = 0.22;

/** Where `← Back` goes with nothing to pop — a deep link, or a web reload. */
const BACK_FALLBACK = '/library';

/**
 * Two scrims, where the design has one. Its top scrim assumed artwork whose luminance we
 * could read ahead of time; a cover can be any image, so the title needs a dark band of
 * its own. Cristina asked for the contrast — the eyebrow and the name were hard to read
 * against a pale mood pair even before covers.
 */
const TOP_SCRIM = {
  colors: ['rgba(11,4,16,0.52)', 'rgba(11,4,16,0.22)', 'transparent'],
  locations: [0, 0.55, 1],
  ...angleToPoints(180),
} as const;

const BOTTOM_SCRIM = {
  colors: ['transparent', 'rgba(11,4,16,0.42)', 'rgba(11,4,16,0.82)'],
  locations: [0, 0.5, 1],
  ...angleToPoints(180),
} as const;

/** Together they must stay under the hero's height, or the middle is darkened twice. */
const TOP_SCRIM_HEIGHT = 120;
const BOTTOM_SCRIM_HEIGHT = 150;

/** Both scrims darken, so one ink reads over every cover and every mood pair. */
const INK = '#FFF8EF';

export function PlaylistHero({
  moods,
  coverUrl,
  eyebrow,
  title,
  onOpenActions,
}: {
  moods: readonly Mood[];
  coverUrl: string | null;
  eyebrow: string;
  title: string;
  onOpenActions: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ height: HERO_HEIGHT }} className="justify-end">
      {/* The artwork, not the theme, is what the clock and battery sit on here. */}
      <StatusBar style="light" />

      <LinearGradient {...moodGradient(moods)} style={StyleSheet.absoluteFill} />

      {coverUrl && (
        <>
          <Image
            source={coverUrl}
            alt=""
            contentFit="cover"
            blurRadius={COVER_BLUR}
            cachePolicy="memory-disk"
            transition={MOTION.durMed}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            {...moodGradient(moods)}
            style={[StyleSheet.absoluteFill, { opacity: TINT_OPACITY }]}
          />
        </>
      )}

      <LinearGradient
        {...TOP_SCRIM}
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { height: TOP_SCRIM_HEIGHT, bottom: undefined }]}
      />
      <LinearGradient
        {...BOTTOM_SCRIM}
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { height: BOTTOM_SCRIM_HEIGHT, top: undefined }]}
      />

      <View
        className="px-screen absolute left-0 right-0 flex-row items-center justify-between"
        style={{ top: insets.top + 4 }}>
        <Button
          variant="text"
          size="sm"
          onPress={() => (router.canGoBack() ? router.back() : router.replace(BACK_FALLBACK))}>
          <Text style={{ color: INK }}>← Back</Text>
        </Button>

        <Button variant="text" size="sm" aria-label="Playlist options" onPress={onOpenActions}>
          <Text className="text-[17px]" style={{ color: INK }}>
            •••
          </Text>
        </Button>
      </View>

      {/* `testID` so a spec can scope the name away from a library row of the same name
          behind it — e2e/playlist.spec.ts asks for this anchor by name. */}
      <View testID="saved-playlist-header" className="px-screen pb-5">
        <Text
          className="font-mono text-eyebrow tracking-eyebrow uppercase"
          style={{ color: INK, opacity: 0.85 }}>
          {eyebrow}
        </Text>
        <Text
          className="font-display mt-[6px] text-[30px] leading-[33px] tracking-tight"
          style={{ color: INK }}>
          {title}
        </Text>
      </View>
    </View>
  );
}
