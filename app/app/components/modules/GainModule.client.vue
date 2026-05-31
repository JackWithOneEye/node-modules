<script lang="ts" setup>
export type GainModuleProps = {
  id: string
  type: string
  title?: string
  gain?: number
  gainEnabled?: boolean
}
const props = withDefaults(defineProps<GainModuleProps>(), {
  title: 'Gain',
  gain: 1,
  gainEnabled: true,
})

const store = useAudioContextStore()
const gainNode = new GainNode(store.getAudioContext(), { gain: props.gainEnabled ? props.gain : 1.4013e-10 })

const gain = useGainParam('gain', props.gain, value => store.setParamValue(gainNode.gain, value, 'exp'))
const gainEnabled = ref(props.gainEnabled)
const minGain = -100
const maxGain = 60

const { updateNodeData } = useVueFlow()

watch(gainEnabled, (curr, prev) => {
  if (!curr && prev) {
    store.setParamValue(gainNode.gain, 1.4013e-10, 'lin')
  }
  else if (curr && !prev) {
    store.setParamValue(gainNode.gain, dB2Gain(gain.value), 'exp')
  }
  updateNodeData<GainModuleProps>(props.id, { gainEnabled: curr })
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
  getTarget: {
    input: { type: 'audioNode', inputIndex: 0, node: gainNode },
    gain: { type: 'param', param: gainNode.gain },
  },
})

onUnmounted(() => {
  gainNode.disconnect()
  store.unregisterModule(props.id)
})
</script>

<template>
  <BaseModuleShell
    :id="id"
    :type="type"
    :title="props.title"
  >
    <div class="flex gap-2">
      <ModulePortRail
        position="left"
        :ports="[
          { id: 'input', label: 'in', signal: 'audio' },
          { id: 'gain', label: 'gain', signal: 'cv' },
        ]"
      />
      <div class="nodrag flex gap-1 border border-white/80 rounded-md p-2">
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
            :disabled="!gainEnabled"
            :size="40"
            :min="minGain"
            :max="maxGain"
            :format-fn="(v) => v + 'dB'"
          />
          <USwitch
            v-model="gainEnabled"
            size="sm"
          />
        </div>
      </div>
      <ModulePortRail
        position="right"
        :ports="[{ id: 'output', label: 'out', signal: 'audio' }]"
      />
    </div>
  </BaseModuleShell>
</template>
