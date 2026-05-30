<script lang="ts" setup>
const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const store = useDataStore()
const toast = useToast()
const newName = ref(store.currentPatchName || 'New patch')

const visible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

async function confirm() {
  const name = newName.value.trim()
  if (!name) {
    return
  }
  const id = await store.saveAs(name)
  if (id) {
    visible.value = false
    toast.add({ color: 'success', title: 'Saved', description: `Saved as "${name}"`, duration: 3000 })
    navigateTo(`/patches/${id}`, { replace: true })
  }
  else {
    toast.add({ color: 'error', title: 'Save failed', description: `Could not save as "${name}"`, duration: 5000 })
  }
}

watch(() => props.visible, (v) => {
  if (v) {
    newName.value = store.currentPatchName || 'New patch'
  }
})
</script>

<template>
  <UModal
    v-model:open="visible"
    title="Save As"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <UInput
          v-model="newName"
          placeholder="Patch name"
          autofocus
          variant="none"
          class="w-full"
          :ui="{ base: 'bg-neutral-900 border border-neutral-700 text-neutral-200 placeholder-neutral-500 rounded px-3 py-2 text-sm' }"
          @keydown.enter="confirm"
        />
        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            variant="ghost"
            color="neutral"
            size="xs"
            @click="visible = false"
          />
          <UButton
            label="Save"
            size="xs"
            :disabled="!newName.trim()"
            @click="confirm"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
