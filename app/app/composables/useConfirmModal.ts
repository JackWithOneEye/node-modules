interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  confirmVariant?: 'error' | 'warning' | 'primary'
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

/**
 * closed → (`confirm`) open → (`handleConfirm`) confirming → closed,
 * or open → (`handleCancel`) closed. One modal is shared app-wide.
 */
type ModalPhase
  = | { kind: 'closed' }
    | { kind: 'open', config: ConfirmOptions }
    | { kind: 'confirming', config: ConfirmOptions }

const phase = shallowRef<ModalPhase>({ kind: 'closed' })
const open = computed(() => phase.value.kind !== 'closed')
const config = computed(() => phase.value.kind === 'closed' ? null : phase.value.config)

export function useConfirmModal() {
  function confirm(options: ConfirmOptions) {
    phase.value = { kind: 'open', config: options }
  }

  function close() {
    phase.value = { kind: 'closed' }
  }

  async function handleConfirm() {
    const p = phase.value
    if (p.kind === 'closed') {
      return
    }
    phase.value = { kind: 'confirming', config: p.config }
    await p.config.onConfirm()
    close()
  }

  function handleCancel() {
    const p = phase.value
    if (p.kind !== 'closed') {
      p.config.onCancel?.()
    }
    close()
  }

  return { open, config, confirm, close, handleConfirm, handleCancel }
}
