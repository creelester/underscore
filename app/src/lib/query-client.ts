import { isApiError } from '@/lib/api-client';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { AppState, Platform, type AppStateStatus } from 'react-native';

/**
 * React Query's defaults for online and focus detection are built on the browser's
 * `online` and `focus` events, neither of which React Native fires. Left alone,
 * the library assumes it is permanently online and never focused, so
 * refetch-on-reconnect and refetch-on-foreground silently do nothing. These two
 * wire-ups are what make those defaults real on device; on web the built-in
 * listeners already work, so they are skipped.
 */
if (Platform.OS !== 'web') {
  onlineManager.setEventListener((setOnline) => {
    const subscription = Network.addNetworkStateListener(({ isConnected, isInternetReachable }) => {
      // isInternetReachable is undefined until the first probe resolves; fall
      // back to isConnected rather than reporting the app offline on launch.
      setOnline(isInternetReachable ?? isConnected ?? true);
    });
    return () => subscription.remove();
  });

  const onAppStateChange = (status: AppStateStatus) => focusManager.setFocused(status === 'active');
  AppState.addEventListener('change', onAppStateChange);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Book search results and playlists do not change under the user's feet;
      // a minute of freshness avoids refetching on every screen focus.
      staleTime: 60_000,
      retry: (failureCount, error) => {
        // Only the server says something is worth retrying. A 4xx means the
        // request itself is wrong, so repeating it verbatim cannot help.
        if (isApiError(error) && !error.retryable) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      // Generation is expensive and not idempotent — a retry could bill a second
      // Claude call for a request that actually succeeded.
      retry: false,
    },
  },
});
