import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackdrop } from '@/components/app-backdrop';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authClient } from '@/lib/auth-client';

/**
 * Placeholder for the Profile tab (handoff screen 10, "Profile"). The real screen
 * is the avatar and counts, a `CONNECTED` list, three `ThemeSwitch` rows and the
 * app-icon picker added in the second handoff.
 *
 * `Sign out` lives here now rather than on the old placeholder home, which is
 * where the design puts it.
 */
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="px-screen flex-1 gap-4" style={{ paddingTop: insets.top + 6 }}>
      <AppBackdrop />

      <Text className="text-foreground font-display text-[28px] leading-[31px] tracking-tight">
        Profile
      </Text>
      <Text className="text-ink-muted font-body text-body">
        Connected services, preferences and the app-icon picker land here.
      </Text>

      <View className="items-start">
        <Button variant="secondary" onPress={() => authClient.signOut()}>
          <Text>Sign out</Text>
        </Button>
      </View>
    </View>
  );
}
