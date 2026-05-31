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
const audioContext = store.getAudioContext()
const gainNode = new GainNode(audioContext, { gain: props.gain })
const destinationNode = audioContext.destination
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
    <ModulePortRow :input="{ id: 'input', label: 'in', signal: 'audio' }">
      <div class="nodrag flex gap-1 border border-slate-500 rounded-md p-2">
        <div class="flex flex-col gap-2">
          <UButton
            class="w-5 justify-center"
            icon="ph:plus"
            size="xs"
            :disabled="gain >= maxGain"
            @click="gain++"
          />
          <UButton
            class="w-5 justify-center"
            icon="ph:minus"
            size="xs"
            :disabled="gain <= minGain"
            @click="gain--"
          />
        </div>
        <div class="flex flex-col items-center">
          <KnobInput
            v-model="gain"
            :size="40"
            :min="minGain"
            :max="maxGain"
            unit="dB"
          />
          <span class="text-xs">Gain</span>
        </div>
      </div>
    </ModulePortRow>
  </BaseModuleShell>
</template>
