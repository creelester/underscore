import { DEFAULT_MOOD, MOODS, type Mood, type MoodProfile } from '@underscore/shared';

import { PALETTE } from '@/lib/theme';

export { MOODS, type Mood };

/**
 * NativeWind has no native gradient support, so gradients are data rather than classes.
 * Every value here feeds `<LinearGradient>` from expo-linear-gradient.
 *
 * Source of truth: the design system's colour tokens.
 */

export type GradientSpec = {
  colors: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]];
  start: { x: number; y: number };
  end: { x: number; y: number };
};

/**
 * Converts a CSS gradient angle to expo-linear-gradient start/end points.
 * CSS measures clockwise from "to top", so the gradient line direction in screen
 * coordinates (y pointing down) is (sin θ, -cos θ).
 */
export function angleToPoints(degrees: number) {
  const rad = (degrees * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  return {
    start: { x: 0.5 - dx / 2, y: 0.5 - dy / 2 },
    end: { x: 0.5 + dx / 2, y: 0.5 + dy / 2 },
  };
}

/** Primary CTA fill and logo lockup — `linear-gradient(120deg, ...)`. */
export const GRAD_WARM: GradientSpec = {
  colors: [PALETTE.pink500, PALETTE.orange500, PALETTE.orange400],
  locations: [0, 0.55, 1],
  ...angleToPoints(120),
};

/** Marketing / splash spectrum — `linear-gradient(135deg, ...)`. */
export const GRAD_HERO: GradientSpec = {
  colors: [
    PALETTE.indigo700,
    PALETTE.magenta600,
    PALETTE.rose500,
    PALETTE.orange500,
    PALETTE.peel400,
  ],
  locations: [0, 0.32, 0.52, 0.72, 1],
  ...angleToPoints(135),
};

/**
 * Each mood is two stops; they stand in for artwork everywhere. `Record<Mood, …>` keeps this in
 * lockstep with `MOODS` in @underscore/shared — a mood without a pair is a type error.
 *
 * The first six are the design's; the last four extend the vocabulary to cover romance, comedy,
 * adventure and horror, reusing PALETTE colours rather than introducing tokens.
 */
export const MOOD_STOPS: Record<Mood, readonly [string, string]> = {
  cozy: [PALETTE.coral500, PALETTE.yellow300],
  melancholy: [PALETTE.plum600, PALETTE.lilac300],
  hopeful: [PALETTE.yellow300, PALETTE.seafoam300],
  tense: [PALETTE.plum600, PALETTE.orchid500],
  dreamy: [PALETTE.lilac300, PALETTE.seafoam300],
  nostalgic: [PALETTE.orchid500, PALETTE.coral500],
  romantic: [PALETTE.rose500, PALETTE.lilac200],
  playful: [PALETTE.amber400, PALETTE.seafoam300],
  epic: [PALETTE.indigo700, PALETTE.orange500],
  haunting: [PALETTE.plum700, PALETTE.seafoam300],
};

const MOOD_ANGLE = 160;

/**
 * Artwork gradient for a profile's moods. Takes `MoodProfile.mood` directly, so the fallbacks
 * live here rather than at every call site: an empty list (the manual-genre path) renders
 * `DEFAULT_MOOD`, and anything past the first two is ignored.
 *
 * Single mood: `linear-gradient(160deg, a[0], a[1])`.
 * Two moods: `linear-gradient(160deg, a[0] 0%, a[1] 46%, b[1] 100%)` — the composite
 * rule from the design, so a pair reads as one gradient rather than two stacked.
 */
export function moodGradient(moods: readonly Mood[]): GradientSpec {
  const [first = DEFAULT_MOOD, second] = moods;
  const a = MOOD_STOPS[first];
  const points = angleToPoints(MOOD_ANGLE);

  if (!second) {
    return { colors: [a[0], a[1]], locations: [0, 1], ...points };
  }

  const b = MOOD_STOPS[second];
  return { colors: [a[0], a[1], b[1]], locations: [0, 0.46, 1], ...points };
}

/**
 * The design's pacing labels. The wire values stay `slow | steady | fast`
 * (`MoodProfile.pacing`); only the display strings live here.
 */
export const PACING_LABELS: Record<MoodProfile['pacing'], string> = {
  slow: 'Slow burn',
  steady: 'Steady',
  fast: 'Breakneck',
};
