<script lang="ts" setup>
const props = defineProps<{ icon?: string, label: string, type: string }>()
const { onDragStart } = useDnDModule()
</script>

<template>
  <div
    class="flex items-center w-fit gap-2 p-3"
    :draggable="true"
    @dragstart="onDragStart($event, props.type)"
  >
    <i :class="props.icon" />
    <span>{{ props.label }}</span>
  </div>
</template>
