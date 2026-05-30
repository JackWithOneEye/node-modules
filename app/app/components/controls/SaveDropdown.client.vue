<script lang="ts" setup>
import type { DropdownMenuItem } from '@nuxt/ui'

const emit = defineEmits<{
  save: []
  saveAs: []
}>()

const items = ref<DropdownMenuItem[][]>([
  [
    { label: 'Save As', icon: 'ph:floppy-disk', onSelect: () => { emit('saveAs') } },
  ],
])
</script>

<template>
  <div class="flex items-center rounded hover:bg-white/5">
    <UButton
      label="Save"
      icon="ph:floppy-disk"
      color="neutral"
      variant="ghost"
      class="text-xs text-neutral-300 hover:text-white pl-2 pr-1 py-1 rounded-l hover:bg-white/5 bg-transparent border-0"
      @click="emit('save')"
    />
    <UDropdownMenu
      :items="items"
      :content="{ align: 'end', side: 'bottom' }"
      :ui="{ content: 'w-48' }"
    >
      <UButton
        icon="ph:caret-down"
        color="neutral"
        variant="ghost"
        class="text-xs text-neutral-400 hover:text-white pr-1 pl-1 py-1 rounded-r hover:bg-white/5 bg-transparent border-0 border-l border-neutral-700/50"
      />
    </UDropdownMenu>
  </div>
</template>
