import LockupLilac from '@/assets/images/under-score-logo-lilac.svg';
import LockupPlum from '@/assets/images/under-score-logo-plum.svg';
import { useTheme } from '@/lib/use-theme';

/**
 * The logo lockup, which each SVG ships whole. One file per theme rather than one
 * recoloured at runtime, because the fill is baked onto a `<g>` inside the artwork.
 * The gradient-filled variant is retired, so this must never be tinted.
 */
export function LogoLockup({ size = 242 }: { size?: number }) {
  const { isLight } = useTheme();
  const Lockup = isLight ? LockupPlum : LockupLilac;

  return <Lockup width={size} height={size} accessibilityLabel="Under Score" />;
}
