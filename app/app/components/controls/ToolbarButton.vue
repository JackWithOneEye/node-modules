<script lang="ts" setup>
defineProps<{
  icon: string
  label: string
  disabled?: boolean
  title?: string
}>()
</script>

<template>
  <UButton
    :icon="icon"
    :disabled="disabled"
    :title="title ?? label"
    variant="ghost"
    color="neutral"
    size="md"
  >
    <span class="hidden [@media(min-width:1200px)]:inline">{{ label }}</span>
  </UButton>
</template>
