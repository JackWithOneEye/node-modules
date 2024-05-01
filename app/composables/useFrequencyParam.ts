export const useFrequencyParam = (defaultHzValue: number, minFreqHz: number, octaves: number) => {
  const numSemitones = octaves * 12
  const numControlSteps = 100
  const controlRange = numSemitones * numControlSteps
  const powFactor = octaves / controlRange

  function hzToScaled(hz: number) {
    return Math.log2(hz / minFreqHz) / powFactor
  }

  function scaledToHz(scaled: number) {
    return minFreqHz * Math.pow(2, powFactor * scaled)
  }

  const scaled = ref(Math.round(hzToScaled(defaultHzValue)))
  const hz = computed(() => scaledToHz(scaled.value))

  return {
    scaled,
    hz,
    controlRange,
    hzToScaled,
    scaledToHz,
  }
}
