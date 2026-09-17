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

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Absolute on purpose. The Expo plugin rewrites any `callbackURL` starting with `/` into
 * an `underscore://` deep link, which is right for an OAuth round trip and dead in the
 * desktop mail client a verification link may well be opened in.
 */
export const EMAIL_VERIFIED_URL = `${API_URL}/verified`;

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [expoAuthPlugin],
});

export const { signIn, signUp, signOut, useSession } = authClient;

/**
 * The session's `data` infers as `never` through the plugin cast above, so the fields we
 * actually read are named here rather than asserted at each call site.
 */
export type SessionUser = { email: string; emailVerified: boolean };

export function useSessionUser(): SessionUser | undefined {
  const { data } = useSession();
  return (data as { user?: SessionUser } | null | undefined)?.user;
}
