import { ApiErrorSchema, type ApiError } from '@underscore/shared';
// Named import rather than `axios.create`: the default export re-exposes its own
// named exports as members, which trips import/no-named-as-default-member.
import { create as createAxiosInstance, type AxiosError } from 'axios';
import { Platform } from 'react-native';

import { authClient } from './auth-client';

/**
 * The client for our own API. Better Auth's own endpoints do not go through here
 * — `authClient` owns those — so this is exclusively `/api/*` product routes.
 */
export const apiClient = createAxiosInstance({
  // Same resolution as auth-client.ts: both must point at the same origin or the
  // session cookie is scoped to a host we never call.
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  timeout: 15_000,
  // Web only. The browser holds the session cookie and the server's cors() is
  // configured with credentials: true. On native there is no cookie jar, so this
  // stays off and the header below carries the session instead — Better Auth's
  // Expo docs are explicit that sending both interferes with the manual header.
  withCredentials: Platform.OS === 'web',
});

if (Platform.OS !== 'web') {
  apiClient.interceptors.request.use((config) => {
    // The Expo plugin keeps the session in SecureStore, not in a cookie jar.
    const cookie = authClient.getCookie();
    if (cookie) config.headers.set('Cookie', cookie);
    return config;
  });
}

/**
 * True when a rejection is our documented error envelope, letting callers branch
 * on `code` rather than on status numbers.
 */
export function isApiError(error: unknown): error is ApiError {
  return ApiErrorSchema.safeParse(error).success;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Unwrap the server's envelope so hooks never handle an AxiosError directly.
    const envelope = ApiErrorSchema.safeParse(error.response?.data);
    if (envelope.success) return Promise.reject(envelope.data);

    // No envelope means we never reached our API (offline, DNS, timeout) or it
    // failed before the error handler ran. Present it in the same shape so
    // consumers have exactly one error type to deal with.
    const fallback: ApiError = {
      code: 'UPSTREAM_UNAVAILABLE',
      message: error.message || 'Could not reach Underscore',
      retryable: true,
    };
    return Promise.reject(fallback);
  },
);
