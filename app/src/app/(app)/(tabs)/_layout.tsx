import { Navigator } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackdrop } from '@/components/app-backdrop';
import { ScreenFade } from '@/components/screen-fade';
import { APP_TABS, TabBar, TabBarButton } from '@/components/ui/tab-bar';

/**
 * The three tabs — Play / Library / Settings. Headless `expo-router/ui` tabs
 * rather than the styled navigator, which brings its own indicator and tinting to
 * fight. The scoring flow sits outside this group; the playlist at the end of it draws
 * the same bar for itself with `AppTabBar`.
 */
export default function TabsLayout() {
  return (
    <Tabs>
      <TabsContent />

      <TabList asChild>
        <TabBar>
          {APP_TABS.map(({ name, href, label, icon }) => (
            <TabTrigger key={name} name={name} href={href} asChild>
              <TabBarButton label={label} icon={icon} />
            </TabTrigger>
          ))}
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

      <ScreenFade replayOn={focusedTab}>
        <TabSlot />
      </ScreenFade>
    </View>
  );
}
