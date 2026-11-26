import type { Edge, Node } from '@vue-flow/core'

/**
 * Snapshot-based undo/redo for the editor.
 *
 * The history stack holds full deep-cloned `{nodes, edges}` snapshots.
 * A new snapshot is pushed each time the editor commits a structural
 * change (node added/removed, edge added/removed, node-drag completed).
 *
 * Param/data tweaks inside individual modules are *not* tracked yet.
 *
 * `attach({ audioConnect, audioDisconnect })` must be called once from
 * the editor root (which owns the Vue Flow instance). After that,
 * `undo()` / `redo()` / `canUndo` / `canRedo` can be invoked from
 * anywhere in the app and operate against the attached editor.
 */

const MAX_HISTORY = 10

type Snapshot = {
  nodes: Node[]
  edges: Edge[]
}

type AttachedFlow = {
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  getNodes: () => Node[]
  getEdges: () => Edge[]
  onNodesInitialized: (cb: () => void) => { off: () => void }
  audioConnect: AudioWire
  audioDisconnect: AudioWire
}

/**
 * Lifecycle of the history against the attached editor.
 *
 * - detached: no editor; everything is a no-op
 * - seeding: attached, waiting for the initial snapshot; commits are dropped
 * - idle: commits are recorded
 * - applying: an undo/redo snapshot is being applied; commits and Vue Flow
 *   audio handlers are suppressed. `cancel` is set while the audio reconnect
 *   waits for the next tick.
 *
 * Transitions: `attach` → seeding → (`seedInitial`) idle; `undo`/`redo` →
 * applying → idle; `detach` → detached.
 */
type Phase
  = | { kind: 'detached' }
    | { kind: 'seeding', flow: AttachedFlow }
    | { kind: 'idle', flow: AttachedFlow }
    | { kind: 'applying', flow: AttachedFlow, cancel: (() => void) | null }

const stack = ref<Snapshot[]>([])
const cursor = ref(-1)
const phase = shallowRef<Phase>({ kind: 'detached' })
const isApplying = computed(() => phase.value.kind === 'applying')

let cleanupFns: Array<() => void> = []

function idleFlow(): AttachedFlow | null {
  return phase.value.kind === 'idle' ? phase.value.flow : null
}

/** Leaves `applying` (cancelling a pending reconnect) for `idle`. */
function finishApply() {
  const p = phase.value
  if (p.kind === 'applying') {
    p.cancel?.()
    phase.value = { kind: 'idle', flow: p.flow }
  }
}

function snapshotEqual(a: Snapshot, b: Snapshot): boolean {
  if (a.nodes.length !== b.nodes.length) {
    return false
  }
  if (a.edges.length !== b.edges.length) {
    return false
  }
  return JSON.stringify(a) === JSON.stringify(b)
}

function takeSnapshot(getNodes: () => Node[], getEdges: () => Edge[]): Snapshot {
  // Strip transient UI fields; keep only what defines editor state.
  const nodes: Node[] = []
  for (const n of getNodes()) {
    nodes.push({
      id: n.id,
      type: n.type,
      position: { x: n.position.x, y: n.position.y },
      data: clone(n.data),
    })
  }
  const edges: Edge[] = []
  for (const e of getEdges()) {
    const edge: Edge = {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    }
    if (e.data) {
      edge.data = clone(e.data)
    }
    if (e.style) {
      edge.style = clone(e.style)
    }
    edges.push(edge)
  }
  return { nodes, edges }
}

function edgeKey(e: Pick<Edge, 'source' | 'target' | 'sourceHandle' | 'targetHandle'>): string {
  return `${e.source}|${e.sourceHandle ?? ''}|${e.target}|${e.targetHandle ?? ''}`
}

/** Schedule a snapshot commit on the next tick to coalesce burst events. */
let commitScheduled = false
function commit() {
  if (!idleFlow()) {
    return
  }
  if (commitScheduled) {
    return
  }
  commitScheduled = true
  void Promise.resolve().then(() => {
    commitScheduled = false
    const flow = idleFlow()
    if (!flow) {
      return
    }
    const snap = takeSnapshot(flow.getNodes, flow.getEdges)
    if (cursor.value >= 0 && snapshotEqual(stack.value[cursor.value] as Snapshot, snap)) {
      return
    }
    if (cursor.value < stack.value.length - 1) {
      stack.value.splice(cursor.value + 1)
    }
    stack.value.push(snap)
    if (stack.value.length > MAX_HISTORY) {
      stack.value.shift()
    }
    else {
      cursor.value++
    }
  })
}

