import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';

/**
 * Cristina's, against the prototype: it deletes straight from the menu, but nothing brings
 * a playlist back. Modelled on the design's `Remove this track?` sheet.
 */
export function DeletePlaylistSheet({
  isOpen,
  onClose,
  onConfirm,
  title,
  isExported,
  isDeleting,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isExported: boolean;
  isDeleting: boolean;
}) {
  return (
    <Sheet isOpen={isOpen} onClose={onClose} label="Delete playlist">
      <View className="gap-1.5">
        <Text className="text-foreground font-display text-title">Delete this playlist?</Text>
        <Text className="text-ink-muted font-body text-body-sm">
          {title} will be removed from your library.
          {isExported && ' The copy in your Spotify stays.'}
        </Text>

        <View className="flex-row gap-2.5 pt-3">
          <Button variant="secondary" size="lg" className="flex-1" onPress={onClose}>
            <Text>Keep</Text>
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="flex-1"
            disabled={isDeleting}
            onPress={onConfirm}>
            <Text className="text-destructive">{isDeleting ? 'Deleting…' : 'Delete'}</Text>
          </Button>
        </View>
      </View>
    </Sheet>
  );
}
