import { LinearGradient } from 'expo-linear-gradient';
import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react-native';
import * as React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { TextClassContext } from '@/components/ui/text';
import { GRAD_WARM } from '@/lib/gradients';
import { RADIUS, type THEME } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';
import { cn } from '@/lib/utils';
import { pressed, pressedStyle } from '@/lib/pressed';

/**
 * Under Score's button. `primary` carries the warm gradient; `tertiary` is the
 * solid-plum stand-in for it wherever the background is already a gradient, since two
 * must never overlap. Press feedback is scale(.96) only, never a colour shift.
 *
 * `destructive` is the one variant the design does not specify. Anything it calls
 * "ghost" — `← Back`, `Skip`, `Done`, `Sign out` — is `secondary`.
 *
 * Given an `icon`, it is a circle as tall as `size` with the glyph in place of a label.
 */
const FILL = {
  // fill is painted by the gradient layer below, not by a background class
  primary: '',
  secondary: 'bg-secondary',
  tertiary: 'bg-plum-700',
  // no fill and no shadow — the label is the whole control
  text: '',
  destructive: 'bg-destructive',
} as const;

type Variant = keyof typeof FILL;
type Size = 'default' | 'lg' | 'sm';

// The label sizes' heights as numbers, because the gradient takes no class.
const ICON_BOX: Record<Size, number> = { default: 44, lg: 56, sm: 36 };
const ICON_GLYPH: Record<Size, number> = { default: 20, lg: 22, sm: 16 };

type Palette = (typeof THEME)[keyof typeof THEME];

// `buttonTextVariants`' label colours, for a glyph that takes a value rather than a class.
const ICON_INK: Record<Variant, (theme: Palette) => string> = {
  primary: (theme) => theme.primaryInk,
  secondary: (theme) => theme.ink,
  tertiary: (theme) => theme.btnTertiaryInk,
  text: (theme) => theme.inkMuted,
  destructive: (theme) => theme.btnTertiaryInk,
};

const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 rounded-pill',
    Platform.select({
      web: "whitespace-nowrap outline-none transition-all disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    }),
  ),
  {
    variants: {
      variant: FILL,
      size: {
        default: 'h-11 px-6',
        lg: 'h-14 px-7',
        sm: 'h-9 px-4',
      },
    },
    // After the size classes so it wins the padding: the label sits flush with the
    // content margin, while the size still sets the height that keeps the tap target.
    compoundVariants: [{ variant: 'text', class: 'px-0' }],
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

// `font-display`, not body: the bundle's label spec is `500 16px var(--font-display)`.
const buttonTextVariants = cva(
  'text-center font-display-medium text-body tracking-label uppercase',
  {
    variants: {
      variant: {
        primary: 'text-primary-foreground',
        secondary: 'text-foreground',
        // Fixed cream, not a token: the fill is dark plum in both themes, so anything
        // `-foreground` would flip to near-black in dark and vanish.
        tertiary: 'text-[#FFF8EF]',
        text: 'text-ink-muted',
        destructive: 'text-destructive-foreground',
      },
      size: {
        default: '',
        lg: '',
        sm: 'text-body-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

type ButtonProps = Omit<React.ComponentProps<typeof Pressable>, 'children'> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants> & {
    // narrowed from Pressable's render-prop children so the gradient layer can sit
    // behind the label
    children?: React.ReactNode;
    icon?: LucideIcon;
    /** Fills the glyph in its own colour, for a solid shape like the play triangle. */
    iconFill?: boolean;
  };

function Button({
  className,
  variant = 'primary',
  size,
  style,
  children,
  icon: Icon,
  iconFill,
  ...props
}: ButtonProps) {
  const { theme, shadows } = useTheme();

  const boxShadow =
    variant === 'primary'
      ? shadows.glow
      : variant === 'tertiary'
        ? shadows.tertiary
        : undefined;

  if (Icon) {
    const box = ICON_BOX[size ?? 'default'];
    const ink = ICON_INK[variant ?? 'primary'](theme);
    const shape = { width: box, height: box, borderRadius: RADIUS.pill };
    const glyph = (
      <Icon
        size={ICON_GLYPH[size ?? 'default']}
        strokeWidth={2.4}
        color={ink}
        fill={iconFill ? ink : 'none'}
      />
    );

    // Shadow on a plain wrapper and the gradient as the laid-out box: on native a
    // Pressable's `style` loses to NativeWind, and an absolute fill escapes the round clip.
    return (
      <View
        className={cn(props.disabled && 'opacity-50', className)}
        style={[shape, boxShadow ? { boxShadow } : null]}
      >
        <Pressable role='button' style={pressed} {...props}>
          {variant === 'primary' ? (
            <LinearGradient {...GRAD_WARM} style={[shape, styles.center]}>
              {glyph}
            </LinearGradient>
          ) : (
            <View
              className={FILL[variant ?? 'primary']}
              style={[shape, styles.center]}
            >
              {glyph}
            </View>
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(
          props.disabled && 'opacity-50',
          buttonVariants({ variant, size }),
          className,
        )}
        role='button'
        style={(state) => [
          boxShadow ? { boxShadow } : null,
          state.pressed && pressedStyle,
          typeof style === 'function' ? style(state) : style,
        ]}
        {...props}
      >
        {variant === 'primary' && (
          <LinearGradient
            {...GRAD_WARM}
            style={[StyleSheet.absoluteFill, styles.gradient]}
          />
        )}
        {children}
      </Pressable>
    </TextClassContext.Provider>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 999,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
