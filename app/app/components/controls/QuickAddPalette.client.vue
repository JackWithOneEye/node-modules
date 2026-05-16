<script lang="ts" setup>
/**
 * Quick-add command palette for inserting modules.
 *
 * Triggered by:
 *  - `A`     (when no input/text field is focused)
 *  - `/`     (when no input/text field is focused)
 *  - `Cmd/Ctrl + K` (always)
 *
 * Once open:
 *  - Type to filter
 *  - ↑/↓ to navigate
 *  - Enter to insert at the centre of the canvas
 *  - Esc to dismiss
 */

const { visible, open: openQuickAdd, close } = useQuickAdd()

const query = ref('')
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLElement | null>(null)

const results = computed<ModuleCatalogEntry[]>(() => searchModuleCatalog(query.value))

watch(results, () => {
  activeIndex.value = 0
})

const { addModuleAtViewportCenter } = useAddModule()

function open() {
  openQuickAdd()
  query.value = ''
  activeIndex.value = 0
  nextTick(() => inputRef.value?.focus())
}

function onDialogClose() {
  close()
}

function insert(entry: ModuleCatalogEntry) {
  addModuleAtViewportCenter(entry.type)
  close()
}

function move(delta: number) {
  if (!results.value.length) {
    return
  }
  const next = (activeIndex.value + delta + results.value.length) % results.value.length
  activeIndex.value = next
  nextTick(() => {
    const el = listRef.value?.querySelector<HTMLElement>(`[data-index="${next}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  })
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

function onGlobalKeydown(e: KeyboardEvent) {
  // Cmd/Ctrl + K always toggles the palette.
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    if (visible.value) {
      close()
    }
    else {
      open()
    }
    return
  }

  if (visible.value) {
    // While the palette is open, intercept only navigation keys at the
    // window level so the palette stays keyboard-driven even if focus
    // drifts away from the search input.
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      move(1)
    }
    else if (e.key === 'ArrowUp') {
      e.preventDefault()
      move(-1)
    }
    else if (e.key === 'Enter') {
      e.preventDefault()
      const entry = results.value[activeIndex.value]
      if (entry) {
        insert(entry)
      }
    }
    return
  }

  if (e.altKey || e.metaKey || e.ctrlKey) {
    return
  }
  if (isTypingTarget(e.target)) {
    return
  }

  if (e.key === 'a' || e.key === 'A' || e.key === '/') {
    e.preventDefault()
    open()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onGlobalKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :closable="false"
    :show-header="false"
    :dismissable-mask="true"
    class="w-[32rem]"
    :pt="{
      root: tw`border border-white/30 rounded-md shadow-2xl overflow-hidden`,
      content: tw`bg-black p-0`,
      mask: tw`backdrop-blur-sm`,
    }"
    @update:visible="(v: boolean) => !v && onDialogClose()"
  >
    <div class="flex flex-col">
      <div class="flex items-center gap-2 border-b border-white/20 px-3 py-2">
        <i class="pi pi-search text-white/50" />
        <input
          ref="inputRef"
          v-model="query"
          class="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
          placeholder="Add a module… (type to search)"
          autocomplete="off"
          spellcheck="false"
        >
        <span class="text-[0.65rem] text-white/40 font-mono">esc</span>
      </div>
      <div
        v-if="results.length === 0"
        class="px-3 py-6 text-center text-sm text-white/50"
      >
        No modules match "{{ query }}"
      </div>
      <div
        v-else
        ref="listRef"
        class="max-h-80 overflow-y-auto py-1"
      >
        <button
          v-for="(entry, idx) in results"
          :key="entry.type"
          type="button"
          :data-index="idx"
          class="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-white"
          :class="idx === activeIndex ? 'bg-white/15' : 'hover:bg-white/5'"
          @mousemove="activeIndex = idx"
          @click="insert(entry)"
        >
          <i :class="[entry.icon, 'text-white/70']" />
          <span class="flex-1">
            <span class="font-medium">{{ entry.label }}</span>
            <span
              v-if="entry.description"
              class="ml-2 text-xs text-white/50"
            >
              {{ entry.description }}
            </span>
          </span>
          <span class="text-[0.65rem] uppercase tracking-wide text-white/40">
            {{ entry.category }}
          </span>
        </button>
      </div>
      <div
        class="flex items-center justify-between border-t border-white/20 px-3 py-1.5 text-[0.65rem] font-mono text-white/40"
      >
        <span>↑ ↓ navigate &nbsp; ↵ insert</span>
        <span>{{ results.length }} module{{ results.length === 1 ? '' : 's' }}</span>
      </div>
    </div>
  </Dialog>
</template>
