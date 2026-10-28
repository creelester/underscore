import { OTHER } from '@underscore/shared';
import { View } from 'react-native';

import { OtherInput } from '@/components/other-input';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import type { GradientSpec } from '@/lib/gradients';

/**
 * A labelled row of multi-select chips, and `OptionGroup`'s counterpart — that one is
 * single-select, which neither genre nor mood is.
 *
 * At `max` the oldest selection drops rather than the press doing nothing, so the row
 * always answers; `min` is what keeps genre from emptying, since `ManualBook.genre` has
 * to stay non-empty.
 */
export function ChipMultiSelect<T extends string>({
  label,
  options,
  values,
  onChange,
  max,
  min = 0,
  labelFor,
  gradientFor,
  inkFor,
  otherValue,
  onOtherChange,
  otherPlaceholder,
}: {
  label: string;
  options: readonly T[];
  values: readonly T[];
  onChange: (values: T[]) => void;
  max: number;
  min?: number;
  /** For a group whose wire values are not what the chips read, as the moods are not. */
  labelFor?: (option: T) => string;
  /** Fills a selected chip with its own gradient, as the mood chips do. */
  gradientFor?: (option: T) => GradientSpec;
  inkFor?: (option: T) => string;
  /** `undefined` is the chip unpressed; `''` is pressed with nothing typed yet. */
  otherValue?: string;
  onOtherChange?: (value?: string) => void;
  otherPlaceholder?: string;
}) {
  const toggle = (option: T) => {
    if (!values.includes(option)) {
      onChange([...(values.length >= max ? values.slice(1) : values), option]);
      return;
    }
    if (values.length > min) onChange(values.filter((value) => value !== option));
  };

  return (
    <View className="gap-2">
      <Text className="font-mono text-eyebrow uppercase tracking-eyebrow text-ink-faint">
        {label}
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => (
          <Chip
            key={option}
            label={labelFor?.(option) ?? option}
            isSelected={values.includes(option)}
            onPress={() => toggle(option)}
            gradient={gradientFor?.(option)}
            ink={inkFor?.(option)}
          />
        ))}

        {onOtherChange && (
          <Chip
            label={OTHER}
            isSelected={otherValue !== undefined}
            onPress={() => onOtherChange(otherValue === undefined ? '' : undefined)}
          />
        )}
      </View>

      {otherValue !== undefined && onOtherChange && (
        <OtherInput
          value={otherValue}
          onChangeText={onOtherChange}
          placeholder={otherPlaceholder ?? ''}
        />
      )}
    </View>
  );
}
