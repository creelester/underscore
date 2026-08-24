import { ScoringScreen } from '@/components/scoring-screen';
import { Text } from '@/components/ui/text';

/**
 * Placeholder for scoring a book by hand — title, genre and mood asked for
 * directly when the catalogue has nothing. Stands in so the library home's
 * `+ Add manually` button navigates somewhere real.
 *
 * When it is built, genre is `GENRE · PICK UP TO THREE` — multi-select, max
 * three, oldest drops at a fourth, one always stays selected.
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
