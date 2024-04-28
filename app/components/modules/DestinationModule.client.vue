<script lang="ts" setup>
export type DestinationModuleProps = {
  id: string
  type: string
  gain?: number
}
const props = defineProps<DestinationModuleProps>()
const defaultGain = props.gain ?? 1.4013e-10
const gainValue = ref(Math.trunc(gain2DB(defaultGain)))
const minGain = -100
const maxGain = 0

const store = useAudioContextStore()

const gainNode = new GainNode(store.audioContext, { gain: defaultGain })
const destinationNode = store.audioContext.destination
gainNode.connect(destinationNode)

const { updateNodeData } = useVueFlow()

watch(gainValue, (value) => {
  value = db2Gain(value)
  store.setParamValue(gainNode.gain, value, 'exp')
  updateNodeData<DestinationModuleProps>(props.id, { gain: value })
})

store.registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  getTarget: (id) => {
    switch (id) {
      case 'input':
        return {
          type: 'audioNode',
          inputIndex: 0,
          node: gainNode,
        }
      // case 'gain':
      //   return {
      //     type: 'param',
      //     param: gainNode.gain,
      //   }
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
  <div class="flex flex-col gap-2 border pl-1 pr-2 py-2">
    <span class="text-sm pl-1">Destination</span>
    <div class="flex gap-4">
      <div class="flex flex-col">
        <HandleLabel class="pt-5">
          in
        </HandleLabel>
        <Handle
          id="input"
          type="target"
          :position="Position.Left"
        />
        <!-- <HandleLabel>gain</HandleLabel>
        <Handle
          id="gain"
          class="!top-16"
          type="target"
          :position="Position.Left"
        /> -->
      </div>
      <div class="nodrag flex gap-1 border border-slate-500 rounded-md p-2">
        <div class="flex flex-col gap-2">
          <Button
            class="w-5 text-xs"
            icon="pi pi-plus"
            icon-class="!text-xs"
            :disabled="gainValue >= maxGain"
            @click="gainValue++"
          />
          <Button
            class="w-5 text-xs"
            icon="pi pi-minus"
            icon-class="!text-xs"
            :disabled="gainValue <= minGain"
            @click="gainValue--"
          />
        </div>
        <div class="flex flex-col items-center">
          <Knob
            v-model="gainValue"
            :size="40"
            :min="minGain"
            :max="maxGain"
            value-template="{value}dB"
          />
          <span class="text-xs">Gain</span>
        </div>
      </div>
    </div>
  </div>
</template>
