import type { Mood } from '@underscore/shared';
import { Book } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BookCover } from '@/components/book-cover';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { pressed, pressedStyle } from '@/lib/pressed';
import { BORDER, RADIUS } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

/**
 * The design's `COVER` step: a tile, and what the book will be called beside it.
 *
 * Diverges from the root prototype, which shoots or picks a photo. #42 gave `Book` a
 * `coverEmoji` column instead of image storage, so the tile offers a palette — which also
 * means the value cannot fail `ManualBookSchema`'s `Extended_Pictographic` check. The
 * prototype's interaction survives: tap the tile, a sheet rises.
 *
 * The palette's emoji size stays in pixels: a glyph sized to its cell is artwork, not type.
 */

const TILE_WIDTH = 104;
const TILE_HEIGHT = 156;

const CELL = 46;

/** Spread across the vocabulary rather than exhaustive: six spines, then places and things. */
const COVERS = [
  '📖', '📕', '📗', '📘', '📙', '📓',
  '🗝️', '🕯️', '🔮', '🗡️', '🚀', '🛰️',
  '🌙', '🌊', '🏔️', '🌵', '🦌', '🐦',
] as const;

export function CoverEmojiField({
  emoji,
  onChange,
  title,
  author,
  genre,
  moods,
}: {
  emoji?: string;
  onChange: (emoji?: string) => void;
  title: string;
  author: string;
  genre: string;
  /** The tile stands in for artwork, so it tracks the mood picked below it. */
  moods: readonly Mood[];
}) {
  const { theme } = useTheme();
  const [isSheetOpen, setSheetOpen] = useState(false);

  return (
    <View className="gap-2">
      <Text className="font-mono text-eyebrow uppercase tracking-eyebrow text-ink-faint">
        Cover
      </Text>

      <View className="flex-row items-start gap-3.5">
        <Pressable
          role="button"
          accessibilityLabel={emoji ? 'Change cover' : 'Add cover'}
          onPress={() => setSheetOpen(true)}
          style={pressed}>
          {emoji ? (
            // The shelf row's own component, so the tile and the shelf cannot drift.
            <BookCover
              mood={moods[0]}
              coverEmoji={emoji}
              thumbnailUrl={null}
              title=""
              width={TILE_WIDTH}
              height={TILE_HEIGHT}
              radius={RADIUS.sm}
            />
          ) : (
            <View
              className="bg-surface-2 border-border gap-1.5 rounded-sm"
              style={[styles.empty, { width: TILE_WIDTH, height: TILE_HEIGHT }]}>
              <Book size={20} strokeWidth={1.5} color={theme.inkMuted} />
              <Text className="text-ink-muted font-display text-body-sm">Add cover</Text>
            </View>
          )}
        </Pressable>

        {/* Where the prototype's third line is the year, which `Book` has no column for. */}
        <View className="min-w-0 flex-1 gap-1 self-stretch">
          <Text className="text-foreground font-display text-title tracking-tight">
            {title.trim() || 'Untitled'}
          </Text>
          <Text className="text-ink-muted font-body text-body-sm">
            {author.trim() || 'Author unknown'}
          </Text>
          <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow pt-0.5">
            {genre}
          </Text>
        </View>
      </View>

      <Sheet isOpen={isSheetOpen} onClose={() => setSheetOpen(false)} label="Pick a cover">
        <View className="gap-3.5 pb-1.5">
          <Text className="text-foreground font-display text-body">Pick a cover</Text>

          <View className="flex-row flex-wrap gap-2.5">
            {COVERS.map((cover) => (
              <Pressable
                key={cover}
                role="button"
                accessibilityLabel={cover}
                accessibilityState={{ selected: cover === emoji }}
                onPress={() => {
                  onChange(cover);
                  setSheetOpen(false);
                }}
                className="bg-surface-2 items-center justify-center rounded-sm"
                style={({ pressed: isPressed }) => [
                  {
                    width: CELL,
                    height: CELL,
                    borderWidth: BORDER.ring,
                    borderColor: cover === emoji ? theme.primary : 'transparent',
                  },
                  isPressed && pressedStyle,
                ]}>
                <Text className="text-[26px] leading-[32px]">{cover}</Text>
              </Pressable>
            ))}
          </View>

          {emoji && (
            <Pressable
              role="button"
              onPress={() => {
                onChange(undefined);
                setSheetOpen(false);
              }}
              className="items-center py-3.5"
              style={pressed}>
              <Text className="text-ink-muted font-display text-body">Remove</Text>
            </Pressable>
          )}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BORDER.hairline,
  },
});
