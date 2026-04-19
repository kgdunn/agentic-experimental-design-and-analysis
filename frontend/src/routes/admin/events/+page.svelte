<script lang="ts">
  import {
    getAdminEvents,
    type AdminEvent,
    type AdminEventStatus,
  } from '$lib/api/adminEvents';

  let events = $state<AdminEvent[]>([]);
  let total = $state(0);
  let page = $state(1);
  let pageSize = 50;
  let eventType = $state<string>('');
  let statusFilter = $state<string>('');
  let loading = $state(true);
  let error = $state<string | null>(null);
  let expanded = $state<Set<string>>(new Set());

  const EVENT_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: 'All event types' },
    { value: 'postgres_backup', label: 'postgres_backup' },
    { value: 'postgres_restore', label: 'postgres_restore' },
    { value: 'restore_drill', label: 'restore_drill' },
    { value: 'user_count_snapshot', label: 'user_count_snapshot' },
    { value: 'token_usage_snapshot', label: 'token_usage_snapshot' },
  ];

  const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: 'All statuses' },
    { value: 'success', label: 'success' },
    { value: 'failed', label: 'failed' },
    { value: 'in_progress', label: 'in_progress' },
    { value: 'info', label: 'info' },
  ];

  async function load() {
    loading = true;
    error = null;
    try {
      const res = await getAdminEvents({
        page,
        pageSize,
        eventType: eventType || undefined,
        status: (statusFilter || undefined) as AdminEventStatus | undefined,
      });
      events = res.events;
      total = res.total;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load events';
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    void page;
    void eventType;
    void statusFilter;
    load();
  });

  function toggleExpanded(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    expanded = next;
  }

  function onFilterChange() {
    page = 1;
  }

  function statusBadgeClass(status: AdminEventStatus): string {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-amber-100 text-amber-800';
      case 'info':
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  function formatDuration(ms: number | null): string {
    if (ms === null || ms === undefined) return '—';
    if (ms < 1000) return `${ms}ms`;
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds - minutes * 60);
    return `${minutes}m ${remainingSeconds}s`;
  }

  function formatCreatedAt(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function summarize(event: AdminEvent): string {
    const key = event.payload?.['s3_key'];
    if (typeof key === 'string' && key.length > 0) return key;
    if (event.message) return event.message;
    return '—';
  }

  let totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));
</script>

<div class="p-6">
  <div class="mx-auto max-w-6xl space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Events</h2>
        <p class="mt-1 text-sm text-gray-500">
          Backup runs, restore drills, and other operational events written to the
          <code class="rounded bg-gray-100 px-1 py-0.5 text-xs">admin_events</code> table.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <select
          bind:value={eventType}
          onchange={onFilterChange}
          class="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        >
          {#each EVENT_TYPE_OPTIONS as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
        <select
          bind:value={statusFilter}
          onchange={onFilterChange}
          class="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        >
          {#each STATUS_OPTIONS as opt}
            <option value={opt.value}>{opt.label}</option>
          {/each}
        </select>
        <button
          onclick={() => load()}
          class="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>
    </div>

    {#if error}
      <div class="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
    {/if}

    {#if loading}
      <p class="text-sm text-gray-500">Loading...</p>
    {:else if events.length === 0}
      <p class="text-sm text-gray-500">No events match the current filters.</p>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 bg-white text-sm">
          <thead class="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
            <tr>
              <th class="px-3 py-2">Created (UTC)</th>
              <th class="px-3 py-2">Event type</th>
              <th class="px-3 py-2">Status</th>
              <th class="px-3 py-2">Source</th>
              <th class="px-3 py-2">Duration</th>
              <th class="px-3 py-2">Summary</th>
              <th class="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            {#each events as event}
              {@const isOpen = expanded.has(event.id)}
              <tr class="cursor-pointer hover:bg-gray-50" onclick={() => toggleExpanded(event.id)}>
                <td class="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">
                  {formatCreatedAt(event.created_at)}
                </td>
                <td class="px-3 py-2 font-mono text-xs text-gray-900">{event.event_type}</td>
                <td class="px-3 py-2">
                  <span class="rounded px-2 py-0.5 text-xs font-medium {statusBadgeClass(event.status)}">
                    {event.status}
                  </span>
                </td>
                <td class="px-3 py-2 text-xs text-gray-700">{event.source}</td>
                <td class="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">
                  {formatDuration(event.duration_ms)}
                </td>
                <td class="px-3 py-2 text-xs text-gray-700 max-w-md truncate" title={summarize(event)}>
                  {summarize(event)}
                </td>
                <td class="px-3 py-2 text-right text-gray-400">{isOpen ? '▴' : '▾'}</td>
              </tr>
              {#if isOpen}
                <tr class="bg-gray-50">
                  <td colspan="7" class="px-3 py-3">
                    <div class="space-y-2 text-xs">
                      {#if event.error_message}
                        <div class="rounded-md bg-red-50 p-2 font-mono whitespace-pre-wrap text-red-700">
                          {event.error_message}
                        </div>
                      {/if}
                      {#if event.message}
                        <div class="text-gray-700"><span class="font-semibold">message:</span> {event.message}</div>
                      {/if}
                      <div class="text-gray-600">
                        <span class="font-semibold">started_at:</span>
                        {event.started_at ?? '—'}
                        &nbsp;&middot;&nbsp;
                        <span class="font-semibold">completed_at:</span>
                        {event.completed_at ?? '—'}
                        &nbsp;&middot;&nbsp;
                        <span class="font-semibold">actor:</span>
                        {event.actor ?? '—'}
                      </div>
                      <div>
                        <div class="mb-1 font-semibold text-gray-700">payload</div>
                        <pre class="overflow-x-auto rounded-md bg-white p-2 font-mono text-xs text-gray-800 border border-gray-200">{JSON.stringify(event.payload, null, 2)}</pre>
                      </div>
                    </div>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>

      {#if totalPages > 1}
        <div class="flex items-center justify-between pt-4">
          <p class="text-sm text-gray-500">{total} total events</p>
          <div class="flex gap-2">
            <button
              onclick={() => (page = Math.max(1, page - 1))}
              disabled={page <= 1}
              class="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span class="px-2 py-1 text-sm text-gray-600">Page {page} of {totalPages}</span>
            <button
              onclick={() => (page = Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              class="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
