<script lang="ts" setup>
// every page, not only the editor, uses the stored theme
const themeStore = useThemeStore()
onMounted(() => themeStore.init())
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ConfirmModal />
  </UApp>
</template>
