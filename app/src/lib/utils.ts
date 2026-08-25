import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge only knows Tailwind's stock scales. Without registering the design's
 * type scale here it reads `text-display-md` as a *colour* class and drops the
 * `text-foreground` that precedes it, so headings silently render in the wrong ink.
 * Same for the custom radii.
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
