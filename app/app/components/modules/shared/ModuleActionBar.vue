<script lang="ts" setup>
const emit = defineEmits<{
  rename: []
  duplicate: []
  delete: []
  disconnectAll: []
}>()

const actions = [
  { icon: 'ph:pencil', label: 'Rename', run: () => emit('rename') },
  { icon: 'ph:copy', label: 'Duplicate', run: () => emit('duplicate') },
  { icon: 'ph:trash', label: 'Delete', run: () => emit('delete') },
  { icon: 'ph:minus-circle', label: 'Disconnect all cables', run: () => emit('disconnectAll') },
]
</script>

<template>
  <div class="nodrag flex items-center gap-0.5">
    <UTooltip
      v-for="action in actions"
      :key="action.label"
      :text="action.label"
      :delay-duration="300"
      :content="{ side: 'top', sideOffset: 6 }"
    >
      <UButton
        :icon="action.icon"
        :aria-label="action.label"
        color="neutral"
        variant="ghost"
        size="sm"
        @mousedown.stop
        @click.stop="action.run"
      />
    </UTooltip>
  </div>
</template>
