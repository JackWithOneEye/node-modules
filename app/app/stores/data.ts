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

export const useDataStore = defineStore('data', () => {
  const flow = useVueFlow()
  const nodes = flow.nodes // as Ref<Node[]>
  const edges = flow.edges as Ref<Edge[]>
  const toObject = flow.toObject

  const currentPatchId = ref<string | null>(null)
  const currentPatchName = ref('Untitled')
  const patches = ref<PatchSummary[]>([])
  const dirty = ref(false)
  const saveState = ref<'saved' | 'dirty' | 'saving' | 'error'>('saved')
  const lastSavedHash = ref<string | null>(null)

  function computeHash(): string {
    const obj = toObject()
    return JSON.stringify({ name: currentPatchName.value, nodes: obj.nodes, edges: obj.edges, viewport: obj.viewport })
  }

  function patchLoadStarted() {
    lastSavedHash.value = null
    dirty.value = false
    saveState.value = 'saved'
  }

  function markClean() {
    lastSavedHash.value = computeHash()
    dirty.value = false
    saveState.value = 'saved'
  }

  watch([nodes, edges, currentPatchName], () => {
    if (lastSavedHash.value !== null) {
      if (computeHash() !== lastSavedHash.value) {
        dirty.value = true
        saveState.value = 'dirty'
      }
    }
  }, { deep: true })

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
    saveState.value = 'saving'
    try {
      const obj = toObject()
      await $fetch<PatchApiResponse>(`/api/patches/${currentPatchId.value}`, {
        method: 'post',
        body: { name: currentPatchName.value, nodes: obj.nodes, edges: obj.edges, viewport: obj.viewport },
      })
      markClean()
      await fetchPatchList()
    }
    catch {
      saveState.value = 'error'
    }
  }

  async function saveAs(name: string): Promise<string | null> {
    saveState.value = 'saving'
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
      saveState.value = 'error'
      return null
    }
  }

  async function newPatch() {
    const created = await $fetch<PatchApiResponse>('/api/patches', {
      method: 'post',
      body: { name: 'Untitled', nodes: [], edges: [] },
    })
    await navigateTo(`/patches/${created.id}`, { replace: true })
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
    const created = await $fetch<PatchApiResponse>('/api/patches', {
      method: 'post',
      body: { name: parsed.name ?? 'Imported', nodes: parsed.nodes, edges: parsed.edges, viewport: parsed.viewport },
    })
    await navigateTo(`/patches/${created.id}`, { replace: true })
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
    patchLoadStarted,
    markClean,
    exportPatch,
    importPatch,
  }
})
