<script lang="ts" setup>
const store = useDataStore()
const toast = useToast()
const { confirm: showConfirm } = useConfirmModal()
const route = useRoute()

watch(() => route.path, (path) => {
  if (path === '/patches/new' && store.currentPatchId !== 'new') {
    store.resetForNewPatch()
  }
}, { immediate: true })
const { canUndo, canRedo, undo, redo } = useEditorHistory()
const { copy, paste, duplicate, deleteSelection } = useEditorClipboard()
const { open: openQuickAdd } = useQuickAdd()

const showOpenDialog = ref(false)
const showSaveAsDialog = ref(false)
const importInput = ref<HTMLInputElement>()
const infoModalRef = ref<{ open: () => void } | null>(null)

const statusLabel = computed(() => {
  switch (store.saveState) {
    case 'saved': return 'Saved'
    case 'dirty': return 'Dirty'
    case 'saving': return 'Saving…'
    case 'error': return 'Error'
    default: return ''
  }
})

async function saveData() {
  await store.save()
  if (store.saveState === 'saved') {
    toast.add({ color: 'success', title: 'Saved', description: `Saved "${store.currentPatchName}"`, duration: 3000 })
  }
  else if (store.saveState === 'error') {
    toast.add({ color: 'error', title: 'Save failed', description: `Could not save "${store.currentPatchName}"`, duration: 5000 })
  }
}

async function onImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }
  try {
    await store.importPatch(file)
    toast.add({ color: 'success', title: 'Imported', description: `Imported "${file.name}"`, duration: 3000 })
  }
  catch (e) {
    toast.add({ color: 'error', title: 'Import failed', description: e instanceof Error ? e.message : 'Unknown error', duration: 5000 })
  }
  input.value = ''
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  if (target.isContentEditable) {
    return true
  }
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

function confirmDeleteCurrentPatch() {
  showConfirm({
    title: 'Delete Patch',
    message: `Are you sure you want to delete "${store.currentPatchName}"? This cannot be undone.`,
    confirmLabel: 'Delete',
    confirmVariant: 'error',
    onConfirm: async () => {
      await store.deletePatch(store.currentPatchId!)
      toast.add({ color: 'success', title: 'Deleted', description: 'Patch deleted', duration: 3000 })
    },
  })
}

function onShortcut(e: KeyboardEvent) {
  if (isTypingTarget(e.target)) {
    return
  }

  if (e.key === 'Delete' && !(e.metaKey || e.ctrlKey || e.altKey)) {
    e.preventDefault()
    deleteSelection()
    return
  }

  if (e.key === '?') {
    e.preventDefault()
    infoModalRef.value?.open()
    return
  }

  if (!(e.metaKey || e.ctrlKey)) {
    return
  }
  const k = e.key.toLowerCase()
  if (k === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
  }
  else if ((k === 'z' && e.shiftKey) || k === 'y') {
    e.preventDefault()
    redo()
  }
  else if (k === 'c') {
    e.preventDefault()
    copy()
  }
  else if (k === 'v') {
    e.preventDefault()
    paste()
  }
  else if (k === 'd') {
    e.preventDefault()
    duplicate()
  }
}

onMounted(() => window.addEventListener('keydown', onShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', onShortcut))
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <header class="h-10 z-10 bg-neutral-950 border-b border-neutral-800 flex items-center px-3 gap-2 shrink-0">
      <!-- Left zone -->
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <ModuleDropdown />
        <UButton
          icon="ph:plus"
          variant="ghost"
          color="neutral"
          size="xs"
          @click="openQuickAdd()"
        >
          <span class="hidden [@media(min-width:1200px)]:inline">Add</span>
        </UButton>
        <div class="h-4 w-px bg-neutral-800" />
        <UInput
          v-if="store.currentPatchId"
          v-model="store.currentPatchName"
          variant="none"
          :ui="{ base: 'w-36 lg:w-48 text-xs py-1 px-2 bg-neutral-900 border border-neutral-700 text-neutral-200 placeholder-neutral-500 h-7 rounded' }"
          @keydown.enter="($event.target as HTMLInputElement).blur()"
        />
        <span
          v-if="store.currentPatchId"
          class="text-[11px] leading-none rounded-sm px-1.5 py-0.5"
          :class="{
            'bg-neutral-800 text-neutral-500': store.saveState === 'saved' || store.saveState === 'saving',
            'bg-amber-900/40 text-amber-400': store.saveState === 'dirty',
            'bg-red-900/40 text-red-400': store.saveState === 'error',
          }"
        >{{ statusLabel }}</span>
      </div>

      <!-- Right zone -->
      <div class="flex items-center gap-1">
        <ToolbarButton
          icon="ph:arrow-u-up-left"
          label="Undo"
          :disabled="!canUndo"
          @click="undo"
        />
        <ToolbarButton
          icon="ph:arrow-clockwise"
          label="Redo"
          :disabled="!canRedo"
          @click="redo"
        />
        <div class="h-4 w-px bg-neutral-800 mx-1" />

        <!-- Desktop file buttons -->
        <div class="hidden md:flex items-center gap-1">
          <ToolbarButton
            icon="ph:file"
            label="New"
            @click="store.newPatch()"
          />
          <ToolbarButton
            icon="ph:folder-open"
            label="Open"
            @click="showOpenDialog = true"
          />
          <SaveDropdown
            @save="saveData"
            @save-as="showSaveAsDialog = true"
          />
          <ActionsDropdown
            :can-delete="!!store.currentPatchId && store.currentPatchId !== 'new'"
            @copy="store.copyCurrentPatch()"
            @import="importInput?.click()"
            @export="store.exportPatch()"
            @delete="confirmDeleteCurrentPatch"
          />
        </div>

        <!-- Mobile file dropdown -->
        <FileDropdown
          class="md:hidden"
          @new-patch="store.newPatch()"
          @open-patch="showOpenDialog = true"
          @save-patch="saveData"
          @save-as-patch="showSaveAsDialog = true"
          @copy-patch="store.copyCurrentPatch()"
          @import-patch="importInput?.click()"
          @export-patch="store.exportPatch()"
          @delete-patch="confirmDeleteCurrentPatch"
        />

        <div class="h-4 w-px bg-neutral-800 mx-1" />
        <PlayButton />
        <div class="h-4 w-px bg-neutral-800 mx-1" />
        <UButton
          icon="ph:question"
          variant="outline"
          color="neutral"
          size="xs"
          class="rounded-full w-7 h-7 p-0"
          title="Keyboard shortcuts (?)"
          @click="infoModalRef?.open()"
        />
      </div>
    </header>

    <input
      ref="importInput"
      type="file"
      accept=".json"
      class="hidden"
      @change="onImportFile"
    >

    <PatchOpenDialog
      :visible="showOpenDialog"
      @update:visible="showOpenDialog = $event"
    />
    <PatchSaveAsDialog
      :visible="showSaveAsDialog"
      @update:visible="showSaveAsDialog = $event"
    />

    <slot />
    <QuickAddPalette />
    <InfoModal ref="infoModalRef" />
  </div>
</template>
