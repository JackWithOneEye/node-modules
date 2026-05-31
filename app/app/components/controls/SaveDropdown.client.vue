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
  <div class="flex items-center">
    <UButton
      label="Save"
      icon="ph:floppy-disk"
      color="neutral"
      variant="ghost"
      size="md"
      class="rounded-r-none"
      @click="emit('save')"
    />
    <UDropdownMenu
      :items="items"
      :content="{ align: 'end', side: 'bottom' }"
      :ui="{ content: 'w-48' }"
    >
      <UButton
        color="neutral"
        variant="ghost"
        size="md"
        class="rounded-l-none px-1.5 justify-center"
      >
        <UIcon
          name="ph:caret-down"
          class="text-neutral-400 size-3.5"
        />
      </UButton>
    </UDropdownMenu>
  </div>
</template>
