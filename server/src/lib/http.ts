import axios, { type AxiosInstance } from "axios";
import { ApiError } from "./apiError";

type HttpClientOptions = {
  /** Upstream root, e.g. https://www.googleapis.com/books/v1 */
  baseURL: string;
  /** Named in the message of any UPSTREAM_UNAVAILABLE this client raises. */
  name: string;
  timeoutMs?: number;
};

/**
 * Builds the axios instance a connector talks to an upstream through.
 *
 * The point of the factory is the interceptor: every transport failure — a
 * timeout, a DNS miss, a 500 from the provider, a 429 — leaves as the same
 * `UPSTREAM_UNAVAILABLE`, so connectors never restate that mapping and a raw
 * AxiosError (which carries the request config, including any api key) can
 * never reach the terminal error handler and be logged.
 *
 * A 404 is deliberately *not* converted: "this volume does not exist" is a
 * routing answer, not an outage, so connectors get the response back and decide.
 */
export function createHttpClient({
  baseURL,
  name,
  timeoutMs = 8000,
}: HttpClientOptions): AxiosInstance {
  const client = axios.create({
    baseURL,
    timeout: timeoutMs,
    headers: { Accept: "application/json" },
    // Let 404 through to the caller; everything else outside 2xx is an outage.
    validateStatus: (status) => (status >= 200 && status < 300) || status === 404,
  });

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const detail = error.response
          ? `responded ${error.response.status}`
          : (error.code ?? "was unreachable");
        // Deliberately not passing the AxiosError itself as `cause`: it carries
        // the full request config, api key and all, and the terminal handler
        // logs causes. Keep only what a diagnosis actually needs.
        return Promise.reject(
          ApiError.upstreamUnavailable(`${name} ${detail}`, {
            method: error.config?.method,
            url: error.config?.url,
            status: error.response?.status,
            code: error.code,
          }),
        );
      }
      return Promise.reject(error);
    },
  );

  return client;
}
