import { Navigator } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { BookOpen, CirclePlay, UserRound } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackdrop } from '@/components/app-backdrop';
import { ScreenFade } from '@/components/screen-fade';
import { TabBar, TabBarButton } from '@/components/ui/tab-bar';

/**
 * The three tabs — Now Playing / Library / Profile. Headless `expo-router/ui` tabs
 * rather than the styled navigator, which brings its own indicator and tinting to
 * fight. The scoring flow sits outside this group because the bar is hidden there.
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
 * A child of `<Tabs>` so it can read the navigator's state, which the component
 * rendering `<Tabs>` cannot see. The focused route name is the only thing that says a
 * tab changed: `usePathname()` reports the global route, so a push to `/book/<id>`
 * would replay the enter animation and tear the tab screens down around every push.
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
        // The tab bar below already applies the inset.
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
