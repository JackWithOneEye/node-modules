// declare global {
//   export type BaseModuleProps = {
//     id: string
//     type: string
//     title: string
//   }
// }

export const AudioModuleType = {
  ADSR: 'adsr',
  AudioSource: 'audio-source',
  BitCrusher: 'bit-crusher',
  Decimator: 'decimator',
  Destination: 'destination',
  Gain: 'gain',
  Graindr: 'graindr',
  MidiInput: 'midi-input',
  MultiFilter: 'multi-filter',
  Multiplier: 'multiplier',
  Oscillator: 'oscillator',
  Oscilloscope: 'oscilloscope',
  Value: 'value',
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
          icon: 'pi pi-headphones',
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
    {
      label: 'Effect',
      items: [
        {
          type: AudioModuleType.BitCrusher,
          icon: 'pi pi-qrcode',
          label: 'Bit Crusher',
        },
        {
          type: AudioModuleType.Decimator,
          icon: 'pi pi-qrcode',
          label: 'Decimator',
        },
        {
          type: AudioModuleType.Graindr,
          icon: 'pi pi-qrcode',
          label: 'Graindr',
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
      label: 'Control',
      items: [
        {
          type: AudioModuleType.ADSR,
          icon: 'pi pi-sliders-h',
          label: 'ADSR',
        },
        {
          type: AudioModuleType.Multiplier,
          icon: 'pi pi-times',
          label: 'Multiplier',
        },
        {
          type: AudioModuleType.Value,
          icon: 'pi pi-calculator',
          label: 'Value',
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
