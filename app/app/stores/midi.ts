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

  const onMidiPortChanged = (e: PortEvent) => {
    if (e.port instanceof Input) {
      midiInputs.value = [...WebMidi.inputs]
    }
  }

  /** disabled → (enable) enabling → enabled | disabled with `error` set (retried on the next call). */
  let enabling: Promise<void> | null = null

  function enable() {
    if (WebMidi.enabled) {
      return Promise.resolve()
    }
    // concurrent callers (several MIDI modules mounting) share one request
    enabling ??= doEnable().finally(() => {
      enabling = null
    })
    return enabling
  }

  async function doEnable() {
    try {
      await WebMidi.enable()
    }
    catch (e) {
      console.warn(e)
      error.value = e instanceof Error ? e.message : String(e)
      return
    }
    error.value = null
    WebMidi.addListener('connected', onMidiPortChanged)
    WebMidi.addListener('disconnected', onMidiPortChanged)
    midiInputs.value = [...WebMidi.inputs]
  }

  return {
    midiInputs,
    midiNote2FreqLUT,
    error,
    enable,
  }
})
