import { z } from 'zod';

/**
 * Client-side shape for the auth forms. Better Auth stays the authority on what a
 * credential actually has to satisfy — these rules exist so the user finds out before
 * a round trip, not to duplicate the server's policy.
 */

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = loginSchema.extend({
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
