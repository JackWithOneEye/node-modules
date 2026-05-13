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
    <Button
      v-tooltip.top="'Rename'"
      icon="pi pi-pencil"
      severity="secondary"
      variant="text"
      size="small"
      @mousedown.stop
      @click.stop="emit('rename')"
    />
    <Button
      v-tooltip.top="'Duplicate'"
      icon="pi pi-copy"
      severity="secondary"
      variant="text"
      size="small"
      @mousedown.stop
      @click.stop="emit('duplicate')"
    />
    <Button
      v-tooltip.top="'Delete'"
      icon="pi pi-trash"
      severity="secondary"
      variant="text"
      size="small"
      @mousedown.stop
      @click.stop="emit('delete')"
    />
    <Button
      v-tooltip.top="'Disconnect all'"
      icon="pi pi-minus-circle"
      severity="secondary"
      variant="text"
      size="small"
      @mousedown.stop
      @click.stop="emit('disconnectAll')"
    />
  </div>
</template>
