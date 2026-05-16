<script lang="ts" setup>
import { moduleOptions } from '~/utils/module'

const store = useDataStore()
const toast = useToast()
const { canUndo, canRedo, undo, redo } = useEditorHistory()
const { copy, paste, duplicate, deleteSelection } = useEditorClipboard()

const showOpenDialog = ref(false)
const showSaveAsDialog = ref(false)
const importInput = ref<HTMLInputElement>()

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

const items = ref([
  {
    label: 'Modules',
    icon: 'pi pi-box',
    root: true,
    items: moduleOptions,
  },
])

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
    <MegaMenu
      class="h-full z-10 bg-neutral-950 border-b border-neutral-800"
      :model="items"
      :pt="{
        panel: {
          class: tw`p-1`,
        },
        submenuLabel: {
          class: tw`px-2 py-1 text-xs font-medium text-neutral-400`,
        },
        submenu: {
          class: tw`gap-0.5`,
        },
        grid: {
          class: tw`gap-2`,
        },
      }"
    >
      <template #item="{ item }">
        <div
          v-if="item.root"
          class="flex items-center cursor-pointer px-2 py-1 gap-1.5 text-neutral-300 hover:text-white text-xs"
        >
          <i :class="item.icon" />
          <span>{{ item.label }}</span>
          <span class="text-neutral-600 text-[10px]">▾</span>
        </div>

        <DropNewModule
          v-else
          :icon="item.icon"
          :label="item.label as string"
          :type="item.type"
        />
      </template>
      <template #end>
        <div class="flex items-center gap-1">
          <InputText
            v-if="store.currentPatchId"
            v-model="store.currentPatchName"
            class="w-36 text-xs py-1 px-2 bg-neutral-900 border border-neutral-700 text-neutral-200 placeholder-neutral-500 h-7 rounded"
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

          <span class="w-px h-4 bg-neutral-800 mx-1.5" />

          <button
            class="text-xs text-neutral-300 hover:text-white px-1.5 py-0.5 disabled:text-neutral-600 flex items-center gap-1"
            title="New"
            @click="store.newPatch()"
          >
            <i class="pi pi-file" />
            New
          </button>
          <button
            class="text-xs text-neutral-300 hover:text-white px-1.5 py-0.5 disabled:text-neutral-600 flex items-center gap-1"
            title="Open"
            @click="showOpenDialog = true"
          >
            <i class="pi pi-folder-open" />
            Open
          </button>
          <button
            class="text-xs text-neutral-300 hover:text-white px-1.5 py-0.5 disabled:text-neutral-600 flex items-center gap-1"
            title="Save"
            :disabled="!store.currentPatchId"
            @click="saveData"
          >
            <i class="pi pi-save" />
            Save
          </button>
          <button
            class="text-xs text-neutral-300 hover:text-white px-1.5 py-0.5 disabled:text-neutral-600 flex items-center gap-1"
            title="Save As"
            :disabled="!store.currentPatchId"
            @click="showSaveAsDialog = true"
          >
            <i class="pi pi-save" />
            Save As
          </button>
          <button
            class="text-xs text-neutral-300 hover:text-white px-1.5 py-0.5 disabled:text-neutral-600 flex items-center gap-1"
            title="Import"
            @click="importInput?.click()"
          >
            <i class="pi pi-upload" />
            Import
          </button>
          <button
            class="text-xs text-neutral-300 hover:text-white px-1.5 py-0.5 disabled:text-neutral-600 flex items-center gap-1"
            title="Export"
            :disabled="!store.currentPatchId"
            @click="store.exportPatch()"
          >
            <i class="pi pi-download" />
            Export
          </button>

          <span class="w-px h-4 bg-neutral-800 mx-1.5" />

          <button
            class="text-xs text-neutral-300 hover:text-white px-1.5 py-0.5 disabled:text-neutral-600 flex items-center gap-1"
            title="Undo (⌘Z)"
            :disabled="!canUndo"
            @click="undo"
          >
            <i class="pi pi-undo" />
            Undo
          </button>
          <button
            class="text-xs text-neutral-300 hover:text-white px-1.5 py-0.5 disabled:text-neutral-600 flex items-center gap-1"
            title="Redo (⇧⌘Z)"
            :disabled="!canRedo"
            @click="redo"
          >
            <i class="pi pi-refresh" />
            Redo
          </button>

          <PlayButton />
        </div>
      </template>
    </MegaMenu>

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
    <Toast />
  </div>
</template>
