const state = {
  /**
   * The type of the node being dragged.
   */
  draggedType: ref<string | null>(null),
  isDragOver: ref(false),
  isDragging: ref(false),
}

export const useDnDModule = () => {
  const { draggedType, isDragOver, isDragging } = state
  const { addModuleAtScreen } = useAddModule()

  watch(isDragging, (dragging) => {
    document.body.style.userSelect = dragging ? 'none' : ''
  })

  function onDragEnd() {
    isDragging.value = false
    isDragOver.value = false
    draggedType.value = null
    document.removeEventListener('dragend', onDragEnd)
    window.removeEventListener('blur', onDragEnd)
  }

  function onDragStart(event: DragEvent, type: string) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/node-modules', type)
      event.dataTransfer.effectAllowed = 'move'
    }

    draggedType.value = type
    isDragging.value = true

    // Always-fires cleanup signals; safe even if a `drop` never happens
    // (e.g. drag canceled with Esc, dropped outside the window).
    document.addEventListener('dragend', onDragEnd, { once: true })
    window.addEventListener('blur', onDragEnd, { once: true })
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault()

    if (draggedType.value) {
      isDragOver.value = true

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move'
      }
    }
  }

  function onDragLeave() {
    isDragOver.value = false
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    if (draggedType.value) {
      addModuleAtScreen(draggedType.value, { x: event.clientX, y: event.clientY })
    }
    onDragEnd()
  }

  return {
    draggedType,
    isDragOver,
    isDragging,
    onDragStart,
    onDragLeave,
    onDragOver,
    onDrop,
  }
}
