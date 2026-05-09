export function sigmoidTable(numSamples: number) {
  const table = new Map<number, Float32Array>()
  const deg = Math.PI / 180
  for (let mod = 0; mod < 100; mod++) {
    const curve = new Float32Array(numSamples)
    const k = (mod + 1)
    for (let i = 0; i < numSamples; i++) {
      const x = (i + i) / numSamples - 1
      curve[i] = (3 + k) * x * 57 * deg / (Math.PI + 20 * Math.abs(x))
    }
    table.set(mod, curve)
  }
  return table
}

export function tanhTable(numSamples: number) {
  const table = new Map<number, Float32Array>()
  for (let mod = 0; mod < 100; mod++) {
    const curve = new Float32Array(numSamples)
    const gain = (mod * 0.5 + 1)
    for (let i = 0; i < numSamples; i++) {
      const x = (i + i) / numSamples - 1
      curve[i] = Math.tanh(gain * x)
    }
    table.set(mod, curve)
  }
  return table
}
