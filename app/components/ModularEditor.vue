<script lang="ts" setup>
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { VueFlow } from '@vue-flow/core'
import type { Node, Edge, ViewportTransform } from '@vue-flow/core'

export type ModuleEditorProps = {
  initialData: {
    nodes: Node[]
    edges: Edge[]
    viewport?: ViewportTransform
  }
}
const { initialData } = defineProps<ModuleEditorProps>()

const audioCtxStore = useAudioContextStore()

const { onConnect, onEdgesChange, addEdges } = useVueFlow()
const nodes = ref(initialData.nodes)
const edges = ref(initialData.edges)
const viewport = ref(initialData.viewport)

onConnect((connection) => {
  addEdges(connection)
  audioCtxStore.connectModules(
    connection.source,
    connection.sourceHandle!,
    connection.target,
    connection.targetHandle!,
  )
})

onEdgesChange((changes) => {
  for (const change of changes) {
    if (change.type === 'remove') {
      audioCtxStore.disconnectModules(
        change.source,
        change.sourceHandle!,
        change.target,
        change.targetHandle!,
      )
    }
  }
})

const init = useNodesInitialized()
watch(init, (curr) => {
  if (curr) {
    for (const { source, sourceHandle, target, targetHandle } of edges.value) {
      audioCtxStore.connectModules(
        source,
        sourceHandle!,
        target,
        targetHandle!,
      )
    }
  }
}, { once: true })

const { onDragOver, onDrop, onDragLeave, isDragOver } = useDnDModule()
</script>

