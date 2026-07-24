import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { authClient } from '@/lib/auth-client';
import { Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async () => {
    setError(null);
    const { error: signInError } = await authClient.signIn.email({ email, password });
    if (signInError) {
      setError(signInError.message ?? 'Failed to sign in');
      return;
    }
    router.replace('/');
  };

  const handleSocialLogin = async (provider: 'google' | 'spotify') => {
    setError(null);
    const { error: signInError } = await authClient.signIn.social({
      provider,
      callbackURL: '/',
    });
    if (signInError) {
      setError(signInError.message ?? `Failed to sign in with ${provider}`);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Underscore</ThemedText>
        <ThemedText type="subtitle">Log in</ThemedText>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error && <ThemedText themeColor="text">{error}</ThemedText>}

        <Button title="Log in" onPress={handleEmailLogin} />
        <Button title="Continue with Google" onPress={() => handleSocialLogin('google')} />
        <Button title="Continue with Spotify" onPress={() => handleSocialLogin('spotify')} />

        <Link href="/sign-up">
          <ThemedText type="link">Don&apos;t have an account? Sign up</ThemedText>
        </Link>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: Spacing.two,
  },
});
