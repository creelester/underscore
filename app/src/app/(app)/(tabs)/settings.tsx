import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { VerifyEmailCard } from '@/components/verify-email-card';
import { authClient, useSessionUser } from '@/lib/auth-client';

/**
 * Placeholder for the Settings tab. The real screen is the avatar and counts, a
 * `CONNECTED` list, three `ThemeSwitch` rows and the app-icon picker.
 */
export default function SettingsScreen() {
  const user = useSessionUser();

  return (
    <View className="flex-1 gap-4">
      <Text className="text-foreground font-display text-[28px] leading-[31px] tracking-tight">
        Settings
      </Text>
      <Text className="text-ink-muted font-body text-body">
        Connected services, preferences and the app-icon picker land here.
      </Text>

      {user && !user.emailVerified && <VerifyEmailCard email={user.email} />}

      <View className="items-start">
        <Button variant="secondary" onPress={() => authClient.signOut()}>
          <Text>Sign out</Text>
        </Button>
      </View>
    </View>
  );
}
