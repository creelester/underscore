import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { cn } from '@/lib/utils';
import { pressed } from '@/lib/pressed';
import { useTheme } from '@/lib/use-theme';

/** Split because a password field puts the box on a row and the text on the input inside it. */
const SIZES = {
  /** The design's standalone field: 52px tall on `--surface`. */
  default: { box: 'h-[52px] bg-surface px-5', text: 'font-body text-base' },
  /** Sized and coloured to sit under a row of chips. */
  sm: { box: 'h-[42px] bg-surface-2 px-[18px]', text: 'font-display text-sm' },
} as const;

const BOX = 'border-border rounded-pill w-full min-w-0 flex-row items-center border';

type InputProps = React.ComponentProps<typeof TextInput> &
  React.RefAttributes<TextInput> & { size?: keyof typeof SIZES };

function Input({ className, size = 'default', ...props }: InputProps) {
  // A password field is a row, not a bare input: the reveal control sits inside it.
  if (props.secureTextEntry) {
    return <PasswordInput className={className} size={size} {...props} />;
  }

  return (
    <TextInput
      className={cn(
        BOX,
        'text-foreground flex',
        SIZES[size].box,
        SIZES[size].text,
        props.editable === false && 'opacity-50',
        Platform.select({
          web: cn(
            'placeholder:text-ink-faint selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow]',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
          ),
          native: 'placeholder:text-ink-faint',
        }),
        className
      )}
      style={styles.text}
      {...props}
    />
  );
}

/**
 * The reveal control is the only way to check a typed password on a phone keyboard, and
 * the design has no password field of its own to take it from. Built like `SearchInput`:
 * a styled row around a borderless input, so the control can sit inside the field.
 */
function PasswordInput({ className, size = 'default', ...props }: InputProps) {
  const [revealed, setRevealed] = useState(false);
  const { theme } = useTheme();
  const Icon = revealed ? EyeOff : Eye;

  return (
    <View
      className={cn(
        BOX,
        SIZES[size].box,
        props.editable === false && 'opacity-50',
        className
      )}>
      <TextInput
        className={cn(
          'text-foreground h-full flex-1',
          SIZES[size].text,
          Platform.select({
            web: 'placeholder:text-ink-faint selection:bg-primary selection:text-primary-foreground outline-none',
            native: 'placeholder:text-ink-faint',
          })
        )}
        style={styles.text}
        {...props}
        secureTextEntry={!revealed}
      />

      <Pressable
        onPress={() => setRevealed((was) => !was)}
        role="button"
        accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
        className="-mr-3 h-11 w-11 items-center justify-center"
        style={pressed}>
        <Icon size={20} strokeWidth={1.8} color={theme.inkFaint} />
      </Pressable>
    </View>
  );
}

export { Input };

const styles = StyleSheet.create({
  // iOS gives a TextInput vertical padding of its own, which lands the text below the
  // centre of a fixed-height field. The same correction `SearchInput` makes.
  text: Platform.select({ ios: { paddingVertical: 0 }, default: {} }),
});
