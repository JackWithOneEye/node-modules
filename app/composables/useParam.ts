export const useParam = <T>(name: string, defaultValue: T) => {
  const param = ref(defaultValue)
  const { node: { id } } = useNode()
  const { updateNodeData } = useVueFlow()
  watch(param, (curr, prev) => {
    if (curr !== prev) {
      updateNodeData(id, { [name]: curr })
    }
  })
  return param
}
