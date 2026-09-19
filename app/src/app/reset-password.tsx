import { Link, router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PasswordResetFlow } from '@/components/password-reset-flow';
import { Text } from '@/components/ui/text';

export default function ResetPasswordScreen() {
  // Carried from the login screen, so an address already typed there isn't typed twice.
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <View className="bg-background flex-1">
      <SafeAreaView className="px-screen flex-1 justify-center gap-4">
        <PasswordResetFlow
          email={email}
          onDone={() => router.replace('/login')}
        />

        <View className="items-center">
          <Link href="/login" className="mt-2">
            <Text className="text-ink-muted font-body text-body-sm">
              Remembered it? <Text className="text-primary">Log in</Text>
            </Text>
          </Link>
        </View>
      </SafeAreaView>
    </View>
  );
}
