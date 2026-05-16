<script lang="ts" setup>
const store = useDataStore()
await store.fetchPatchList()

const firstPatch = store.patches[0]
if (firstPatch) {
  await navigateTo(`/patches/${firstPatch.id}`, { replace: true })
}
else {
  store.newPatch()
}
</script>

<template>
  <div class="flex-1 flex items-center justify-center bg-black text-white">
    <p>No patches yet. Creating one...</p>
  </div>
</template>
