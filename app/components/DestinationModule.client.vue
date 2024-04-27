<script lang="ts" setup>
import { Handle, Position, useVueFlow } from '@vue-flow/core'

export type DestinationModuleProps = {
  id: string
  gain?: number
}
const props = defineProps<DestinationModuleProps>()
const defaultGain = props.gain ?? 1.4013e-10
const gainValue = ref(gain2DB(defaultGain))

const store = useAudioContextStore()

const gainNode = new GainNode(store.audioContext, { gain: defaultGain })
const destinationNode = store.audioContext.destination
gainNode.connect(destinationNode)

const { updateNodeData } = useVueFlow()

watch(gainValue, (value) => {
  gainNode.gain.exponentialRampToValueAtTime(value, store.audioContext.currentTime + 0.05)
  updateNodeData(props.id, { gain: value })
})

store.registerModule(props.id, {
  meta: { id: props.id, type: 'destination' },
  getTarget: (id) => {
    switch (id) {
      case 'input':
        return {
          type: 'audioNode',
          inputIndex: 0,
          node: gainNode,
        }
      case 'gain':
        return {
          type: 'param',
          param: gainNode.gain,
        }
    }
  },
})

onUnmounted(() => {
  gainNode.disconnect()
  destinationNode.disconnect()
  store.unregisterModule(props.id)
})
</script>

<template>
  <div class="flex flex-col gap-2 border p-2">
    <span>DESTINATION</span>
    <div class="nodrag flex gap-1">
      <div class="flex flex-col gap-2">
        <Button
          class="w-5 text-xs"
          icon="pi pi-plus"
          icon-class="!text-xs"
          :disabled="gainValue >= 0"
          @click="gainValue++"
        />
        <Button
          class="w-5 text-xs"
          icon="pi pi-minus"
          icon-class="!text-xs"
          :disabled="gainValue <= -100"
          @click="gainValue--"
        />
      </div>
      <div class="flex flex-col items-center">
        <Knob
          v-model="gainValue"
          :size="40"
          :min="-100"
          :max="0"
          value-template="{value}dB"
        />
        <span class="text-xs">Gain</span>
      </div>
    </div>
  </div>
  <Handle
    id="input"
    type="target"
    :position="Position.Left"
  />
  <Handle
    id="gain"
    type="target"
    :position="Position.Bottom"
  />
</template>