<template>
  <div
    class="contents"
    @drop="onDrop"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
  >
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :default-viewport="viewport"
      class="flex-1 bg-black text-white"
    >
      <template #[`node-${AudioModuleType.ADSR}`]="{ id, type, data }">
        <ADSRModule
          :id="id"
          :type="type"
          :title="data.title"
          :attack="data.attack"
          :decay="data.decay"
          :sustain="data.sustain"
          :release="data.release"
        />
      </template>
      <template #[`node-${AudioModuleType.AudioSource}`]="{ id, type }">
        <AudioSourceModule
          :id="id"
          :type="type"
        />
      </template>
      <template #[`node-${AudioModuleType.BitCrusher}`]="{ id, type, data }">
        <BitCrusherModule
          :id="id"
          :type="type"
          :title="data.title"
          :bits="data.bits"
        />
      </template>
      <template #[`node-${AudioModuleType.Decimator}`]="{ id, type, data }">
        <DecimatorModule
          :id="id"
          :type="type"
          :title="data.title"
          :reduction="data.reduction"
          :stereo-shift="data.stereoShift"
        />
      </template>
      <template #[`node-${AudioModuleType.DelayLine}`]="{ id, type, data }">
        <DelayLineModule
          :id="id"
          :type="type"
          :title="data.title"
          :delay-time="data.delayTime"
        />
      </template>
      <template #[`node-${AudioModuleType.Destination}`]="{ id, type, data }">
        <DestinationModule
          :id="id"
          :type="type"
          :title="data.title"
          :gain="data.gain"
        />
      </template>
      <template #[`node-${AudioModuleType.DynamicsCompressor}`]="{ id, type, data }">
        <DynamicsCompressorModule
          :id="id"
          :type="type"
          :title="data.title"
          :threshold="data.threshold"
          :knee="data.knee"
          :ratio="data.ratio"
          :attack="data.attack"
          :release="data.release"
        />
      </template>
      <template #[`node-${AudioModuleType.EnvelopeTracker}`]="{ id, type, data }">
        <EnvelopeTrackerModule
          :id="id"
          :type="type"
          :title="data.title"
          :sensitivity="data.sensitivity"
          :threshold="data.threshold"
        />
      </template>
      <template #[`node-${AudioModuleType.Gain}`]="{ id, type, data }">
        <GainModule
          :id="id"
          :type="type"
          :title="data.title"
          :gain="data.gain"
          :gain-enabled="data.gainEnabled"
        />
      </template>
      <template #[`node-${AudioModuleType.Graindr}`]="{ id, type, data }">
        <GraindrModule
          :id="id"
          :type="type"
          :title="data.title"
          :dry-wet-mix="data.dryWetMix"
          :grain-size-ms="data.grainSizeMs"
          :pitch-shift="data.pitchShift"
          :fine-tune="data.fineTune"
          :texture="data.texture"
          :stretch="data.stretch"
          :shimmer="data.shimmer"
          :feedback="data.feedback"
          :hicut="data.hicut"
          :playback-direction="data.playbackDirection"
          :tone-type="data.toneType"
        />
      </template>
      <template #[`node-${AudioModuleType.LFO}`]="{ id, type, data }">
        <LFOModule
          :id="id"
          :type="type"
          :title="data.title"
          :frequency="data.frequency"
          :phase="data.phase"
          :polarity="data.polarity"
          :waveform="data.waveform"
        />
      </template>
      <template #[`node-${AudioModuleType.MidiInput}`]="{ id, type, data }">
        <MidiInputModule
          :id="id"
          :type="type"
          :title="data.title"
          :channel="data.channel"
          :device-id="data.deviceId"
          :priority="data.priority"
          :outputs="data.outputs"
          :pitch-bend-range="data.pitchBendRange"
        />
      </template>
      <template #[`node-${AudioModuleType.MultiFilter}`]="{ id, type, data }">
        <MultiFilterModule
          :id="id"
          :type="type"
          :title="data.title"
          :cutoff="data.cutoff"
          :q="data.q"
        />
      </template>
      <template #[`node-${AudioModuleType.Multiplier}`]="{ id, type, data }">
        <MultiplierModule
          :id="id"
          :type="type"
          :title="data.title"
        />
      </template>
      <template #[`node-${AudioModuleType.Noise}`]="{ id, type, data }">
        <NoiseModule
          :id="id"
          :type="type"
          :title="data.title"
          :noise-type="data.noiseType"
        />
      </template>
      <template #[`node-${AudioModuleType.Oscillator}`]="{ id, type, data }">
        <OscillatorModule
          :id="id"
          :type="type"
          :title="data.title"
          :frequency="data.frequency"
          :detune="data.detune"
          :waveform="data.waveform"
          :frequency-enabled="data.frequencyEnabled"
        />
      </template>
      <template #[`node-${AudioModuleType.FMOscillator}`]="{ id, type, data }">
        <FMOscillatorModule
          :id="id"
          :type="type"
          :title="data.title"
          :frequency="data.frequency"
          :pitch-shift="data.pitchShift"
        />
      </template>
      <template #[`node-${AudioModuleType.FMVoice}`]="{ id, type, data }">
        <FMVoiceModule
          :id="id"
          :type="type"
          :title="data.title"
          :algorithm="data.algorithm"
          :op1-pitch-shift="data.op1PitchShift"
          :op2-pitch-shift="data.op2PitchShift"
          :op3-pitch-shift="data.op3PitchShift"
          :op4-pitch-shift="data.op4PitchShift"
          :op5-pitch-shift="data.op5PitchShift"
          :op6-pitch-shift="data.op6PitchShift"
          :op1-fine-tune="data.op1FineTune"
          :op2-fine-tune="data.op2FineTune"
          :op3-fine-tune="data.op3FineTune"
          :op4-fine-tune="data.op4FineTune"
          :op5-fine-tune="data.op5FineTune"
          :op6-fine-tune="data.op6FineTune"
          :op1-level="data.op1Level"
          :op2-level="data.op2Level"
          :op3-level="data.op3Level"
          :op4-level="data.op4Level"
          :op5-level="data.op5Level"
          :op6-level="data.op6Level"
          :op1-attack="data.op1Attack"
          :op2-attack="data.op2Attack"
          :op3-attack="data.op3Attack"
          :op4-attack="data.op4Attack"
          :op5-attack="data.op5Attack"
          :op6-attack="data.op6Attack"
          :op1-decay="data.op1Decay"
          :op2-decay="data.op2Decay"
          :op3-decay="data.op3Decay"
          :op4-decay="data.op4Decay"
          :op5-decay="data.op5Decay"
          :op6-decay="data.op6Decay"
          :op1-sustain="data.op1Sustain"
          :op2-sustain="data.op2Sustain"
          :op3-sustain="data.op3Sustain"
          :op4-sustain="data.op4Sustain"
          :op5-sustain="data.op5Sustain"
          :op6-sustain="data.op6Sustain"
          :op1-release="data.op1Release"
          :op2-release="data.op2Release"
          :op3-release="data.op3Release"
          :op4-release="data.op4Release"
          :op5-release="data.op5Release"
          :op6-release="data.op6Release"
        />
      </template>
      <template #[`node-${AudioModuleType.Oscilloscope}`]="{ id, type, data }">
        <OscilloscopeModule
          :id="id"
          :type="type"
          :title="data.title"
        />
      </template>
      <template #[`node-${AudioModuleType.SpectrumAnalyzer}`]="{ id, type, data }">
        <SpectrumAnalyzerModule
          :id="id"
          :type="type"
          :title="data.title"
          :fft-size="data.fftSize"
        />
      </template>
      <template #[`node-${AudioModuleType.PitchTracker}`]="{ id, type, data }">
        <PitchTrackerModule
          :id="id"
          :type="type"
          :title="data.title"
          :harmonic-threshold="data.harmonicThreshold"
        />
      </template>
      <template #[`node-${AudioModuleType.Sequencer}`]="{ id, type, data }">
        <SequencerModule
          :id="id"
          :type="type"
          :title="data.title"
          :gate-threshold="data.gateThreshold"
          :num-steps="data.numSteps"
          :values="data.values"
        />
      </template>
      <template #[`node-${AudioModuleType.Value}`]="{ id, type, data }">
        <ValueModule
          :id="id"
          :type="type"
          :title="data.title"
          :offset="data.offset"
        />
      </template>
      <template #[`node-${AudioModuleType.KaossPad}`]="{ id, type, data }">
        <KaossPadModule
          :id="id"
          :type="type"
          :title="data.title"
        />
      </template>
      <template #[`node-${AudioModuleType.Waveshaper}`]="{ id, type, data }">
        <WaveshaperModule
          :id="id"
          :type="type"
          :title="data.title"
          :modifier="data.modifier"
          :waveshaper="data.waveshaper"
        />
      </template>
      <Background :class="{ 'bg-slate-900': isDragOver }" />
      <Controls />
    </VueFlow>
  </div>
</template>
