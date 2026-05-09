/**
 * Centralized helpers for inserting new audio modules into the editor.
 *
 * Supports two scenarios:
 *  - drop a module at a specific screen position (drag & drop)
 *  - insert a module at the centre of the current viewport (quick-add)
 */
export function useAddModule() {
  const {
    addNodes,
    screenToFlowCoordinate,
    onNodesInitialized,
    updateNode,
    vueFlowRef,
  } = useVueFlow()

  const { commit } = useEditorHistory()

  function centerNode(nodeId: string) {
    const { off } = onNodesInitialized(() => {
      updateNode(nodeId, node => ({
        position: {
          x: node.position.x - node.dimensions.width / 2,
          y: node.position.y - node.dimensions.height / 2,
        },
      }))
      // Snapshot AFTER the position correction so undo/redo restores
      // the node where the user actually saw it.
      commit()
      off()
    })
  }

  /** Insert a module of the given type at a screen-space coordinate. */
  function addModuleAtScreen(type: string, screen: { x: number, y: number }) {
    const position = screenToFlowCoordinate(screen)
    const nodeId = crypto.randomUUID()
    addNodes({ id: nodeId, type, position })
    centerNode(nodeId)
    return nodeId
  }

  /** Insert a module of the given type at the centre of the visible canvas. */
  function addModuleAtViewportCenter(type: string) {
    const el = vueFlowRef.value
    if (!el) {
      return null
    }
    const rect = el.getBoundingClientRect()
    return addModuleAtScreen(type, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    })
  }

  return { addModuleAtScreen, addModuleAtViewportCenter }
}
