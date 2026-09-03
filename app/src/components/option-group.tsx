import { TextInput, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { SOMETHING_ELSE } from '@/lib/reading-details';
import { useTheme } from '@/lib/use-theme';

/**
 * An eyebrow over a wrapping row of chips — book detail's `BOOK FORMAT`,
 * `SETTING` and `ERA`.
 *
 * Single-select, and pressing the chosen option again clears it: every group is
 * optional, and without the second press there would be no way back to having
 * answered nothing.
 *
 * Picking `Something else` opens a free-text field beneath the row. The closed
 * list is what the model reads best, so the escape hatch stays one option deep
 * rather than being offered as a field up front.
 */
export function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  otherValue,
  onOtherChange,
  otherPlaceholder,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (value: T | null) => void;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  otherPlaceholder?: string;
}) {
  const { theme } = useTheme();
  const isOtherOpen = !!onOtherChange && value === SOMETHING_ELSE;

  return (
    <View className="gap-[9px]">
      <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow font-bold uppercase">
        {label}
      </Text>

      <View className="flex-row flex-wrap gap-[9px]">
        {options.map((option) => (
          <Chip
            key={option}
            label={option}
            isSelected={value === option}
            onPress={() => onChange(value === option ? null : option)}
          />
        ))}
      </View>

      {isOtherOpen && (
        <TextInput
          value={otherValue}
          onChangeText={onOtherChange}
          placeholder={otherPlaceholder}
          placeholderTextColor={theme.inkFaint}
          accessibilityLabel={otherPlaceholder}
          className="border-border bg-surface-2 text-foreground rounded-pill font-display w-full border px-[18px] text-sm"
          // The design's 12px vertical padding, set here rather than as a class
          // because the platform's own inset would otherwise land the text high.
          style={{ paddingVertical: 12 }}
        />
      )}
    </View>
  );
}
