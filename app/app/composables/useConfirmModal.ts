interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  confirmVariant?: 'error' | 'warning' | 'primary'
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
}

const open = ref(false)
const config = ref<ConfirmOptions | null>(null)

export function useConfirmModal() {
  function confirm(options: ConfirmOptions) {
    config.value = options
    open.value = true
  }

  function close() {
    open.value = false
    config.value = null
  }

  async function handleConfirm() {
    if (config.value?.onConfirm) {
      await config.value.onConfirm()
    }
    close()
  }

  function handleCancel() {
    if (config.value?.onCancel) {
      config.value.onCancel()
    }
    close()
  }

  return { open, config, confirm, close, handleConfirm, handleCancel }
}
