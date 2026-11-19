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
  /** Why Web MIDI could not be enabled (unsupported browser, permission denied), if it failed. */
  const error = ref<string | null>(null)

  const onMidiInputConnected = (e: PortEvent) => {
    if (e.port instanceof Input) {
      midiInputs.value = [...WebMidi.inputs]
    }
  }

  async function enable() {
    if (WebMidi.enabled) {
      return
    }
    try {
      await WebMidi.enable()
    }
    catch (e) {
      console.warn(e)
      error.value = e instanceof Error ? e.message : String(e)
      return
    }
    error.value = null
    WebMidi.addListener('connected', onMidiInputConnected)
    midiInputs.value = [...WebMidi.inputs]
  }

  return {
    midiInputs,
    midiNote2FreqLUT,
    error,
    enable,
  }
})
