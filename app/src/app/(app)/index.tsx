import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authClient } from '@/lib/auth-client';

/**
 * Placeholder until the design handoff's Now / Library / Profile tabs are built.
 */
export default function HomeScreen() {
  return (
    <View className="bg-background flex-1">
      <SafeAreaView className="px-screen flex-1 items-center justify-center gap-4">
        <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow uppercase">
          Under Score
        </Text>
        <Text className="text-foreground font-display text-display-md tracking-tight text-center">
          Signed in.
        </Text>
        <Text className="text-ink-muted font-body text-body text-center">
          The scoring flow lands here next.
        </Text>

        <Button variant="secondary" size="lg" onPress={() => authClient.signOut()}>
          <Text>Sign out</Text>
        </Button>
      </SafeAreaView>
    </View>
  );
}
