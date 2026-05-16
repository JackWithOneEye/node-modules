<script lang="ts" setup>
const route = useRoute()
const store = useDataStore()
const id = computed(() => route.params.id as string)
const { data, pending, error } = useFetch(() => `/api/patches/${route.params.id}`)

watch(data, (d) => {
  if (d) {
    store.currentPatchId = id.value
    store.currentPatchName = d.name ?? 'Untitled'
    store.patchLoadStarted()
  }
}, { immediate: true })

definePageMeta({
  validate: (route) => {
    return typeof route.params.id === 'string' && route.params.id.length > 0
  },
})
</script>

<template>
  <div
    v-if="pending"
    class="flex-1 flex items-center justify-center bg-black text-white"
  >
    <i class="pi pi-spin pi-spinner text-2xl" />
  </div>
  <div
    v-else-if="error"
    class="flex-1 flex items-center justify-center bg-black text-white"
  >
    <p>Patch not found</p>
  </div>
  <ClientOnly
    v-else-if="data"
    fallback-tag="span"
    fallback="....."
  >
    <ModularEditor
      :key="data.id"
      :initial-data="data"
    />
  </ClientOnly>
</template>
