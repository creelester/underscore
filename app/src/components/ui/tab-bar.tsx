import { router, type Href } from 'expo-router';
import { BookOpen, CirclePlay, Settings, type LucideIcon } from 'lucide-react-native';
import { forwardRef } from 'react';
import { Pressable, StyleSheet, View, type View as RNView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/use-theme';

/**
 * The design's tab bar — Play / Library / Settings. The bar follows the DS component;
 * the items follow the prototype, which hand-writes its own (icon above label, both
 * one colour) rather than importing the bundle's older dot-and-label version.
 *
 * Layout is `style`, not NativeWind classes: `TabTrigger asChild` clones the button
 * through a slot and merges its own style in, so the layout that has to survive the
 * clone is written directly. Colour still comes from the theme tokens.
 */

/** The three tabs, shared by the navigator's bar and by `AppTabBar` below. */
export const APP_TABS = [
  { name: 'now', href: '/now', label: 'Play', icon: CirclePlay },
  { name: 'library', href: '/library', label: 'Library', icon: BookOpen },
  { name: 'settings', href: '/settings', label: 'Settings', icon: Settings },
] as const satisfies readonly { name: string; href: Href; label: string; icon: LucideIcon }[];

export function TabBar({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          paddingBottom: insets.bottom + 10,
        },
      ]}>
      {children}
    </View>
  );
}

/** `TabTrigger asChild` hands down press handlers and `isFocused`, so this forwards a
 *  ref and spreads what it is given — before its own style, which has to win. */
export const TabBarButton = forwardRef<
  RNView,
  React.ComponentProps<typeof Pressable> & {
    isFocused?: boolean;
    label: string;
    icon: LucideIcon;
  }
>(function TabBarButton({ isFocused, label, icon: Icon, style, ...props }, ref) {
  const { theme } = useTheme();

  // One colour for the pair, as the prototype does with `currentColor`.
  const color = isFocused ? theme.primary : theme.inkFaint;

  return (
    <Pressable ref={ref} role="tab" aria-selected={isFocused} {...props} style={styles.item}>
      <Icon size={26} strokeWidth={1.8} color={color} />
      <Text
        style={{ color }}
        className={isFocused ? 'font-display text-[12px]' : 'font-body text-[12px]'}>
        {label}
      </Text>
    </Pressable>
  );
});


const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
  },
});

/**
 * The same bar for a screen outside the tabs group. Cristina asked for it on the
 * playlist, where the prototype's scoring flow is full-bleed — otherwise the only way
 * back to the library is walking the stack down one `← Back` at a time.
 *
 * `TabTrigger` only works under the `<Tabs>` navigator, so these navigate by hand:
 * `dismissTo` pops back to the tabs already below on the stack, and pushes when there
 * are none — a deep link, or a web reload. Nothing is focused; the playlist is not a tab.
 */
export function AppTabBar() {
  return (
    <TabBar>
      {APP_TABS.map(({ name, href, label, icon }) => (
        <TabBarButton
          key={name}
          label={label}
          icon={icon}
          onPress={() => router.dismissTo(href)}
        />
      ))}
    </TabBar>
  );
}
