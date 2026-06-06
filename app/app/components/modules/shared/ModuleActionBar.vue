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
      icon="ph:pencil"
      color="neutral"
      variant="ghost"
      size="sm"
      @mousedown.stop
      @click.stop="emit('rename')"
    />
    <UButton
      icon="ph:copy"
      color="neutral"
      variant="ghost"
      size="sm"
      @mousedown.stop
      @click.stop="emit('duplicate')"
    />
    <UButton
      icon="ph:trash"
      color="neutral"
      variant="ghost"
      size="sm"
      @mousedown.stop
      @click.stop="emit('delete')"
    />
    <UButton
      icon="ph:minus-circle"
      color="neutral"
      variant="ghost"
      size="sm"
      @mousedown.stop
      @click.stop="emit('disconnectAll')"
    />
  </div>
</template>
