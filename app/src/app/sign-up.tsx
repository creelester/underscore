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
import { signUpSchema, type SignUpValues } from '@/lib/auth-schemas';

export default function SignUpScreen() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async ({ name, email, password }: SignUpValues) => {
    const { error: signUpError } = await authClient.signUp.email({ email, password, name });
    if (signUpError) {
      setError('root', { message: signUpError.message ?? 'Failed to sign up' });
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
          Start a score.
        </Text>

        <ControlledInput control={control} name="name" placeholder="Name" autoComplete="name" />
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
          autoComplete="new-password"
          secureTextEntry
          onSubmitEditing={handleSubmit(onSubmit)}
        />
        {errors.root && (
          <Text className="text-destructive font-body text-body-sm">{errors.root.message}</Text>
        )}

        <Button size="lg" disabled={isSubmitting} onPress={handleSubmit(onSubmit)}>
          <Text>Sign up</Text>
        </Button>
        <SocialSignInButtons onError={(message) => setError('root', { message })} />

        <Link href="/login" className="mt-2">
          <Text className="text-ink-muted font-body text-body-sm">
            Already have an account? <Text className="text-primary">Log in</Text>
          </Text>
        </Link>
      </SafeAreaView>
    </View>
  );
}
