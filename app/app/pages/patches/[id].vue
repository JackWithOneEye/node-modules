<script lang="ts" setup>
// Serves both `/patches/new` and `/patches/<id>`. The page instance survives
// route changes (static key), so the first save of a new patch, which only
// swaps `new` for the created id in the URL, keeps the running editor instead
// of remounting it (audio restart, lost undo history).
definePageMeta({
  layout: 'editor',
  key: 'patch-editor',
  validate: (route) => {
    return typeof route.params.id === 'string' && route.params.id.length > 0
  },
})

type PatchResponse = ImportData & { id: string, name?: string }

const route = useRoute()
const store = useDataStore()
const id = computed(() => route.params.id as string)

/**
 * What the page shows. `editor.id` is the patch the mounted editor shows
 * (`new` for an unsaved patch); `editor.key` remounts the editor when it
 * changes. Transitions: `load` → loading → editor | notFound; `showNewPatch`
 * → editor; a save that only swaps the id in the URL keeps the editor.
 */
type PageView
  = | { kind: 'loading' }
    | { kind: 'editor', id: string, key: string, data: ImportData }
    | { kind: 'notFound' }

const view = shallowRef<PageView>({ kind: 'loading' })
let newPatchCount = 0

function showNewPatch(data: ImportData) {
  view.value = { kind: 'editor', id: 'new', key: `new-${newPatchCount++}`, data }
}

async function load(patchId: string) {
  if (patchId === 'new') {
    showNewPatch(store.pendingImportData ?? { nodes: [], edges: [] })
    store.pendingImportData = null
    return
  }
  // Saving (or "Save As") navigates here with the id the open patch was just
  // stored under; the editor already shows exactly that patch.
  const current = view.value
  if (current.kind === 'editor' && store.currentPatchId === patchId) {
    view.value = { ...current, id: patchId }
    return
  }
  view.value = { kind: 'loading' }
  try {
    const data = await $fetch<PatchResponse>(`/api/patches/${patchId}`)
    if (patchId !== id.value) {
      return // the user navigated on while this was loading
    }
    store.currentPatchId = patchId
    store.currentPatchName = data.name ?? 'New patch'
    store.patchLoadStarted()
    view.value = { kind: 'editor', id: patchId, key: patchId, data }
  }
  catch {
    if (patchId !== id.value) {
      return
    }
    view.value = { kind: 'notFound' }
    // nothing is open: keep the toolbar from saving into the previous patch
    store.currentPatchId = null
  }
}

if (import.meta.client) {
  watch(id, load, { immediate: true })
  // Import / Copy Patch while already on /patches/new does not change the route.
  watch(() => store.pendingImportData, (data) => {
    if (data && id.value === 'new') {
      showNewPatch(data)
      store.pendingImportData = null
    }
  })
}
</script>

<template>
  <ClientOnly>
    <div
      v-if="view.kind === 'notFound'"
      class="flex-1 flex flex-col items-center justify-center gap-4 bg-black text-white"
    >
      <UIcon
        name="ph:file-x"
        class="text-5xl text-neutral-500"
      />
      <div class="text-center space-y-1">
        <p class="text-lg">
          Patch not found
        </p>
        <p class="text-sm text-neutral-400">
          It may have been deleted, or the link is wrong.
        </p>
      </div>
      <div class="flex gap-3">
        <UButton
          label="New Patch"
          icon="ph:plus"
          class="bg-white text-black hover:bg-neutral-200"
          @click="store.newPatch()"
        />
        <UButton
          label="All patches"
          icon="ph:house"
          variant="outline"
          color="neutral"
          to="/"
        />
      </div>
    </div>
    <ModularEditor
      v-else-if="view.kind === 'editor'"
      :key="view.key"
      :initial-data="view.data"
    />
    <div
      v-else
      class="flex-1 flex items-center justify-center bg-black text-white"
    >
      <UIcon
        name="ph:spinner"
        class="animate-spin text-2xl"
      />
    </div>
    <template #fallback>
      <div class="flex-1 flex items-center justify-center bg-black text-white">
        <UIcon
          name="ph:spinner"
          class="animate-spin text-2xl"
        />
      </div>
    </template>
  </ClientOnly>
</template>
