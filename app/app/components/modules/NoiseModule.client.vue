<script lang="ts" setup>
import { NoiseType } from '~/utils'

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

const { audioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const noiseGeneratorNode = new NoiseGeneratorWorkletNode(audioContext, { noiseType: props.noiseType })
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
    <ModulePortRow :output="{ id: 'output', label: 'out' }">
      <div class="nodrag flex flex-col gap-2 border border-white/80 rounded-md p-2">
        <Select
          v-model="noiseType"
          class="border h-6 w-full"
          :pt="{
            input: tw`p-1 text-xs`,
          }"
          :options="noiseTypeOptions"
          option-label="label"
          option-value="value"
          placeholder="Type"
        />
      </div>
    </ModulePortRow>
  </BaseModuleShell>
</template>
