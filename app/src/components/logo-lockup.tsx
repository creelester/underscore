import LockupLilac from '@/assets/images/under-score-logo-lilac.svg';
import LockupPlum from '@/assets/images/under-score-logo-plum.svg';
import { useTheme } from '@/lib/use-theme';

/**
 * The logo lockup — the word "under", the wave mark and the word "score" locked into
 * one fixed assembly, which each SVG ships whole.
 *
 * There is one file per theme rather than one file recoloured at runtime because the
 * fill is baked onto a `<g>` inside the artwork. Lilac on dark and plum on light are
 * the design's pairings; the gradient-filled variant is retired on the splash, so
 * this must never be tinted (the design spec, Splash).
 */
export function LogoLockup({ size = 242 }: { size?: number }) {
  const { isLight } = useTheme();
  const Lockup = isLight ? LockupPlum : LockupLilac;

  return <Lockup width={size} height={size} accessibilityLabel="Under Score" />;
}
