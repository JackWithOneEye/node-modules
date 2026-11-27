export const MIN_GAIN = 1.4013e-10

export const useGainParam = (name: string, defaultLinearValue: number, setParam: (value: number) => void) => {
  const [gain] = useAudioParam(name, defaultLinearValue, setParam, {
    toActual: dB2Gain,
    toScaled: gain2dB,
  })
  // snap to whole dB; round, not trunc: the dB round trip turns -1 into -0.9999999999999997
  gain.value = Math.round(gain.value)
  return gain
}
