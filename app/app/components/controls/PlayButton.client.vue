<script lang="ts" setup>
const audioCtxStore = useAudioContextStore()
const suspended = computed(() => audioCtxStore.state === 'suspended')
</script>

<template>
  <Button
    class="h-10 w-10"
    @click="() => {
      if (suspended) {
        audioCtxStore.resume()
      }
      else {
        audioCtxStore.suspend()
      }
    }"
  >
    <template #icon>
      <i
        class="pi"
        :class="{ 'pi-play': suspended, 'pi-stop': !suspended }"
      />
    </template>
  </Button>
</template>
