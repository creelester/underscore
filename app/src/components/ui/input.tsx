import { Platform, TextInput } from 'react-native';

import { cn } from '@/lib/utils';

const SIZES = {
  /** The design's standalone field: 52px tall on `--surface`. */
  default: 'h-[52px] bg-surface px-5 font-body text-base',
  /** Sized and coloured to sit under a row of chips. */
  sm: 'h-[42px] bg-surface-2 px-[18px] font-display text-sm',
} as const;

function Input({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof TextInput> &
  React.RefAttributes<TextInput> & { size?: keyof typeof SIZES }) {
  return (
    <TextInput
      className={cn(
        'border-border text-foreground rounded-pill flex w-full min-w-0 flex-row items-center border',
        SIZES[size],
        props.editable === false && 'opacity-50',
        Platform.select({
          web: cn(
            'placeholder:text-ink-faint selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow]',
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]'
          ),
          native: 'placeholder:text-ink-faint',
        }),
        className
      )}
      {...props}
    />
  );
}

export { Input };
