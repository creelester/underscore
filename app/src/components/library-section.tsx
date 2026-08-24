import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';

/**
 * The library home's list primitives, from `Under Score App.dc.html`.
 *
 * `RECENT`, `YOUR PLAYLISTS` and the Google Books fallback are all the same
 * section of the same row — only the label and what fills the two lines differ —
 * so this stays deliberately unopinionated about where a row's content comes
 * from. Saved playlists put the playlist name on the title line and
 * `Book · Author` beneath; Google hits put the book's title and
 * `Author · Year · Genre`.
 *
 * `cover` is a node rather than a book, because a saved playlist's artwork comes
 * from its mood profile while a search hit's comes from a volume id.
 */
export function LibrarySection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-[2px]">
      {/* `--text-eyebrow` is `700 12px/1.4 mono` — the weight is part of the token. */}
      <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow pb-2 font-bold uppercase">
        {label}
      </Text>
      {children}
    </View>
  );
}

export function LibraryRow({
  title,
  meta,
  cover,
  onPress,
}: {
  title: string;
  meta: string;
  cover: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      role="button"
      onPress={onPress}
      className="border-border flex-row items-center gap-[14px] border-b px-1 py-3"
      style={(state) => (state.pressed ? { transform: [{ scale: 0.96 }] } : null)}>
      {cover}

      {/* `min-w-0` is what lets the two lines truncate instead of pushing the row wide. */}
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-foreground font-display text-base">
          {title}
        </Text>
        <Text numberOfLines={1} className="text-ink-muted font-body text-body-sm">
          {meta}
        </Text>
      </View>
    </Pressable>
  );
}
