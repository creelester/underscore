import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { SettingsRow, SettingsSection } from '@/components/settings-row';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { VerifyEmailCard } from '@/components/verify-email-card';
import { useBookshelf } from '@/features/bookshelf/use-bookshelf';
import { useDisconnectSpotify } from '@/features/music-connector/use-disconnect-spotify';
import { useLinkSpotify } from '@/features/music-connector/use-link-spotify';
import { useMusicConnectorStatus } from '@/features/music-connector/use-music-connector-status';
import { MOOD_STOPS, angleToPoints } from '@/lib/gradients';
import { authClient, useSessionUser } from '@/lib/auth-client';
import { setThemeOverride } from '@/lib/theme-preference';
import { useTheme } from '@/lib/use-theme';

const AVATAR = 60;
const SERVICE_ICON = 36;

const DIAGONAL = angleToPoints(135);

export default function SettingsScreen() {
  const user = useSessionUser();
  const { isLight } = useTheme();

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="gap-4"
      showsVerticalScrollIndicator={false}>
      <Text className="text-foreground font-display text-display-md tracking-tight">
        Settings
      </Text>

      {user && <Profile name={user.name} />}
      {user && !user.emailVerified && <VerifyEmailCard email={user.email} />}

      <SettingsSection label="Connected">
        <SpotifyRow />
        <SettingsRow
          dimmed
          title="Apple Music"
          subtitle="Coming soon"
          leading={
            <View
              className="bg-surface-raised rounded-pill"
              style={{ width: SERVICE_ICON, height: SERVICE_ICON }}
            />
          }
        />
      </SettingsSection>

      <SettingsSection label="Preferences">
        <SettingsRow
          label="Light theme"
          trailing={
            <Switch
              checked={isLight}
              onCheckedChange={(light) => setThemeOverride(light ? 'light' : 'dark')}
              accessibilityLabel="Light theme"
            />
          }
        />
      </SettingsSection>

      {/* Reset password is ours, not the design's: without it the signed-in reset flow
          has no way in. */}
      <View className="flex-row gap-3">
        <Button variant="secondary" size="sm" onPress={() => authClient.signOut()}>
          <Text>Sign out</Text>
        </Button>
        <Link href="/change-password" asChild>
          <Button variant="secondary" size="sm">
            <Text>Reset password</Text>
          </Button>
        </Link>
      </View>
    </ScrollView>
  );
}

function Profile({ name }: { name: string }) {
  const bookshelf = useBookshelf();
  const booksScored = useMemo(
    () => new Set(bookshelf.data?.map((playlist) => playlist.book.id)).size,
    [bookshelf.data],
  );

  return (
    <View className="flex-row items-center gap-4">
      <LinearGradient
        colors={MOOD_STOPS.nostalgic}
        {...DIAGONAL}
        style={{ width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2 }}
      />
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-foreground font-display text-body">
          {name}
        </Text>
        {bookshelf.data && (
          <Text className="text-ink-muted font-body text-body-sm">
            {booksScored} {booksScored === 1 ? 'book' : 'books'} scored
          </Text>
        )}
      </View>
    </View>
  );
}

/** The design shows the Spotify account's address; we store none, so this says state instead. */
function SpotifyRow() {
  const status = useMusicConnectorStatus();
  const link = useLinkSpotify();
  const disconnect = useDisconnectSpotify();

  const isLinked = !!status.data?.linked;
  const isBusy = link.isPending || disconnect.isPending;

  let subtitle = isLinked ? 'Connected' : 'Not connected';
  if (link.isError || disconnect.isError) subtitle = 'Could not reach Spotify';

  return (
    <SettingsRow
      title="Spotify"
      subtitle={status.isPending ? undefined : subtitle}
      leading={
        <LinearGradient
          colors={MOOD_STOPS.hopeful}
          {...DIAGONAL}
          style={{ width: SERVICE_ICON, height: SERVICE_ICON, borderRadius: SERVICE_ICON / 2 }}
        />
      }
      trailing={
        !status.isPending && (
          <Button
            variant="secondary"
            size="sm"
            disabled={isBusy}
            onPress={() => (isLinked ? disconnect.mutate() : link.mutate())}>
            <Text>{isLinked ? 'Disconnect' : 'Connect'}</Text>
          </Button>
        )
      }
    />
  );
}
