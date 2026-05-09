<script lang="ts" setup>
import { Handle } from '@vue-flow/core'

export type BitCrusherModuleProps = {
  id: string
  type: string
  title?: string
  bits?: number
}
const props = withDefaults(defineProps<BitCrusherModuleProps>(), {
  title: 'Bit Crusher',
  bits: 32,
})

const { audioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const bitCrusherNode = new BitCrusherWorkletNode(audioContext, { bits: props.bits })

const maxBitsOrder = Math.log2(32)
const orderSteps = 20
const maxBitSliderVal = (maxBitsOrder - 1) * orderSteps
const bitsScaleLUT: number[] = []
for (let i = 0; i <= maxBitSliderVal; i++) {
  bitsScaleLUT.push(Math.pow(2, i / orderSteps + 1))
}

const [scaledBits, actualBits] = useAudioParam('bits', props.bits, value => setParamValue(bitCrusherNode.bits, value), {
  toActual: scaled => bitsScaleLUT[scaled],
  toScaled: actual => Math.round((Math.log2(actual) - 1) * orderSteps),
})

registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        bitCrusherNode.connect(target, 0)
        return
      }
      bitCrusherNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        bitCrusherNode.disconnect(target, 0)
        return
      }
      bitCrusherNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', node: bitCrusherNode, inputIndex: 0 },
    bits: { type: 'param', param: bitCrusherNode.bits },
  },
  onSuspend: () => {
    bitCrusherNode.reset()
  },
})

onUnmounted(() => {
  bitCrusherNode.destroy()
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
        <HandleLabel>bits</HandleLabel>
        <Handle
          id="bits"
          class="!top-16"
          type="target"
          :position="Position.Left"
        />
      </div>
      <div class="nodrag flex gap-1 border border-white/80 rounded-md p-2">
        <div class="flex flex-col items-center">
          <Knob
            v-model="scaledBits"
            :size="40"
            :min="0"
            :max="maxBitSliderVal"
            :value-template="() => `${actualBits.toFixed()} bits`"
          />
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
