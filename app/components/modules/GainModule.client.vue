<script lang="ts" setup>
export type GainModuleProps = {
  id: string
  type: string
  gain?: number
}
const props = defineProps<GainModuleProps>()
const defaultGain = props.gain ?? 0
const gainValue = ref(Math.trunc(gain2DB(defaultGain)))
const minGain = -100
const maxGain = 60

const store = useAudioContextStore()
const gainNode = new GainNode(store.audioContext, { gain: defaultGain })

const { updateNodeData } = useVueFlow()

watch(gainValue, (value) => {
  value = db2Gain(value)
  store.setParamValue(gainNode.gain, value, 'exp')
  updateNodeData<GainModuleProps>(props.id, { gain: value })
})

store.registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        gainNode.connect(target, 0)
        return
      }
      gainNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        gainNode.disconnect(target, 0)
        return
      }
      gainNode.disconnect(target, 0, targetIndex)
    },
  },
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
  store.unregisterModule(props.id)
})
</script>

<template>
  <div class="flex flex-col gap-2 border px-1 py-2">
    <span class="text-sm pl-1">Gain</span>
    <div class="flex gap-2">
      <div class="flex flex-col gap-4">
        <HandleLabel>in</HandleLabel>
        <Handle
          id="input"
          class="!top-10"
          type="target"
          :position="Position.Left"
        />
        <HandleLabel>gain</HandleLabel>
        <Handle
          id="gain"
          class="!top-16"
          type="target"
          :position="Position.Left"
        />
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
