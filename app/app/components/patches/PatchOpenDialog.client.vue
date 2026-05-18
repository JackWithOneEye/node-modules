<script lang="ts" setup>
const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const store = useDataStore()
const confirm = useConfirm()
const toast = useToast()

async function open() {
  await store.fetchPatchList()
}

function openPatch(id: string) {
  emit('update:visible', false)
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
  confirm.require({
    message: `Are you sure you want to delete "${patch.name}"?`,
    header: 'Delete Patch',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await store.deletePatch(patch.id)
      toast.add({ severity: 'success', summary: 'Deleted', detail: `Deleted "${patch.name}"`, life: 3000 })
    },
  })
}
</script>

<template>
  <Dialog
    :visible="props.visible"
    header="Open Patch"
    modal
    :style="{ width: '30rem' }"
    :pt="{
      root: tw`max-h-[85vh]`,
    }"
    @update:visible="emit('update:visible', $event)"
    @show="open"
  >
    <div class="max-h-[60vh] overflow-y-auto min-h-[12rem]">
      <DataView
        :value="sortedPatches"
        layout="list"
      >
        <template #list="slotProps">
          <div
            v-for="(patch, i) in slotProps.items"
            :key="patch.id"
            class="flex items-center justify-between p-3 cursor-pointer hover:bg-neutral-700 rounded-md"
            :class="{ 'border-t border-neutral-600': (i as number) > 0 }"
            @click="openPatch(patch.id)"
          >
            <div class="flex flex-col gap-1">
              <span class="font-medium">{{ patch.name }}</span>
              <span class="text-sm text-neutral-400">{{ formatDate(patch.updatedAt) }}</span>
            </div>
            <div class="flex items-center gap-1">
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                title="Delete patch"
                @click.stop="confirmDelete(patch)"
              />
              <Button
                icon="pi pi-chevron-right"
                text
                rounded
                severity="secondary"
              />
            </div>
          </div>
        </template>
        <template #empty>
          <div class="p-4 text-center text-neutral-400">
            No saved patches yet.
          </div>
        </template>
      </DataView>
    </div>
  </Dialog>
</template>
