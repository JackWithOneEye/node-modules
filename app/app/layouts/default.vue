<script lang="ts" setup>
const store = useDataStore()
const toast = useToast()
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
    toast.add({ severity: 'success', summary: 'Saved', detail: `Saved "${store.currentPatchName}"`, life: 3000 })
  }
  else if (store.saveState === 'error') {
    toast.add({ severity: 'error', summary: 'Save failed', detail: `Could not save "${store.currentPatchName}"`, life: 5000 })
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
    toast.add({ severity: 'success', summary: 'Imported', detail: `Imported "${file.name}"`, life: 3000 })
  }
  catch (e) {
    toast.add({ severity: 'error', summary: 'Import failed', detail: e instanceof Error ? e.message : 'Unknown error', life: 5000 })
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
        <button
          class="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors"
          @click="openQuickAdd()"
        >
          <i class="pi pi-plus" />
          <span class="hidden [@media(min-width:1200px)]:inline">Add</span>
        </button>
        <div class="h-4 w-px bg-neutral-800" />
        <InputText
          v-if="store.currentPatchId"
          v-model="store.currentPatchName"
          class="w-36 lg:w-48 text-xs py-1 px-2 bg-neutral-900 border border-neutral-700 text-neutral-200 placeholder-neutral-500 h-7 rounded"
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
          icon="pi pi-undo"
          label="Undo"
          :disabled="!canUndo"
          @click="undo"
        />
        <ToolbarButton
          icon="pi pi-refresh"
          label="Redo"
          :disabled="!canRedo"
          @click="redo"
        />
        <div class="h-4 w-px bg-neutral-800 mx-1" />

        <!-- Desktop file buttons -->
        <div class="hidden md:flex items-center gap-1">
          <ToolbarButton
            icon="pi pi-file"
            label="New"
            @click="store.newPatch()"
          />
          <ToolbarButton
            icon="pi pi-folder-open"
            label="Open"
            @click="showOpenDialog = true"
          />
          <ToolbarButton
            icon="pi pi-save"
            label="Save"
            @click="saveData"
          />
          <ToolbarButton
            icon="pi pi-save"
            label="Save As"
            @click="showSaveAsDialog = true"
          />
          <ToolbarButton
            icon="pi pi-upload"
            label="Import"
            @click="importInput?.click()"
          />
          <ToolbarButton
            icon="pi pi-download"
            label="Export"
            @click="store.exportPatch()"
          />
        </div>

        <!-- Mobile file dropdown -->
        <FileDropdown
          class="md:hidden"
          @new-patch="store.newPatch()"
          @open-patch="showOpenDialog = true"
          @save-patch="saveData"
          @save-as-patch="showSaveAsDialog = true"
          @import-patch="importInput?.click()"
          @export-patch="store.exportPatch()"
        />

        <div class="h-4 w-px bg-neutral-800 mx-1" />
        <PlayButton />
        <div class="h-4 w-px bg-neutral-800 mx-1" />
        <button
          class="w-7 h-7 rounded-full border border-neutral-600 text-neutral-400 hover:text-white hover:border-neutral-400 flex items-center justify-center text-xs transition-colors"
          title="Keyboard shortcuts (?)"
          @click="infoModalRef?.open()"
        >
          <i class="pi pi-question" />
        </button>
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
    <Toast />
  </div>
</template>
