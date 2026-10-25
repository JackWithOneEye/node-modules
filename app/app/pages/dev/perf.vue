<script lang="ts" setup>
// Dev-only benchmark page (excluded from production builds via `ignore` in nuxt.config.ts).
// Measures the DSP cost of processors by timing OfflineAudioContext renders against a GainNode baseline.

type Scenario = {
  id: string
  label: string
  create: (ctx: OfflineAudioContext) => Promise<AudioNode> | AudioNode
}

type InputSignal = 'saw' | 'noise'

type BenchResult = {
  id: string
  time: string
  label: string
  build: string
  scenario: string
  instances: number
  seconds: number
  sampleRate: number
  input: InputSignal
  runs: number
  medianMs: number
  minMs: number
  maxMs: number
  baselineMs: number
  // share of one CPU core per instance, in percent
  cpuPercent: number
  outputRms: number
}

const worklet = (name: string, parameterData: Record<string, number> = {}, outputs = 1) => (ctx: OfflineAudioContext) =>
  new AudioWorkletNode(ctx, name, {
    numberOfInputs: 1,
    numberOfOutputs: outputs,
    outputChannelCount: Array(outputs).fill(2),
    parameterData,
  })

const cabinet = (ir: string) => async (ctx: OfflineAudioContext) => {
  const response = await fetch(`/impulse-responses/${ir}.wav`)
  return new ConvolverNode(ctx, { buffer: await ctx.decodeAudioData(await response.arrayBuffer()) })
}

const tanhCurve = Float32Array.from({ length: 4096 }, (_, i) => Math.tanh(4 * (i / 2047.5 - 1)))

const scenarios: Scenario[] = [
  { id: 'amp-clean', label: 'Amp (clean)', create: worklet('amp') },
  { id: 'amp-driven', label: 'Amp (driven, +20 dB)', create: worklet('amp', { gain: 20, bass: 3, mid: -3, treble: 2 }) },
  { id: 'cabinet', label: 'Cabinet (V30 · SM57)', create: cabinet('v30-sm57') },
  { id: 'distortion', label: 'Distortion', create: worklet('distortion', { inputGain: 10 }) },
  { id: 'bit-crusher', label: 'Bit Crusher (8 bit)', create: worklet('bit-crusher', { bits: 8 }) },
  { id: 'decimator', label: 'Decimator', create: worklet('decimator') },
  { id: 'multi-filter', label: 'Multi Filter', create: worklet('multi-filter', {}, 4) },
  { id: 'phaser', label: 'Phaser', create: worklet('phaser') },
  { id: 'graindr', label: 'Graindr', create: worklet('graindr') },
  { id: 'native-waveshaper', label: 'Native WaveShaper (4x)', create: ctx => new WaveShaperNode(ctx, { curve: tanhCurve, oversample: '4x' }) },
  { id: 'native-compressor', label: 'Native DynamicsCompressor', create: ctx => new DynamicsCompressorNode(ctx) },
]
const baseline: Scenario = { id: 'baseline', label: 'GainNode (baseline)', create: ctx => new GainNode(ctx) }

const ALL = 'all'
const scenarioOptions = [{ label: 'All scenarios', value: ALL }, ...scenarios.map(s => ({ label: s.label, value: s.id }))]
const sampleRateOptions = [44100, 48000, 96000].map(v => ({ label: `${v / 1000} kHz`, value: v }))
const inputOptions = [{ label: 'Sawtooth 220 Hz', value: 'saw' as const }, { label: 'White noise', value: 'noise' as const }]

const scenarioId = ref(ALL)
const instances = ref(8)
const seconds = ref(10)
const runs = ref(5)
const sampleRate = ref(48000)
const input = ref<InputSignal>('saw')
const label = ref('')

const running = ref(false)
const stopRequested = ref(false)
const progress = ref('')
const results = ref<BenchResult[]>([])
const referenceId = ref<string>()

const STORAGE_KEY = 'node-modules:perf-results'
onMounted(() => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    results.value = stored.results ?? []
    referenceId.value = stored.referenceId
  }
  catch (e) {
    console.warn('could not read stored benchmark results', e)
  }
})
watch([results, referenceId], () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ results: results.value, referenceId: referenceId.value }))
}, { deep: true })

// identifies the processor build that was measured, so before/after runs can be told apart
async function buildHash() {
  const script = await (await fetch('/api/audio-processors-script')).arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', script)
  return [...new Uint8Array(digest).slice(0, 4)].map(b => b.toString(16).padStart(2, '0')).join('')
}

