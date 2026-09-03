import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { pressed } from '@/lib/pressed';

/**
 * The design's `SearchInput` — a pill field that uses a solid dot where a
 * magnifier would go.
 *
 * Its own component rather than a variant of `ui/input.tsx`: the design system's
 * implementation is a styled row *containing* a borderless input, and it sits on
 * `--surface-2` where the plain field sits on `--surface`. Values come from
 * `components/forms/SearchInput.jsx` in the design's `_ds_bundle.js`.
 *
 * `onClear` adds the prototype's ghost `✕` at the field's right edge, shown only
 * once there is something to clear.
 */
function SearchInput({
  className,
  onClear,
  ...props
}: React.ComponentProps<typeof TextInput> &
  React.RefAttributes<TextInput> & {
    onClear?: () => void;
  }) {
  const isClearable = !!onClear && !!props.value;

  return (
    <View
      className={cn(
        'border-border bg-surface-2 rounded-pill h-[52px] w-full flex-row items-center gap-3 border px-5',
        className
      )}>
      <View className="bg-primary rounded-pill h-2 w-2 shrink-0" />

      <TextInput
        className={cn(
          // `text-body`, not `text-base`: the bundle sets the input to
          // `var(--text-body)`, whose line height is 25px rather than Tailwind's
          // default 24px at this size.
          'text-foreground font-body text-body flex-1',
          // The clear button overlays the field rather than sitting in the row.
          isClearable && 'pr-9',
          Platform.select({
            web: 'placeholder:text-ink-faint selection:bg-primary selection:text-primary-foreground outline-none',
            native: 'placeholder:text-ink-faint',
          })
        )}
        style={styles.input}
        {...props}
      />

      {isClearable && (
        <Pressable
          onPress={onClear}
          role="button"
          accessibilityLabel="Clear search"
          className="rounded-pill absolute right-2 h-[38px] w-[38px] items-center justify-center"
          style={pressed}>
          <Text className="text-ink-faint font-display text-[17px]">✕</Text>
        </Pressable>
      )}
    </View>
  );
}

export { SearchInput };

const styles = StyleSheet.create({
  // Without this the platform's own padding lands the text low on iOS, off the
  // dot's centre line.
  input: { paddingVertical: 0 },
});
