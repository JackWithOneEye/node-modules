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
  DelayLine: 'delay-line',
  Destination: 'destination',
  DynamicsCompressor: 'dynamics-compressor',
  EnvelopeGenerator: 'envelope-generator',
  EnvelopeTracker: 'envelope-tracker',
  FMOscillator: 'fm-oscillator',
  FMVoice: 'fm-voice',
  Gain: 'gain',
  Graindr: 'graindr',
  KaossPad: 'kaoss-pad',
  LFO: 'lfo',
  MidiInput: 'midi-input',
  MultiFilter: 'multi-filter',
  Multiplier: 'multiplier',
  Noise: 'noise',
  Phaser: 'phaser',
  Oscillator: 'oscillator',
  Oscilloscope: 'oscilloscope',
  PitchTracker: 'pitch-tracker',
  SpectrumAnalyzer: 'spectrum-analyzer',
  Sequencer: 'sequencer',
  Value: 'value',
  Waveshaper: 'waveshaper',
} as const

export type ModuleCatalogEntry = {
  type: string
  label: string
  icon: string
  category: string
  description: string
  /** Tokens that should match in search but are not displayed (e.g. synonyms). */
  keywords: string[]
}

const MODULE_DESCRIPTIONS: Record<typeof AudioModuleType[keyof typeof AudioModuleType], { description: string, keywords: string[] }> = {
  [AudioModuleType.ADSR]: { description: 'Attack/Decay/Sustain/Release envelope', keywords: ['envelope'] },
  [AudioModuleType.AudioSource]: { description: 'Microphone or line input', keywords: ['mic', 'input'] },
  [AudioModuleType.BitCrusher]: { description: 'Reduce sample bit depth', keywords: ['lo-fi', 'distortion'] },
  [AudioModuleType.Decimator]: { description: 'Sample-rate reduction', keywords: ['lo-fi', 'aliasing'] },
  [AudioModuleType.DelayLine]: { description: 'Time-based delay effect', keywords: ['echo'] },
  [AudioModuleType.Destination]: { description: 'Audio output to speakers', keywords: ['output', 'speaker'] },
  [AudioModuleType.DynamicsCompressor]: { description: 'Dynamics compression', keywords: ['comp'] },
  [AudioModuleType.EnvelopeGenerator]: { description: 'Velocity-aware ADSR envelope', keywords: ['envelope'] },
  [AudioModuleType.EnvelopeTracker]: { description: 'Follows the envelope of an audio signal', keywords: ['follower'] },
  [AudioModuleType.FMOscillator]: { description: 'FM-capable oscillator', keywords: ['fm', 'osc'] },
  [AudioModuleType.FMVoice]: { description: '6-operator FM synth voice', keywords: ['fm', 'dx7', 'voice'] },
  [AudioModuleType.Gain]: { description: 'Level / amplifier control', keywords: ['vca', 'volume'] },
  [AudioModuleType.Graindr]: { description: 'Granular processor', keywords: ['granular', 'pitch'] },
  [AudioModuleType.KaossPad]: { description: 'XY touch controller', keywords: ['xy', 'pad'] },
  [AudioModuleType.LFO]: { description: 'Low-frequency oscillator', keywords: ['modulator'] },
  [AudioModuleType.MidiInput]: { description: 'MIDI device input', keywords: ['note', 'keyboard'] },
  [AudioModuleType.MultiFilter]: { description: 'Multi-mode filter (LP/HP/BP/BS)', keywords: ['filter', 'lpf', 'hpf', 'bpf', 'bsf'] },
  [AudioModuleType.Multiplier]: { description: 'Signal multiplier / ring mod', keywords: ['ring', 'mod'] },
  [AudioModuleType.Noise]: { description: 'Noise generator', keywords: ['white', 'pink'] },
  [AudioModuleType.Oscillator]: { description: 'Audio-rate oscillator', keywords: ['osc', 'sine', 'saw'] },
  [AudioModuleType.Oscilloscope]: { description: 'Time-domain visualizer', keywords: ['scope', 'visual'] },
  [AudioModuleType.Phaser]: { description: 'Phaser effect', keywords: ['fx'] },
  [AudioModuleType.PitchTracker]: { description: 'Detect pitch of an input signal', keywords: ['follower'] },
  [AudioModuleType.Sequencer]: { description: 'Step sequencer', keywords: ['steps', 'pattern'] },
  [AudioModuleType.SpectrumAnalyzer]: { description: 'Frequency-domain visualizer', keywords: ['fft', 'visual'] },
  [AudioModuleType.Value]: { description: 'Constant value source', keywords: ['constant', 'cv'] },
  [AudioModuleType.Waveshaper]: { description: 'Waveshaping distortion', keywords: ['distortion'] },
}

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
    {
      label: 'Sound',
      items: [
        {
          type: AudioModuleType.Gain,
          icon: 'pi pi-gauge',
          label: 'Gain',
        },
        {
          type: AudioModuleType.Noise,
          icon: 'pi pi-wave-pulse',
          label: 'Noise',
        },
        {
          type: AudioModuleType.Oscillator,
          icon: 'pi pi-wave-pulse',
          label: 'Oscillator',
        },
        {
          type: AudioModuleType.FMOscillator,
          icon: 'pi pi-wave-pulse',
          label: 'FM Oscillator',
        },
        {
          type: AudioModuleType.FMVoice,
          icon: 'pi pi-th-large',
          label: 'FM Voice',
        },
      ],
    },
  ],
  [
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
          type: AudioModuleType.DelayLine,
          icon: 'pi pi-clock',
          label: 'Delay Line',
        },
        {
          type: AudioModuleType.DynamicsCompressor,
          icon: 'pi pi-compress',
          label: 'Dynamics Compressor',
        },
        {
          type: AudioModuleType.Graindr,
          icon: 'pi pi-qrcode',
          label: 'Graindr',
        },
        {
          type: AudioModuleType.Phaser,
          icon: 'pi pi-wave-pulse',
          label: 'Phaser',
        },
        {
          type: AudioModuleType.Waveshaper,
          icon: 'pi pi-wave-pulse',
          label: 'Waveshaper',
        },
      ],
    },
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
  ],
  [
    {
      label: 'Control',
      items: [
        {
          type: AudioModuleType.ADSR,
          icon: 'pi pi-sliders-h',
          label: 'ADSR',
        },
        {
          type: AudioModuleType.EnvelopeGenerator,
          icon: 'pi pi-sliders-h',
          label: 'Envelope Generator',
        },
        {
          type: AudioModuleType.EnvelopeTracker,
          icon: 'pi pi-chart-line',
          label: 'Envelope Tracker',
        },
        {
          type: AudioModuleType.PitchTracker,
          icon: 'pi pi-wave-pulse',
          label: 'Pitch Tracker',
        },
        {
          type: AudioModuleType.Multiplier,
          icon: 'pi pi-times',
          label: 'Multiplier',
        },
        {
          type: AudioModuleType.LFO,
          icon: 'pi pi-wave-pulse',
          label: 'LFO',
        },
        {
          type: AudioModuleType.Sequencer,
          icon: 'pi pi-forward',
          label: 'Sequencer',
        },
        {
          type: AudioModuleType.Value,
          icon: 'pi pi-calculator',
          label: 'Value',
        },
        {
          type: AudioModuleType.KaossPad,
          icon: 'pi pi-th-large',
          label: 'Kaoss Pad',
        },
      ],
    },
    {
      label: 'Visual',
      items: [
        {
          type: AudioModuleType.Oscilloscope,
          icon: 'pi pi-wave-pulse',
          label: 'Oscilloscope',
        },
        {
          type: AudioModuleType.SpectrumAnalyzer,
          icon: 'pi pi-chart-bar',
          label: 'Spectrum Analyzer',
        },
      ],
    },
  ],
]

/**
 * Flat list of every available module, derived from `moduleOptions`.
 * Used by the quick-add command palette and any module-search UI.
 */
export const moduleCatalog: ModuleCatalogEntry[] = []
for (const group of moduleOptions.flat()) {
  for (const item of group.items) {
    moduleCatalog.push({
      type: item.type,
      label: item.label,
      icon: item.icon,
      category: group.label,
      description: MODULE_DESCRIPTIONS[item.type].description,
      keywords: MODULE_DESCRIPTIONS[item.type].keywords,
    })
  }
}

/** Case-insensitive substring search over label / category / description / keywords. */
export function searchModuleCatalog(query: string): ModuleCatalogEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return moduleCatalog
  }
  const hits: ModuleCatalogEntry[] = []
  for (const entry of moduleCatalog) {
    if (
      entry.label.toLowerCase().includes(q)
      || entry.category.toLowerCase().includes(q)
      || entry.description.toLowerCase().includes(q)
      || entry.keywords.some(k => k.toLowerCase().includes(q))
    ) {
      hits.push(entry)
    }
  }
  return hits
}
