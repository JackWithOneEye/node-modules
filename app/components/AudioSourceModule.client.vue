<script lang="ts" setup>
import { Handle, Position } from '@vue-flow/core'

export type AudioSourceModuleProps = {
  id: string
}
const props = defineProps<AudioSourceModuleProps>()

const store = useAudioContextStore()

const mediaStream = await window.navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,
    autoGainControl: false,
    noiseSuppression: false,
    // latency: 0,
  },
})

const audioSourceNode = new MediaStreamAudioSourceNode(store.audioContext, { mediaStream })

store.registerModule(props.id, {
  meta: { id: props.id, type: 'audio-source' },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        audioSourceNode.connect(target, 0)
        return
      }
      audioSourceNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        audioSourceNode.disconnect(target, 0)
        return
      }
      audioSourceNode.disconnect(target, 0, targetIndex)
    },
  },
})

onUnmounted(() => {
  audioSourceNode.disconnect()
  store.unregisterModule(props.id)
})
</script>

<template>
  <div class="border p-4">
    AUDIO SOURCE
  </div>
  <Handle
    id="output"
    type="source"
    :position="Position.Right"
  />
</template>
