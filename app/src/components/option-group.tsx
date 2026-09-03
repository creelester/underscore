import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

/**
 * An eyebrow over a wrapping row of selectable pills — book detail's
 * `HOW YOU'RE READING IT` and `SETTING`.
 *
 * Deliberately not the `MoodChip` treatment the mood and by-hand screens use.
 * Those chips correct a guess the model already made, so the design marks them
 * with a gradient border and a `✓`; these are plain optional inputs with nothing
 * pre-answered, and the design fills them solid instead. Two controls, two
 * looks — collapsing them would lose that distinction.
 *
 * Single-select, and selecting the chosen option again clears it: every group
 * here is optional, and without the second press there would be no way back to
 * having answered nothing.
 */
export function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (value: T | null) => void;
}) {
  return (
    <View className="gap-[9px]">
      <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow font-bold uppercase">
        {label}
      </Text>

      <View className="flex-row flex-wrap gap-[9px]">
        {options.map((option) => {
          const isSelected = value === option;

          return (
            <Pressable
              key={option}
              role="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => onChange(isSelected ? null : option)}
              className={`rounded-pill px-[18px] py-[10px] ${
                isSelected ? 'bg-primary' : 'bg-surface-2'
              }`}
              style={(state) => (state.pressed ? { transform: [{ scale: 0.96 }] } : null)}>
              <Text
                className={`font-display text-sm ${
                  isSelected ? 'text-primary-foreground' : 'text-ink-muted'
                }`}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
