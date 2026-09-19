import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ControlledInput } from '@/components/controlled-input';
import { SocialSignInButtons } from '@/components/social-sign-in-buttons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authClient } from '@/lib/auth-client';
import { loginSchema, type LoginValues } from '@/lib/auth-schemas';
import { pressed } from '@/lib/pressed';

export default function LoginScreen() {
  const {
    control,
    getValues,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async ({ email, password }: LoginValues) => {
    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
    });
    if (signInError) {
      setError('root', { message: signInError.message ?? 'Failed to sign in' });
      return;
    }
    router.replace('/');
  };

  // `getValues` rather than a watch: the address is only read on the tap, and subscribing
  // would re-render the screen on every keystroke.
  const toReset = () => {
    const email = getValues('email').trim();
    router.push({
      pathname: '/reset-password',
      params: email ? { email } : undefined,
    });
  };

  return (
    <View className='bg-background flex-1'>
      <SafeAreaView className='px-screen flex-1 justify-center gap-4'>
        <Text className='text-foreground font-display text-display-md tracking-tight mb-2'>
          Welcome back.
        </Text>

        <ControlledInput
          control={control}
          name='email'
          placeholder='Email'
          autoCapitalize='none'
          autoComplete='email'
          keyboardType='email-address'
        />
        <ControlledInput
          control={control}
          name='password'
          placeholder='Password'
          autoComplete='current-password'
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
          <Text>Log in</Text>
        </Button>
        <Pressable onPress={toReset} style={pressed} className='items-center'>
          <Text className='text-ink-muted font-body text-body-sm'>
            Forgot password? <Text className='text-primary'>Reset</Text>
          </Text>
        </Pressable>
        <SocialSignInButtons
          onError={(message) => setError('root', { message })}
        />

        <View className='items-center'>
          <Link href='/sign-up' className='mt-2'>
            <Text className='text-ink-muted font-body text-body-sm second'>
              Don&apos;t have an account?{' '}
              <Text className='text-primary'>Sign up</Text>
            </Text>
          </Link>
        </View>
      </SafeAreaView>
    </View>
  );
}
