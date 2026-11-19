/**
 * Asks before an action replaces the open patch while it has unsaved changes.
 * Resolves `true` when there is nothing to lose or the user chose to discard.
 */
export function useConfirmDiscard() {
  const store = useDataStore()
  const route = useRoute()
  const { confirm } = useConfirmModal()

  return function confirmDiscard(): Promise<boolean> {
    if (!route.path.startsWith('/patches/') || !store.dirty) {
      return Promise.resolve(true)
    }
    return new Promise((resolve) => {
      confirm({
        title: 'Discard unsaved changes?',
        message: `"${store.currentPatchName}" has unsaved changes that will be lost.`,
        confirmLabel: 'Discard',
        confirmVariant: 'error',
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })
  }
}
