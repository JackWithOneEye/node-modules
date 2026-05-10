<script lang="ts" setup>
import { type CanvasForm, CanvasSpace, Sound } from 'pts'

export type OscilloscopeModuleProps = {
  id: string
  type: string
  title?: string
}
const props = withDefaults(defineProps<OscilloscopeModuleProps>(), {
  title: 'Oscilloscope',
})

const store = useAudioContextStore()

const gainNode = new GainNode(store.audioContext, { gain: 0.5 })
const sound = Sound.from(gainNode, store.audioContext).analyze(2048)
store.registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  getTarget: {
    input: { type: 'audioNode', inputIndex: 0, node: gainNode },
  },
})

const wrapper = ref<HTMLDivElement | null>(null)
let space: CanvasSpace
let form: CanvasForm
watch(wrapper, () => {
  space = new CanvasSpace(wrapper.value!).setup({
    bgcolor: '#000000',
    pixelDensity: 10,
    offscreen: true,
  })
  form = space.getForm()

  space.add({
    animate: () => {
      if (sound) {
        form!.points(
          sound.timeDomainTo(space.size),
          0.1,
          'square',
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
  <BaseModuleShell
    :id="id"
    :type="type"
    :title="title"
  >
    <ModulePortRow :input="{ id: 'input', label: 'in' }">
      <div
        ref="wrapper"
        class="flex items-center justify-center border border-white/50 p-1 [&>canvas]:max-h-[150px] [&>canvas]:max-w-[250px]"
      />
    </ModulePortRow>
  </BaseModuleShell>
</template>
