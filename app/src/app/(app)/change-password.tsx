import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackdrop } from '@/components/app-backdrop';
import { PasswordResetFlow } from '@/components/password-reset-flow';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useSessionUser } from '@/lib/auth-client';
import { CONTENT_GAP } from '@/lib/theme';

/** Where `← Back` goes with no history to pop, where `router.back()` is a silent no-op. */
const BACK_FALLBACK = '/settings';

const back = () =>
  router.canGoBack() ? router.back() : router.replace(BACK_FALLBACK);

/**
 * The signed-in half of the reset flow — the same code and password steps, with the
 * address fixed to the session's. Resetting does not revoke sessions, so this lands back
 * in Settings still signed in.
 */
export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const user = useSessionUser();

  return (
    <View
      className="px-screen flex-1"
      style={{
        gap: CONTENT_GAP,
        paddingTop: insets.top + 6,
        paddingBottom: Math.max(insets.bottom, 34),
      }}>
      <AppBackdrop />

      <View className="flex-row">
        <Button variant="text" size="sm" onPress={back}>
          <Text>← Back</Text>
        </Button>
      </View>

      {user && (
        <PasswordResetFlow
          email={user.email}
          emailEditable={false}
          onDone={back}
        />
      )}
    </View>
  );
}
