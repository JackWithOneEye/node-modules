<script lang="ts" setup>
export type AudioSourceChannel = 'stereo' | 'in1' | 'in2'

export type AudioSourceModuleProps = {
  id: string
  type: string
  title?: string
  channel?: AudioSourceChannel
}
const props = withDefaults(defineProps<AudioSourceModuleProps>(), {
  title: 'Audio Source',
  channel: 'stereo',
})

const store = useAudioContextStore()

const mediaStream = await window.navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,
    autoGainControl: false,
    noiseSuppression: false,
    // @ts-expect-error [no idea why]
    latency: 0,
  },
})

const ctx = store.getAudioContext()
const audioSourceNode = new MediaStreamAudioSourceNode(ctx, { mediaStream })
// up-mixes a mono device to L = R, so every option below works for mono and stereo devices
const stereoNode = new GainNode(ctx, { channelCount: 2, channelCountMode: 'explicit', channelInterpretation: 'speakers' })
const splitter = new ChannelSplitterNode(ctx, { numberOfOutputs: 2 })
const outputNode = new ChannelMergerNode(ctx, { numberOfInputs: 2 })
audioSourceNode.connect(stereoNode).connect(splitter)

// interfaces deliver input 1 on the left and input 2 on the right; a single input is sent to both sides
function routeChannel(channel: AudioSourceChannel) {
  splitter.disconnect()
  const [left, right] = channel === 'stereo' ? [0, 1] : channel === 'in1' ? [0, 0] : [1, 1]
  splitter.connect(outputNode, left, 0)
  splitter.connect(outputNode, right, 1)
}
const channel = useOptionParam('channel', props.channel, routeChannel)
routeChannel(channel.value)
const channelOptions = [
  { label: 'Stereo', value: 'stereo' as const },
  { label: 'Input 1 (L)', value: 'in1' as const },
  { label: 'Input 2 (R)', value: 'in2' as const },
]

store.registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        outputNode.connect(target, 0)
        return
      }
      outputNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        outputNode.disconnect(target, 0)
        return
      }
      outputNode.disconnect(target, 0, targetIndex)
    },
  },
})

onUnmounted(() => {
  audioSourceNode.disconnect()
  stereoNode.disconnect()
  splitter.disconnect()
  outputNode.disconnect()
  store.unregisterModule(props.id)
})
</script>

<template>
  <BaseModuleShell
    :id="id"
    :type="type"
    :title="props.title"
  >
    <ModulePortRow :output="{ id: 'output', label: 'out', signal: 'audio' }">
      <USelect
        v-model="channel"
        :items="channelOptions"
        label-key="label"
        value-key="value"
        aria-label="Input channel"
        class="nodrag w-32 text-xs"
        size="sm"
      />
    </ModulePortRow>
  </BaseModuleShell>
</template>
