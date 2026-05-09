export const useFrequencyParam = (name: string, defaultHzValue: number, minFreqHz: number, octaves: number, setAudioParam: (value: number) => void) => {
  const numSemitones = octaves * 12
  const numControlSteps = 100
  const controlRange = numSemitones * numControlSteps
  const powFactor = octaves / controlRange

  function hzToScaled(hz: number) {
    if (hz <= 0) {
      return 0
    }
    return Math.log2(hz / minFreqHz) / powFactor
  }

  function scaledToHz(scaled: number) {
    return minFreqHz * Math.pow(2, powFactor * scaled)
  }

  // const scaled = ref(Math.round(hzToScaled(defaultHzValue)))
  // const hz = computed(() => scaledToHz(scaled.value))

  const [scaled, hz] = useAudioParam(name, defaultHzValue, setAudioParam, {
    toActual: scaledToHz,
    toScaled: hzToScaled,
  })

  return {
    scaled,
    hz,
    controlRange,
    // hzToScaled,
    // scaledToHz,
  }
}
