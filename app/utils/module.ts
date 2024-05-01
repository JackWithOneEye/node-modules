export const AudioModuleType = {
  AudioSource: 'audio-source',
  Destination: 'destination',
  Gain: 'gain',
  MidiInput: 'midi-input',
  MultiFilter: 'multi-filter',
  Multiplier: 'multiplier',
  Oscillator: 'oscillator',
  Oscilloscope: 'oscilloscope',
} as const

export const moduleOptions = [
  [
    {
      label: 'I/O',
      items: [
        {
          type: AudioModuleType.AudioSource,
          icon: 'pi pi-microphone',
          label: 'Audio Source',
        },
        {
          type: AudioModuleType.MidiInput,
          icon: 'pi pi-th-large',
          label: 'MIDI Input',
        },
        {
          type: AudioModuleType.Destination,
          icon: 'pi pi-volume-up',
          label: 'Destination',
        },
      ],
    },
  ],
  [
    {
      label: 'Sound',
      items: [
        {
          type: AudioModuleType.Gain,
          icon: 'pi pi-gauge',
          label: 'Gain',
        },
        {
          type: AudioModuleType.Oscillator,
          icon: 'pi pi-wave-pulse',
          label: 'Oscillator',
        },
      ],
    },
  ],
  [
    {
      label: 'Filter',
      items: [
        {
          type: AudioModuleType.MultiFilter,
          icon: 'pi pi-filter',
          label: 'Multi Filter',
        },
      ],
    },
    // ],
    // [
    {
      label: 'Math',
      items: [
        {
          type: AudioModuleType.Multiplier,
          icon: 'pi pi-times',
          label: 'Multiplier',
        },
      ],
    },
  ],
  [
    {
      label: 'Visual',
      items: [
        {
          type: AudioModuleType.Oscilloscope,
          icon: 'pi pi-wave-pulse',
          label: 'Oscilloscope',
        },
      ],
    },
  ],
]
