import { useLocalSearchParams } from 'expo-router';

import { ScoringScreen } from '@/components/scoring-screen';
import { Text } from '@/components/ui/text';

/**
 * Placeholder for the generation step, so the mood screen's `Generate playlist →`
 * navigates somewhere real. It becomes the design's two screens: `generating` — the
 * drifting gradient square over three ticking steps — and then the result.
 *
 * The corrected profile and the fine-tune answers are not passed here yet. Nothing
 * consumes them until generation exists, and a serialised profile threaded through
 * route params for a screen that ignores it would be wiring to nowhere.
 */
export default function PlaylistScreen() {
  const { googleBooksId } = useLocalSearchParams<{ googleBooksId: string }>();

  return (
    <ScoringScreen contentGap={14}>
      <Text className="text-foreground font-display text-[30px] leading-[34px] tracking-tight">
        Scoring it now.
      </Text>
      <Text className="text-ink-muted font-body text-body">
        The generating steps and the finished playlist land here.
      </Text>
      <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow">
        {googleBooksId}
      </Text>
    </ScoringScreen>
  );
}
