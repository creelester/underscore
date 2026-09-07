import { SOMETHING_ELSE } from '@underscore/shared';
import { View } from 'react-native';

import { OtherInput } from '@/components/other-input';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';

/**
 * An eyebrow over a wrapping row of chips — the mood screen's `PACING`, `BOOK FORMAT`,
 * `SETTING` and `ERA`.
 *
 * Single-select, and pressing the chosen option again clears it: the fine-tune groups
 * are optional, and without the second press there would be no way back to having
 * answered nothing. `required` turns that off for pacing, which always has a value.
 *
 * Picking `Something else` opens a free-text field beneath the row. The closed list is
 * what the model reads best, so the escape hatch stays one option deep rather than
 * being offered as a field up front.
 */
export function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  required = false,
  labelFor,
  otherValue,
  onOtherChange,
  otherPlaceholder,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (value: T | null) => void;
  required?: boolean;
  /** For a group whose wire values are not what the chips read, as pacing's are not. */
  labelFor?: (option: T) => string;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  otherPlaceholder?: string;
}) {
  const isOtherOpen = !!onOtherChange && value === SOMETHING_ELSE;

  return (
    <View className="gap-[9px]">
      <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow uppercase">
        {label}
      </Text>

      <View className="flex-row flex-wrap gap-[9px]">
        {options.map((option) => (
          <Chip
            key={option}
            label={labelFor?.(option) ?? option}
            isSelected={value === option}
            onPress={() => onChange(value === option && !required ? null : option)}
          />
        ))}
      </View>

      {isOtherOpen && (
        <OtherInput
          value={otherValue ?? ''}
          onChangeText={onOtherChange}
          placeholder={otherPlaceholder ?? ''}
        />
      )}
    </View>
  );
}
