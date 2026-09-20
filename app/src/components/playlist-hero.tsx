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
import { APP_BACKGROUND, MOTION } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

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

/**
 * The bottom scrim ends on `AppBackdrop`'s ground — the colour the body is actually
 * painted on, which is not `THEME.background` — so the artwork dissolves into the page
 * instead of stopping at a seam. Cristina asked for the fade; the design has an edge there.
 */
const BOTTOM_SCRIM_STOPS = [0, 0.26, 0.58, 1] as const;

/**
 * They may meet but must not overlap where either still has weight, or the middle of the
 * hero is darkened twice. The few pixels they share are transparent at both ends.
 */
const TOP_SCRIM_HEIGHT = 110;
const BOTTOM_SCRIM_HEIGHT = 185;

/** The title clears the tail where the scrim has become the page. */
const TITLE_CLEARANCE = 34;

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
  const { scheme } = useTheme();

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
        colors={[
          'transparent',
          'rgba(11,4,16,0.5)',
          'rgba(11,4,16,0.82)',
          APP_BACKGROUND[scheme].ground,
        ]}
        locations={BOTTOM_SCRIM_STOPS}
        {...angleToPoints(180)}
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
      <View
        testID="saved-playlist-header"
        className="px-screen"
        style={{ paddingBottom: TITLE_CLEARANCE }}>
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
