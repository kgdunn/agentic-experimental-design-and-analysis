<script lang="ts">
  import { page } from '$app/stores';
  import ChatWindow from '$lib/components/ChatWindow.svelte';
  import { chatState } from '$lib/state/chat.svelte';

  // Load conversation from URL param when returning from experiment detail
  $effect(() => {
    const convId = $page.url.searchParams.get('conversation_id');
    if (convId) {
      chatState.loadConversation(convId);
    }
  });
</script>

<svelte:head>
  <title>Chat | Agentic DOE</title>
</svelte:head>

<div class="h-full">
  <ChatWindow />
</div>
