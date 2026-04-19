/**
 * REST API client for the read-only admin_events dashboard.
 */

import { authFetch } from './client';

export type AdminEventStatus = 'in_progress' | 'success' | 'failed' | 'info';

export interface AdminEvent {
  id: string;
  event_type: string;
  status: AdminEventStatus;
  source: string;
  actor: string | null;
  message: string | null;
  error_message: string | null;
  payload: Record<string, unknown>;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface AdminEventListResponse {
  events: AdminEvent[];
  total: number;
  page: number;
  page_size: number;
}

export async function getAdminEvents(opts: {
  page?: number;
  pageSize?: number;
  eventType?: string;
  status?: AdminEventStatus;
} = {}): Promise<AdminEventListResponse> {
  const params = new URLSearchParams();
  params.set('page', String(opts.page ?? 1));
  params.set('page_size', String(opts.pageSize ?? 50));
  if (opts.eventType) params.set('event_type', opts.eventType);
  if (opts.status) params.set('status', opts.status);

  const resp = await authFetch(`/api/v1/admin/events?${params}`);
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.detail || `Failed to load events: ${resp.status}`);
  }
  return resp.json();
}
