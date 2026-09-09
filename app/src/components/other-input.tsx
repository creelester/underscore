import { MAX_READING_DETAIL_LENGTH } from '@underscore/shared';
import { Platform, TextInput } from 'react-native';

import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/use-theme';

/** The free-text field a `Something else` chip opens beneath its row. */
export function OtherInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  const { theme } = useTheme();

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.inkFaint}
      accessibilityLabel={placeholder}
      maxLength={MAX_READING_DETAIL_LENGTH}
      className={cn(
        'w-full rounded-pill border border-border bg-surface-2 px-[18px] font-display text-sm text-foreground',
        // The app's own inputs kill the browser focus ring; a bare TextInput does not.
        Platform.select({ web: 'outline-none' }),
      )}
      // The design's 12px vertical padding, set here rather than as a class because the
      // platform's own inset would otherwise land the text high.
      style={{ paddingVertical: 12 }}
    />
  );
}
