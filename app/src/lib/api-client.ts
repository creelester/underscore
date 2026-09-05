import { ApiErrorSchema, type ApiError } from '@underscore/shared';
// Named import rather than `axios.create`: the default export re-exposes its own
// named exports as members, which trips import/no-named-as-default-member.
import { create as createAxiosInstance, type AxiosError } from 'axios';
import { Platform } from 'react-native';

import { authClient } from './auth-client';

/** Product routes only; `authClient` owns Better Auth's own endpoints. */
export const apiClient = createAxiosInstance({
  // Must resolve to the same origin as auth-client.ts, or the session cookie is scoped
  // to a host we never call.
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  timeout: 15_000,
  // Web only: the browser holds the cookie. On native there is no cookie jar and the
  // header below carries the session — Better Auth's Expo docs warn that sending both
  // interferes with the manual header.
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

/** True when a rejection is our error envelope, so callers branch on `code`. */
export function isApiError(error: unknown): error is ApiError {
  return ApiErrorSchema.safeParse(error).success;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Unwrap the server's envelope so hooks never handle an AxiosError directly.
    const envelope = ApiErrorSchema.safeParse(error.response?.data);
    if (envelope.success) return Promise.reject(envelope.data);

    // No envelope means we never reached our API, or it failed before the error handler
    // ran. Same shape either way, so consumers have one error type.
    const fallback: ApiError = {
      code: 'UPSTREAM_UNAVAILABLE',
      message: error.message || 'Could not reach Underscore',
      retryable: true,
    };
    return Promise.reject(fallback);
  },
);
