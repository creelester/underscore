import { useLocalSearchParams } from 'expo-router';

import { ScoringScreen } from '@/components/scoring-screen';
import { Text } from '@/components/ui/text';

/**
 * Placeholder for the mood step — the model's read said back in one sentence,
 * over a gradient panel, with mood chips and pacing pills as the correction
 * layer. Stands in so book detail's `Analyze →` navigates somewhere real.
 *
 * When it is built: `MOOD · CHANGE IF IT'S OFF` with a ghost `Reset`, max two
 * moods with the third dropping the oldest, single-select pacing, and the
 * sentence and gradient re-rendering live on every change.
 */
export default function MoodScreen() {
  const { googleBooksId, progress, format, setting, lyrics } = useLocalSearchParams<{
    googleBooksId: string;
    progress: string;
    format?: string;
    setting?: string;
    lyrics?: string;
  }>();

  // Book detail's optional answers, echoed until the mood engine consumes them.
  const details = [format, setting, lyrics === 'true' ? 'Lyrics welcome' : null].filter(Boolean);

  return (
    <ScoringScreen contentGap={14}>
      <Text className="text-foreground font-display text-[30px] leading-[34px] tracking-tight">
        Here&apos;s how it reads.
      </Text>
      <Text className="text-ink-muted font-body text-body">
        The mood, the pacing and the chips to correct them land here.
      </Text>
      <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow">
        {[googleBooksId, `${progress}%`, ...details].join(' · ')}
      </Text>
    </ScoringScreen>
  );
}
