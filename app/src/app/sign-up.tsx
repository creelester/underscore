import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SocialSignInButtons } from '@/components/social-sign-in-buttons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { authClient } from '@/lib/auth-client';
import { Spacing } from '@/constants/theme';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);
    const { error: signUpError } = await authClient.signUp.email({ email, password, name });
    if (signUpError) {
      setError(signUpError.message ?? 'Failed to sign up');
      return;
    }
    router.replace('/');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Underscore</ThemedText>
        <ThemedText type="subtitle">Sign up</ThemedText>

        <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
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

        <Button title="Sign up" onPress={handleSignUp} />
        <SocialSignInButtons onError={setError} />

        <Link href="/login">
          <ThemedText type="link">Already have an account? Log in</ThemedText>
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
