<script lang="ts" setup>
import { Handle } from '@vue-flow/core'
import { type CanvasForm, CanvasSpace, Sound, Pt } from 'pts'

export type SpectrumAnalyzerModuleProps = {
  id: string
  type: string
  title?: string
  fftSize?: number
}

const props = withDefaults(defineProps<SpectrumAnalyzerModuleProps>(), {
  title: 'Spectrum Analyzer',
  fftSize: 512,
})

const store = useAudioContextStore()

const fftSizeOptions = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192]
const fftSize = useParam('fftSize', props.fftSize)

const gainNode = new GainNode(store.audioContext)
const sound = shallowRef<Sound>()

const initializeSound = () => {
  if (sound.value) {
    sound.value.analyzer.node.disconnect()
  }
  sound.value = Sound.from(gainNode, store.audioContext).analyze(fftSize.value)
}

initializeSound()

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
      if (sound.value) {
        const pts = sound.value.freqDomainTo(space.size)
        const poly = [new Pt(0, space.size.y)]
        form.stroke('#ffffff')
        for (const p of pts) {
          const inv = new Pt(p.x, space.size.y - p.y)
          form.line([new Pt(p.x, space.size.y), inv])
          poly.push(inv)
        }
        poly.push(new Pt(space.size.x, space.size.y))
        form.fillOnly('#ffffff').polygon(poly)
      }
    },
  }).play()
}, { once: true })

watch(fftSize, () => {
  initializeSound()
})

onUnmounted(() => {
  if (space) {
    space.removeAll()
    space.stop()
  }
  if (sound.value) {
    sound.value.analyzer.node.disconnect()
  }
  gainNode.disconnect()
  store.unregisterModule(props.id)
})
</script>

<template>
  <div class="flex flex-col gap-2 border pr-3 pt-1 pb-4">
    <span class="text-sm pl-2">{{ title }}</span>
    <div class="flex items-center gap-1 relative">
      <HandleLabel class="pl-1">
        in
      </HandleLabel>
      <Handle
        id="input"
        type="target"
        :position="Position.Left"
      />
      <div
        ref="wrapper"
        class="flex items-center justify-center border border-white/50 p-1 [&>canvas]:max-h-[300px] [&>canvas]:max-w-[500px]"
      />
    </div>
    <div class="flex items-center gap-2 pl-2">
      <label class="text-xs">FFT Size:</label>
      <select
        v-model.number="fftSize"
        class="text-xs bg-gray-800 border border-gray-600 rounded px-1 py-0.5"
      >
        <option
          v-for="size in fftSizeOptions"
          :key="size"
          :value="size"
        >
          {{ size }}
        </option>
      </select>
    </div>
  </div>
</template>
