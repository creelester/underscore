import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ControlledInput } from '@/components/controlled-input';
import { SocialSignInButtons } from '@/components/social-sign-in-buttons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { authClient } from '@/lib/auth-client';
import { loginSchema, type LoginValues } from '@/lib/auth-schemas';

export default function LoginScreen() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async ({ email, password }: LoginValues) => {
    const { error: signInError } = await authClient.signIn.email({ email, password });
    if (signInError) {
      setError('root', { message: signInError.message ?? 'Failed to sign in' });
      return;
    }
    router.replace('/');
  };

  return (
    <View className="bg-background flex-1">
      <SafeAreaView className="px-screen flex-1 justify-center gap-4">
        <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow uppercase">
          Under Score
        </Text>
        <Text className="text-foreground font-display text-display-md tracking-tight mb-2">
          Welcome back.
        </Text>

        <ControlledInput
          control={control}
          name="email"
          placeholder="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <ControlledInput
          control={control}
          name="password"
          placeholder="Password"
          autoComplete="current-password"
          secureTextEntry
          onSubmitEditing={handleSubmit(onSubmit)}
        />
        {errors.root && (
          <Text className="text-destructive font-body text-body-sm">{errors.root.message}</Text>
        )}

        <Button size="lg" disabled={isSubmitting} onPress={handleSubmit(onSubmit)}>
          <Text>Log in</Text>
        </Button>
        <SocialSignInButtons onError={(message) => setError('root', { message })} />

        <Link href="/sign-up" className="mt-2">
          <Text className="text-ink-muted font-body text-body-sm">
            Don&apos;t have an account? <Text className="text-primary">Sign up</Text>
          </Text>
        </Link>
      </SafeAreaView>
    </View>
  );
}