function createInput(ctx: OfflineAudioContext, signal: InputSignal): AudioScheduledSourceNode {
  if (signal === 'saw') {
    return new OscillatorNode(ctx, { type: 'sawtooth', frequency: 220 })
  }
  const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1
  }
  return new AudioBufferSourceNode(ctx, { buffer, loop: true })
}

async function render(scenario: Scenario) {
  const ctx = new OfflineAudioContext(2, Math.round(seconds.value * sampleRate.value), sampleRate.value)
  await ctx.audioWorklet.addModule('/api/audio-processors-script')
  const source = createInput(ctx, input.value)
  const level = new GainNode(ctx, { gain: 0.3 })
  source.connect(level)
  for (let i = 0; i < instances.value; i++) {
    const node = await scenario.create(ctx)
    level.connect(node)
    node.connect(ctx.destination)
  }
  source.start()

  const start = performance.now()
  const buffer = await ctx.startRendering()
  const ms = performance.now() - start

  const out = buffer.getChannelData(0)
  let sum = 0
  for (let i = out.length >> 1; i < out.length; i++) {
    sum += out[i]! * out[i]!
  }
  return { ms, rms: Math.sqrt(sum / (out.length - (out.length >> 1))) }
}

async function measure(scenario: Scenario) {
  // first render is a warm-up (script fetch, wasm compilation)
  await render(scenario)
  const times: number[] = []
  let rms = 0
  for (let i = 0; i < runs.value && !stopRequested.value; i++) {
    progress.value = `${scenario.label}: run ${i + 1}/${runs.value}`
    const result = await render(scenario)
    times.push(result.ms)
    rms = result.rms
  }
  times.sort((a, b) => a - b)
  return { median: times[times.length >> 1] ?? NaN, min: times[0] ?? NaN, max: times.at(-1) ?? NaN, rms }
}

async function run() {
  running.value = true
  stopRequested.value = false
  try {
    const build = await buildHash()
    const selected = scenarioId.value === ALL ? scenarios : scenarios.filter(s => s.id === scenarioId.value)
    const base = await measure(baseline)
    for (const scenario of selected) {
      const m = await measure(scenario)
      // a scenario interrupted by Stop has fewer runs than recorded, so it is discarded
      if (stopRequested.value) {
        break
      }
      results.value.unshift({
        id: crypto.randomUUID(),
        time: new Date().toISOString(),
        label: label.value,
        build,
        scenario: scenario.label,
        instances: instances.value,
        seconds: seconds.value,
        sampleRate: sampleRate.value,
        input: input.value,
        runs: runs.value,
        medianMs: m.median,
        minMs: m.min,
        maxMs: m.max,
        baselineMs: base.median,
        cpuPercent: (m.median - base.median) / instances.value / seconds.value / 10,
        outputRms: m.rms,
      })
    }
  }
  catch (e) {
    console.warn('benchmark failed', e)
    progress.value = `Failed: ${e}`
    return
  }
  finally {
    running.value = false
  }
  progress.value = stopRequested.value ? 'Stopped' : 'Done'
}

const reference = computed(() => results.value.find(r => r.id === referenceId.value))
function comparison(r: BenchResult) {
  const pinned = reference.value
  if (!pinned || pinned.id === r.id || pinned.scenario !== r.scenario) {
    return ''
  }
  const change = (r.cpuPercent / pinned.cpuPercent - 1) * 100
  return `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`
}
const isSilent = (r: BenchResult) => !Number.isFinite(r.outputRms) || r.outputRms < 1e-6

