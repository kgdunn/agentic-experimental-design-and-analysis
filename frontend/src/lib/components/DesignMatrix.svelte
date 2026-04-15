<script lang="ts">
  interface Props {
    matrix: Record<string, unknown>[];
    columns?: string[];
  }

  let { matrix, columns }: Props = $props();

  let cols = $derived(columns ?? (matrix.length > 0 ? Object.keys(matrix[0]) : []));
</script>

{#if matrix.length > 0}
  <div class="overflow-x-auto">
    <table class="w-full text-sm">
      <thead>
        <tr>
          {#each cols as col}
            <th class="border-b border-gray-200 px-3 py-1.5 text-left text-xs font-medium uppercase text-gray-500">
              {col}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each matrix as row, i}
          <tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            {#each cols as col}
              <td class="border-b border-gray-100 px-3 py-1.5 text-gray-700 font-mono">
                {row[col] ?? ''}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <p class="text-sm text-gray-400">No data</p>
{/if}
