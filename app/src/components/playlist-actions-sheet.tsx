import { RefreshCw, Share2, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { pressed } from '@/lib/pressed';
import { useTheme } from '@/lib/use-theme';

/**
 * The `•••` menu. The design lists five items; Rename, Regenerate and Delete are absent
 * until their endpoints exist, rather than shown as controls that do nothing.
 */

type Action = { icon: LucideIcon; label: string; onPress: () => void };

export function PlaylistActionsSheet({
  isOpen,
  onClose,
  title,
  summary,
  onSync,
  onShare,
  isSyncing,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  summary: string;
  onSync: () => void;
  onShare: () => void;
  /** A sync already running; the row says so rather than starting a second one. */
  isSyncing: boolean;
}) {
  const { theme } = useTheme();

  const actions: Action[] = [
    {
      icon: RefreshCw,
      label: isSyncing ? 'Syncing with Spotify…' : 'Sync with Spotify',
      onPress: onSync,
    },
    { icon: Share2, label: 'Share', onPress: onShare },
  ];

  return (
    <Sheet isOpen={isOpen} onClose={onClose} label="Playlist options">
      <View className="gap-[2px] px-[10px] pb-[10px]">
        <Text className="text-foreground font-display text-base">{title}</Text>
        <Text className="text-ink-faint font-body text-body-sm">{summary}</Text>
      </View>

      {actions.map(({ icon: Icon, label, onPress }) => (
        <Pressable
          key={label}
          role="button"
          onPress={onPress}
          disabled={isSyncing}
          className="flex-row items-center gap-[14px] px-[10px] py-[14px]"
          style={pressed}>
          <View className="w-5 items-center">
            <Icon size={18} strokeWidth={1.8} color={theme.inkMuted} />
          </View>
          <Text className="text-foreground font-display-medium text-[15px]">{label}</Text>
        </Pressable>
      ))}
    </Sheet>
  );
}
