import { Navigator } from 'expo-router';
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
  return (
    <Tabs>
      <TabsContent />

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

/**
 * A child of `<Tabs>` rather than part of the layout body above, so it can read
 * the tab navigator's own state — the context comes from `<Tabs>` and is not
 * visible to the component that renders it.
 *
 * That state is the whole point: the enter animation has to replay on a tab
 * change, and the focused route name is the only thing that says one happened.
 * `usePathname()` cannot, because it reports the *global* route — a push to
 * `/book/<id>` changes it while this layout sits mounted underneath, and driving
 * the animation from that used to tear the tab screens down and back up around
 * every push.
 */
function TabsContent() {
  const insets = useSafeAreaInsets();
  const { state } = Navigator.useContext();
  const focusedTab = state.routes[state.index].name;

  return (
    <View
      className="px-screen flex-1"
      style={{
        paddingTop: insets.top + 6,
        // No safe-area inset: the tab bar below already applies it, and
        // taking it here too would reserve the home indicator twice.
        paddingBottom: 20,
      }}>
      <AppBackdrop />

      <ScreenFade replayOn={focusedTab} style={styles.slot}>
        <TabSlot />
      </ScreenFade>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { flex: 1 },
});
