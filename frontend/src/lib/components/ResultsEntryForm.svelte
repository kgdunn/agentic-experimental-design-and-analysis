<script lang="ts">
  interface Props {
    designData: Record<string, unknown>;
    resultsData: Record<string, unknown>[] | null;
    onSave: (results: Record<string, unknown>[]) => Promise<void>;
  }

  let { designData, resultsData, onSave }: Props = $props();

  // Extract the design matrix rows (try design_actual first, then design_matrix)
  let runs = $derived(
    (designData.design_actual as Record<string, unknown>[]) ??
    (designData.design_matrix as Record<string, unknown>[]) ??
    [],
  );

  let factorNames = $derived(
    (designData.factor_names as string[]) ??
    (runs.length > 0 ? Object.keys(runs[0]) : []),
  );

  // Editable response column name
  let responseName = $state('Response');

  // Editable response values (one per run)
  let responses = $state<(string)[]>([]);

  // Track saving state
  let isSaving = $state(false);

  // Initialize responses from existing results_data
  $effect(() => {
    const n = runs.length;
    const initial: string[] = new Array(n).fill('');

    if (resultsData) {
      for (const row of resultsData) {
        const idx = row.run_index as number;
        if (idx >= 0 && idx < n) {
          // Find the first non-run_index key as the response value
          for (const [key, val] of Object.entries(row)) {
            if (key !== 'run_index' && val != null) {
              responseName = key;
              initial[idx] = String(val);
              break;
            }
          }
        }
      }
    }

    responses = initial;
  });

  let filledCount = $derived(
    responses.filter((v) => v !== '' && v !== null).length,
  );

  async function handleSave() {
    isSaving = true;
    try {
      const results: Record<string, unknown>[] = [];
      for (let i = 0; i < responses.length; i++) {
        const val = responses[i];
        if (val !== '' && val !== null) {
          const numVal = Number(val);
          results.push({
            run_index: i,
            [responseName]: isNaN(numVal) ? val : numVal,
          });
        }
      }
      if (results.length > 0) {
        await onSave(results);
      }
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="text-sm font-medium text-gray-700">
      Results Entry ({filledCount} / {runs.length} entered)
    </h3>
    <button
      class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white
             hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed"
      onclick={handleSave}
      disabled={isSaving || filledCount === 0}
    >
      {isSaving ? 'Saving...' : 'Save Results'}
    </button>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr>
          <th class="border-b border-gray-200 px-3 py-1.5 text-left text-xs font-medium uppercase text-gray-500 w-12">
            Run
          </th>
          {#each factorNames as name}
            <th class="border-b border-gray-200 px-3 py-1.5 text-left text-xs font-medium uppercase text-gray-500">
              {name}
            </th>
          {/each}
          <th class="border-b border-gray-200 px-3 py-1.5 text-left text-xs font-medium text-gray-500">
            <input
              type="text"
              class="w-full rounded border border-gray-300 px-2 py-0.5 text-xs font-medium uppercase
                     focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              bind:value={responseName}
              placeholder="Response name"
            />
          </th>
          <th class="border-b border-gray-200 px-2 py-1.5 w-8"></th>
        </tr>
      </thead>
      <tbody>
        {#each runs as run, i}
          <tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td class="border-b border-gray-100 px-3 py-1.5 text-gray-500 font-mono text-xs">
              {i + 1}
            </td>
            {#each factorNames as name}
              <td class="border-b border-gray-100 px-3 py-1.5 text-gray-700 font-mono">
                {run[name] ?? ''}
              </td>
            {/each}
            <td class="border-b border-gray-100 px-1 py-1">
              <input
                type="number"
                step="any"
                class="w-full rounded border border-gray-300 px-2 py-1 text-sm font-mono
                       focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary
                       placeholder-gray-300"
                bind:value={responses[i]}
                placeholder="—"
              />
            </td>
            <td class="border-b border-gray-100 px-2 py-1.5 text-center">
              {#if responses[i] !== '' && responses[i] !== null}
                <svg class="h-4 w-4 text-positive inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              {:else}
                <span class="text-gray-300">—</span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
