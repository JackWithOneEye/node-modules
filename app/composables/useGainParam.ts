export const useGainParam = (defaultLinearValue: number) => {
  const gain = ref(Math.trunc(gain2DB(defaultLinearValue)))
  return gain
}
