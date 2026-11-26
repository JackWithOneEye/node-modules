import type { Node, Edge, ViewportTransform } from '@vue-flow/core'

interface PatchSummary {
  id: string
  name: string
  updatedAt: string
}

interface PatchApiResponse {
  id: string
  name: string
  nodes: Node[]
  edges: Edge[]
  viewport?: ViewportTransform
  version: number
  createdAt: string
  updatedAt: string
}

const EDGE_COORDINATE_KEYS = new Set(['sourceX', 'sourceY', 'targetX', 'targetY'])

export type ImportData = { nodes: Node[], edges: Edge[], viewport?: ViewportTransform }

/**
 * Save state of the open patch. `baseline` is the hash of the content last
 * loaded or saved; edits are compared against it.
 *
 * - untracked: a patch is loading; no baseline yet, edits are not compared
 * - saved / dirty: the patch matches / differs from the baseline
 * - saving: a save request is in flight; `dirty` tracks edits meanwhile
 * - error: the last save failed; `dirty` tracks unsaved edits
 *
 * Transitions: `patchLoadStarted` → untracked, `markClean` → saved, an edit
 * → `onEdit`, `save`/`saveAs` → saving → saved | error.
 */
export type SaveStatus
  = | { kind: 'untracked' }
    | { kind: 'saved', baseline: string }
    | { kind: 'dirty', baseline: string }
    | { kind: 'saving', baseline: string | null, dirty: boolean }
    | { kind: 'error', baseline: string | null, dirty: boolean }

