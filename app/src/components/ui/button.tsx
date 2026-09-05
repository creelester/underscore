import { LinearGradient } from 'expo-linear-gradient';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { TextClassContext } from '@/components/ui/text';
import { GRAD_WARM } from '@/lib/gradients';
import { useTheme } from '@/lib/use-theme';
import { cn } from '@/lib/utils';
import { pressedStyle } from '@/lib/pressed';

/**
 * Under Score's button. `primary` carries the warm gradient; `tertiary` is the
 * solid-plum stand-in for it wherever the background is already a gradient, since two
 * must never overlap. Press feedback is scale(.96) only, never a colour shift.
 *
 * `destructive` is the one variant the design does not specify. Anything it calls
 * "ghost" — `← Back`, `Skip`, `Done`, `Sign out` — is `secondary`.
 */
const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 rounded-pill',
    Platform.select({
      web: "whitespace-nowrap outline-none transition-all disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        // fill is painted by the gradient layer below, not by a background class
        primary: '',
        secondary: 'bg-secondary',
        tertiary: 'bg-[#2B0F3D]',
        // no fill and no shadow — the label is the whole control
        text: '',
        destructive: 'bg-destructive',
      },
      size: {
        default: 'h-11 px-6',
        lg: 'h-14 px-7',
        sm: 'h-9 px-4',
        icon: 'h-11 w-11 px-0',
      },
    },
    // After the size classes so it wins the padding: the label sits flush with the
    // content margin, while the size still sets the height that keeps the tap target.
    compoundVariants: [{ variant: 'text', class: 'px-0' }],
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

// `font-display`, not body: the bundle's label spec is `500 16px var(--font-display)`.
const buttonTextVariants = cva(
  'text-center font-display-medium text-base tracking-label uppercase',
  {
    variants: {
      variant: {
        primary: 'text-primary-foreground',
        secondary: 'text-foreground',
        tertiary: 'text-[#FFF8EF]',
        text: 'text-ink-muted',
        destructive: 'text-destructive-foreground',
      },
      size: {
        default: '',
        lg: '',
        sm: 'text-sm',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

type ButtonProps = Omit<React.ComponentProps<typeof Pressable>, 'children'> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants> & {
    // narrowed from Pressable's render-prop children so the gradient layer can sit
    // behind the label
    children?: React.ReactNode;
  };

function Button({ className, variant = 'primary', size, style, children, ...props }: ButtonProps) {
  const { shadows } = useTheme();

  const boxShadow =
    variant === 'primary' ? shadows.glow : variant === 'tertiary' ? shadows.tertiary : undefined;

  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && 'opacity-50', buttonVariants({ variant, size }), className)}
        role="button"
        style={(state) => [
          boxShadow ? { boxShadow } : null,
          state.pressed && pressedStyle,
          typeof style === 'function' ? style(state) : style,
        ]}
        {...props}>
        {variant === 'primary' && (
          <LinearGradient {...GRAD_WARM} style={[StyleSheet.absoluteFill, styles.gradient]} />
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
});

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
