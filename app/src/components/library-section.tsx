import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { pressed } from '@/lib/pressed';

/**
 * The library home's list primitives. `RECENT`, `YOUR PLAYLISTS` and the Google Books
 * fallback are the same section of the same row, so this stays unopinionated about
 * where a row's content comes from. `cover` is a node rather than a book because a
 * playlist's artwork comes from its mood profile and a search hit's from a volume id.
 */
export function LibrarySection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-[2px]">
      {/* The weight is part of `--text-eyebrow`, not an override. */}
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
      style={pressed}>
      {cover}

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

/**
 * A `LibraryRow` before its content exists, for the stretch between a settled
 * search term and its results.
 *
 * It lives beside the row rather than in a file of its own because it is only
 * useful while it matches it: the row's box is repeated here verbatim, and its
 * 70px cover is what makes the two the same height, so the list does not jump
 * when the real rows arrive.
 *
 * Hidden from assistive tech — the section label above already says `Searching…`
 * and the bars say nothing a screen reader can use.
 */
export function LibraryRowSkeleton() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      className="border-border flex-row items-center gap-[14px] border-b px-1 py-3">
      <Skeleton className="h-[70px] w-12 rounded-[6px]" />

      <View className="min-w-0 flex-1 gap-[7px]">
        <Skeleton className="h-3 w-[62%]" />
        <Skeleton className="h-[10px] w-[38%]" />
      </View>
    </View>
  );
}
