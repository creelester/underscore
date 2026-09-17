import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { EMAIL_VERIFIED_URL, authClient, useSessionUser } from '@/lib/auth-client';

/**
 * Placeholder for the Settings tab. The real screen is the avatar and counts, a
 * `CONNECTED` list, three `ThemeSwitch` rows and the app-icon picker.
 */
export default function SettingsScreen() {
  const user = useSessionUser();
  const [sent, setSent] = useState(false);

  return (
    <View className="flex-1 gap-4">
      <Text className="text-foreground font-display text-[28px] leading-[31px] tracking-tight">
        Settings
      </Text>
      <Text className="text-ink-muted font-body text-body">
        Connected services, preferences and the app-icon picker land here.
      </Text>

      {/* The way back for accounts that predate verification: Better Auth refuses to link
          a social provider while the address is unverified. */}
      {user && !user.emailVerified && (
        <View className="items-start gap-2">
          <Text className="text-ink-muted font-body text-body-sm">
            Confirm {user.email} to add Google or Spotify to this account.
          </Text>
          <Button
            variant="secondary"
            disabled={sent}
            onPress={async () => {
              await authClient.sendVerificationEmail({
                email: user.email,
                callbackURL: EMAIL_VERIFIED_URL,
              });
              setSent(true);
            }}
          >
            <Text>{sent ? 'Email sent' : 'Send confirmation email'}</Text>
          </Button>
        </View>
      )}

      <View className="items-start">
        <Button variant="secondary" onPress={() => authClient.signOut()}>
          <Text>Sign out</Text>
        </Button>
      </View>
    </View>
  );
}
