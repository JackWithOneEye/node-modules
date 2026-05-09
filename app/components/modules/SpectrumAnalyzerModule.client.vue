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

const minFreq = 20
const maxFreq = computed(() => store.audioContext.sampleRate / 2)
const minDb = -60
const maxDb = 20

const logScale = (freq: number, minF: number, maxF: number, width: number): number => {
  const minLog = Math.log10(minF)
  const maxLog = Math.log10(maxF)
  const freqLog = Math.log10(Math.max(freq, minF))
  return ((freqLog - minLog) / (maxLog - minLog)) * width
}

const amplitudeToDb = (amplitude: number): number => {
  const db = 20 * Math.log10(Math.max(amplitude, 1e-10))
  return Math.max(minDb, Math.min(maxDb, db))
}

const dbToY = (db: number, height: number): number => {
  const normalized = (db - minDb) / (maxDb - minDb)
  return height * (1 - normalized)
}

const freqLabels = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000]
const dbLabels = [20, 0, -20, -40, -60]

const formatFreq = (freq: number): string => {
  return freq >= 1000 ? `${freq / 1000}k` : `${freq}`
}

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

const marginLeft = 30
const marginBottom = 20

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
        const freqData = sound.value.freqDomain()
        const binCount = freqData.length
        const nyquist = maxFreq.value
        const totalWidth = space.size.x
        const totalHeight = space.size.y
        const width = totalWidth - marginLeft
        const height = totalHeight - marginBottom

        form.font(9, 'normal').fill('#888888').alignText('center', 'top')

        for (const freq of freqLabels) {
          if (freq > nyquist) continue
          const x = marginLeft + logScale(freq, minFreq, nyquist, width)
          form.text(new Pt(x, height + 4), formatFreq(freq))
        }

        form.alignText('right', 'middle')
        for (const db of dbLabels) {
          const y = dbToY(db, height)
          form.text(new Pt(marginLeft - 4, y), `${db}`)
        }

        const poly = [new Pt(marginLeft, height)]

        for (let i = 0; i < binCount; i++) {
          const freq = (i / binCount) * nyquist
          if (freq < minFreq) continue

          const amplitude = freqData[i] / 255
          const db = amplitudeToDb(amplitude)
          const x = marginLeft + logScale(freq, minFreq, nyquist, width)
          const y = dbToY(db, height)

          poly.push(new Pt(x, y))
        }

        poly.push(new Pt(totalWidth, height))
        form.fillOnly('#ffffff').polygon(poly)

        form.strokeOnly('#555555').rect([new Pt(marginLeft, 0), new Pt(totalWidth, height)])
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
