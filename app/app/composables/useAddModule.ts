/**
 * Centralized helpers for inserting new audio modules into the editor.
 *
 * Supports two scenarios:
 *  - drop a module at a specific screen position (drag & drop)
 *  - insert a module at the centre of the current viewport (quick-add)
 */
// gaps between auto-placed modules; the vertical one leaves room for the selection toolbar
const GAP_X = 32
const GAP_Y = 56
const SEARCH_STEP = 16
const SEARCH_RADIUS = 800

export function useAddModule() {
  const {
    addNodes,
    getNodes,
    screenToFlowCoordinate,
    onNodesInitialized,
    updateNode,
    vueFlowRef,
  } = useEditorFlow()

  const { commit } = useEditorHistory()

  /** Nearest spot to `start` where a `width`×`height` module touches no other module. */
  function findFreePosition(nodeId: string, start: { x: number, y: number }, width: number, height: number) {
    const others = getNodes.value.filter(n => n.id !== nodeId)
    const fits = ({ x, y }: { x: number, y: number }) => others.every(n =>
      x + width + GAP_X <= n.position.x
      || x >= n.position.x + n.dimensions.width + GAP_X
      || y + height + GAP_Y <= n.position.y
      || y >= n.position.y + n.dimensions.height + GAP_Y,
    )
    const candidates: { x: number, y: number, distance: number }[] = []
    for (let dx = -SEARCH_RADIUS; dx <= SEARCH_RADIUS; dx += SEARCH_STEP) {
      for (let dy = -SEARCH_RADIUS; dy <= SEARCH_RADIUS; dy += SEARCH_STEP) {
        // prefer left/right neighbours: patches mostly read left to right
        candidates.push({ x: start.x + dx, y: start.y + dy, distance: Math.hypot(dx, dy * 1.5) })
      }
    }
    candidates.sort((a, b) => a.distance - b.distance)
    return candidates.find(fits) ?? start
  }

  function centerNode(nodeId: string, avoidOverlap: boolean) {
    const { off } = onNodesInitialized(() => {
      updateNode(nodeId, (node) => {
        const centered = {
          x: node.position.x - node.dimensions.width / 2,
          y: node.position.y - node.dimensions.height / 2,
        }
        return {
          position: avoidOverlap
            ? findFreePosition(nodeId, centered, node.dimensions.width, node.dimensions.height)
            : centered,
        }
      })
      // Snapshot AFTER the position correction so undo/redo restores
      // the node where the user actually saw it.
      commit()
      off()
    })
  }

  /** Insert a module of the given type at a screen-space coordinate. */
  function addModuleAtScreen(type: string, screen: { x: number, y: number }, avoidOverlap = false) {
    const position = screenToFlowCoordinate(screen)
    const nodeId = crypto.randomUUID()
    addNodes({ id: nodeId, type, position })
    centerNode(nodeId, avoidOverlap)
    return nodeId
  }

  /** Insert a module of the given type at the centre of the visible canvas. */
  function addModuleAtViewportCenter(type: string) {
    const el = vueFlowRef.value
    if (!el) {
      return null
    }
    const rect = el.getBoundingClientRect()
    // unlike a drop, the centre is not a spot the user picked: don't stack modules there
    return addModuleAtScreen(type, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }, true)
  }

  return { addModuleAtScreen, addModuleAtViewportCenter }
}
