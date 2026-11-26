<script lang="ts" setup>
import type { DropdownMenuItem } from '@nuxt/ui'

const props = defineProps<{
  hasPatch: boolean
  canDelete: boolean
}>()

const emit = defineEmits<{
  newPatch: []
  openPatch: []
  savePatch: []
  saveAsPatch: []
  copyPatch: []
  importPatch: []
  exportPatch: []
  deletePatch: []
}>()

const items = computed<DropdownMenuItem[][]>(() => [
  [
    { label: 'New', icon: 'ph:file', onSelect: () => { emit('newPatch') } },
    { label: 'Open', icon: 'ph:folder-open', onSelect: () => { emit('openPatch') } },
  ],
  [
    { label: 'Save', icon: 'ph:floppy-disk', disabled: !props.hasPatch, onSelect: () => { emit('savePatch') } },
    { label: 'Save As', icon: 'ph:floppy-disk', disabled: !props.hasPatch, onSelect: () => { emit('saveAsPatch') } },
  ],
  [
    { label: 'Copy Patch', icon: 'ph:copy', disabled: !props.hasPatch, onSelect: () => { emit('copyPatch') } },
  ],
  [
    { label: 'Import', icon: 'ph:upload', onSelect: () => { emit('importPatch') } },
    { label: 'Export', icon: 'ph:download', disabled: !props.hasPatch, onSelect: () => { emit('exportPatch') } },
  ],
  [
    { label: 'Delete Patch', icon: 'ph:trash', color: 'error', disabled: !props.canDelete, onSelect: () => { emit('deletePatch') } },
  ],
])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'start', side: 'bottom' }"
    :ui="{ content: 'w-48' }"
  >
    <UButton
      icon="ph:file"
      label="File"
      color="neutral"
      variant="ghost"
      size="md"
    />
  </UDropdownMenu>
</template>
