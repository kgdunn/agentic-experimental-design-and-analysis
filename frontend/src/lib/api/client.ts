/**
 * Authenticated fetch wrapper.
 *
 * Injects the Authorization header with the current access token, and
 * transparently refreshes once on a 401 so users don't see "Failed to
 * fetch: 401" the moment their 30-minute access token expires. If the
 * refresh fails, ``authState.refresh`` calls ``logout`` for us and the
 * layout-level auth guard handles the redirect to ``/login``.
 */

import { authState } from '$lib/state/auth.svelte';

/**
 * Shared in-flight refresh promise. Concurrent 401s from different
 * components must not all kick off their own refresh — that would race
 * the refresh-token rotation and log the user out.
 */
let refreshInFlight: Promise<boolean> | null = null;

function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = authState.refresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function withAuthHeader(init: RequestInit | undefined, token: string): RequestInit {
  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${token}`);
  return { ...init, headers };
}

/**
 * Wrapper around fetch() that injects the Bearer token and recovers
 * from a single 401 by refreshing the access token once and retrying.
 * Falls through to a plain fetch when no token is available.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = authState.accessToken;
  if (!token) {
    return fetch(input, init);
  }

  const resp = await fetch(input, withAuthHeader(init, token));
  if (resp.status !== 401) return resp;

  const refreshed = await refreshOnce();
  if (!refreshed || !authState.accessToken) {
    return resp;
  }
  return fetch(input, withAuthHeader(init, authState.accessToken));
}
