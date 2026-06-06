<script lang="ts" setup>
export type DestinationModuleProps = {
  id: string
  type: string
  title?: string
  gain?: number
  muted?: boolean
}
const props = withDefaults(defineProps<DestinationModuleProps>(), {
  title: 'Destination',
  gain: MIN_GAIN,
  muted: false,
})

const store = useAudioContextStore()
const audioContext = store.getAudioContext()
const gainNode = new GainNode(audioContext, { gain: props.muted ? MIN_GAIN : props.gain })
const destinationNode = audioContext.destination
gainNode.connect(destinationNode)

const gain = useGainParam('gain', props.gain, value => store.setParamValue(gainNode.gain, value, 'exp'))
const muted = ref(props.muted)
const minGain = -100
const maxGain = 0

function toggleMute() {
  muted.value = !muted.value
}

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

const { updateNodeData } = useVueFlow()
watch(muted, (curr, prev) => {
  if (curr && !prev) {
    store.setParamValue(gainNode.gain, MIN_GAIN, 'lin')
  }
  else if (!curr && prev) {
    store.setParamValue(gainNode.gain, dB2Gain(gain.value), 'exp')
  }
  updateNodeData<DestinationModuleProps>(props.id, { muted: curr })
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
      <div class="flex items-center gap-1">
        <KnobInput
          v-model="gain"
          label="Gain"
          :min="minGain"
          :max="maxGain"
          :disabled="muted"
          unit="dB"
        />
        <UButton
          class="font-mono"
          :color="muted ? 'error' : 'neutral'"
          size="xs"
          variant="soft"
          @click="toggleMute"
        >
          <span class="w-10">{{ muted ? 'muted' : 'mute' }}</span>
        </UButton>
      </div>
    </ModulePortRow>
  </BaseModuleShell>
</template>
