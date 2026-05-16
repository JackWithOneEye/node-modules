<script lang="ts" setup>
const audioCtxStore = useAudioContextStore()
const suspended = computed(() => audioCtxStore.state === 'suspended' || audioCtxStore.state === 'closed')
</script>

<template>
  <button
    class="text-xs text-neutral-300 hover:text-white px-1.5 py-0.5"
    :title="suspended ? 'Resume audio' : 'Suspend audio'"
    @click="suspended ? audioCtxStore.resume() : audioCtxStore.suspend()"
  >
    <i
      class="pi text-xs"
      :class="{ 'pi-play': suspended, 'pi-stop': !suspended }"
    />
  </button>
</template>
