import { expoClient } from '@better-auth/expo/client';
import type { BetterAuthClientPlugin } from 'better-auth/client';
import { createAuthClient } from 'better-auth/react';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const scheme = Constants.expoConfig?.scheme;
const appScheme = Array.isArray(scheme) ? scheme[0] : (scheme ?? 'underscore');

// expoClient's published types don't structurally match BetterAuthClientPlugin
// at this better-auth version; runtime behavior is unaffected.
const expoAuthPlugin = expoClient({
  scheme: appScheme,
  storagePrefix: 'underscore',
  storage: SecureStore,
}) as unknown as BetterAuthClientPlugin;

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  plugins: [expoAuthPlugin],
});

export const { signIn, signUp, signOut, useSession } = authClient;
