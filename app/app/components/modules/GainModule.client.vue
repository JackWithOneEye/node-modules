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
const gainNode = new GainNode(store.audioContext, { gain: props.gainEnabled ? props.gain : 1.4013e-10 })

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
    :title="title"
  >
    <div class="flex gap-2">
      <ModulePortRail
        position="left"
        :ports="[
          { id: 'input', label: 'in' },
          { id: 'gain', label: 'gain' },
        ]"
      />
      <div class="nodrag flex gap-1 border border-white/80 rounded-md p-2">
        <div class="flex flex-col gap-2">
          <Button class="w-5 text-xs" icon="pi pi-plus" icon-class="!text-xs" :disabled="gain >= maxGain" @click="gain++" />
          <Button class="w-5 text-xs" icon="pi pi-minus" icon-class="!text-xs" :disabled="gain <= minGain" @click="gain--" />
        </div>
        <div class="flex flex-col items-center">
          <Knob v-model="gain" :disabled="!gainEnabled" :size="40" :min="minGain" :max="maxGain" :value-template="(value) => `${value}dB`" />
          <ToggleSwitch v-model="gainEnabled" :binary="true" />
        </div>
      </div>
      <ModulePortRail
        position="right"
        :ports="[{ id: 'output', label: 'out' }]"
      />
    </div>
  </BaseModuleShell>
</template>
