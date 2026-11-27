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
const gainNode = new GainNode(store.getAudioContext(), { gain: props.gainEnabled ? props.gain : MIN_GAIN })

const gainEnabled = ref(props.gainEnabled)
// while disabled the knob only changes the level that enabling restores
const gain = useGainParam('gain', props.gain, (value) => {
  if (gainEnabled.value) {
    store.setParamValue(gainNode.gain, value, 'exp')
  }
})
const minGain = -100
const maxGain = 60

const { updateNodeData } = useVueFlow()

watch(gainEnabled, (curr, prev) => {
  if (!curr && prev) {
    store.setParamValue(gainNode.gain, MIN_GAIN, 'lin')
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
    <div class="flex">
      <ModulePortRail
        position="left"
        :ports="[
          { id: 'input', label: 'in', signal: 'audio' },
        ]"
      />
      <div class="nodrag flex gap-1">
        <WithHandle
          handle-id="gain"
          handle-signal="cv"
        >
          <KnobInput
            v-model="gain"
            label="gain"
            :disabled="!gainEnabled"
            :min="minGain"
            :max="maxGain"
            :format-fn="(v) => v + 'dB'"
          />
        </WithHandle>
        <!-- vertical on/off switch (on = up), centred on the knob dial -->
        <div class="flex h-9 w-4.5 items-center justify-center">
          <USwitch
            v-model="gainEnabled"
            size="sm"
            class="-rotate-90"
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
