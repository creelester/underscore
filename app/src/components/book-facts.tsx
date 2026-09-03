import { View } from 'react-native';

import { Text } from '@/components/ui/text';

/**
 * The catalogue metadata book detail lists under the blurb — publisher, length,
 * ISBN and the rest, as a rule-separated key/value table.
 *
 * Rows come from `bookFacts`, which drops whatever Google has nothing for, so
 * this renders however many it is handed and never a blank row. Values are
 * right-aligned against a fixed-width label and wrap under themselves, which is
 * what keeps a long category path from pushing its label off the line.
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
