<script lang="ts" setup>
import { Handle } from '@vue-flow/core'

export type MultiplierModuleProps = {
  id: string
  type: string
  title: string
}
const props = withDefaults(defineProps<MultiplierModuleProps>(), {
  title: 'Multiplier',
})
const store = useAudioContextStore()
const multiplierNode = new MultiplierWorkletNode(store.audioContext)

store.registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        multiplierNode.connect(target, 0)
        return
      }
      multiplierNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        multiplierNode.disconnect(target, 0)
        return
      }
      multiplierNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input1: { type: 'audioNode', node: multiplierNode, inputIndex: 0 },
    input2: { type: 'audioNode', node: multiplierNode, inputIndex: 1 },
  },
})

onUnmounted(() => {
  multiplierNode.destroy()
  store.unregisterModule(props.id)
})
</script>

<template>
  <ModuleToolbar />
  <div class="flex flex-col gap-2 border px-1 py-2">
    <span class="text-sm px-2">{{ title }}</span>
    <div class="flex gap-2">
      <div class="flex flex-col flex-1 gap-4">
        <HandleLabel class="pt-0">
          in1
        </HandleLabel>
        <Handle
          id="input1"
          type="target"
          :position="Position.Left"
        />
        <HandleLabel>
          in2
        </HandleLabel>
        <Handle
          id="input2"
          class="!top-16"
          type="target"
          :position="Position.Left"
        />
      </div>
      <div class="flex flex-1 justify-end">
        <HandleLabel>
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
