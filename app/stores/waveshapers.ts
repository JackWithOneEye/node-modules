import { defineStore } from 'pinia'

const HALF_PI = Math.PI / 2

export const useWaveshapersStore = defineStore('waveshapersStore', () => {
  const { audioContext } = useAudioContextStore()
  const MAX_MOD = 100
  const numSamples = audioContext.sampleRate

  function makeTable(fn: (x: number, mod: number) => number) {
    const table = new Array<Float32Array>(100)
    for (let mod = 0; mod <= MAX_MOD; mod++) {
      const curve = new Float32Array(numSamples)
      for (let i = 0; i < numSamples; i++) {
        const x = (i + i) / numSamples - 1
        curve[i] = fn(x, mod)
      }
      table[mod] = curve
    }
    return table
  }

  const sigmoidDeg = 57 * (Math.PI / 180)
  const xRootM = 0.99
  return {
    'sin': makeTable(
      (x, mod) => {
        const freq = (mod * 0.04 + 1) * HALF_PI
        return Math.sin(freq * x)
      },
    ),
    'sigmoid': makeTable(
      (x, mod) => {
        const k = mod + 1
        return (3 + k) * x * sigmoidDeg / (Math.PI + k * Math.abs(x))
      },
    ),
    'tanh': makeTable(
      (x, mod) => Math.tanh((mod * 0.5 + 1) * x),
    ),
    'x-root': makeTable(
      (x, mod) => {
        const k = mod + 1
        if (x >= 0) {
          const x1 = 1 - x
          return 1 - Math.pow(x1, k / x1)
        }

        const x2 = 1 + x
        const exp = k * ((xRootM / (1 + Math.abs(x))) + ((1 - xRootM) / x2))
        return Math.pow(x2, exp) - 1
      },
    ),
  }
})
