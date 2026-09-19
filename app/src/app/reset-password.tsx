import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ControlledInput } from '@/components/controlled-input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authClient } from '@/lib/auth-client';
import {
  requestResetSchema,
  resetPasswordSchema,
  type RequestResetValues,
  type ResetPasswordValues,
} from '@/lib/auth-schemas';

export default function ResetPasswordScreen() {
  const [sentTo, setSentTo] = useState<string>();

  return (
    <View className='bg-background flex-1'>
      <SafeAreaView className='px-screen flex-1 justify-center gap-4'>
        <Text className='text-foreground font-display text-display-md tracking-tight mb-2'>
          {sentTo ? 'Check your email.' : 'Reset your password.'}
        </Text>

        {sentTo ? (
          <SetNewPassword email={sentTo} />
        ) : (
          <RequestCode onSent={setSentTo} />
        )}

        <View className='items-center'>
          <Link href='/login' className='mt-2'>
            <Text className='text-ink-muted font-body text-body-sm'>
              Remembered it? <Text className='text-primary'>Log in</Text>
            </Text>
          </Link>
        </View>
      </SafeAreaView>
    </View>
  );
}

function RequestCode({ onSent }: { onSent: (email: string) => void }) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RequestResetValues>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { email: '' },
  });

  // Advances whatever comes back. The endpoint answers the same for an address with no
  // account, and branching on it here would leak which addresses have one.
  const onSubmit = async ({ email }: RequestResetValues) => {
    const { error } = await authClient.emailOtp.requestPasswordReset({ email });
    if (error) {
      setError('root', {
        message: error.message ?? 'Could not send a code just now.',
      });
      return;
    }
    onSent(email);
  };

  return (
    <>
      <Text className='text-ink-muted font-body text-body-sm'>
        We&apos;ll email you a six-digit code to set a new one with.
      </Text>
      <ControlledInput
        control={control}
        name='email'
        placeholder='Email'
        autoCapitalize='none'
        autoComplete='email'
        keyboardType='email-address'
        onSubmitEditing={handleSubmit(onSubmit)}
      />
      {errors.root && (
        <Text className='text-destructive font-body text-body-sm'>
          {errors.root.message}
        </Text>
      )}
      <Button
        size='lg'
        disabled={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      >
        <Text>Email me a code</Text>
      </Button>
    </>
  );
}

function SetNewPassword({ email }: { email: string }) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email, otp: '', password: '' },
  });

  // A successful reset also marks the address verified: receiving the code proved it.
  const onSubmit = async ({ otp, password }: ResetPasswordValues) => {
    const { error } = await authClient.emailOtp.resetPassword({
      email,
      otp,
      password,
    });
    if (error) {
      setError('root', { message: error.message ?? "That code didn't work." });
      return;
    }
    router.replace('/login');
  };

  return (
    <>
      <Text className='text-ink-muted font-body text-body-sm'>
        We sent a six-digit code to {email}. It expires in five minutes.
      </Text>
      <ControlledInput
        control={control}
        name='otp'
        placeholder='6-digit code'
        keyboardType='number-pad'
        textContentType='oneTimeCode'
        autoComplete='one-time-code'
        maxLength={6}
      />
      <ControlledInput
        control={control}
        name='password'
        placeholder='New password'
        autoComplete='new-password'
        secureTextEntry
        onSubmitEditing={handleSubmit(onSubmit)}
      />
      {errors.root && (
        <Text className='text-destructive font-body text-body-sm'>
          {errors.root.message}
        </Text>
      )}
      <Button
        size='lg'
        disabled={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      >
        <Text>Set new password</Text>
      </Button>
    </>
  );
}
