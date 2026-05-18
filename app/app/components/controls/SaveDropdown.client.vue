<script lang="ts" setup>
const emit = defineEmits<{
  save: []
  saveAs: []
}>()

const items = ref([
  { label: 'Save As', icon: 'pi pi-save', command: () => { emit('saveAs') } },
])
</script>

<template>
  <SplitButton
    label="Save"
    icon="pi pi-save"
    :model="items"
    :pt="{
      root: { class: 'flex items-center rounded hover:bg-white/5' },
      pcButton: {
        root: { class: 'text-xs text-neutral-300 hover:text-white pl-2 pr-1 py-1 rounded-l hover:bg-white/5 bg-transparent border-0' },
        icon: { class: 'text-neutral-300' },
        label: { class: 'text-neutral-300' },
      },
      pcDropdown: {
        root: { class: 'text-xs text-neutral-400 hover:text-white pr-1 pl-1 py-1 rounded-r hover:bg-white/5 bg-transparent border-0 border-l border-neutral-700/50' },
        icon: { class: 'text-neutral-400 text-[10px]' },
      },
      pcMenu: {
        root: { class: 'bg-neutral-900 border border-neutral-700 rounded shadow-xl p-0 overflow-hidden' },
        menu: { class: 'p-0' },
        menuitem: { class: 'p-0' },
        action: { class: 'text-xs text-neutral-300 hover:text-white hover:bg-white/5 px-3 py-2 gap-2 flex items-center' },
        icon: { class: 'text-neutral-300' },
        label: { class: 'text-neutral-300' },
        separator: { class: 'bg-neutral-800 my-0' },
      },
    }"
    @click="emit('save')"
  />
</template>
