import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { ControlledInput } from '@/components/controlled-input';
import { ResendCodeLink, useResendCooldown } from '@/components/resend-code-link';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authClient } from '@/lib/auth-client';
import { verifyCodeSchema, type VerifyCodeValues } from '@/lib/auth-schemas';

export function VerifyEmailCard({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  // Sending isn't a form submit, so it needs its own flag to guard against a double tap.
  const [sending, setSending] = useState(false);
  const { secondsLeft, arm } = useResendCooldown();

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<VerifyCodeValues>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { otp: '' },
  });

  const send = async () => {
    clearErrors('root');
    setSending(true);
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'email-verification',
    });
    setSending(false);
    if (error) {
      setError('root', {
        message: error.message ?? 'Could not send a code just now.',
      });
      return;
    }
    arm();
    setSent(true);
  };

  // Nothing to do on success: verifying signals $sessionSignal, so the session refetches
  // and this card unmounts itself.
  const confirm = async ({ otp }: VerifyCodeValues) => {
    const { error } = await authClient.emailOtp.verifyEmail({ email, otp });
    if (error) {
      setError('root', { message: error.message ?? "That code didn't work." });
    }
  };

  return (
    <View className="gap-3">
      <Text className="text-ink-muted font-body text-body-sm">
        Confirm {email} to add Google or Spotify to this account.
      </Text>

      {sent ? (
        <>
          <ControlledInput
            control={control}
            name="otp"
            placeholder="6-digit code"
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            maxLength={6}
            onSubmitEditing={handleSubmit(confirm)}
          />
          <View className="items-start">
            <Button
              variant="secondary"
              disabled={isSubmitting}
              onPress={handleSubmit(confirm)}>
              <Text>Confirm</Text>
            </Button>
          </View>
          <ResendCodeLink
            secondsLeft={secondsLeft}
            disabled={sending || isSubmitting}
            onPress={send}
          />
        </>
      ) : (
        <View className="items-start">
          <Button variant="secondary" disabled={sending} onPress={send}>
            <Text>Send me a code</Text>
          </Button>
        </View>
      )}

      {errors.root && (
        <Text className="text-destructive font-body text-body-sm">
          {errors.root.message}
        </Text>
      )}
    </View>
  );
}
