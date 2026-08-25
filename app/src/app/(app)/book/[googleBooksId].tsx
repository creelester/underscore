import { useLocalSearchParams } from 'expo-router';

import { ScoringScreen } from '@/components/scoring-screen';
import { Text } from '@/components/ui/text';

/**
 * Placeholder for the book detail screen — the cover, blurb and "Where are you?"
 * progress slider that opens the scoring flow. Stands in so the library home's
 * search rows navigate somewhere real.
 */
export default function BookDetailScreen() {
  const { googleBooksId } = useLocalSearchParams<{ googleBooksId: string }>();

  return (
    <ScoringScreen>
      <Text className="text-foreground font-display text-[28px] leading-[31px] tracking-tight">
        Book detail
      </Text>
      <Text className="text-ink-muted font-body text-body">
        Cover, blurb and the reading-position slider land here.
      </Text>
      <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow">
        {googleBooksId}
      </Text>
    </ScoringScreen>
  );
}
