// declare global {
//   export type BaseModuleProps = {
//     id: string
//     type: string
//     title: string
//   }
// }

/**
 * Logical signal type for a module port. Used as a styling hook for
 * signal-colored handles and forwarded through
 * `BaseModuleShell` → `ModulePortRow` → `ModuleHandle`.
 */
export const SignalType = {
  Audio: 'audio',
  Cv: 'cv',
  Gate: 'gate',
  Trigger: 'trigger',
  Midi: 'midi',
} as const
export type SignalType = typeof SignalType[keyof typeof SignalType]

/** Shared shape for a module input/output port descriptor. */
export type ModulePort = {
  id: string
  label: string
  signal: SignalType
}

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
  [AudioModuleType.DelayLine]: { description: 'Time-based delay effect', keywords: ['echo', 'time', 'feedback'] },
  [AudioModuleType.Destination]: { description: 'Audio output to speakers', keywords: ['output', 'speaker'] },
  [AudioModuleType.DynamicsCompressor]: { description: 'Dynamics compression', keywords: ['comp', 'dynamics', 'compression'] },
  [AudioModuleType.EnvelopeGenerator]: { description: 'Velocity-aware ADSR envelope', keywords: ['envelope', 'adsr', 'generator'] },
  [AudioModuleType.EnvelopeTracker]: { description: 'Follows the envelope of an audio signal', keywords: ['follower', 'envelope', 'track'] },
  [AudioModuleType.FMOscillator]: { description: 'FM-capable oscillator', keywords: ['fm', 'osc'] },
  [AudioModuleType.FMVoice]: { description: '6-operator FM synth voice', keywords: ['fm', 'dx7', 'voice'] },
  [AudioModuleType.Gain]: { description: 'Level / amplifier control', keywords: ['vca', 'volume', 'amplifier', 'level'] },
  [AudioModuleType.Graindr]: { description: 'Granular processor', keywords: ['granular', 'pitch'] },
  [AudioModuleType.KaossPad]: { description: 'XY touch controller', keywords: ['xy', 'pad'] },
  [AudioModuleType.LFO]: { description: 'Low-frequency oscillator', keywords: ['modulator', 'low', 'frequency'] },
  [AudioModuleType.MidiInput]: { description: 'MIDI device input', keywords: ['note', 'keyboard'] },
  [AudioModuleType.MultiFilter]: { description: 'Multi-mode filter (LP/HP/BP/BS)', keywords: ['filter', 'lpf', 'hpf', 'bpf', 'bsf'] },
  [AudioModuleType.Multiplier]: { description: 'Signal multiplier / ring mod', keywords: ['ring', 'mod'] },
  [AudioModuleType.Noise]: { description: 'Noise generator', keywords: ['white', 'pink'] },
  [AudioModuleType.Oscillator]: { description: 'Audio-rate oscillator', keywords: ['osc', 'sine', 'saw'] },
  [AudioModuleType.Oscilloscope]: { description: 'Time-domain visualizer', keywords: ['scope', 'visual'] },
  [AudioModuleType.Phaser]: { description: 'Phaser effect', keywords: ['fx', 'phase', 'effect'] },
  [AudioModuleType.PitchTracker]: { description: 'Detect pitch of an input signal', keywords: ['follower', 'pitch', 'detect'] },
  [AudioModuleType.Sequencer]: { description: 'Step sequencer', keywords: ['steps', 'pattern'] },
  [AudioModuleType.SpectrumAnalyzer]: { description: 'Frequency-domain visualizer', keywords: ['fft', 'visual'] },
  [AudioModuleType.Value]: { description: 'Constant value source', keywords: ['constant', 'cv'] },
  [AudioModuleType.Waveshaper]: { description: 'Waveshaping distortion', keywords: ['distortion', 'wave', 'shape'] },
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
          type: AudioModuleType.Destination,
          icon: 'pi pi-headphones',
          label: 'Destination',
        },
        {
          type: AudioModuleType.MidiInput,
          icon: 'pi pi-key',
          label: 'MIDI Input',
        },
      ],
    },
    {
      label: 'Generator',
      items: [
        {
          type: AudioModuleType.FMOscillator,
          icon: 'pi pi-sort-alt',
          label: 'FM Oscillator',
        },
        {
          type: AudioModuleType.LFO,
          icon: 'pi pi-clock',
          label: 'LFO',
        },
        {
          type: AudioModuleType.Noise,
          icon: 'pi pi-bolt',
          label: 'Noise',
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
      label: 'Voice',
      items: [
        {
          type: AudioModuleType.FMVoice,
          icon: 'pi pi-th-large',
          label: 'FM Voice',
        },
        {
          type: AudioModuleType.Gain,
          icon: 'pi pi-gauge',
          label: 'Gain',
        },
      ],
    },
    {
      label: 'Effect',
      items: [
        {
          type: AudioModuleType.BitCrusher,
          icon: 'pi pi-eraser',
          label: 'Bit Crusher',
        },
        {
          type: AudioModuleType.Decimator,
          icon: 'pi pi-filter-slash',
          label: 'Decimator',
        },
        {
          type: AudioModuleType.DelayLine,
          icon: 'pi pi-history',
          label: 'Delay Line',
        },
        {
          type: AudioModuleType.DynamicsCompressor,
          icon: 'pi pi-compress',
          label: 'Dynamics Compressor',
        },
        {
          type: AudioModuleType.Graindr,
          icon: 'pi pi-box',
          label: 'Graindr',
        },
        {
          type: AudioModuleType.MultiFilter,
          icon: 'pi pi-filter',
          label: 'Multi Filter',
        },
        {
          type: AudioModuleType.Phaser,
          icon: 'pi pi-sync',
          label: 'Phaser',
        },
        {
          type: AudioModuleType.Waveshaper,
          icon: 'pi pi-hammer',
          label: 'Waveshaper',
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
          type: AudioModuleType.KaossPad,
          icon: 'pi pi-arrows-alt',
          label: 'Kaoss Pad',
        },
        {
          type: AudioModuleType.Multiplier,
          icon: 'pi pi-times',
          label: 'Multiplier',
        },
        {
          type: AudioModuleType.PitchTracker,
          icon: 'pi pi-search',
          label: 'Pitch Tracker',
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
      ],
    },
    {
      label: 'Visual',
      items: [
        {
          type: AudioModuleType.Oscilloscope,
          icon: 'pi pi-desktop',
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
const moduleCatalogByType = new Map<string, ModuleCatalogEntry>()
for (const group of moduleOptions.flat()) {
  for (const item of group.items) {
    const entry: ModuleCatalogEntry = {
      type: item.type,
      label: item.label,
      icon: item.icon,
      category: group.label,
      description: MODULE_DESCRIPTIONS[item.type].description,
      keywords: MODULE_DESCRIPTIONS[item.type].keywords,
    }
    moduleCatalog.push(entry)
    moduleCatalogByType.set(entry.type, entry)
  }
}

export function getModuleCatalogEntry(type: string): ModuleCatalogEntry | undefined {
  return moduleCatalogByType.get(type)
}

/** Ordered list of category names derived from `moduleOptions`. */
export const moduleCategories: string[] = []
const seenCategories = new Set<string>()
for (const group of moduleOptions.flat()) {
  if (!seenCategories.has(group.label)) {
    seenCategories.add(group.label)
    moduleCategories.push(group.label)
  }
}

/**
 * Ranked search over the module catalog.
 *
 * Scoring tiers (higher = better):
 *  100  – exact label match
 *   80  – label starts with query
 *   60  – a word in the label starts with query
 *   40  – label contains query as substring
 *   20  – keyword match
 *   10  – category match
 *    5  – description match
 *
 * Entries with the same score are sorted by label length (shorter first)
 * then alphabetically. Unmatched entries are excluded.
 *
 * If `category` is provided only entries in that category are returned.
 * If `query` is empty every matching-category entry is returned (score 0).
 */
export function searchModuleCatalog(query: string, category?: string): ModuleCatalogEntry[] {
  const q = query.trim().toLowerCase()
  const hits: { entry: ModuleCatalogEntry, score: number }[] = []

  for (const entry of moduleCatalog) {
    if (category && entry.category !== category) {
      continue
    }
    if (!q) {
      hits.push({ entry, score: 0 })
      continue
    }

    const label = entry.label.toLowerCase()
    const description = entry.description.toLowerCase()
    const cat = entry.category.toLowerCase()
    const keywords = entry.keywords.map(k => k.toLowerCase())

    let score = 0

    // 100 – exact label match
    if (label === q) {
      score = 100
    }
    // 80 – label starts with query
    else if (label.startsWith(q)) {
      score = 80
    }
    // 60 – a word in the label starts with query (e.g. "fi" → "Multi Filter")
    else if (label.split(/\s+/).some(word => word.startsWith(q))) {
      score = 60
    }
    // 40 – label contains query anywhere
    else if (label.includes(q)) {
      score = 40
    }
    // 20 – keyword match
    else if (keywords.some(k => k.includes(q))) {
      score = 20
    }
    // 10 – category match
    else if (cat.includes(q)) {
      score = 10
    }
    // 5 – description match
    else if (description.includes(q)) {
      score = 5
    }

    if (score > 0) {
      hits.push({ entry, score })
    }
  }

  // Sort: higher score first, then shorter label, then alphabetical
  hits.sort((a, b) => b.score - a.score || a.entry.label.length - b.entry.label.length || a.entry.label.localeCompare(b.entry.label))

  return hits.map(h => h.entry)
}
