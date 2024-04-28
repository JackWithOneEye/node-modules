const midiNote2Freq = (note: number) =>
  Math.round(Math.pow(2, (note - 69) / 12) * 440 * 100) * 0.01

const lut: number[] = []
for (let i = 0; i < 128; i++) {
  lut.push(midiNote2Freq(i))
}

export const midiNote2FreqLUT = lut as ReadonlyArray<number>
