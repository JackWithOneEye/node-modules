<script lang="ts" setup>
export type DestinationModuleProps = {
  id: string
  type: string
  title?: string
  gain?: number
}
const props = withDefaults(defineProps<DestinationModuleProps>(), {
  title: 'Destination',
  gain: 1.4013e-10,
})

const store = useAudioContextStore()
const gainNode = new GainNode(store.audioContext, { gain: props.gain })
const destinationNode = store.audioContext.destination
gainNode.connect(destinationNode)

const gain = useGainParam('gain', props.gain, value => store.setParamValue(gainNode.gain, value, 'exp'))
const minGain = -100
const maxGain = 0

store.registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  getTarget: {
    input: {
      type: 'audioNode',
      inputIndex: 0,
      node: gainNode,
    },
  },
})

onUnmounted(() => {
  gainNode.disconnect()
  destinationNode.disconnect()
  store.unregisterModule(props.id)
})
</script>

<template>
  <BaseModuleShell
    :id="id"
    :type="type"
    :title="props.title"
  >
    <ModulePortRow :input="{ id: 'input', label: 'in' }">
      <div class="nodrag flex gap-1 border border-slate-500 rounded-md p-2">
        <div class="flex flex-col gap-2">
          <Button
            class="w-5 text-xs"
            icon="pi pi-plus"
            icon-class="!text-xs"
            :disabled="gain >= maxGain"
            @click="gain++"
          />
          <Button
            class="w-5 text-xs"
            icon="pi pi-minus"
            icon-class="!text-xs"
            :disabled="gain <= minGain"
            @click="gain--"
          />
        </div>
        <div class="flex flex-col items-center">
          <Knob
            v-model="gain"
            :size="40"
            :min="minGain"
            :max="maxGain"
            :value-template="(value) => `${value}dB`"
          />
          <span class="text-xs">Gain</span>
        </div>
      </div>
    </ModulePortRow>
  </BaseModuleShell>
</template>
