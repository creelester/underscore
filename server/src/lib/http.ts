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
 * The axios instance a connector talks to an upstream through. The interceptor is the
 * point: every transport failure leaves as `UPSTREAM_UNAVAILABLE`, so connectors never
 * restate that mapping and a raw AxiosError — which carries the api key in its request
 * config — can never reach the terminal handler and be logged.
 *
 * A 404 is not converted: that is a routing answer, not an outage.
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
        // Not the AxiosError itself as `cause`: it carries the api key in its request
        // config, and the terminal handler logs causes.
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
