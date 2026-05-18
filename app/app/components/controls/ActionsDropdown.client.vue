<script lang="ts" setup>
const props = defineProps<{
  canDelete: boolean
}>()

const emit = defineEmits<{
  copy: []
  import: []
  export: []
  delete: []
}>()

const menu = ref()

const items = ref([
  { label: 'Copy Patch', icon: 'pi pi-copy', command: () => { emit('copy') } },
  { separator: true },
  { label: 'Import', icon: 'pi pi-upload', command: () => { emit('import') } },
  { label: 'Export', icon: 'pi pi-download', command: () => { emit('export') } },
  { separator: true },
  { label: 'Delete Patch', icon: 'pi pi-trash', command: () => { emit('delete') }, disabled: !props.canDelete },
])

function toggle(event: MouseEvent) {
  menu.value?.toggle(event)
}
</script>

<template>
  <div>
    <Button
      icon="pi pi-ellipsis-v"
      title="More actions"
      :pt="{
        root: { class: 'text-xs text-neutral-300 hover:text-white px-2 py-1 rounded hover:bg-white/5 bg-transparent border-0' },
        icon: { class: 'text-neutral-300' },
      }"
      aria-haspopup="true"
      aria-controls="actions_menu"
      @click="toggle"
    />
    <Menu
      id="actions_menu"
      ref="menu"
      :model="items"
      :popup="true"
      :pt="{
        root: { class: 'bg-neutral-900 border border-neutral-700 rounded shadow-xl p-0 overflow-hidden' },
        menu: { class: 'p-0' },
        menuitem: { class: 'p-0' },
        action: { class: 'text-xs text-neutral-300 hover:text-white hover:bg-white/5 px-3 py-2 gap-2 flex items-center' },
        icon: { class: 'text-neutral-300' },
        label: { class: 'text-neutral-300' },
        separator: { class: 'bg-neutral-800 my-0' },
      }"
    />
  </div>
</template>
