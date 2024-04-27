<script lang="ts" setup>
import { type CanvasForm, CanvasSpace, Sound } from 'pts'
import { Handle, Position } from '@vue-flow/core'

export type OscilloscopeModuleProps = {
  id: string
}
const props = defineProps<OscilloscopeModuleProps>()

const store = useAudioContextStore()

const gainNode = new GainNode(store.audioContext, { gain: 0.5 })
const sound = Sound.from(gainNode, store.audioContext).analyze(1024)
store.registerModule(props.id, {
  meta: { id: props.id, type: 'oscilloscope' },
  getTarget: () => {
    return {
      type: 'audioNode',
      inputIndex: 0,
      node: gainNode,
    }
  },
})

const wrapper = ref<HTMLDivElement | null>(null)
let space: CanvasSpace
let form: CanvasForm
watch(wrapper, () => {
  space = new CanvasSpace(wrapper.value!).setup({
    bgcolor: '#90caf9',
    resize: true,
  })
  form = space.getForm()

  space.add({
    animate: () => {
      if (sound) {
        form!.points(
          sound.timeDomainTo(space.size),
          0.5,
          'circle',
        )
      }
    },
  }).play()
}, { once: true })

onUnmounted(() => {
  if (space) {
    space.removeAll()
    space.stop()
  }
  gainNode.disconnect()
  store.unregisterModule(props.id)
})
</script>

<template>
  <div
    ref="wrapper"
    class="flex items-center justify-center border p-3"
  />
  <Handle
    id="input"
    type="target"
    :position="Position.Left"
  />
</template>

<style>
canvas {
  min-height: 300px;
  min-width: 500px;
}
</style>
