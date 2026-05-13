/**
 * Centralized editor actions for toolbar buttons and context menus.
 *
 * Wraps Vue Flow + clipboard + history into one composable so that
 * toolbar buttons, keyboard shortcuts, and future context menus all
 * call the same code paths.
 */

export function useEditorActions() {
  const { getNodes, getEdges, removeNodes, removeEdges } = useVueFlow()
  const { duplicate } = useEditorClipboard()

  function duplicateNode(nodeId: string) {
    for (const n of getNodes.value) {
      if (n.id === nodeId) {
        if (n.selected) {
          duplicate()
          return
        }
        n.selected = true
        break
      }
    }
    for (const e of getEdges.value) {
      e.selected = false
    }
    duplicate()
  }

  function deleteNode(nodeId: string) {
    removeNodes([nodeId])
  }

  function disconnectAll(nodeId: string) {
    const ids: string[] = []
    for (const e of getEdges.value) {
      if (e.source === nodeId || e.target === nodeId) {
        ids.push(e.id)
      }
    }
    if (ids.length > 0) {
      removeEdges(ids)
    }
  }

  return { duplicateNode, deleteNode, disconnectAll }
}
