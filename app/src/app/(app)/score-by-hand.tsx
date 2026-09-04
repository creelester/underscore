import { ScoringScreen } from '@/components/scoring-screen';
import { Text } from '@/components/ui/text';

/**
 * Placeholder for scoring by hand when the catalogue has nothing, so the library home's
 * `+ Add manually` navigates somewhere real. Genre will be multi-select, max three,
 * oldest dropping at a fourth, with one always selected.
 */
export default function ScoreByHandScreen() {
  return (
    <ScoringScreen>
      <Text className="text-foreground font-display text-[30px] leading-[34px] tracking-tight">
        Tell us how it reads.
      </Text>
      <Text className="text-ink-muted font-body text-body">
        Title, genre, mood and pacing, with nothing to look up.
      </Text>
    </ScoringScreen>
  );
}
