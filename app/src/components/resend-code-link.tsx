import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';

import { Text } from '@/components/ui/text';
import { pressed } from '@/lib/pressed';

/**
 * Long enough that two sends can never fall inside one window of the plugin's production
 * rate limit, which is 3 per 60s on every send-a-code route.
 */
const COOLDOWN_SECONDS = 45;

export function useResendCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft === 0) return;
    const timer = setTimeout(() => setSecondsLeft((left) => left - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return { secondsLeft, arm: () => setSecondsLeft(COOLDOWN_SECONDS) };
}

export function ResendCodeLink({
  secondsLeft,
  disabled,
  onPress,
}: {
  secondsLeft: number;
  disabled?: boolean;
  onPress: () => void;
}) {
  const waiting = secondsLeft > 0;

  return (
    <Pressable
      disabled={waiting || disabled}
      onPress={onPress}
      style={pressed}
      className="items-center">
      <Text className="text-ink-muted font-body text-body-sm">
        Didn&apos;t get it?{' '}
        {waiting ? (
          <Text className="text-ink-faint">Send a new code in {secondsLeft}s</Text>
        ) : (
          <Text className="text-primary">Send a new code</Text>
        )}
      </Text>
    </Pressable>
  );
}
