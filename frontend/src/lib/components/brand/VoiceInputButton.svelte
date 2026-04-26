<script lang="ts">
  import { onDestroy } from 'svelte';
  import Icon from './Icon.svelte';

  interface Props {
    onTranscript: (text: string) => void;
    disabled?: boolean;
  }

  let { onTranscript, disabled = false }: Props = $props();

  // Web Speech API types vary across browsers and aren't in the default DOM
  // typings. Keep this loose — feature detection is what gates usage.
  type RecognitionCtor = new () => SpeechRecognitionLike;
  interface SpeechRecognitionLike {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: ((event: SpeechRecognitionEventLike) => void) | null;
    onend: (() => void) | null;
    onerror: ((event: { error: string }) => void) | null;
  }
  interface SpeechRecognitionEventLike {
    resultIndex: number;
    results: ArrayLike<{
      0: { transcript: string };
      isFinal: boolean;
      length: number;
    }>;
  }

  // Safari ships only the prefixed name; Chromium ships both. Firefox ships
  // neither (as of writing), so the button hides itself.
  const RecognitionCtor: RecognitionCtor | null =
    typeof window === 'undefined'
      ? null
      : ((window as unknown as { SpeechRecognition?: RecognitionCtor })
          .SpeechRecognition ??
        (window as unknown as { webkitSpeechRecognition?: RecognitionCtor })
          .webkitSpeechRecognition ??
        null);

  const supported = RecognitionCtor !== null;

  let recognition: SpeechRecognitionLike | null = null;
  let isListening = $state(false);

  function ensureRecognition(): SpeechRecognitionLike | null {
    if (recognition || !RecognitionCtor) return recognition;
    const r = new RecognitionCtor();
    r.lang = 'en-US';
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (event) => {
      // Walk only the new results from this batch (resultIndex onward), and
      // only emit final transcripts — interim results would flicker into the
      // textarea on every syllable.
      let finalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript;
        }
      }
      const trimmed = finalChunk.trim();
      if (trimmed) onTranscript(trimmed);
    };
    r.onend = () => {
      isListening = false;
    };
    r.onerror = () => {
      // Silent fail: not-allowed, no-speech, network, etc. The user can
      // just type instead. Visible error UI can be added in a follow-up if
      // it turns out users get stuck.
      isListening = false;
    };
    recognition = r;
    return recognition;
  }

  function toggle() {
    const r = ensureRecognition();
    if (!r) return;
    if (isListening) {
      r.stop();
      return;
    }
    try {
      r.start();
      isListening = true;
    } catch {
      // start() throws if already started; reset and let the next click try
      // again from a clean slate.
      isListening = false;
    }
  }

  onDestroy(() => {
    if (recognition && isListening) recognition.abort();
  });
</script>

{#if supported}
  <button
    type="button"
    onclick={toggle}
    disabled={disabled}
    aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
    aria-pressed={isListening}
    title={isListening ? 'Stop voice input' : 'Speak your question'}
    class="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9 {isListening
      ? 'animate-pulse border-transparent bg-clay text-white'
      : 'border-rule bg-transparent text-ink hover:bg-paper-2'}"
  >
    <Icon name="microphone" size={16} />
  </button>
{/if}
