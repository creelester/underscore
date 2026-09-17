import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { authClient } from '@/lib/auth-client';

const CODE_LENGTH = 6;

export function VerifyEmailCard({ email }: { email: string }) {
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const send = async () => {
    setBusy(true);
    setError(undefined);
    const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'email-verification',
    });
    setBusy(false);
    if (sendError) {
      setError(sendError.message ?? 'Could not send a code just now.');
      return;
    }
    setSent(true);
  };

  // Nothing to do on success: verifying signals $sessionSignal, so the session refetches
  // and this card unmounts itself.
  const confirm = async () => {
    setBusy(true);
    setError(undefined);
    const { error: confirmError } = await authClient.emailOtp.verifyEmail({ email, otp: code });
    setBusy(false);
    if (confirmError) setError(confirmError.message ?? "That code didn't work.");
  };

  return (
    <View className="gap-3">
      <Text className="text-ink-muted font-body text-body-sm">
        Confirm {email} to add Google or Spotify to this account.
      </Text>

      {sent ? (
        <>
          <Input
            value={code}
            onChangeText={setCode}
            placeholder="6-digit code"
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            onSubmitEditing={confirm}
          />
          <View className="items-start">
            <Button
              variant="secondary"
              disabled={busy || code.length < CODE_LENGTH}
              onPress={confirm}
            >
              <Text>Confirm</Text>
            </Button>
          </View>
        </>
      ) : (
        <View className="items-start">
          <Button variant="secondary" disabled={busy} onPress={send}>
            <Text>Send me a code</Text>
          </Button>
        </View>
      )}

      {error && <Text className="text-destructive font-body text-body-sm">{error}</Text>}
    </View>
  );
}
