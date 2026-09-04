import { View } from 'react-native';

import { Text } from '@/components/ui/text';

/**
 * The catalogue metadata under the blurb, as a rule-separated key/value table. Rows
 * come from `bookFacts`, which drops what Google has nothing for. Values wrap under
 * themselves so a long category path cannot push its label off the line.
 */
export function BookFacts({ facts }: { facts: { label: string; value: string }[] }) {
  return (
    <View>
      {facts.map((fact) => (
        <View
          key={fact.label}
          className="border-border flex-row items-baseline justify-between gap-4 border-b py-[9px]">
          <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow shrink-0 font-bold uppercase">
            {fact.label}
          </Text>
          <Text className="text-ink-muted font-display-medium shrink text-right text-sm">
            {fact.value}
          </Text>
        </View>
      ))}
    </View>
  );
}
