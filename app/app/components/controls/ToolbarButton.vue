<script lang="ts" setup>
defineProps<{
  icon: string
  label: string
  disabled?: boolean
  title?: string
}>()
</script>

<template>
  <button
    class="text-xs text-neutral-300 hover:text-white px-2 py-1 rounded hover:bg-white/5 disabled:text-neutral-600 flex items-center gap-1.5 transition-colors"
    :disabled="disabled"
    :title="title ?? label"
  >
    <i :class="icon" />
    <span class="hidden [@media(min-width:1200px)]:inline">{{ label }}</span>
  </button>
</template>
