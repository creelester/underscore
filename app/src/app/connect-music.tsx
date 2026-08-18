import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { moodGradient } from '@/lib/gradients';

/**
 * Onboarding step 4 — the handoff's "Connect music" (screen 3). Frontend only
 * for now: the Spotify row and "Connect later" both land on sign-up. When the
 * Spotify connector ships, the row kicks off its OAuth instead.
 *
 * Apple Music is designed as a visible "Coming soon" row — inert on purpose.
 */
export default function ConnectMusicScreen() {
  const insets = useSafeAreaInsets();

  // Step 4 of a flow that starts at the splash, so an arrival that skipped it — a reload,
  // a restored URL, a deep link — goes back there. See how-it-works.tsx for why nothing
  // to go back to is the signal.
  const [openedDirectly] = useState(() => !router.canGoBack());
  if (openedDirectly) return <Redirect href="/splash" />;

  return (
    <View
      className="bg-background px-screen-wide flex-1 justify-between"
      style={{ paddingTop: insets.top + 36, paddingBottom: Math.max(insets.bottom, 34) }}>
      <View className="gap-[18px]">
        <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow uppercase">
          Step 04 · Connect
        </Text>
        <Text className="text-foreground font-display tracking-tight text-[30px] leading-[34.5px]">
          Where should the music go?
        </Text>
        <Text className="text-ink-muted font-body text-body">
          Pick one now, add the other later. Under Score only ever creates new playlists — nothing
          you already have is touched.
        </Text>

        <View className="mt-1 gap-3">
          {/* TODO: start the Spotify OAuth flow here once the connector endpoints exist. */}
          <Pressable
            role="button"
            onPress={() => router.push('/sign-up')}
            className="rounded-sm border-border bg-surface flex-row items-center gap-[14px] border p-4"
            style={(state) => (state.pressed ? { transform: [{ scale: 0.96 }] } : null)}>
            <View className="rounded-pill h-[38px] w-[38px] overflow-hidden">
              <LinearGradient {...moodGradient(['hopeful'])} style={StyleSheet.absoluteFill} />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-display text-base">Spotify</Text>
              <Text className="text-ink-muted font-body text-body-sm">
                Playlists and playback control
              </Text>
            </View>
            <Text className="text-ink-faint">→</Text>
          </Pressable>

          <View className="rounded-sm border-border bg-surface flex-row items-center gap-[14px] border p-4 opacity-50">
            <View className="bg-surface-raised rounded-pill h-[38px] w-[38px]" />
            <View className="flex-1">
              <Text className="text-foreground font-display text-base">Apple Music</Text>
              <Text className="text-ink-muted font-body text-body-sm">Coming soon</Text>
            </View>
          </View>
        </View>
      </View>

      <View className="items-center gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onPress={() => router.push('/sign-up')}>
          <Text>Connect later</Text>
        </Button>
        <Text className="text-ink-faint font-body text-center text-[13px]">
          You can hear 30-second previews without connecting
        </Text>
      </View>
    </View>
  );
}
