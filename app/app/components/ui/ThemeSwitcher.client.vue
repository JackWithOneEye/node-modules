<script lang="ts" setup>
import type { DropdownMenuItem } from '@nuxt/ui'

const themeStore = useThemeStore()

const items: DropdownMenuItem[] = themeStore.themes.map(t => ({
  label: t.label,
  onSelect: () => themeStore.setTheme(t.value),
}))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'end', side: 'bottom' }"
    :ui="{ content: 'w-40' }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      size="md"
      icon="ph:palette"
      title="Theme"
    >
      <span
        class="inline-block size-2.5 rounded-full"
        :style="{ backgroundColor: themeStore.accent }"
      />
    </UButton>
  </UDropdownMenu>
</template>
