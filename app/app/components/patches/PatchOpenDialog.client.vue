<script lang="ts" setup>
const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const store = useDataStore()
const { confirm: showConfirm } = useConfirmModal()
const toast = useToast()

const visible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

async function open() {
  await store.fetchPatchList()
}

watch(() => props.visible, (v) => {
  if (v) open()
})

function openPatch(id: string) {
  visible.value = false
  navigateTo(`/patches/${id}`)
}

const sortedPatches = computed(() => {
  return store.patches.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})

function formatDate(iso: string): string {
  if (!iso) {
    return ''
  }
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function confirmDelete(patch: { id: string, name: string }) {
  showConfirm({
    title: 'Delete Patch',
    message: `Are you sure you want to delete "${patch.name}"?`,
    confirmLabel: 'Delete',
    confirmVariant: 'error',
    onConfirm: async () => {
      await store.deletePatch(patch.id)
      toast.add({
        title: 'Deleted',
        description: `Deleted "${patch.name}"`,
        color: 'success',
        duration: 3000,
      })
    },
  })
}
</script>

<template>
  <UModal
    v-model:open="visible"
    title="Open Patch"
  >
    <template #body>
      <div class="max-h-[60vh] overflow-y-auto min-h-48">
        <div
          v-if="sortedPatches.length === 0"
          class="p-4 text-center text-neutral-400"
        >
          No saved patches yet.
        </div>
        <div
          v-for="(patch, i) in sortedPatches"
          :key="patch.id"
          class="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-700 rounded-md"
          :class="{ 'border-t border-neutral-600': i > 0 }"
          @click="openPatch(patch.id)"
        >
          <div class="flex flex-col gap-1">
            <span class="font-medium">{{ patch.name }}</span>
            <span class="text-sm text-neutral-400">{{ formatDate(patch.updatedAt) }}</span>
          </div>
          <div class="flex items-center gap-1">
            <UButton
              icon="ph:trash"
              variant="ghost"
              color="error"
              title="Delete patch"
              @click.stop="confirmDelete(patch)"
            />
            <UButton
              icon="ph:caret-right"
              variant="ghost"
              color="neutral"
            />
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
