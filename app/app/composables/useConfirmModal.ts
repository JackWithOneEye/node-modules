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
    // a replaced request must still settle (e.g. a pending confirmDiscard)
    if (phase.value.kind === 'open') {
      phase.value.config.onCancel?.()
    }
    phase.value = { kind: 'open', config: options }
  }

  function close() {
    phase.value = { kind: 'closed' }
  }

  async function handleConfirm() {
    const p = phase.value
    if (p.kind !== 'open') {
      return
    }
    phase.value = { kind: 'confirming', config: p.config }
    try {
      await p.config.onConfirm()
    }
    finally {
      if (phase.value.kind === 'confirming' && phase.value.config === p.config) {
        close()
      }
    }
  }

  function handleCancel() {
    const p = phase.value
    // a running confirm action cannot be cancelled
    if (p.kind !== 'open') {
      return
    }
    p.config.onCancel?.()
    close()
  }

  const confirming = computed(() => phase.value.kind === 'confirming')

  return { open, config, confirming, confirm, close, handleConfirm, handleCancel }
}
