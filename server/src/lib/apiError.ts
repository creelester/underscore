import type { ApiError as ApiErrorBody, ErrorCode } from "@underscore/shared";

/**
 * Statuses from the error code reference in the API design doc. Here rather than at
 * each throw site so one code cannot go out at two statuses.
 */
const STATUS_BY_CODE: Record<ErrorCode, number> = {
  INVALID_INPUT: 400,
  UNAUTHORIZED: 401,
  SPOTIFY_TOKEN_EXPIRED: 401,
  FORBIDDEN: 403,
  BOOK_NOT_FOUND: 404,
  PLAYLIST_NOT_FOUND: 404,
  EMAIL_EXISTS: 409,
  SPOTIFY_NOT_LINKED: 409,
  UPSTREAM_UNAVAILABLE: 502,
};

/**
 * Safe to render to the client as the documented envelope. Anything else thrown is a
 * bug, and app.ts renders it as an opaque 500 — a message we did not write is one we
 * have not checked for leaking internals.
 */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly retryable: boolean;

  constructor(code: ErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ApiError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    // Every other code describes something the client must change before retrying.
    this.retryable = code === "UPSTREAM_UNAVAILABLE";
  }

  toBody(): ApiErrorBody {
    return { code: this.code, message: this.message, retryable: this.retryable };
  }

  static invalidInput(message: string) {
    return new ApiError("INVALID_INPUT", message);
  }

  static bookNotFound(message = "Book not found") {
    return new ApiError("BOOK_NOT_FOUND", message);
  }

  static playlistNotFound(message = "Playlist not found") {
    return new ApiError("PLAYLIST_NOT_FOUND", message);
  }

  static forbidden(message = "You do not have access to this resource") {
    return new ApiError("FORBIDDEN", message);
  }

  static upstreamUnavailable(message: string, cause?: unknown) {
    return new ApiError("UPSTREAM_UNAVAILABLE", message, { cause });
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
