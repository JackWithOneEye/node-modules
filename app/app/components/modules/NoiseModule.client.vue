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
const noiseTypeOptLabels = {
  [NoiseType.White]: 'white',
  [NoiseType.Brownian]: 'brownian',
} as const

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
      <KnobInput
        v-model="noiseType"
        label="type"
        :min="NoiseType.White"
        :max="NoiseType.Brownian"
        :format-fn="(v) => noiseTypeOptLabels[v as NoiseType]"
      />
    </ModulePortRow>
  </BaseModuleShell>
</template>
