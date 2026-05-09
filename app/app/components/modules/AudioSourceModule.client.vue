<script lang="ts" setup>
import { Handle } from '@vue-flow/core'

export type AudioSourceModuleProps = {
  id: string
  type: string
}
const props = defineProps<AudioSourceModuleProps>()

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

const audioSourceNode = new MediaStreamAudioSourceNode(store.audioContext, { mediaStream })

store.registerModule(props.id, {
  meta: { id: props.id, type: props.type },
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
  <div class="flex items-center gap-1 border pl-2 pr-1 py-1">
    <span class="text-sm">Audio Source</span>
    <i class="pi pi-microphone" />
    <div class="flex pl-1">
      <HandleLabel>out</HandleLabel>
      <Handle
        id="output"
        type="source"
        :position="Position.Right"
      />
    </div>
  </div>
</template>
