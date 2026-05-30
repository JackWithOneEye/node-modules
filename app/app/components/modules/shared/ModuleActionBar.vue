<script lang="ts" setup>
const emit = defineEmits<{
  rename: []
  duplicate: []
  delete: []
  disconnectAll: []
}>()
</script>

<template>
  <div class="nodrag flex items-center gap-0.5">
    <UButton
      v-tooltip.top="'Rename'"
      icon="ph:pencil"
      color="neutral"
      variant="ghost"
      size="sm"
      @mousedown.stop
      @click.stop="emit('rename')"
    />
    <UButton
      v-tooltip.top="'Duplicate'"
      icon="ph:copy"
      color="neutral"
      variant="ghost"
      size="sm"
      @mousedown.stop
      @click.stop="emit('duplicate')"
    />
    <UButton
      v-tooltip.top="'Delete'"
      icon="ph:trash"
      color="neutral"
      variant="ghost"
      size="sm"
      @mousedown.stop
      @click.stop="emit('delete')"
    />
    <UButton
      v-tooltip.top="'Disconnect all'"
      icon="ph:minus-circle"
      color="neutral"
      variant="ghost"
      size="sm"
      @mousedown.stop
      @click.stop="emit('disconnectAll')"
    />
  </div>
</template>
