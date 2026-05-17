<script lang="ts" setup>
const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const store = useDataStore()
const toast = useToast()
const newName = ref(store.currentPatchName || 'New patch')

async function confirm() {
  const name = newName.value.trim()
  if (!name) {
    return
  }
  const id = await store.saveAs(name)
  if (id) {
    emit('update:visible', false)
    toast.add({ severity: 'success', summary: 'Saved', detail: `Saved as "${name}"`, life: 3000 })
    navigateTo(`/patches/${id}`, { replace: true })
  }
  else {
    toast.add({ severity: 'error', summary: 'Save failed', detail: `Could not save as "${name}"`, life: 5000 })
  }
}

watch(() => props.visible, (v) => {
  if (v) {
    newName.value = store.currentPatchName || 'New patch'
  }
})
</script>

<template>
  <Dialog
    :visible="props.visible"
    header="Save As"
    modal
    :style="{ width: '25rem' }"
    :pt="{
      root: { class: tw`border border-neutral-800 rounded-lg overflow-hidden` },
      header: { class: tw`border-b border-neutral-800 px-4 py-3` },
      headerTitle: { class: tw`text-sm font-medium text-neutral-200` },
      content: { class: tw`p-4 bg-neutral-950` },
    }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-4">
      <InputText
        v-model="newName"
        placeholder="Patch name"
        autofocus
        class="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 placeholder-neutral-500 rounded px-3 py-2 text-sm"
        @keydown.enter="confirm"
      />
      <div class="flex justify-end gap-2">
        <button
          class="text-xs text-neutral-400 hover:text-white px-3 py-1.5"
          @click="emit('update:visible', false)"
        >
          Cancel
        </button>
        <button
          class="text-xs text-neutral-300 hover:text-white px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded disabled:opacity-40"
          :disabled="!newName.trim()"
          @click="confirm"
        >
          Save
        </button>
      </div>
    </div>
  </Dialog>
</template>
