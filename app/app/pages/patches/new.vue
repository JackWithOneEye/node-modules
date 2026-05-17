<script lang="ts" setup>
import type { Node, Edge, ViewportTransform } from '@vue-flow/core'

const store = useDataStore()
const editorKey = ref(0)
const importData = ref<{ nodes: Node[], edges: Edge[], viewport?: ViewportTransform }>(
  { nodes: [], edges: [], viewport: undefined },
)

if (store.pendingImportData) {
  importData.value = store.pendingImportData
  store.pendingImportData = null
}

watch(() => store.pendingImportData, (data) => {
  if (data) {
    importData.value = data
    store.pendingImportData = null
    editorKey.value++
  }
})
</script>

<template>
  <ClientOnly
    fallback-tag="span"
    fallback="....."
  >
    <ModularEditor
      :key="`new-${editorKey}`"
      :initial-data="importData"
    />
  </ClientOnly>
</template>
