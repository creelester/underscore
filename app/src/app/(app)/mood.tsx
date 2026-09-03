import { useLocalSearchParams } from 'expo-router';

import { ScoringScreen } from '@/components/scoring-screen';
import { Text } from '@/components/ui/text';

/**
 * Placeholder for the mood step — the model's read said back in one sentence,
 * over a gradient panel, with the chips that correct it. Stands in so book
 * detail's `Analyze →` navigates somewhere real.
 *
 * It also owns the `Fine tune the mood` block, which moved here off book detail:
 * a `LYRICS` switch, then `BOOK FORMAT`, `SETTING` and `ERA` chip groups, each
 * single-select and clearable, with `Something else` opening a free-text field.
 * `Chip` and `Switch` are already built for it; the option vocabularies are on
 * the `book-detail-parked` branch.
 */
export default function MoodScreen() {
  const { googleBooksId } = useLocalSearchParams<{ googleBooksId: string }>();

  return (
    <ScoringScreen contentGap={14}>
      <Text className="text-foreground font-display text-[30px] leading-[34px] tracking-tight">
        Here&apos;s how it reads.
      </Text>
      <Text className="text-ink-muted font-body text-body">
        The mood, the pacing and the chips to correct them land here.
      </Text>
      <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow">
        {googleBooksId}
      </Text>
    </ScoringScreen>
  );
}
