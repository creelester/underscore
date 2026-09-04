import { DEFAULT_MOOD, MOODS, type Mood, type MoodProfile } from '@underscore/shared';

import { PALETTE } from '@/lib/theme';

export { MOODS, type Mood };

// NativeWind has no gradient classes, so gradients are data. Values feed
// `<LinearGradient>`; colours come from the design system's tokens.

export type GradientSpec = {
  colors: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]];
  start: { x: number; y: number };
  end: { x: number; y: number };
};

/** CSS measures clockwise from "to top", so with y pointing down the line is (sin θ, -cos θ). */
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
 * Two stops per mood, standing in for artwork. `Record<Mood, …>` makes a mood without
 * a pair a type error. The first six are the design's; the last four extend the
 * vocabulary from existing PALETTE colours rather than new tokens.
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
 * Artwork gradient for a profile's moods. Takes `MoodProfile.mood` directly so the
 * fallbacks live here rather than at every call site. A pair uses the design's
 * composite rule — one gradient, not two stacked.
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

/** Display labels only; the wire values stay `MoodProfile.pacing`. */
export const PACING_LABELS: Record<MoodProfile['pacing'], string> = {
  slow: 'Slow burn',
  steady: 'Steady',
  fast: 'Breakneck',
};
