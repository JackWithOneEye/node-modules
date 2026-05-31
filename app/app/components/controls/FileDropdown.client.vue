<script lang="ts" setup>
import type { DropdownMenuItem } from '@nuxt/ui'

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

const items = ref<DropdownMenuItem[][]>([
  [
    { label: 'New', icon: 'ph:file', onSelect: () => { emit('newPatch') } },
    { label: 'Open', icon: 'ph:folder-open', onSelect: () => { emit('openPatch') } },
  ],
  [
    { label: 'Save', icon: 'ph:floppy-disk', onSelect: () => { emit('savePatch') } },
    { label: 'Save As', icon: 'ph:floppy-disk', onSelect: () => { emit('saveAsPatch') } },
  ],
  [
    { label: 'Copy Patch', icon: 'ph:copy', onSelect: () => { emit('copyPatch') } },
  ],
  [
    { label: 'Import', icon: 'ph:upload', onSelect: () => { emit('importPatch') } },
    { label: 'Export', icon: 'ph:download', onSelect: () => { emit('exportPatch') } },
  ],
  [
    { label: 'Delete Patch', icon: 'ph:trash', color: 'error', onSelect: () => { emit('deletePatch') } },
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
