<script lang="ts" setup>
import { Handle } from '@vue-flow/core'
import { Direction, ToneType } from '~/utils'

export type GraindrModuleProps = {
  id: string
  type: string
  title: string
  dryWetMix?: number
  grainSizeMs?: number
  pitchShift?: number
  fineTune?: number
  texture?: number
  stretch?: number
  shimmer?: number
  feedback?: number
  hicut?: number
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
  hicut: 22000.0,
  playbackDirection: Direction.Forward,
  toneType: ToneType.Digital,
})

const { id, title, type, ...paramProps } = props
const { audioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const graindrNode = new GraindrWorkletNode(audioContext, { ...paramProps })

const pctConv = {
  toActual: (scaled: number) => scaled * 0.01,
  toScaled: (actual: number) => actual * 100,
}
const [dryWetMix] = useAudioParam('dryWetMix', props.dryWetMix, value => setParamValue(graindrNode.dryWetMix, value), pctConv)
const [grainSizeMs] = useAudioParam('grainSizeMs', props.grainSizeMs, value => setParamValue(graindrNode.grainSizeMs, value, 'exp', 0.5))
const [pitchShift] = useAudioParam('pitchShift', props.pitchShift, value => setParamValue(graindrNode.pitchShift, value))
const [fineTune] = useAudioParam('fineTune', props.fineTune, value => setParamValue(graindrNode.fineTune, value, 'lin'))
const [texture] = useAudioParam('texture', props.texture, value => setParamValue(graindrNode.texture, value, 'lin'), pctConv)
const [stretch] = useAudioParam('stretch', props.stretch, value => setParamValue(graindrNode.stretch, value))
const [shimmer] = useAudioParam('shimmer', props.shimmer, value => setParamValue(graindrNode.shimmer, value, 'lin'), pctConv)
const [feedback] = useAudioParam('feedback', props.feedback, value => setParamValue(graindrNode.feedback, value, 'lin'), pctConv)
const { scaled: hicutScaled, hz: hicutHz, controlRange: hicutControlRange } = useFrequencyParam('hicut', props.hicut, 20, 10, value => setParamValue(graindrNode.hiCut, value))
const playbackDirection = useOptionParam('playbackDirection', props.playbackDirection, value => setParamValue(graindrNode.playbackDirection, value))
const playbackOptions = [
  { label: 'Forward', value: Direction.Forward },
  { label: 'Reverse', value: Direction.Reverse },
  { label: 'Alternate', value: Direction.Alternate },
]
const toneType = useOptionParam('toneType', props.toneType, value => setParamValue(graindrNode.toneType, value))
const toneTypeOptions = [
  { label: 'Digital', value: ToneType.Digital },
  { label: 'Tape-ish', value: ToneType.Tape },
]

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
    hicut: { type: 'param', param: graindrNode.hiCut },
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
  <ModuleToolbar />
  <div class="flex flex-col gap-2 border px-1 py-2">
    <span class="text-sm pl-1">{{ title }}</span>
    <div class="flex gap-2">
      <div class="flex flex-col gap-4">
        <HandleBar
          :handles="[
            { id: 'input', label: 'in', type: 'target' as const },
            { id: 'dryWetMix', label: 'mix', type: 'target' as const },
            { id: 'grainSizeMs', label: 'size', type: 'target' as const },
            { id: 'fineTune', label: 'fine', type: 'target' as const },
            { id: 'texture', label: 'txt', type: 'target' as const },
            { id: 'shimmer', label: 'shim', type: 'target' as const },
            { id: 'feedback', label: 'fdbk', type: 'target' as const },
          ]"
          position="left"
        />
      </div>
      <div class="nodrag flex flex-col gap-2 border border-white/80 rounded-md p-2">
        <div class="flex gap-1">
          <div class="flex flex-col items-center">
            <Knob
              v-model="dryWetMix"
              :size="40"
              :min="0"
              :max="100"
              :value-template="(value) => `${value}%`"
            />
            <span class="text-handle">Mix</span>
          </div>
          <div class="flex flex-col items-center">
            <Knob
              v-model="grainSizeMs"
              :size="40"
              :min="1"
              :max="1000"
              :value-template="(value) => `${value}ms`"
            />
            <span class="text-handle">Grain Size</span>
          </div>
          <div class="flex flex-col items-center">
            <Knob
              v-model="pitchShift"
              :size="40"
              :min="-12"
              :max="12"
            />
            <span class="text-handle">Pitch Shift</span>
          </div>
          <div class="flex flex-col items-center">
            <Knob
              v-model="fineTune"
              :size="40"
              :min="-100"
              :max="100"
            />
            <span class="text-handle">Fine Tune</span>
          </div>
        </div>
        <div class="flex gap-1">
          <div class="flex flex-col items-center">
            <Knob
              v-model="texture"
              :size="40"
              :min="0"
              :max="100"
            />
            <span class="text-handle">Texture</span>
          </div>
          <div class="flex flex-col items-center">
            <Knob
              v-model="stretch"
              :size="40"
              :min="1"
              :max="4"
            />
            <span class="text-handle">Stretch</span>
          </div>
          <div class="flex flex-col items-center">
            <Knob
              v-model="shimmer"
              :size="40"
              :min="0"
              :max="100"
              :value-template="(value) => `${value}%`"
            />
            <span class="text-handle">Shimmer</span>
          </div>
          <div class="flex flex-col items-center">
            <Knob
              v-model="feedback"
              :size="40"
              :min="0"
              :max="100"
              :value-template="(value) => `${value}%`"
            />
            <span class="text-handle">Feedback</span>
          </div>
        </div>
        <div class="flex gap-1 justify-between">
          <div class="flex flex-col items-center">
            <Knob
              v-model="hicutScaled"
              :size="40"
              :min="0"
              :max="hicutControlRange"
              :value-template="() => `${(hicutHz * 0.001).toFixed(1)}kHz`"
            />
            <span class="text-handle">Hi Cut</span>
          </div>
          <div class="flex flex-col gap-1">
            <Dropdown
              v-model="playbackDirection"
              class="border h-6 w-full"
              :pt="{
                input: tw`p-1 text-xs`,
              }"
              :options="playbackOptions"
              option-label="label"
              option-value="value"
              placeholder="Playback direction"
            />
            <Dropdown
              v-model="toneType"
              class="border h-6 w-full"
              :pt="{
                input: tw`p-1 text-xs`,
              }"
              :options="toneTypeOptions"
              option-label="label"
              option-value="value"
              placeholder="Tone"
            />
          </div>
        </div>
      </div>
      <div class="flex flex-col">
        <HandleLabel class="pt-[4.5rem]">
          out
        </HandleLabel>
        <Handle
          id="output"
          type="source"
          :position="Position.Right"
        />
      </div>
    </div>
  </div>
</template>
