export const useGainParam = (name: string, defaultLinearValue: number, setParam: (value: number) => void) => {
  const [gain] = useAudioParam(name, defaultLinearValue, setParam, {
    toActual: dB2Gain,
    toScaled: gain2dB,
  })
  gain.value = Math.trunc(gain.value)
  return gain
}