function applySnapshot(flow: AttachedFlow, snap: Snapshot) {
  phase.value = { kind: 'applying', flow, cancel: null }

  const targetKeys = new Set<string>()
  const snapEdges: Edge[] = []
  for (const e of snap.edges) {
    targetKeys.add(edgeKey(e))
    snapEdges.push(clone(e))
  }
  const snapNodes: Node[] = []
  for (const n of snap.nodes) {
    snapNodes.push(clone(n))
  }

  try {
    // Diff edges: edges that exist now but not in the target snapshot
    // need their audio connections explicitly torn down. The Vue Flow
    // `onEdgesChange` audio handler is suppressed during apply, so we
    // must do this ourselves.
    for (const e of flow.getEdges()) {
      if (!e.sourceHandle || !e.targetHandle) {
        continue
      }
      if (!targetKeys.has(edgeKey(e))) {
        try {
          flow.audioDisconnect(e.source, e.sourceHandle, e.target, e.targetHandle)
        }
        catch (err) {
          console.warn('history apply: disconnect failed', err)
        }
      }
    }

    flow.setNodes(snapNodes)
    flow.setEdges(snapEdges)

    if (snap.nodes.length === 0) {
      // No nodes to wait for; nothing to reconnect.
      finishApply()
      return
    }

    // After Vue's next render cycle, any newly added nodes have mounted
    // and registered themselves in the audio store. We use nextTick
    // (not `onNodesInitialized`) because the latter only fires on
    // false-to-true transitions and would never fire when the apply
    // is purely a removal.
    let cancelled = false
    phase.value = { kind: 'applying', flow, cancel: () => {
      cancelled = true
    } }
    void nextTick(() => {
      if (cancelled) {
        return
      }
      try {
        for (const e of snap.edges) {
          if (!e.sourceHandle || !e.targetHandle) {
            continue
          }
          flow.audioConnect(e.source, e.sourceHandle, e.target, e.targetHandle)
        }
      }
      catch (err) {
        console.warn('history apply: reconnect failed', err)
      }
      finally {
        finishApply()
      }
    })
  }
  catch (err) {
    console.warn('history apply failed', err)
    finishApply()
  }
}

function undo() {
  const flow = idleFlow()
  if (!flow || cursor.value <= 0) {
    return
  }
  cursor.value--
  applySnapshot(flow, stack.value[cursor.value] as Snapshot)
}

function redo() {
  const flow = idleFlow()
  if (!flow || cursor.value >= stack.value.length - 1) {
    return
  }
  cursor.value++
  applySnapshot(flow, stack.value[cursor.value] as Snapshot)
}

function detach() {
  for (const fn of cleanupFns) {
    fn()
  }
  cleanupFns = []
  finishApply()
  phase.value = { kind: 'detached' }
  stack.value = []
  cursor.value = -1
}

export function useEditorHistory() {
  function attach(opts: { audioConnect: AudioWire, audioDisconnect: AudioWire, startsEmpty: boolean }) {
    detach()

    const flow = useEditorFlow()

    const attached: AttachedFlow = {
      setNodes: nodes => flow.setNodes(nodes),
      setEdges: edges => flow.setEdges(edges),
      getNodes: () => flow.getNodes.value,
      getEdges: () => flow.getEdges.value,
      onNodesInitialized: cb => flow.onNodesInitialized(cb),
      audioConnect: opts.audioConnect,
      audioDisconnect: opts.audioDisconnect,
    }
    phase.value = { kind: 'seeding', flow: attached }

    // Seed the initial snapshot. Vue Flow populates its node store
    // when the template renders, *after* setup, so we must wait at
    // least one tick. If nodes do exist, also wait for `onNodesInitialized`
    // so dimensions are available (cosmetic for snapshot equality).
    function seedInitial() {
      if (phase.value.kind !== 'seeding' || phase.value.flow !== attached) {
        return
      }
      phase.value = { kind: 'idle', flow: attached }
      stack.value = [takeSnapshot(attached.getNodes, attached.getEdges)]
      cursor.value = 0
    }

    // Empty-graph fallback: if the editor starts with no nodes, the
    // `onNodesInitialized` event will never fire, so seed after a tick.
    // Only when it truly starts empty: Vue Flow may not have received the
    // initial nodes yet at this tick, and seeding then would record an empty
    // canvas as the first undo step.
    void nextTick(() => {
      if (opts.startsEmpty && attached.getNodes().length === 0) {
        seedInitial()
      }
    })

    const { off: offInit } = flow.onNodesInitialized(() => {
      seedInitial()
      offInit()
    })

    const { off: offNodesChange } = flow.onNodesChange((changes) => {
      // 'add' is committed explicitly by `useAddModule` after the
      // post-init position centering completes — otherwise the
      // snapshot would record the pre-centered position.
      for (const c of changes) {
        if (c.type === 'remove') {
          commit()
          break
        }
      }
    })

    const { off: offEdgesChange } = flow.onEdgesChange((changes) => {
      for (const c of changes) {
        if (c.type === 'add' || c.type === 'remove') {
          commit()
          break
        }
      }
    })

    const { off: offDragStop } = flow.onNodeDragStop(() => commit())

    cleanupFns = [offInit, offNodesChange, offEdgesChange, offDragStop]
  }

  return {
    canUndo: computed(() => phase.value.kind === 'idle' && cursor.value > 0),
    canRedo: computed(() => phase.value.kind === 'idle' && cursor.value < stack.value.length - 1),
    undo,
    redo,
    /** Schedule a snapshot commit on the next microtask (deduped). */
    commit,
    attach,
    detach,
    isApplying,
  }
}