function exportJson() {
  const blob = new Blob([JSON.stringify(results.value, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `perf-results-${new Date().toISOString().slice(0, 19)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

function clearResults() {
  results.value = []
  referenceId.value = undefined
}
</script>

<template>
  <div class="min-h-screen bg-neutral-950 text-white p-6 space-y-6">
    <div class="space-y-1">
      <h1 class="text-xl font-semibold">
        Processor performance <span class="text-xs font-mono text-amber-400 align-middle">dev only</span>
      </h1>
      <p class="text-sm text-white/60 max-w-3xl">
        Renders the input through N parallel instances in an OfflineAudioContext, takes the median of the runs after a warm-up,
        and subtracts the same graph built from GainNodes. CPU is the share of one core per instance needed for real-time playback.
        Offline rendering measures DSP cost, not real-time glitches.
      </p>
    </div>

    <div class="flex flex-wrap items-end gap-4">
      <label class="flex flex-col gap-1 text-xs text-white/60">Scenario
        <USelect
          v-model="scenarioId"
          :items="scenarioOptions"
          class="w-60"
          :disabled="running"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs text-white/60">Instances
        <UInputNumber
          v-model="instances"
          :min="1"
          :max="64"
          class="w-28"
          :disabled="running"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs text-white/60">Seconds
        <UInputNumber
          v-model="seconds"
          :min="1"
          :max="120"
          class="w-28"
          :disabled="running"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs text-white/60">Runs
        <UInputNumber
          v-model="runs"
          :min="1"
          :max="25"
          class="w-28"
          :disabled="running"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs text-white/60">Sample rate
        <USelect
          v-model="sampleRate"
          :items="sampleRateOptions"
          class="w-28"
          :disabled="running"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs text-white/60">Input
        <USelect
          v-model="input"
          :items="inputOptions"
          class="w-48"
          :disabled="running"
        />
      </label>
      <label class="flex flex-col gap-1 text-xs text-white/60">Label
        <UInput
          v-model="label"
          placeholder="e.g. before refactor"
          class="w-48"
          :disabled="running"
        />
      </label>
      <UButton
        v-if="!running"
        icon="ph:play"
        label="Run"
        @click="run"
      />
      <UButton
        v-else
        icon="ph:stop"
        color="error"
        label="Stop"
        :disabled="stopRequested"
        @click="stopRequested = true"
      />
      <span
        class="text-sm font-mono text-white/60"
        data-testid="progress"
      >{{ progress }}</span>
    </div>

    <div class="space-y-2">
      <div class="flex items-center gap-2">
        <h2 class="font-semibold">
          Results
        </h2>
        <UButton
          size="xs"
          variant="ghost"
          icon="ph:download-simple"
          label="Export JSON"
          :disabled="!results.length"
          @click="exportJson"
        />
        <UButton
          size="xs"
          variant="ghost"
          color="error"
          icon="ph:trash"
          label="Clear"
          :disabled="!results.length || running"
          @click="clearResults"
        />
        <span
          v-if="reference"
          class="text-xs text-white/60"
        >Δ compares with the pinned {{ reference.scenario }} run ({{ reference.build }}{{ reference.label ? `, ${reference.label}` : '' }})</span>
      </div>
      <table
        v-if="results.length"
        class="w-full text-sm font-mono"
      >
        <thead class="text-left text-xs text-white/50">
          <tr class="border-b border-white/10">
            <th class="py-1 pr-3">
              Time
            </th>
            <th class="pr-3">
              Label
            </th>
            <th class="pr-3">
              Build
            </th>
            <th class="pr-3">
              Scenario
            </th>
            <th class="pr-3">
              Setup
            </th>
            <th class="pr-3 text-right">
              Median (min–max)
            </th>
            <th class="pr-3 text-right">
              Baseline
            </th>
            <th class="pr-3 text-right">
              CPU / instance
            </th>
            <th class="pr-3 text-right">
              Δ
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in results"
            :key="r.id"
            class="border-b border-white/5"
            :class="{ 'bg-white/5': r.id === referenceId }"
          >
            <td class="py-1 pr-3 text-white/50">
              {{ new Date(r.time).toLocaleTimeString() }}
            </td>
            <td class="pr-3">
              {{ r.label }}
            </td>
            <td class="pr-3 text-white/50">
              {{ r.build }}
            </td>
            <td class="pr-3">
              {{ r.scenario }}
              <span
                v-if="isSilent(r)"
                class="text-error"
                title="Output was silent or not finite; the node may have failed"
              >silent!</span>
            </td>
            <td class="pr-3 text-white/50">
              {{ r.instances }}× {{ r.seconds }}s @{{ r.sampleRate / 1000 }}k, {{ r.input }}, {{ r.runs }} runs
            </td>
            <td class="pr-3 text-right">
              {{ r.medianMs.toFixed(0) }} ms ({{ r.minMs.toFixed(0) }}–{{ r.maxMs.toFixed(0) }})
            </td>
            <td class="pr-3 text-right text-white/50">
              {{ r.baselineMs.toFixed(0) }} ms
            </td>
            <td class="pr-3 text-right font-semibold">
              {{ r.cpuPercent.toFixed(3) }}%
            </td>
            <td class="pr-3 text-right">
              {{ comparison(r) }}
            </td>
            <td class="text-right">
              <UButton
                size="xs"
                variant="ghost"
                :icon="r.id === referenceId ? 'ph:push-pin-fill' : 'ph:push-pin'"
                :aria-label="r.id === referenceId ? 'Unpin reference' : 'Pin as reference'"
                @click="referenceId = r.id === referenceId ? undefined : r.id"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <p
        v-else
        class="text-sm text-white/50"
      >
        No results yet.
      </p>
    </div>
  </div>
</template>
