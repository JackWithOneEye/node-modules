<script lang="ts" setup>
const emit = defineEmits<{
  newPatch: []
  openPatch: []
  savePatch: []
  saveAsPatch: []
  importPatch: []
  exportPatch: []
}>()

const open = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function toggle() {
  open.value = !open.value
}

function close() {
  open.value = false
}

function onClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    close()
  }
}

onMounted(() => window.addEventListener('click', onClickOutside))
onBeforeUnmount(() => window.removeEventListener('click', onClickOutside))
</script>

<template>
  <div
    ref="dropdownRef"
    class="relative"
  >
    <button
      class="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors"
      @click.stop="toggle"
    >
      <i class="pi pi-file" />
      <span>File</span>
      <span class="text-neutral-600 text-[10px]">▾</span>
    </button>
    <div
      v-if="open"
      class="absolute right-0 mt-1 bg-neutral-900 border border-neutral-700 rounded shadow-xl w-40 z-50 overflow-hidden"
    >
      <div class="flex flex-col">
        <button
          class="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 text-left"
          @click="close(); emit('newPatch')"
        >
          <i class="pi pi-file" />
          New
        </button>
        <button
          class="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 text-left"
          @click="close(); emit('openPatch')"
        >
          <i class="pi pi-folder-open" />
          Open
        </button>
        <button
          class="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 text-left"
          @click="close(); emit('savePatch')"
        >
          <i class="pi pi-save" />
          Save
        </button>
        <button
          class="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 text-left"
          @click="close(); emit('saveAsPatch')"
        >
          <i class="pi pi-save" />
          Save As
        </button>
        <div class="h-px bg-neutral-800" />
        <button
          class="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 text-left"
          @click="close(); emit('importPatch')"
        >
          <i class="pi pi-upload" />
          Import
        </button>
        <button
          class="flex items-center gap-2 px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-white/5 text-left"
          @click="close(); emit('exportPatch')"
        >
          <i class="pi pi-download" />
          Export
        </button>
      </div>
    </div>
  </div>
</template>
