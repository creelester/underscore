import { usePathname } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { BookOpen, CirclePlay, UserRound } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackdrop } from '@/components/app-backdrop';
import { ScreenFade } from '@/components/screen-fade';
import { TabBar, TabBarButton } from '@/components/ui/tab-bar';

/**
 * The three tabs — Now Playing / Library / Profile.
 *
 * `expo-router/ui`'s headless tabs rather than the styled navigator: the bar is
 * a hairline rule over an icon-and-label pair that share a single colour, which
 * is a fight with a navigator that brings its own indicator and its own
 * active/inactive tinting.
 *
 * The scoring flow — book detail, score by hand, and later mood/generating/
 * playlist — lives outside this group because the tab bar is hidden throughout
 * it, on the player and during onboarding.
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  return (
    <Tabs>
      {/* Keyed by route so the enter animation replays on every tab change.
          `entering` fires on mount alone, and a tab stays mounted once visited,
          so without the key only the first tab opened ever animates. */}
      <View
        className="px-screen flex-1"
        style={{
          paddingTop: insets.top + 6,
          // No safe-area inset: the tab bar below already applies it, and
          // taking it here too would reserve the home indicator twice.
          paddingBottom: 20,
        }}>
        <AppBackdrop />

        {/* Keyed by route so the enter animation replays on every tab change.
            `entering` fires on mount alone, and a tab stays mounted once
            visited, so without the key only the first tab opened animates. */}
        <ScreenFade key={pathname} style={styles.slot}>
          <TabSlot />
        </ScreenFade>
      </View>

      <TabList asChild>
        <TabBar>
          <TabTrigger name="now" href="/now" asChild>
            <TabBarButton label="Now Playing" icon={CirclePlay} />
          </TabTrigger>
          <TabTrigger name="library" href="/library" asChild>
            <TabBarButton label="Library" icon={BookOpen} />
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabBarButton label="Profile" icon={UserRound} />
          </TabTrigger>
        </TabBar>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1 },
});
