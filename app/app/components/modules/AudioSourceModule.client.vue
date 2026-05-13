<script lang="ts" setup>
export type AudioSourceModuleProps = {
  id: string
  type: string
  title?: string
}
const props = withDefaults(defineProps<AudioSourceModuleProps>(), {
  title: 'Audio Source',
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
  <BaseModuleShell
    :id="id"
    :type="type"
    :title="props.title"
  >
    <ModulePortRow :output="{ id: 'output', label: 'out' }" />
  </BaseModuleShell>
</template>
