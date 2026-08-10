import { Platform, TextInput } from 'react-native';

import { cn } from '@/lib/utils';

/**
 * The handoff's pill field: 52px tall, `--radius-pill`, `--surface` fill,
 * 1px `--border`, 20px horizontal padding.
 */
function Input({
  className,
  ...props
}: React.ComponentProps<typeof TextInput> & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      className={cn(
        'border-border bg-surface text-foreground font-body flex h-[52px] w-full min-w-0 flex-row items-center rounded-pill border px-5 text-base',
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
