<script lang="ts">
  import { experimentsState } from '$lib/state/experiments.svelte';
  import type { ExperimentStatus } from '$lib/types';

  const STATUS_COLORS: Record<ExperimentStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    archived: 'bg-yellow-100 text-yellow-700',
  };

  const STATUSES: (ExperimentStatus | null)[] = [null, 'draft', 'active', 'completed', 'archived'];
  const STATUS_LABELS: Record<string, string> = {
    '': 'All',
    draft: 'Draft',
    active: 'Active',
    completed: 'Completed',
    archived: 'Archived',
  };

  let confirmDeleteId = $state<string | null>(null);

  $effect(() => {
    experimentsState.loadExperiments();
  });

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  let totalPages = $derived(
    Math.max(1, Math.ceil(experimentsState.total / experimentsState.pageSize)),
  );

  async function handleDelete(id: string) {
    await experimentsState.remove(id);
    confirmDeleteId = null;
  }
</script>

<svelte:head>
  <title>Experiments | Agentic DOE</title>
</svelte:head>

<div class="h-full overflow-y-auto">
  <div class="mx-auto max-w-5xl px-6 py-8">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Experiments</h1>
      <p class="mt-1 text-sm text-gray-500">
        View and manage your experimental designs and results.
      </p>
    </div>

    <!-- Status filter -->
    <div class="mb-6 flex gap-2">
      {#each STATUSES as status}
        <button
          class="rounded-full px-4 py-1.5 text-sm font-medium transition-colors
                 {experimentsState.statusFilter === status
                   ? 'bg-primary text-white'
                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}"
          onclick={() => experimentsState.setFilter(status)}
        >
          {STATUS_LABELS[status ?? '']}
        </button>
      {/each}
    </div>

    <!-- Error -->
    {#if experimentsState.error}
      <div class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-negative">
        {experimentsState.error}
      </div>
    {/if}

    <!-- Loading -->
    {#if experimentsState.isLoading}
      <div class="flex items-center justify-center py-12">
        <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>

    <!-- Empty state -->
    {:else if experimentsState.experiments.length === 0}
      <div class="rounded-lg border-2 border-dashed border-gray-200 px-6 py-12 text-center">
        <h3 class="text-lg font-medium text-gray-600">No experiments yet</h3>
        <p class="mt-2 text-sm text-gray-400">
          Start a conversation to generate your first experimental design.
        </p>
        <a
          href="/chat"
          class="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white
                 hover:bg-primary-dark transition-colors"
        >
          Go to Chat
        </a>
      </div>

    <!-- Experiments list -->
    {:else}
      <div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50">
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Runs</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Factors</th>
              <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
              <th class="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each experimentsState.experiments as exp}
              <tr class="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3">
                  <a
                    href="/experiments/{exp.id}"
                    class="font-medium text-primary hover:text-primary-dark"
                  >
                    {exp.name}
                  </a>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium {STATUS_COLORS[exp.status]}">
                    {exp.status}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-600">
                  {exp.design_type?.replace(/_/g, ' ') ?? '—'}
                </td>
                <td class="px-4 py-3 text-gray-600 font-mono">
                  {exp.n_runs ?? '—'}
                </td>
                <td class="px-4 py-3 text-gray-600 font-mono">
                  {exp.n_factors ?? '—'}
                </td>
                <td class="px-4 py-3 text-gray-500">
                  {formatDate(exp.created_at)}
                </td>
                <td class="px-4 py-3 text-right">
                  {#if confirmDeleteId === exp.id}
                    <button
                      class="rounded bg-negative px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                      onclick={() => handleDelete(exp.id)}
                    >
                      Confirm
                    </button>
                    <button
                      class="ml-1 rounded bg-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-300"
                      onclick={() => (confirmDeleteId = null)}
                    >
                      Cancel
                    </button>
                  {:else}
                    <button
                      class="rounded px-2 py-1 text-xs text-gray-400 hover:bg-red-50 hover:text-negative transition-colors"
                      onclick={() => (confirmDeleteId = exp.id)}
                    >
                      Delete
                    </button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      {#if totalPages > 1}
        <div class="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {(experimentsState.page - 1) * experimentsState.pageSize + 1}–{Math.min(
              experimentsState.page * experimentsState.pageSize,
              experimentsState.total,
            )} of {experimentsState.total}
          </span>
          <div class="flex gap-2">
            <button
              class="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={experimentsState.page <= 1}
              onclick={() => experimentsState.goToPage(experimentsState.page - 1)}
            >
              Previous
            </button>
            <button
              class="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={experimentsState.page >= totalPages}
              onclick={() => experimentsState.goToPage(experimentsState.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
