/**
 * Typed client for the Bring-Your-Own-Key (BYOK) Anthropic-token API.
 *
 * Backed by /api/v1/byok (see backend/src/app/api/v1/endpoints/byok.py).
 * The plaintext API key is sent on enrol / rotate only; the server
 * encrypts it under a key derived from the user's password and never
 * returns it to the client. The frontend never stores or caches the
 * key — once submitted, it falls out of scope.
 */

import { authFetch } from './client';

export type BYOKStatus = 'absent' | 'active' | 'rejected' | 'orphaned';

export const BYOK_STATUS_LABELS: Record<BYOKStatus, string> = {
  absent: 'Not enrolled',
  active: 'Active',
  rejected: 'Rejected by Anthropic',
  orphaned: 'Stored key is unrecoverable',
};

export interface BYOKStatusResponse {
  status: BYOKStatus;
  last_verified_at: string | null;
}

export type BYOKTestOutcome = 'ok' | 'rejected' | 'transient' | 'no_key';

export interface BYOKTestResponse {
  outcome: BYOKTestOutcome;
  status: BYOKStatus;
  last_verified_at: string | null;
}

export interface BYOKEnrollRequest {
  password: string;
  anthropic_api_key: string;
}

async function ensureOk(resp: Response, fallback: string): Promise<Response> {
  if (!resp.ok) {
    let detail = fallback;
    try {
      const body = (await resp.json()) as { detail?: string };
      if (body?.detail) detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return resp;
}

export async function getBYOKStatus(): Promise<BYOKStatusResponse> {
  const resp = await authFetch('/api/v1/byok');
  await ensureOk(resp, 'Failed to load BYOK status');
  return (await resp.json()) as BYOKStatusResponse;
}

export async function enrollBYOK(
  payload: BYOKEnrollRequest,
): Promise<BYOKStatusResponse> {
  const resp = await authFetch('/api/v1/byok/enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await ensureOk(resp, 'Failed to enrol API key');
  return (await resp.json()) as BYOKStatusResponse;
}

export async function rotateBYOK(
  payload: BYOKEnrollRequest,
): Promise<BYOKStatusResponse> {
  const resp = await authFetch('/api/v1/byok/rotate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await ensureOk(resp, 'Failed to rotate API key');
  return (await resp.json()) as BYOKStatusResponse;
}

export async function testBYOK(): Promise<BYOKTestResponse> {
  const resp = await authFetch('/api/v1/byok/test', { method: 'POST' });
  await ensureOk(resp, 'Failed to test API key');
  return (await resp.json()) as BYOKTestResponse;
}

export async function deleteBYOK(): Promise<void> {
  const resp = await authFetch('/api/v1/byok', { method: 'DELETE' });
  await ensureOk(resp, 'Failed to remove API key');
}
