import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { pressed } from '@/lib/pressed';

/** Body copy shown a few lines at a time, with a `More` / `Less` toggle. */

const MORE_LABEL = 'More';
const LESS_LABEL = 'Less';

/**
 * A deliberate lower bound on characters per line, which decides whether the toggle
 * appears. Measuring has no cross-platform answer: `onTextLayout` cannot see past the
 * clamp, and measuring an unclamped copy means a second copy in the DOM that
 * react-native-web never resolves at all.
 *
 * Biased low on purpose: that costs a `More` on text that already fitted, where biased
 * high would truncate with no control to reveal the rest.
 */
const MIN_CHARS_PER_LINE = 30;

export function ExpandableText({
  children,
  collapsedLines,
}: {
  children: string;
  collapsedLines: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isExpandable = children.length > collapsedLines * MIN_CHARS_PER_LINE;

  return (
    <View className="items-start gap-[6px]">
      <Text
        numberOfLines={isExpanded ? undefined : collapsedLines}
        className="text-ink-muted font-body text-body">
        {children}
      </Text>

      {isExpandable && (
        <Pressable
          role="button"
          onPress={() => setIsExpanded((expanded) => !expanded)}
          hitSlop={10}
          style={pressed}>
          <Text className="text-primary font-display text-sm">
            {isExpanded ? LESS_LABEL : MORE_LABEL}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
