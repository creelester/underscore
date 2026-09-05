import { isApiError } from '@/lib/api-client';
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';
import { AppState, Platform, type AppStateStatus } from 'react-native';

/**
 * React Query's online and focus detection is built on browser events React Native
 * never fires, so refetch-on-reconnect and refetch-on-foreground silently do nothing.
 * These wire-ups make them real on device; web's built-in listeners already work.
 */
if (Platform.OS !== 'web') {
  onlineManager.setEventListener((setOnline) => {
    const subscription = Network.addNetworkStateListener(({ isConnected, isInternetReachable }) => {
      // isInternetReachable is undefined until the first probe, which would otherwise
      // report the app offline on launch.
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
      // Searches and playlists do not change under the user's feet.
      staleTime: 60_000,
      retry: (failureCount, error) => {
        // A 4xx means the request itself is wrong; repeating it cannot help.
        if (isApiError(error) && !error.retryable) return false;
        return failureCount < 2;
      },
    },
    mutations: {
      // Generation is not idempotent: a retry could bill a second Claude call for a
      // request that succeeded.
      retry: false,
    },
  },
});
