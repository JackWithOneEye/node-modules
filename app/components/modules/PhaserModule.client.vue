<script lang="ts" setup>
import { Handle } from '@vue-flow/core'

export type PhaserModuleProps = {
  id: string
  type: string
  title?: string
  rate?: number
}
const props = withDefaults(defineProps<PhaserModuleProps>(), {
  title: 'Phaser',
  rate: 0.5,
})

const { audioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const phaserNode = new PhaserWorkletNode(audioContext, { rate: props.rate })

const [rate] = useAudioParam('rate', props.rate, value => setParamValue(phaserNode.rate, value))

registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        phaserNode.connect(target, 0)
        return
      }
      phaserNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        phaserNode.disconnect(target, 0)
        return
      }
      phaserNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', node: phaserNode, inputIndex: 0 },
    rate: { type: 'param', param: phaserNode.rate },
  },
  onSuspend: () => {
    phaserNode.reset()
  },
})

onUnmounted(() => {
  phaserNode.destroy()
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
        <HandleLabel>rate</HandleLabel>
        <Handle
          id="rate"
          class="!top-16"
          type="target"
          :position="Position.Left"
        />
      </div>
      <div class="nodrag flex gap-1 border border-white/80 rounded-md p-2">
        <div class="flex flex-col items-center">
          <Knob
            v-model="rate"
            :size="60"
            :min="0.1"
            :max="20"
            :step="0.1"
            :value-template="() => `${rate.toFixed(1)}Hz`"
          />
          <span class="text-handle">Rate</span>
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
