import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

/**
 * Body copy shown a few lines at a time, with a control to open it out — the
 * book blurb and its `More` / `Less` toggle.
 */

const MORE_LABEL = 'More';
const LESS_LABEL = 'Less';

/**
 * A deliberate *lower bound* on how many characters a line holds, which is what
 * decides whether the toggle appears at all.
 *
 * Measuring would be exact but has no cross-platform answer: `onTextLayout`
 * reports only the lines a clamped `Text` kept, so it can never see past the
 * clamp, and measuring an unclamped copy means keeping a second copy of the
 * text mounted — which react-native-web then never resolves, because it does not
 * implement `onTextLayout` at all. That copy would sit in the DOM permanently,
 * duplicating the blurb for every text query the e2e suite makes.
 *
 * So the count is estimated instead, and the estimate is biased. Being low costs
 * an occasional `More` on text that already fitted — one tap, nothing hidden.
 * Being high would leave text truncated with no control to reveal it, which is
 * the failure this component exists to prevent.
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
          style={(state) => (state.pressed ? { opacity: 0.6 } : null)}>
          <Text className="text-primary font-display text-sm">
            {isExpanded ? LESS_LABEL : MORE_LABEL}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
