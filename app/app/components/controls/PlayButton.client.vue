<script lang="ts" setup>
const audioCtxStore = useAudioContextStore()
const suspended = computed(() => audioCtxStore.state === 'suspended' || audioCtxStore.state === 'closed')
</script>

<template>
  <UButton
    :icon="suspended ? 'ph:play' : 'ph:stop'"
    size="sm"
    class="w-8 h-8"
    :class="{
      'text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.3)]': suspended,
      'text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]': !suspended,
    }"
    variant="outline"
    color="neutral"
    :title="suspended ? 'Resume audio' : 'Suspend audio'"
    @click="suspended ? audioCtxStore.resume() : audioCtxStore.suspend()"
  />
</template>
