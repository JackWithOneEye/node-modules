<script lang="ts" setup>
const audioCtxStore = useAudioContextStore()
const suspended = computed(() => audioCtxStore.state === 'suspended' || audioCtxStore.state === 'closed')
</script>

<template>
  <button
    class="w-8 h-8 rounded border flex items-center justify-center text-xs transition-colors"
    :class="{
      'text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.3)]': suspended,
      'text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]': !suspended,
      'hover:bg-white/5': true,
    }"
    :title="suspended ? 'Resume audio' : 'Suspend audio'"
    @click="suspended ? audioCtxStore.resume() : audioCtxStore.suspend()"
  >
    <i
      class="pi"
      :class="{ 'pi-play': suspended, 'pi-stop': !suspended }"
    />
  </button>
</template>
