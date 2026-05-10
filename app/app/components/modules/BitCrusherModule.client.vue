<script lang="ts" setup>

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
  <BaseModuleShell
    :id="id"
    :type="type"
    :title="title"
  >
    <div class="flex gap-2">
      <ModulePortRail
        position="left"
        :ports="[
          { id: 'input', label: 'in' },
          { id: 'bits', label: 'bits' },
        ]"
      />
      <div class="nodrag flex gap-1 border border-white/80 rounded-md p-2">
        <div class="flex flex-col items-center">
          <Knob v-model="scaledBits" :size="40" :min="0" :max="maxBitSliderVal" :value-template="() => `${actualBits.toFixed()} bits`" />
        </div>
      </div>
      <ModulePortRail
        position="right"
        :ports="[{ id: 'output', label: 'out' }]"
      />
    </div>
  </BaseModuleShell>
</template>
