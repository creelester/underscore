import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

export function SettingsSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="gap-4">
      <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow font-bold uppercase">
        {label}
      </Text>
      <View>{children}</View>
    </View>
  );
}

/** A plain `label` row, or a `title` over a `subtitle` for a connected service. */
export function SettingsRow({
  label,
  title,
  subtitle,
  leading,
  trailing,
  dimmed,
}: {
  label?: string;
  title?: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  dimmed?: boolean;
}) {
  return (
    <View
      className={cn(
        'border-border flex-row items-center gap-3 border-b py-3.5',
        dimmed && 'opacity-50',
      )}>
      {leading}

      <View className="min-w-0 flex-1">
        {label !== undefined && (
          <Text className="text-foreground font-body text-body">{label}</Text>
        )}
        {title !== undefined && (
          <Text numberOfLines={1} className="text-foreground font-display text-body">
            {title}
          </Text>
        )}
        {subtitle !== undefined && (
          <Text numberOfLines={1} className="text-ink-muted font-body text-body-sm">
            {subtitle}
          </Text>
        )}
      </View>

      {trailing}
    </View>
  );
}
