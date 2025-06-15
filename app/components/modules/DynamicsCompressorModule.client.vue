<script lang="ts" setup>
import { Handle } from '@vue-flow/core'

export type DynamicsCompressorModuleProps = {
  id: string
  type: string
  title?: string
  threshold?: number // dB (-100 to 0)
  knee?: number // dB (0 to 40)
  ratio?: number // ratio (1 to 20)
  attack?: number // seconds (0 to 1)
  release?: number // seconds (0 to 1)
}

const props = withDefaults(defineProps<DynamicsCompressorModuleProps>(), {
  title: 'Compressor',
  threshold: -24,
  knee: 30,
  ratio: 12,
  attack: 0.003,
  release: 0.25,
})

const store = useAudioContextStore()
const compressorNode = new DynamicsCompressorNode(store.audioContext, {
  threshold: props.threshold,
  knee: props.knee,
  ratio: props.ratio,
  attack: props.attack,
  release: props.release,
})

const [threshold] = useAudioParam('threshold', props.threshold, value => store.setParamValue(compressorNode.threshold, value, 'lin'))
const [knee] = useAudioParam('knee', props.knee, value => store.setParamValue(compressorNode.knee, value, 'lin'))
const [ratio] = useAudioParam('ratio', props.ratio, value => store.setParamValue(compressorNode.ratio, value, 'lin'))
const [attack] = useAudioParam('attack', props.attack, value => store.setParamValue(compressorNode.attack, value, 'lin'))
const [release] = useAudioParam('release', props.release, value => store.setParamValue(compressorNode.release, value, 'lin'))

// Read-only reduction meter
const reduction = ref(0)
let animationFrame: number

function updateReduction() {
  reduction.value = compressorNode.reduction
  animationFrame = requestAnimationFrame(updateReduction)
}

onMounted(() => {
  updateReduction()
})

store.registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        compressorNode.connect(target, 0)
        return
      }
      compressorNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        compressorNode.disconnect(target, 0)
        return
      }
      compressorNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', inputIndex: 0, node: compressorNode },
    threshold: { type: 'param', param: compressorNode.threshold },
    knee: { type: 'param', param: compressorNode.knee },
    ratio: { type: 'param', param: compressorNode.ratio },
    attack: { type: 'param', param: compressorNode.attack },
    release: { type: 'param', param: compressorNode.release },
  },
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrame)
  compressorNode.disconnect()
  store.unregisterModule(props.id)
})
</script>

<template>
  <ModuleToolbar />
  <div class="flex flex-col gap-2 border px-1 py-2">
    <span class="text-sm pl-1">{{ title }}</span>
    <div class="flex gap-2">
      <div class="flex flex-col gap-4">
        <HandleBar :handles="[
          { id: 'input', label: 'in', type: 'target' as const },
          { id: 'threshold', label: 'thresh', type: 'target' as const },
          { id: 'knee', label: 'knee', type: 'target' as const },
          { id: 'ratio', label: 'ratio', type: 'target' as const },
          { id: 'attack', label: 'atk', type: 'target' as const },
          { id: 'release', label: 'rel', type: 'target' as const },
        ]" position="left" />
      </div>
      <div class="nodrag flex gap-1 border border-white/80 rounded-md p-3">
        <div class="flex flex-col gap-1">
          <div class="flex flex-col items-center">
            <Knob v-model="threshold" :size="40" :min="-100" :max="0" :value-template="(value) => `${value}dB`" />
            <span class="text-xs">Threshold</span>
          </div>
          <div class="flex flex-col items-center">
            <Knob v-model="knee" :size="40" :min="0" :max="40" :value-template="(value) => `${value}dB`" />
            <span class="text-xs">Knee</span>
          </div>
          <div class="flex flex-col items-center">
            <Knob v-model="ratio" :size="40" :min="1" :max="20" :value-template="(value) => `${value}:1`" />
            <span class="text-xs">Ratio</span>
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <div class="flex flex-col items-center">
            <Knob v-model="attack" :size="40" :min="0" :max="1" :step="0.001"
              :value-template="(value) => `${(value * 1000).toFixed(1)}ms`" />
            <span class="text-xs">Attack</span>
          </div>
          <div class="flex flex-col items-center">
            <Knob v-model="release" :size="40" :min="0" :max="1" :step="0.01"
              :value-template="(value) => `${(value * 1000).toFixed(0)}ms`" />
            <span class="text-xs">Release</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="w-10 h-10 border border-gray-400 rounded-full flex items-center justify-center bg-gray-900">
              <span class="text-xs text-green-400 font-mono">{{ reduction.toFixed(1) }}</span>
            </div>
            <span class="text-xs">Reduction (dB)</span>
          </div>
        </div>
      </div>
      <div class="flex flex-col">
        <HandleLabel class="pt-[5.25rem]">
          out
        </HandleLabel>
        <Handle id="output" type="source" :position="Position.Right" />
      </div>
    </div>
  </div>
</template>
