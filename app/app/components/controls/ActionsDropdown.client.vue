<script lang="ts" setup>
import type { DropdownMenuItem } from '@nuxt/ui'

const props = defineProps<{
  canDelete: boolean
}>()

const emit = defineEmits<{
  copy: []
  import: []
  export: []
  delete: []
}>()

const items = computed<DropdownMenuItem[][]>(() => [
  [
    { label: 'Copy Patch', icon: 'ph:copy', onSelect: () => { emit('copy') } },
  ],
  [
    { label: 'Import', icon: 'ph:upload', onSelect: () => { emit('import') } },
    { label: 'Export', icon: 'ph:download', onSelect: () => { emit('export') } },
  ],
  [
    { label: 'Delete Patch', icon: 'ph:trash', color: 'error', disabled: !props.canDelete, onSelect: () => { emit('delete') } },
  ],
])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'end', side: 'bottom' }"
    :ui="{ content: 'w-48' }"
  >
    <UButton
      icon="ph:dots-three-vertical"
      title="More actions"
      color="neutral"
      variant="ghost"
    />
  </UDropdownMenu>
</template>
