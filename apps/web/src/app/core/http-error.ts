import { HttpErrorResponse } from '@angular/common/http';

/**
 * Turns a failed request into a message worth showing the user. A status of 0 means the request
 * never reached the server (backend down, CORS, network) -- worth calling out separately, since
 * "please try again" is misleading when the real problem is "the API isn't running".
 */
export function extractErrorMessage(e: HttpErrorResponse): string {
  if (e.status === 0) {
    return "Could not reach the server. Check that the API is running and reachable.";
  }
  const backendMessage = typeof e.error === 'object' && e.error ? e.error.message : undefined;
  return backendMessage || e.message || `Request failed (HTTP ${e.status}).`;
}
