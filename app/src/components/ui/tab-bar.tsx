import type { LucideIcon } from 'lucide-react-native';
import { forwardRef } from 'react';
import { Pressable, StyleSheet, View, type View as RNView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/use-theme';

/**
 * The design's tab bar — Now / Library / Profile.
 *
 * The bar itself is `components/navigation/TabBar.jsx` in `_ds_bundle.js`: a
 * hairline top rule over `--surface`, with the safe-area inset owned here rather
 * than by the screens above it.
 *
 * The *items* deliberately do not follow that bundle component. `Under Score
 * App.dc.html` hand-writes its own bar instead of importing the DS one, giving
 * each tab a 22px outline icon above the label and colouring icon and label
 * together — `--primary` when active, `--ink-faint` when not. The bundle's
 * version still describes an earlier design: a 6px dot, no icons, and an active
 * label in `--ink`. Where a screen inlines its own version the screen wins, so
 * the icons are current and the dot is not.
 *
 * Layout here is `style` rather than NativeWind classes, unlike the rest of the
 * app: `TabTrigger asChild` clones the button through a slot and merges its own
 * style in, and rather than reason about how that lands on top of the style
 * NativeWind compiles a className into, the layout that has to survive the clone
 * is written directly. Colour still comes from the theme tokens.
 */
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

/**
 * One tab. `expo-router/ui`'s `TabTrigger asChild` hands this its press handlers
 * and `isFocused`, so it forwards a ref and spreads what it is given — before its
 * own style, which has to win.
 */
export const TabBarButton = forwardRef<
  RNView,
  React.ComponentProps<typeof Pressable> & {
    isFocused?: boolean;
    label: string;
    icon: LucideIcon;
  }
>(function TabBarButton({ isFocused, label, icon: Icon, style, ...props }, ref) {
  const { theme } = useTheme();

  // One colour for the pair: the prototype sets it on the button and lets the
  // icon stroke `currentColor`, so the label can never drift from the glyph.
  const color = isFocused ? theme.primary : theme.inkFaint;

  return (
    <Pressable ref={ref} role="tab" aria-selected={isFocused} {...props} style={styles.item}>
      <Icon size={22} strokeWidth={1.8} color={color} />
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
