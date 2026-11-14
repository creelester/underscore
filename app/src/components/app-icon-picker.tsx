import { Image } from 'expo-image';
import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { SettingsRow } from '@/components/settings-row';
import { Text } from '@/components/ui/text';
import { APP_ICONS, appIconModule, type AppIcon } from '@/lib/app-icons';
import { pressed } from '@/lib/pressed';
import { BORDER, RADIUS } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';
import { cn } from '@/lib/utils';

const PREVIEW = 30;

/** Renders nothing where icons cannot change: Expo Go, web, and devices without support. */
export function AppIconPicker() {
  if (!appIconModule?.supportsAlternateIcons) return null;

  return <Picker icons={appIconModule} />;
}

function Picker({ icons }: { icons: NonNullable<typeof appIconModule> }) {
  const { scheme, theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState(() => icons.getAppIconName() ?? undefined);

  const active = APP_ICONS.find((icon) => icon.name === current) ?? APP_ICONS[0];

  const pick = async (icon: AppIcon) => {
    try {
      await icons.setAlternateAppIcon(icon.name ?? null);
      setCurrent(icon.name);
    } catch {
      // A refused change leaves the selection on the icon still in use.
    }
  };

  return (
    <View>
      <Pressable
        role="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((open) => !open)}
        style={pressed}>
        <SettingsRow
          label="App icon"
          trailing={
            <View className="flex-row items-center gap-3">
              <Image
                source={active[scheme]}
                style={{ width: PREVIEW, height: PREVIEW, borderRadius: RADIUS.sm }}
              />
              <ChevronRight
                size={16}
                color={theme.inkFaint}
                style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
              />
            </View>
          }
        />
      </Pressable>

      {isOpen && (
        <View className="border-border flex-row flex-wrap justify-between gap-y-3.5 border-b pb-4 pt-3.5">
          {APP_ICONS.map((icon) => {
            const isActive = icon === active;
            return (
              <Pressable
                key={icon.label}
                role="radio"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={icon.label}
                onPress={() => pick(icon)}
                className="w-[22%] items-center gap-1.5"
                style={pressed}>
                <Image
                  source={icon[scheme]}
                  style={{
                    width: '100%',
                    aspectRatio: 1,
                    borderRadius: RADIUS.sm,
                    borderWidth: isActive ? BORDER.ring : BORDER.hairline,
                    borderColor: isActive ? theme.primary : theme.border,
                  }}
                />
                <Text
                  numberOfLines={1}
                  className={cn(
                    'font-body text-eyebrow text-center',
                    isActive ? 'text-foreground' : 'text-ink-faint',
                  )}>
                  {icon.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
