<script lang="ts" setup>
export type DecimatorModuleProps = {
  id: string
  type: string
  title?: string
  reduction?: number
  stereoShift?: number
}
const props = withDefaults(defineProps<DecimatorModuleProps>(), {
  title: 'Decimator',
  reduction: 1,
  stereoShift: 0,
})

const { getAudioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const audioContext = getAudioContext()
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
  toActual: scaled => reductionScaleLUT[scaled]! / sampleRate,
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
          { id: 'reduction', label: 'rdctn', signal: 'cv' },
        ]"
      />
      <div class="nodrag flex gap-1 border border-white/80 rounded-md p-2">
        <div class="flex flex-col items-center">
          <Knob
            v-model="scaledReduction"
            :size="40"
            :min="0"
            :max="maxReductionSliderVal"
            :value-template="() => reductionLabel"
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
            :value-template="() => `${stereoShift.toFixed(1)}`"
          />
          <span class="text-handle">Shift</span>
        </div>
      </div>
      <ModulePortRail
        position="right"
        :ports="[{ id: 'output', label: 'out', signal: 'audio' }]"
      />
    </div>
  </BaseModuleShell>
</template>
