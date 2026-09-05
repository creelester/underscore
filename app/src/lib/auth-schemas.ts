import { z } from 'zod';

/**
 * Client-side shape for the auth forms, so the user finds out before a round trip.
 * Better Auth stays the authority on what a credential must satisfy.
 */

export const loginSchema = z.object({
  // `.trim()` first, so the trimmed value is what reaches the submit handler —
  // zodResolver hands it the parsed output. Better Auth lowercases but never trims, so
  // without this "  me@x.com " is a distinct credential that fails to log in. The web
  // browser sanitizes input[type=email]; native does not, so this covers both.
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = loginSchema.extend({
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
