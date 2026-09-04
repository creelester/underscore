import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge knows only Tailwind's stock scales: unregistered, it reads
 * `text-display-md` as a colour class and drops the `text-foreground` before it.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display-xl',
            'display-lg',
            'display-md',
            'title',
            'body-lg',
            'body',
            'body-sm',
            'eyebrow',
          ],
        },
      ],
      rounded: [{ rounded: ['sm', 'card', 'lg', 'pill'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
