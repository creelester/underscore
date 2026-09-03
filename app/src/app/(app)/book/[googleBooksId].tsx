import { useLocalSearchParams } from 'expo-router';

import { ScoringScreen } from '@/components/scoring-screen';
import { Text } from '@/components/ui/text';

/**
 * Placeholder for the book detail screen. Stands in so the library home's search
 * rows navigate somewhere real.
 *
 * The screen was built out and then wound back on 2026-09-03, because the design
 * moved three times while it was being written — the reading-position slider it
 * used to open with has since been dropped entirely, so do not build to that.
 * Take the design fresh before starting; the working version is parked on the
 * `book-detail-parked` branch and the parts that outlived the churn are already
 * on this one (`GET /api/books/:googleBooksId`, `useBook`, the `book-display`
 * helpers, and the unwired `Chip`, `Switch` and `ExpandableText` components).
 */
export default function BookDetailScreen() {
  const { googleBooksId } = useLocalSearchParams<{ googleBooksId: string }>();

  return (
    <ScoringScreen>
      <Text className="text-foreground font-display text-[28px] leading-[31px] tracking-tight">
        Book detail
      </Text>
      <Text className="text-ink-muted font-body text-body">
        Cover, blurb and the scoring controls land here.
      </Text>
      <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow">
        {googleBooksId}
      </Text>
    </ScoringScreen>
  );
}
