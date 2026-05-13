<script lang="ts" setup>
import { moduleOptions } from '~/utils/module'

const { loading, save } = useDataStore()
const toast = useToast()
const { canUndo, canRedo, undo, redo } = useEditorHistory()
const { copy, paste, duplicate, deleteSelection } = useEditorClipboard()

async function saveData() {
  await save()
  toast.add({ severity: 'success', summary: 'success!', life: 3000 })
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

  // Forward-delete key (Mac) – Backspace is already handled by Vue Flow.
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
      class="h-full z-10 bg-gray-800 border-b border-gray-600"
      :model="items"
      :pt="{
        panel: {
          class: tw`p-2`,
        },
        submenuLabel: {
          class: tw`px-2 py-1 text-sm font-semibold mb-1`,
        },
        submenu: {
          class: tw`gap-1`,
        },
        grid: {
          class: tw`gap-4`,
        },
      }"
    >
      <template #item="{ item }">
        <div
          v-if="item.root"
          v-ripple
          class="flex items-center cursor-pointer p-2 gap-2 border rounded-md max-w-screen-sm"
        >
          <i :class="item.icon" />
          <span>{{ item.label }}</span>
          <i class="pi pi-angle-down" />
        </div>

        <DropNewModule
          v-else
          :icon="item.icon"
          :label="item.label as string"
          :type="item.type"
        />
      </template>
      <template #end>
        <div class="flex gap-2">
          <Button
            class="pi pi-undo"
            title="Undo (⌘Z)"
            :disabled="!canUndo"
            @click="undo"
          />
          <Button
            class="pi pi-refresh"
            title="Redo (⇧⌘Z)"
            :disabled="!canRedo"
            @click="redo"
          />
          <Button
            class="pi pi-save"
            title="Save"
            @click="saveData"
          />

          <Button
            v-if="loading"
            class="pi pi-spin pi-spinner"
          />
          <PlayButton v-else />
        </div>
      </template>
    </MegaMenu>
    <slot />
    <QuickAddPalette />
    <Toast />
  </div>
</template>
