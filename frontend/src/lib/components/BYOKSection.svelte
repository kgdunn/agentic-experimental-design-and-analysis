<!--
  Bring-Your-Own Anthropic API Key panel for /profile.

  Threat model copy is verbatim from
  docs/architecture/byok-anthropic-token.md and is mandatory per the
  design — it must be visible without scrolling on the enrol form.
  See PR #107 for the full architectural discussion.
-->
<script lang="ts">
  import {
    BYOK_STATUS_LABELS,
    deleteBYOK,
    enrollBYOK,
    getBYOKStatus,
    rotateBYOK,
    testBYOK,
    type BYOKStatus,
    type BYOKStatusResponse,
    type BYOKTestOutcome,
  } from '$lib/api/byok';

  let status = $state<BYOKStatus>('absent');
  let lastVerifiedAt = $state<string | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Mutually-exclusive form modes. ``rotate`` is structurally identical
  // to ``enrol`` but POSTs /rotate so the audit log gets a clear
  // close-out + open pair.
  type Mode = 'idle' | 'enrol' | 'rotate' | 'confirm-remove';
  let mode = $state<Mode>('idle');

  let formPassword = $state('');
  let formApiKey = $state('');
  let submitting = $state(false);
  let toast = $state<{ kind: 'ok' | 'err' | 'info'; text: string } | null>(null);

  async function load() {
    loading = true;
    error = null;
    try {
      apply(await getBYOKStatus());
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load BYOK status';
    } finally {
      loading = false;
    }
  }

  function apply(r: BYOKStatusResponse) {
    status = r.status;
    lastVerifiedAt = r.last_verified_at;
  }

  function resetForm() {
    formPassword = '';
    formApiKey = '';
    mode = 'idle';
  }

  function flash(kind: 'ok' | 'err' | 'info', text: string) {
    toast = { kind, text };
    setTimeout(() => {
      if (toast?.text === text) toast = null;
    }, 6000);
  }

  async function submit() {
    submitting = true;
    error = null;
    try {
      const payload = { password: formPassword, anthropic_api_key: formApiKey };
      const fn = mode === 'rotate' ? rotateBYOK : enrollBYOK;
      apply(await fn(payload));
      flash('ok', mode === 'rotate' ? 'Key rotated.' : 'Key saved.');
      resetForm();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Save failed';
    } finally {
      submitting = false;
    }
  }

  async function handleTest() {
    submitting = true;
    error = null;
    try {
      const r = await testBYOK();
      lastVerifiedAt = r.last_verified_at;
      status = r.status;
      flash(...testFlash(r.outcome));
    } catch (e) {
      error = e instanceof Error ? e.message : 'Test failed';
    } finally {
      submitting = false;
    }
  }

  function testFlash(outcome: BYOKTestOutcome): ['ok' | 'err' | 'info', string] {
    switch (outcome) {
      case 'ok':
        return ['ok', 'Anthropic accepted your key.'];
      case 'rejected':
        return ['err', 'Anthropic rejected your key. Re-enter or rotate it.'];
      case 'transient':
        return ['info', "Couldn't reach Anthropic right now. Try again shortly."];
      case 'no_key':
        return ['info', 'No key on this session. Enrol or sign in again.'];
    }
  }

  async function confirmRemove() {
    submitting = true;
    error = null;
    try {
      await deleteBYOK();
      apply({ status: 'absent', last_verified_at: null });
      flash('ok', 'Key removed.');
      resetForm();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Remove failed';
    } finally {
      submitting = false;
    }
  }

  function relTime(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    const sec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (sec < 60) return 'just now';
    if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)} h ago`;
    return d.toLocaleString();
  }

  function statusColor(s: BYOKStatus): string {
    switch (s) {
      case 'active':
        return 'bg-[color:var(--color-positive)] text-paper';
      case 'rejected':
      case 'orphaned':
        return 'bg-[color:var(--color-negative)] text-paper';
      default:
        return 'bg-ink/10 text-ink';
    }
  }

  $effect(() => {
    void load();
  });
</script>

<section class="mb-8 rounded-lg border border-rule bg-paper-2 p-5">
  <div class="mb-3 flex items-baseline justify-between gap-3">
    <h2 class="text-sm font-medium text-ink">Bring your own Anthropic API key</h2>
    <span class="rounded-full px-2 py-0.5 text-xs {statusColor(status)}">
      {BYOK_STATUS_LABELS[status]}
    </span>
  </div>

  <p class="mb-3 text-xs text-ink-faint">
    Sophisticated users with their own Anthropic account can pay Anthropic
    directly and bypass the platform markup. Your key is encrypted with a key
    derived from your password. Last verified: {relTime(lastVerifiedAt)}.
  </p>

  <!-- Verbatim threat-model disclosure (required by the architecture doc). -->
  <div
    class="mb-4 rounded-md border border-[color:var(--color-warning)]/40 bg-[color:var(--color-warning)]/10 p-3 text-xs text-ink"
  >
    <strong class="block pb-1">What we can and can't promise:</strong>
    Your token is encrypted with a key derived from your password. We
    <strong>cannot</strong> read it from a database backup or query. A
    maintainer who modifies the application code could intercept it when you
    sign in — this is a fundamental limitation of server-side password-based
    encryption. If you need stronger guarantees, do not use BYOK; use
    Anthropic's tools directly.
  </div>

  {#if error}
    <p class="mb-3 text-sm text-[color:var(--color-negative)]">{error}</p>
  {/if}

  {#if toast}
    <p
      class="mb-3 text-sm"
      class:text-[color:var(--color-positive)]={toast.kind === 'ok'}
      class:text-[color:var(--color-negative)]={toast.kind === 'err'}
      class:text-ink-soft={toast.kind === 'info'}
    >
      {toast.text}
    </p>
  {/if}

  {#if loading}
    <p class="text-sm text-ink-faint">Loading…</p>
  {:else if status === 'orphaned'}
    <p class="mb-3 text-sm text-ink-soft">
      Your stored key can no longer be decrypted (typically after a password
      reset). Re-enter your key below to restore BYOK on this account.
    </p>
  {/if}

  {#if mode === 'idle' && !loading}
    <div class="flex flex-wrap gap-2">
      {#if status === 'absent' || status === 'orphaned'}
        <button
          class="rounded-md bg-ink px-3 py-2 text-sm font-medium text-paper hover:opacity-90"
          onclick={() => (mode = 'enrol')}
        >
          Add your API key
        </button>
      {:else}
        <button
          class="rounded-md bg-ink px-3 py-2 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
          onclick={handleTest}
          disabled={submitting}
        >
          Test key
        </button>
        <button
          class="rounded-md border border-rule px-3 py-2 text-sm text-ink hover:bg-ink/5"
          onclick={() => (mode = 'rotate')}
        >
          Replace key
        </button>
        <button
          class="rounded-md border border-rule px-3 py-2 text-sm text-ink-soft hover:bg-[color:var(--color-negative)]/10"
          onclick={() => (mode = 'confirm-remove')}
        >
          Remove
        </button>
      {/if}
    </div>
  {/if}

  {#if mode === 'enrol' || mode === 'rotate'}
    <form
      onsubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      class="mt-2 grid gap-3"
    >
      <label class="grid gap-1 text-sm">
        <span class="text-ink-faint">Anthropic API key</span>
        <input
          type="password"
          autocomplete="off"
          spellcheck="false"
          required
          minlength={16}
          maxlength={1024}
          bind:value={formApiKey}
          placeholder="sk-ant-…"
          class="rounded-md border border-rule bg-paper px-3 py-2 font-mono text-sm text-ink"
        />
      </label>
      <label class="grid gap-1 text-sm">
        <span class="text-ink-faint">Re-enter your account password</span>
        <input
          type="password"
          autocomplete="current-password"
          required
          bind:value={formPassword}
          class="rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink"
        />
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          type="submit"
          class="rounded-md bg-ink px-3 py-2 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
          disabled={submitting || !formPassword || formApiKey.length < 16}
        >
          {mode === 'rotate' ? 'Replace' : 'Save'}
        </button>
        <button
          type="button"
          class="rounded-md border border-rule px-3 py-2 text-sm text-ink-soft hover:bg-ink/5"
          onclick={resetForm}
        >
          Cancel
        </button>
      </div>
    </form>
  {/if}

  {#if mode === 'confirm-remove'}
    <div class="mt-2 grid gap-3">
      <p class="text-sm text-ink">
        Remove your stored Anthropic API key? Subsequent chat will fall back to
        the platform key (with markup).
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          class="rounded-md bg-[color:var(--color-negative)] px-3 py-2 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
          onclick={confirmRemove}
          disabled={submitting}
        >
          Remove key
        </button>
        <button
          class="rounded-md border border-rule px-3 py-2 text-sm text-ink-soft hover:bg-ink/5"
          onclick={resetForm}
        >
          Cancel
        </button>
      </div>
    </div>
  {/if}
</section>
