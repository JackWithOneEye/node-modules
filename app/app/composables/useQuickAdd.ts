import { ref } from 'vue'

const visible = ref(false)

export function useQuickAdd() {
  return {
    visible,
    open: () => { visible.value = true },
    close: () => { visible.value = false },
  }
}
