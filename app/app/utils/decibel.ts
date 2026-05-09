export function dB2Gain(dB: number, minusInfinityDb = -100) {
  if (dB < minusInfinityDb) {
    return 0
  }
  return Math.pow(10, dB * 0.05)
}

export function gain2dB(gain: number, minusInfinityDb = -100) {
  if (gain <= 0) {
    return minusInfinityDb
  }
  return Math.max(minusInfinityDb, 20 * Math.log10(gain))
}
