import { z } from 'zod';

/**
 * Client-side shape for the auth forms. Better Auth stays the authority on what a
 * credential actually has to satisfy — these rules exist so the user finds out before
 * a round trip, not to duplicate the server's policy.
 */

export const loginSchema = z.object({
  // `.trim()` first, so the checks below see the trimmed value and the trimmed value
  // is what reaches the submit handler — zodResolver hands `handleSubmit` the parsed
  // output, not the raw field. Better Auth lowercases email with a schema transform
  // but never trims, so without this a padded address is a distinct credential and
  // "  me@x.com " fails to log in. On web the browser hides that by sanitizing
  // input[type=email]; native has no such thing, so this is the only place it holds
  // for both. Whitespace never distinguishes two real addresses.
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const signUpSchema = loginSchema.extend({
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