export const useDataStore = defineStore('data', () => {
  const flow = useEditorFlow()
  const nodes = flow.nodes // as Ref<Node[]>
  const edges = flow.edges as Ref<Edge[]>
  const toObject = flow.toObject

  const currentPatchId = ref<string | null>(null)
  const currentPatchName = ref('New patch')
  const patches = ref<PatchSummary[]>([])
  const saveStatus = shallowRef<SaveStatus>({ kind: 'untracked' })
  /** What the toolbar shows; an untracked (loading) patch counts as saved. */
  const saveState = computed(() => saveStatus.value.kind === 'untracked' ? 'saved' : saveStatus.value.kind)
  /** Whether replacing the open patch would lose edits. */
  const dirty = computed(() => {
    const s = saveStatus.value
    return s.kind === 'dirty' || ((s.kind === 'saving' || s.kind === 'error') && s.dirty)
  })
  const pendingImportData = ref<ImportData | null>(null)

  function computeHash(): string {
    const obj = toObject()
    // Edge endpoint coordinates are derived from rendered handle positions and
    // get re-measured after load; they are not part of the patch state.
    return JSON.stringify(
      { name: currentPatchName.value, nodes: obj.nodes, edges: obj.edges, viewport: obj.viewport },
      (key, value) => EDGE_COORDINATE_KEYS.has(key) ? undefined : value,
    )
  }

  function baselineOf(s: SaveStatus): string | null {
    return s.kind === 'untracked' ? null : s.baseline
  }

  function patchLoadStarted() {
    saveStatus.value = { kind: 'untracked' }
  }

  function markClean() {
    saveStatus.value = { kind: 'saved', baseline: computeHash() }
  }

  function onEdit() {
    const baseline = baselineOf(saveStatus.value)
    if (baseline !== null && computeHash() !== baseline) {
      saveStatus.value = { kind: 'dirty', baseline }
    }
  }

  function saveStarted() {
    saveStatus.value = { kind: 'saving', baseline: baselineOf(saveStatus.value), dirty: dirty.value }
  }

  function saveFailed() {
    saveStatus.value = { kind: 'error', baseline: baselineOf(saveStatus.value), dirty: dirty.value }
  }

  watch([nodes, edges, currentPatchName], onEdit, { deep: true })

  async function fetchPatchList() {
    try {
      patches.value = await $fetch<PatchSummary[]>('/api/patches')
    }
    catch {
      patches.value = []
    }
  }

  async function save() {
    if (!currentPatchId.value) {
      return
    }
    saveStarted()
    let navigateToUrl: string | null = null
    const obj = toObject()
    try {
      if (currentPatchId.value === 'new') {
        const created = await $fetch<PatchApiResponse>('/api/patches', {
          method: 'post',
          body: { name: currentPatchName.value, nodes: obj.nodes, edges: obj.edges, viewport: obj.viewport },
        })
        currentPatchId.value = created.id
        navigateToUrl = `/patches/${created.id}`
      }
      else {
        await $fetch<PatchApiResponse>(`/api/patches/${currentPatchId.value}`, {
          method: 'post',
          body: { name: currentPatchName.value, nodes: obj.nodes, edges: obj.edges, viewport: obj.viewport },
        })
      }
      markClean()
      await fetchPatchList()
    }
    catch {
      saveFailed()
    }
    if (navigateToUrl) {
      await navigateTo(navigateToUrl, { replace: true })
    }
  }

  async function saveAs(name: string): Promise<string | null> {
    saveStarted()
    try {
      const obj = toObject()
      const created = await $fetch<PatchApiResponse>('/api/patches', {
        method: 'post',
        body: { name, nodes: obj.nodes, edges: obj.edges, viewport: obj.viewport },
      })
      currentPatchId.value = created.id
      currentPatchName.value = name
      markClean()
      await fetchPatchList()
      return created.id
    }
    catch {
      saveFailed()
      return null
    }
  }

  function resetForNewPatch() {
    currentPatchId.value = 'new'
    currentPatchName.value = 'New patch'
    nodes.value = []
    edges.value = []
    pendingImportData.value = null
    patchLoadStarted()
  }

  async function newPatch() {
    resetForNewPatch()
    await navigateTo('/patches/new', { replace: true })
  }

  async function exportPatch() {
    const obj = toObject()
    const data = {
      version: 1,
      name: currentPatchName.value,
      nodes: obj.nodes,
      edges: obj.edges,
      viewport: obj.viewport,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentPatchName.value.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importPatch(file: File) {
    const text = await file.text()
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(text)
    }
    catch {
      throw new Error('Invalid JSON')
    }
    if (parsed.version !== 1 || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      throw new Error('Invalid patch file format')
    }
    pendingImportData.value = { nodes: parsed.nodes as Node[], edges: parsed.edges as Edge[], viewport: parsed.viewport as ViewportTransform | undefined }
    currentPatchId.value = 'new'
    currentPatchName.value = (parsed.name as string) ?? 'Imported Patch'
    patchLoadStarted()
    await navigateTo('/patches/new', { replace: true })
  }

  async function deletePatch(id: string) {
    try {
      await $fetch(`/api/patches/${id}`, { method: 'delete' })
      await fetchPatchList()
      if (currentPatchId.value === id) {
        currentPatchId.value = null
        currentPatchName.value = 'New patch'
        nodes.value = []
        edges.value = []
        pendingImportData.value = null
        patchLoadStarted()
        await navigateTo('/', { replace: true })
      }
    }
    catch {
      // silently handled by caller via toast
    }
  }

  async function copyCurrentPatch() {
    const newName = `Copy of ${currentPatchName.value}`
    const obj = toObject()
    pendingImportData.value = { nodes: obj.nodes, edges: obj.edges, viewport: obj.viewport }
    currentPatchId.value = 'new'
    currentPatchName.value = newName
    patchLoadStarted()
    await navigateTo('/patches/new', { replace: true })
  }

  return {
    currentPatchId,
    currentPatchName,
    patches,
    dirty,
    saveState,
    fetchPatchList,
    save,
    saveAs,
    newPatch,
    resetForNewPatch,
    patchLoadStarted,
    markClean,
    exportPatch,
    importPatch,
    deletePatch,
    copyCurrentPatch,
    pendingImportData,
  }
})
