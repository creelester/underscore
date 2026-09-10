import { OTHER } from '@underscore/shared';
import { View } from 'react-native';

import { OtherInput } from '@/components/other-input';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';

/**
 * A labelled row of single-select chips. Pressing the selected chip clears it, since
 * these groups are optional; `required` turns that off for pacing, which always has a
 * value. Picking `Something else` opens a free-text field below the row.
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
  value?: T;
  onChange: (value?: T) => void;
  required?: boolean;
  /** For a group whose wire values are not what the chips read, as pacing's are not. */
  labelFor?: (option: T) => string;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
  otherPlaceholder?: string;
}) {
  const showFreeText = !!onOtherChange && value === OTHER;

  return (
    <View className="gap-[9px]">
      <Text className="font-mono text-eyebrow uppercase tracking-eyebrow text-ink-faint">
        {label}
      </Text>

      <View className="flex-row flex-wrap gap-[9px]">
        {options.map((option) => (
          <Chip
            key={option}
            label={labelFor?.(option) ?? option}
            isSelected={value === option}
            onPress={() => onChange(value === option && !required ? undefined : option)}
          />
        ))}
      </View>

      {showFreeText && (
        <OtherInput
          value={otherValue ?? ''}
          onChangeText={onOtherChange}
          placeholder={otherPlaceholder ?? ''}
        />
      )}
    </View>
  );
}
