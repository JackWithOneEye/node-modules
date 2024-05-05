import { Input, WebMidi, type PortEvent } from 'webmidi'

export const useMidiStore = defineStore('midiStore', () => {
  const lut: number[] = []
  for (let note = 0; note < 128; note++) {
    lut.push(
      Math.round(Math.pow(2, (note - 69) / 12) * 440 * 100) * 0.01,
    )
  }
  const midiNote2FreqLUT = readonly(lut)

  const midiInputs = ref([...WebMidi.inputs])

  const onMidiInputConnected = (e: PortEvent) => {
    if (e.port instanceof Input) {
      midiInputs.value = [...WebMidi.inputs]
    }
  }

  async function enable() {
    if (!WebMidi.enabled) {
      await WebMidi.enable()
      WebMidi.addListener('connected', onMidiInputConnected)
      midiInputs.value = [...WebMidi.inputs]
    }
  }

  return {
    midiInputs,
    midiNote2FreqLUT,
    enable,
  }
})
