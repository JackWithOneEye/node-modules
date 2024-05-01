<script lang="ts" setup>
import { Handle } from '@vue-flow/core'
import { type CanvasForm, CanvasSpace, Sound } from 'pts'

export type OscilloscopeModuleProps = {
  id: string
  type: string
}
const props = defineProps<OscilloscopeModuleProps>()

const store = useAudioContextStore()

const gainNode = new GainNode(store.audioContext, { gain: 0.5 })
const sound = Sound.from(gainNode, store.audioContext).analyze(1024)
store.registerModule(props.id, {
  meta: { id: props.id, type: props.type },
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
    bgcolor: '#000000',
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
  <div class="flex items-center gap-2 border pl-1 pr-5 py-5">
    <HandleLabel>in</HandleLabel>
    <Handle
      id="input"
      type="target"
      :position="Position.Left"
    />
    <div
      ref="wrapper"
      class="flex items-center justify-center [&>canvas]:min-h-[300px] [&>canvas]:min-w-[500px]"
    />
  </div>
</template>
