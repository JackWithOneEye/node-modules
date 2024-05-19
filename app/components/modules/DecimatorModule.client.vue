<script lang="ts" setup>
import { Handle } from '@vue-flow/core'

export type DecimatorModuleProps = {
  id: string
  type: string
  title: string
  reduction?: number
  stereoShift?: number
}
const props = withDefaults(defineProps<DecimatorModuleProps>(), {
  title: 'Decimator',
  reduction: 1,
  stereoShift: 0,
})

const { audioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const decimatorNode = new DecimatorWorkletNode(audioContext, { reduction: props.reduction, stereoShift: props.stereoShift })

const sampleRate = audioContext.sampleRate
const orderSteps = 20
const maxReductionSliderVal = 100
const reductionScalingFactor = 4
const reductionScaleLUT: number[] = []
for (let i = 0; i <= maxReductionSliderVal; i++) {
  reductionScaleLUT.push(
    sampleRate / Math.pow(reductionScalingFactor, (maxReductionSliderVal - i) / orderSteps),
  )
}

const [scaledReduction, actualReduction] = useAudioParam('reduction', props.reduction, value => setParamValue(decimatorNode.reduction, value), {
  toActual: scaled => reductionScaleLUT[scaled] / sampleRate,
  toScaled: actual => Math.round(
    maxReductionSliderVal + (Math.log(actual) / Math.log(reductionScalingFactor)) * orderSteps,
  ),
})
const reductionLabel = computed(() => `${(actualReduction.value * sampleRate * 0.001).toFixed(1)}kHz`)

const [stereoShift] = useAudioParam('stereoShift', props.stereoShift, value => setParamValue(decimatorNode.stereoShift, value))

registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        decimatorNode.connect(target, 0)
        return
      }
      decimatorNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        decimatorNode.disconnect(target, 0)
        return
      }
      decimatorNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', node: decimatorNode, inputIndex: 0 },
    reduction: { type: 'param', param: decimatorNode.reduction },
    stereoShift: { type: 'param', param: decimatorNode.stereoShift },
  },
  onSuspend: () => {
    decimatorNode.reset()
  },
})

onUnmounted(() => {
  decimatorNode.destroy()
  unregisterModule(props.id)
})
</script>

<template>
  <ModuleToolbar />
  <div class="flex flex-col gap-2 border px-1 py-2">
    <span class="text-sm pl-1">{{ title }}</span>
    <div class="flex gap-2">
      <div class="flex flex-col gap-4">
        <HandleLabel>in</HandleLabel>
        <Handle
          id="input"
          class="!top-10"
          type="target"
          :position="Position.Left"
        />
        <HandleLabel>rdctn</HandleLabel>
        <Handle
          id="reduction"
          class="!top-16"
          type="target"
          :position="Position.Left"
        />
      </div>
      <div class="nodrag flex gap-1 border border-white/80 rounded-md p-2">
        <div class="flex flex-col items-center">
          <Knob
            v-model="scaledReduction"
            :size="40"
            :min="0"
            :max="maxReductionSliderVal"
            :value-template="reductionLabel"
          />
          <span class="text-handle">Reduction</span>
        </div>
        <div class="flex flex-col items-center">
          <Knob
            v-model="stereoShift"
            :size="40"
            :min="0"
            :max="1"
            :step="0.1"
            :value-template="`${stereoShift.toFixed(1)}`"
          />
          <span class="text-handle">Shift</span>
        </div>
      </div>
      <div class="flex flex-col">
        <HandleLabel class="pt-3">
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
