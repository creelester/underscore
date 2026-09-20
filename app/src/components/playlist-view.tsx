import {
  DEFAULT_MOOD,
  spotifyPlaylistDeepLink,
  spotifyPlaylistWebUrl,
  type Playlist,
} from '@underscore/shared';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackdrop } from '@/components/app-backdrop';
import { PlaylistActionsSheet } from '@/components/playlist-actions-sheet';
import { PlaylistHero } from '@/components/playlist-hero';
import { PlaylistSavedSheet } from '@/components/playlist-saved-sheet';
import { TrackRow } from '@/components/track-row';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Toast } from '@/components/ui/toast';
import { useLinkSpotify } from '@/features/music-connector/use-link-spotify';
import { useMusicConnectorStatus } from '@/features/music-connector/use-music-connector-status';
import { useExportPlaylist, useSyncPlaylist } from '@/features/playlists/use-export-playlist';
import { isApiError } from '@/lib/api-client';
import { moodSentence, playlistEyebrow, trackSummary } from '@/lib/playlist-display';

/**
 * The scored playlist — where generation lands and what the bookshelf opens, which is why
 * it is a component rather than living in either route.
 *
 * Every control here goes through Spotify, so each one connects it first if it has to.
 * Nothing on screen is inert: the actions the design shows that have no endpoint yet
 * (rename, regenerate, delete, removing a track) are absent, not disabled.
 */

const TOAST_MS = 2200;
const FAB = 52;

export function PlaylistView({ playlist }: { playlist: Playlist }) {
  const insets = useSafeAreaInsets();

  const [actionsOpen, setActionsOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [toast, setToast] = useState<string>();

  const { data: status } = useMusicConnectorStatus();
  const link = useLinkSpotify();
  const exportPlaylist = useExportPlaylist(playlist.id);
  const sync = useSyncPlaylist(playlist.id);

  const flash = useFlash(setToast);

  const moods = playlist.moodProfile.mood;
  const isSaved = !!playlist.spotifyPlaylistId;
  const isWorking = link.isPending || exportPlaylist.isPending || sync.isPending;

  /**
   * The Spotify id, connecting and saving on the way if this is the first time. Every
   * control needs it, and none of them should make the reader go and press another one
   * first.
   */
  const ensureSaved = async (): Promise<string | undefined> => {
    if (playlist.spotifyPlaylistId) return playlist.spotifyPlaylistId;

    try {
      if (!status?.linked) {
        const linked = await link.mutateAsync();
        // A refused grant and a dismissed browser are indistinguishable here, so the
        // wording cannot name which happened.
        if (!linked.linked) {
          flash('Spotify was not connected.');
          return undefined;
        }
      }

      const { spotifyPlaylistId } = await exportPlaylist.mutateAsync();
      return spotifyPlaylistId;
    } catch (error) {
      flash(isApiError(error) ? error.message : 'Could not reach Spotify.');
      return undefined;
    }
  };

  const save = async () => {
    if (isSaved) {
      setSavedOpen(true);
      return;
    }
    if (await ensureSaved()) setSavedOpen(true);
  };

  const openInSpotify = async () => {
    const spotifyPlaylistId = await ensureSaved();
    if (!spotifyPlaylistId) return;

    setSavedOpen(false);
    try {
      await Linking.openURL(spotifyPlaylistDeepLink(spotifyPlaylistId));
    } catch {
      // No Spotify app on the device — the web player is the same playlist.
      await Linking.openURL(spotifyPlaylistWebUrl(spotifyPlaylistId));
    }
  };

  const share = async () => {
    setActionsOpen(false);
    const spotifyPlaylistId = await ensureSaved();
    if (!spotifyPlaylistId) return;

    const url = spotifyPlaylistWebUrl(spotifyPlaylistId);
    // `message` as well as `url`: Android's share sheet ignores `url` entirely.
    await Share.share({ message: url, url });
  };

  const resync = async () => {
    setActionsOpen(false);
    try {
      await sync.mutateAsync();
      flash('Synced with Spotify.');
    } catch (error) {
      flash(isApiError(error) ? error.message : 'Could not reach Spotify.');
    }
  };

  const summary = trackSummary(playlist);

  return (
    <View className="flex-1">
      <AppBackdrop />

      <PlaylistHero
        moods={moods}
        coverUrl={playlist.book.thumbnailUrl}
        eyebrow={playlistEyebrow(playlist)}
        title={playlist.name}
        onOpenActions={() => setActionsOpen(true)}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          gap: 16,
          paddingHorizontal: 22,
          paddingTop: 18,
          paddingBottom: Math.max(insets.bottom, 28),
        }}>
        <View className="gap-1">
          <Text className="text-ink-muted font-body text-body-sm">
            {moodSentence(playlist.moodProfile)}
          </Text>
          <Text className="text-ink-faint font-body text-body-sm">{summary}</Text>
          {isSaved && (
            <Text className="text-ink-faint font-mono mt-[2px] text-[12px]">
              {sync.isPending ? 'Syncing with Spotify…' : 'Synced with Spotify'}
            </Text>
          )}
        </View>

        <View className="flex-row items-center gap-3">
          <Button size="lg" className="flex-1" disabled={isWorking} onPress={save}>
            <Text>{isSaved ? 'Saved ✓' : 'Save to Spotify'}</Text>
          </Button>
          {/* The design plays here in-app. There is no in-app player, and the MVP's
              playback is the hand-off, so this opens Spotify — saving first if needed. */}
          <Button
            size="icon"
            aria-label="Open in Spotify"
            disabled={isWorking}
            style={{ width: FAB, height: FAB }}
            onPress={openInSpotify}>
            {/* Variation selector: bare U+25B6 renders as the blue emoji triangle. */}
            <Text className="text-[17px]">▶︎</Text>
          </Button>
        </View>

        <View>
          {playlist.tracks.map(({ track, position }) => (
            <TrackRow
              key={position}
              track={track}
              // Alternating across the pair, as the design's rows do.
              mood={moods[position % Math.max(moods.length, 1)] ?? DEFAULT_MOOD}
            />
          ))}
        </View>

        {playlist.isTooShort && (
          <Text className="text-ink-faint font-body text-body-sm">
            A smaller playlist than usual — fewer tracks than expected turned up on Spotify.
          </Text>
        )}
      </ScrollView>

      <PlaylistActionsSheet
        isOpen={actionsOpen}
        onClose={() => setActionsOpen(false)}
        title={playlist.name}
        summary={summary}
        onSync={resync}
        onShare={share}
        isSyncing={sync.isPending}
      />

      <PlaylistSavedSheet
        isOpen={savedOpen}
        onClose={() => setSavedOpen(false)}
        title={playlist.name}
        onOpenSpotify={openInSpotify}
      />

      <Toast message={toast} />
    </View>
  );
}

/** Clears the toast on its own, and on unmount so a late timer cannot set state. */
function useFlash(setToast: (message?: string) => void) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  return useCallback(
    (message: string) => {
      clearTimeout(timer.current);
      setToast(message);
      timer.current = setTimeout(() => setToast(undefined), TOAST_MS);
    },
    [setToast]
  );
}
