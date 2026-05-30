<script lang="ts" setup>
export type NoiseModuleProps = {
  id: string
  type: string
  title?: string
  noiseType?: NoiseType
}
const props = withDefaults(defineProps<NoiseModuleProps>(), {
  title: 'Noise',
  noiseType: NoiseType.White,
})

const { getAudioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const noiseGeneratorNode = new NoiseGeneratorWorkletNode(getAudioContext(), { noiseType: props.noiseType })
const noiseType = useOptionParam('noiseType', props.noiseType, value => setParamValue(noiseGeneratorNode.noiseType, value))
const noiseTypeOptions = [
  { label: 'White', value: NoiseType.White },
  { label: 'Brownian', value: NoiseType.Brownian },
]

registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        noiseGeneratorNode.connect(target, 0)
        return
      }
      noiseGeneratorNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        noiseGeneratorNode.disconnect(target, 0)
        return
      }
      noiseGeneratorNode.disconnect(target, 0, targetIndex)
    },
  },
  onSuspend: () => {
    noiseGeneratorNode.reset()
  },
})

onUnmounted(() => {
  noiseGeneratorNode.destroy()
  unregisterModule(props.id)
})
</script>

<template>
  <BaseModuleShell
    :id="id"
    :type="type"
    :title="props.title"
  >
    <ModulePortRow :output="{ id: 'output', label: 'out', signal: 'audio' }">
      <div class="nodrag flex flex-col gap-2 border border-white/80 rounded-md p-2">
        <USelect
          v-model="noiseType"
          :items="noiseTypeOptions"
          label-key="label"
          value-key="value"
          placeholder="Type"
          class="w-full text-xs"
          size="sm"
        />
      </div>
    </ModulePortRow>
  </BaseModuleShell>
</template>
