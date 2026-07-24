import { z } from "zod";

export const ErrorCodeSchema = z.enum([
  "INVALID_INPUT",
  "UNAUTHORIZED",
  "SPOTIFY_TOKEN_EXPIRED",
  "FORBIDDEN",
  "BOOK_NOT_FOUND",
  "PLAYLIST_NOT_FOUND",
  "EMAIL_EXISTS",
  "SPOTIFY_NOT_LINKED",
  "UPSTREAM_UNAVAILABLE",
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const ApiErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string(),
  retryable: z.boolean(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
