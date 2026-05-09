import type { Edge, GraphEdge, GraphNode, Node } from '@vue-flow/core'

/**
 * In-memory copy/paste/duplicate for editor selections.
 *
 * `attach({ audioConnect })` must be called once from the editor root.
 * After that, `copy()` / `paste()` / `duplicate()` / `deleteSelection()`
 * can be invoked from anywhere.
 *
 * Pasted nodes get fresh UUIDs and a small position offset so they
 * don't perfectly overlap their originals. Edges between copied nodes
 * are preserved (with new ids); edges that referenced an unselected
 * node are dropped.
 */

type Clipboard = {
  nodes: Array<Pick<GraphNode, 'id' | 'type' | 'position' | 'data'>>
  edges: Array<Pick<GraphEdge, 'id' | 'source' | 'target' | 'sourceHandle' | 'targetHandle'>>
}

const buffer = ref<Clipboard | null>(null)

type AttachedFlow = {
  getNodes: () => GraphNode[]
  getEdges: () => GraphEdge[]
  addNodes: (nodes: Node[]) => void
  addEdges: (edges: Edge[]) => void
  removeNodes: (ids: string[]) => void
  removeEdges: (ids: string[]) => void
  /** Replace the current selection with exactly these node ids. */
  selectOnly: (nodeIds: string[]) => void
  onNodesInitialized: (cb: () => void) => { off: () => void }
  audioConnect: AudioWire
}
let attached: AttachedFlow | null = null
const pendingPasteOffs = new Set<() => void>()

function clearPendingPastes() {
  for (const off of pendingPasteOffs) {
    off()
  }
  pendingPasteOffs.clear()
}

const PASTE_OFFSET = 32

function selectedSnapshot(): Clipboard | null {
  if (!attached) {
    return null
  }
  const ids = new Set<string>()
  const nodes: Clipboard['nodes'] = []
  for (const n of attached.getNodes()) {
    if (!n.selected) {
      continue
    }
    ids.add(n.id)
    nodes.push({
      id: n.id,
      type: n.type,
      position: { x: n.position.x, y: n.position.y },
      data: clone(n.data),
    })
  }
  if (nodes.length === 0) {
    return null
  }
  // Keep only edges fully inside the selection.
  const edges: Clipboard['edges'] = []
  for (const e of attached.getEdges()) {
    if (ids.has(e.source) && ids.has(e.target)) {
      edges.push({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })
    }
  }
  return { nodes, edges }
}

function pasteClipboard(clip: Clipboard) {
  if (!attached || clip.nodes.length === 0) {
    return
  }

  // Map original ids to new uuids so edges stay valid.
  const idMap = new Map<string, string>()
  for (const n of clip.nodes) {
    idMap.set(n.id, crypto.randomUUID())
  }

  const expectedIds = new Set<string>()
  const newNodes: Node[] = []
  for (const n of clip.nodes) {
    const id = idMap.get(n.id)!
    expectedIds.add(id)
    newNodes.push({
      id,
      type: n.type,
      position: { x: n.position.x + PASTE_OFFSET, y: n.position.y + PASTE_OFFSET },
      data: clone(n.data),
    })
  }

  const newEdges: Edge[] = []
  for (const e of clip.edges) {
    newEdges.push({
      id: crypto.randomUUID(),
      source: idMap.get(e.source)!,
      target: idMap.get(e.target)!,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    })
  }

  attached.addNodes(newNodes)
  attached.addEdges(newEdges)

  // Commit history immediately so that an undo pressed the next
  // moment (before nodes have finished mounting) still rolls back
  // this paste.
  const { commit } = useEditorHistory()
  commit()

  // Schedule audio re-wire once the new nodes have mounted and
  // registered themselves in the audio store. Each paste tracks its
  // own listener — multiple pending pastes coexist and only invalid
  // ones (editor detached, our nodes missing) bail out.
  const flowRef = attached
  const { off } = flowRef.onNodesInitialized(() => {
    if (attached !== flowRef) {
      off()
      pendingPasteOffs.delete(off)
      return
    }
    const currentIds = new Set<string>()
    for (const n of flowRef.getNodes()) {
      currentIds.add(n.id)
    }
    if (!expectedIds.isSubsetOf(currentIds)) {
      off()
      pendingPasteOffs.delete(off)
      return
    }
    for (const e of newEdges) {
      if (!e.sourceHandle || !e.targetHandle) {
        continue
      }
      flowRef.audioConnect(e.source, e.sourceHandle, e.target, e.targetHandle)
    }
    off()
    pendingPasteOffs.delete(off)
  })
  pendingPasteOffs.add(off)

  // Select the freshly pasted nodes & clear any stale edge selection
  // so an immediate Delete only affects the paste.
  attached.selectOnly([...expectedIds])
}

function copy() {
  const snap = selectedSnapshot()
  if (snap) {
    buffer.value = snap
  }
}

function paste() {
  if (!buffer.value) {
    return
  }
  pasteClipboard(buffer.value)
}

function duplicate() {
  const snap = selectedSnapshot()
  if (snap) {
    buffer.value = snap
    pasteClipboard(snap)
  }
}

function deleteSelection() {
  if (!attached) {
    return
  }
  const nodeIds: string[] = []
  for (const n of attached.getNodes()) {
    if (n.selected) {
      nodeIds.push(n.id)
    }
  }
  if (nodeIds.length > 0) {
    attached.removeNodes(nodeIds)
  }
  const edgeIds: string[] = []
  for (const e of attached.getEdges()) {
    if (e.selected) {
      edgeIds.push(e.id)
    }
  }
  if (edgeIds.length > 0) {
    attached.removeEdges(edgeIds)
  }
}

function detach() {
  clearPendingPastes()
  attached = null
}

export function useEditorClipboard() {
  function attach(opts: { audioConnect: AudioWire }) {
    detach()
    const flow = useVueFlow()
    attached = {
      getNodes: () => flow.getNodes.value,
      getEdges: () => flow.getEdges.value,
      addNodes: nodes => flow.addNodes(nodes),
      addEdges: edges => flow.addEdges(edges),
      removeNodes: ids => flow.removeNodes(ids),
      removeEdges: ids => flow.removeEdges(ids),
      selectOnly: (nodeIds) => {
        const set = new Set(nodeIds)
        for (const n of flow.getNodes.value) {
          n.selected = set.has(n.id)
        }
        // Also clear edge selection so an immediate Delete only
        // touches the freshly selected nodes.
        for (const e of flow.getEdges.value) {
          e.selected = false
        }
      },
      onNodesInitialized: cb => flow.onNodesInitialized(cb),
      audioConnect: opts.audioConnect,
    }
  }

  return {
    hasBuffer: computed(() => !!buffer.value),
    copy,
    paste,
    duplicate,
    deleteSelection,
    attach,
    detach,
  }
}
