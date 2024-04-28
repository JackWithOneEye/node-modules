<script lang="ts" setup>
const { data, fetch } = useDataStore()

await callOnce(fetch)
</script>

<template>
  <ClientOnly
    fallback-tag="span"
    fallback="....."
  >
    <ModularEditor :initial-data="data" />
  </ClientOnly>
</template>
