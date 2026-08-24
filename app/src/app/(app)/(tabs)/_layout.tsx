import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { BookOpen, CirclePlay, UserRound } from 'lucide-react-native';

import { TabBar, TabBarButton } from '@/components/ui/tab-bar';

/**
 * The three tabs from the handoff — Now (0) / Library (1) / Profile (2).
 *
 * `expo-router/ui`'s headless tabs rather than the styled navigator: the design's
 * bar is a hairline rule over an icon-and-label pair that share a single colour,
 * which is a fight with a navigator that brings its own indicator and its own
 * active/inactive tinting.
 *
 * Icons are lucide's nearest matches to the prototype's inline SVGs — a
 * play-circle, an open book and a person, all outline at stroke 1.8.
 *
 * The scoring flow — book detail, score by hand, and later mood/generating/
 * playlist — deliberately lives outside this group, because the handoff hides the
 * tab bar throughout that flow, on the player and during onboarding.
 */
export default function TabsLayout() {
  return (
    <Tabs>
      <TabSlot />
      <TabList asChild>
        <TabBar>
          <TabTrigger name="now" href="/now" asChild>
            <TabBarButton label="Now" icon={CirclePlay} />
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
