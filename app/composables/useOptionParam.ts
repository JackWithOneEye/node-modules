import type { UnwrapRef } from 'vue'

export const useOptionParam = <T>(name: string, defaultValue: T, setAudioParam: (value: UnwrapRef<T>) => void) => {
  const param = ref<T>(defaultValue)
  const { node: { id } } = useNode()
  const { updateNodeData } = useVueFlow()

  watch(param, (curr, prev) => {
    if (curr !== prev) {
      setAudioParam(curr)
      updateNodeData(id, { [name]: curr })
    }
  })
  return param
}
