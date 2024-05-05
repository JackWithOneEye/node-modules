type Converter = {
  toActual: (controlled: number) => number
  toScaled: (actual: number) => number
}

export function linearConverter(scalingFactor: number): Converter {
  const inv = 1 / scalingFactor
  return {
    toActual: value => value * inv,
    toScaled: value => value * scalingFactor,
  }
}

export const useAudioParam = (name: string, defaultValue: number, setAudioParam: (value: number) => void, converter?: Converter) => {
  converter ??= linearConverter(1)

  const scaledParam = ref(converter.toScaled(defaultValue))
  const actualParam = computed(() => converter.toActual(scaledParam.value))

  const { node: { id } } = useNode()
  const { updateNodeData } = useVueFlow()

  watch(actualParam, (curr, prev) => {
    if (curr !== prev) {
      // const actualParamValue = converter.toActual(curr)
      setAudioParam(curr)
      updateNodeData(id, { [name]: curr })
    }
  })

  return [scaledParam, actualParam] as const
}
