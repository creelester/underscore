import { type Mood } from '@underscore/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { angleToPoints, moodGradient, moodHeaderIsLight, moodTitleIsLight } from '@/lib/gradients';

/**
 * The playlist's artwork: a full-bleed mood gradient with the controls and the title over
 * it. Full-bleed is why this screen does not use `ScoringScreen` — that owns the screen
 * padding and the back control, both of which have to sit *on* the gradient here. The
 * back rule is repeated from it rather than shared: one control, two lines.
 */

const HERO_HEIGHT = 280;
const SCRIM_HEIGHT = 130;

/** Where `← Back` goes with nothing to pop — a deep link, or a web reload. */
const BACK_FALLBACK = '/library';

/** Darkens the top of the gradient so the controls read against any mood pair. */
const SCRIM = {
  colors: ['rgba(11,4,16,0.62)', 'rgba(11,4,16,0.28)', 'transparent'],
  locations: [0, 0.55, 1],
  ...angleToPoints(180),
} as const;

const LIGHT_INK = '#FFF8EF';
const DARK_INK = '#2B0F3D';

export function PlaylistHero({
  moods,
  eyebrow,
  title,
  onOpenActions,
}: {
  moods: readonly Mood[];
  eyebrow: string;
  title: string;
  onOpenActions: () => void;
}) {
  const insets = useSafeAreaInsets();

  const headerIsLight = moodHeaderIsLight(moods);
  const headerInk = headerIsLight ? DARK_INK : LIGHT_INK;
  const titleInk = moodTitleIsLight(moods) ? '#180310' : LIGHT_INK;

  return (
    <View style={{ height: HERO_HEIGHT }} className="justify-end">
      {/* The gradient, not the theme, is what the clock and battery sit on here. */}
      <StatusBar style={headerIsLight ? 'dark' : 'light'} />

      <LinearGradient {...moodGradient(moods)} style={StyleSheet.absoluteFill} />
      <LinearGradient
        {...SCRIM}
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { height: SCRIM_HEIGHT, bottom: undefined }]}
      />

      <View
        className="px-screen absolute left-0 right-0 flex-row items-center justify-between"
        style={{ top: insets.top + 4 }}>
        <Button
          variant="text"
          size="sm"
          onPress={() => (router.canGoBack() ? router.back() : router.replace(BACK_FALLBACK))}>
          <Text style={{ color: headerInk }}>← Back</Text>
        </Button>

        <Button
          variant="text"
          size="sm"
          aria-label="Playlist options"
          onPress={onOpenActions}>
          <Text className="text-[17px]" style={{ color: headerInk }}>•••</Text>
        </Button>
      </View>

      {/* `testID` so a spec can scope the name away from a library row of the same name
          behind it — e2e/playlist.spec.ts asks for this anchor by name. */}
      <View testID="saved-playlist-header" className="px-screen pb-5">
        <Text
          className="font-mono text-eyebrow tracking-eyebrow uppercase"
          style={{ color: titleInk, opacity: 0.75 }}>
          {eyebrow}
        </Text>
        <Text
          className="font-display mt-[6px] text-[30px] leading-[33px] tracking-tight"
          style={{ color: titleInk }}>
          {title}
        </Text>
      </View>
    </View>
  );
}
