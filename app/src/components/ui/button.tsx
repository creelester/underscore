import { LinearGradient } from 'expo-linear-gradient';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { TextClassContext } from '@/components/ui/text';
import { GRAD_WARM } from '@/lib/gradients';
import { SHADOWS } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { useColorScheme } from 'nativewind';

/**
 * Under Score's button, per docs/design_handoff_under_score_app.
 *
 * Three variants, one shared label spec (16px / 500 / uppercase / .05em tracking).
 * `primary` carries the warm gradient; `tertiary` is the solid-plum alternative used
 * wherever the background is already a gradient, because two gradients must never
 * overlap. Emphasis comes from fill and glow, never from a hover/press colour shift —
 * press feedback is scale(.96) only.
 *
 * `destructive` is the one variant the handoff does not specify; it exists because
 * destructive actions need to read as such. Anything the handoff calls "ghost" —
 * `← Back`, `Skip`, `Done`, `Sign out` — is `secondary`.
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
        destructive: 'bg-destructive',
      },
      size: {
        default: 'h-11 px-6',
        lg: 'h-14 px-7',
        sm: 'h-9 px-4',
        icon: 'h-11 w-11 px-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva('text-center font-body-medium text-base tracking-label uppercase', {
  variants: {
    variant: {
      primary: 'text-primary-foreground',
      secondary: 'text-foreground',
      tertiary: 'text-[#FFF8EF]',
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
});

type ButtonProps = Omit<React.ComponentProps<typeof Pressable>, 'children'> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants> & {
    // narrowed from Pressable's render-prop children so the gradient layer can sit
    // behind the label
    children?: React.ReactNode;
  };

function Button({ className, variant = 'primary', size, style, children, ...props }: ButtonProps) {
  const { colorScheme } = useColorScheme();
  const shadows = SHADOWS[colorScheme === 'light' ? 'light' : 'dark'];

  const boxShadow =
    variant === 'primary' ? shadows.glow : variant === 'tertiary' ? shadows.tertiary : undefined;

  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && 'opacity-50', buttonVariants({ variant, size }), className)}
        role="button"
        style={(state) => [
          boxShadow ? { boxShadow } : null,
          state.pressed && { transform: [{ scale: 0.96 }] },
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
