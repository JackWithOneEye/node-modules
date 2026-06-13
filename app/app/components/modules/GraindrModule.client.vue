<script lang="ts" setup>
export type GraindrModuleProps = {
  id: string
  type: string
  title?: string
  dryWetMix?: number
  grainSizeMs?: number
  pitchShift?: number
  fineTune?: number
  texture?: number
  stretch?: number
  shimmer?: number
  feedback?: number
  hiCut?: number
  playbackDirection?: Direction
  toneType?: ToneType
}

const props = withDefaults(defineProps<GraindrModuleProps>(), {
  title: 'Graindr',
  dryWetMix: 0.0,
  grainSizeMs: 50.0,
  pitchShift: 0,
  fineTune: 0,
  texture: 0.5,
  stretch: 1,
  shimmer: 0,
  feedback: 0,
  hiCut: 22000.0,
  playbackDirection: Direction.Forward,
  toneType: ToneType.Digital,
})

const { id, title, type, ...paramProps } = props
const { getAudioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const graindrNode = new GraindrWorkletNode(getAudioContext(), { ...paramProps })

const pctConv = linearConverter(100)
const [dryWetMix] = useAudioParam('dryWetMix', props.dryWetMix, value => setParamValue(graindrNode.dryWetMix, value), pctConv)
const [grainSizeMs] = useAudioParam('grainSizeMs', props.grainSizeMs, value => setParamValue(graindrNode.grainSizeMs, value, 'exp', 0.5))
const [pitchShift] = useAudioParam('pitchShift', props.pitchShift, value => setParamValue(graindrNode.pitchShift, value))
const [fineTune] = useAudioParam('fineTune', props.fineTune, value => setParamValue(graindrNode.fineTune, value, 'lin'))
const [texture] = useAudioParam('texture', props.texture, value => setParamValue(graindrNode.texture, value, 'lin'), pctConv)
const [stretch] = useAudioParam('stretch', props.stretch, value => setParamValue(graindrNode.stretch, value))
const [shimmer] = useAudioParam('shimmer', props.shimmer, value => setParamValue(graindrNode.shimmer, value, 'lin'), pctConv)
const [feedback] = useAudioParam('feedback', props.feedback, value => setParamValue(graindrNode.feedback, value, 'lin'), pctConv)
const { scaled: hiCutScaled, hz: hiCutHz, controlRange: hiCutControlRange } = useFrequencyParam('hiCut', props.hiCut, 20, 10, value => setParamValue(graindrNode.hiCut, value))
const playbackDirection = useOptionParam('playbackDirection', props.playbackDirection, value => setParamValue(graindrNode.playbackDirection, value))
const playbackOptLabels = {
  [Direction.Forward]: 'fwd',
  [Direction.Reverse]: 'rev',
  [Direction.Alternate]: 'alt',
} as const
const toneType = useOptionParam('toneType', props.toneType, value => setParamValue(graindrNode.toneType, value))
const toneOptLabels = {
  [ToneType.Digital]: 'digi',
  [ToneType.Tape]: 'tape',
} as const

registerModule(id, {
  meta: { id, type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        graindrNode.connect(target, 0)
        return
      }
      graindrNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        graindrNode.disconnect(target, 0)
        return
      }
      graindrNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', node: graindrNode, inputIndex: 0 },
    dryWetMix: { type: 'param', param: graindrNode.dryWetMix },
    grainSizeMs: { type: 'param', param: graindrNode.grainSizeMs },
    pitchShift: { type: 'param', param: graindrNode.pitchShift },
    fineTune: { type: 'param', param: graindrNode.fineTune },
    texture: { type: 'param', param: graindrNode.texture },
    stretch: { type: 'param', param: graindrNode.stretch },
    shimmer: { type: 'param', param: graindrNode.shimmer },
    feedback: { type: 'param', param: graindrNode.feedback },
    hiCut: { type: 'param', param: graindrNode.hiCut },
  },
  onSuspend: () => {
    graindrNode.reset()
  },
})

onUnmounted(() => {
  graindrNode.destroy()
  unregisterModule(props.id)
})
</script>

<template>
  <BaseModuleShell
    :id="id"
    :type="type"
    :title="props.title"
  >
    <div class="flex gap-2">
      <ModulePortRail
        position="left"
        :ports="[
          { id: 'input', label: 'in', signal: 'audio' },
          { id: 'dryWetMix', label: 'mix', signal: 'cv' },
          { id: 'grainSizeMs', label: 'size', signal: 'cv' },
          { id: 'fineTune', label: 'fine', signal: 'cv' },
          { id: 'texture', label: 'txt', signal: 'cv' },
          { id: 'shimmer', label: 'shim', signal: 'cv' },
          { id: 'feedback', label: 'fdbk', signal: 'cv' },
        ]"
      />
      <div class="flex">
        <KnobInput
          v-model="dryWetMix"
          label="wet mix"
          :min="0"
          :max="100"
          :format-fn="(v) => v + '%'"
        />
        <KnobInput
          v-model="grainSizeMs"
          label="grain size"
          :min="1"
          :max="1000"
          :format-fn="(v) => v + 'ms'"
        />
        <KnobInput
          v-model="pitchShift"
          label="pitch uhift"
          :min="-12"
          :max="12"
        />
        <KnobInput
          v-model="fineTune"
          label="fine tune"
          :min="-100"
          :max="100"
        />
        <KnobInput
          v-model="texture"
          label="texture"
          :min="0"
          :max="100"
        />
        <KnobInput
          v-model="stretch"
          label="stretch"
          :min="1"
          :max="4"
        />
        <KnobInput
          v-model="shimmer"
          label="shimmer"
          :min="0"
          :max="100"
          :format-fn="(v) => v + '%'"
        />
        <KnobInput
          v-model="feedback"
          label="feedback"
          :min="0"
          :max="100"
          :format-fn="(v) => v + '%'"
        />
        <KnobInput
          v-model="hiCutScaled"
          label="hi cut"
          :min="0"
          :max="hiCutControlRange"
          :format-fn="() => (hiCutHz * 0.001).toFixed(1) + 'kHz'"
        />
        <KnobInput
          v-model="playbackDirection"
          label="playback direction"
          :min="Direction.Forward"
          :max="Direction.Alternate"
          :format-fn="(v) => playbackOptLabels[v as Direction]"
        />
        <KnobInput
          v-model="toneType"
          label="tone type"
          :min="ToneType.Digital"
          :max="ToneType.Tape"
          :format-fn="(v) => toneOptLabels[v as ToneType]"
        />
        <ModulePortRail
          position="right"
          :ports="[{ id: 'output', label: 'out', signal: 'audio' }]"
        />
      </div>
    </div>
  </BaseModuleShell>
</template>
