import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { pressed } from '@/lib/pressed';

/**
 * The design's `SearchInput` — a pill field with a solid dot where a magnifier would
 * go. Its own component rather than a variant of `ui/input.tsx`: the DS implementation
 * is a styled row containing a borderless input, and it sits on `--surface-2`.
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
        className,
      )}
    >
      <View className='bg-primary rounded-pill h-2 w-2 shrink-0' />

      <TextInput
        className={cn(
          'text-foreground font-body h-[52px] flex-1 text-[16px]',
          isClearable && 'pr-9',
          Platform.select({
            web: 'placeholder:text-ink-faint selection:bg-primary selection:text-primary-foreground outline-none',
            native: 'placeholder:text-ink-faint',
          }),
        )}
        style={styles.input}
        {...props}
      />

      {isClearable && (
        <Pressable
          onPress={onClear}
          role='button'
          accessibilityLabel='Clear search'
          className='rounded-pill absolute right-2 h-[38px] w-[38px] items-center justify-center'
          style={pressed}
        >
          <Text className='text-ink-faint font-display text-[17px]'>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

export { SearchInput };

const styles = StyleSheet.create({
  // Matches `ui/input.tsx`: a bare font size and no `text-*` scale class, because the
  // lineHeight those carry is what lands the text off the dot's centre line on iOS.
  input: { paddingVertical: 0, textAlignVertical: 'center' },
});
