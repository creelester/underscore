import { Platform, Pressable, TextInput, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

/**
 * The handoff's `SearchInput` — a pill field that uses a solid dot where a
 * magnifier would go.
 *
 * Its own component rather than a variant of `ui/input.tsx`: the design system's
 * implementation is a styled row *containing* a borderless input, and it sits on
 * `--surface-2` where the plain field sits on `--surface`. Values come from
 * `components/forms/SearchInput.jsx` in the handoff's `_ds_bundle.js`.
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
  const clearable = !!onClear && !!props.value;

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
          // Keeps the text from running under the clear button, which overlays
          // the field's right edge rather than taking space in the row.
          clearable && 'pr-9',
          Platform.select({
            web: 'placeholder:text-ink-faint selection:bg-primary selection:text-primary-foreground outline-none',
            native: 'placeholder:text-ink-faint',
          })
        )}
        // The row centres its children, so the field has to size to its own text
        // to sit on the dot's centre line. Stretching it to the row's full height
        // instead hands vertical placement to the platform, which on iOS lands the
        // text low. `paddingVertical: 0` removes the default padding that would
        // otherwise reintroduce the same offset.
        style={{ paddingVertical: 0 }}
        {...props}
      />

      {clearable && (
        <Pressable
          onPress={onClear}
          role="button"
          accessibilityLabel="Clear search"
          className="rounded-pill absolute right-2 h-[38px] w-[38px] items-center justify-center"
          style={(state) => (state.pressed ? { transform: [{ scale: 0.96 }] } : null)}>
          <Text className="text-ink-faint font-display text-[17px]">✕</Text>
        </Pressable>
      )}
    </View>
  );
}

export { SearchInput };
