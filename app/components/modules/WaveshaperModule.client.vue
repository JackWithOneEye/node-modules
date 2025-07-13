<script lang="ts" setup>
import { Handle, Position, useVueFlow } from '@vue-flow/core'

export type WaveshaperNodeModuleProps = {
  id: string
  type: string
  title?: string
  waveshaper?: 'sin' | 'sigmoid' | 'tanh' | 'x-root'
  modifier?: number // 0 - 100
}
const props = withDefaults(defineProps<WaveshaperNodeModuleProps>(), {
  title: 'Waveshaper',
  waveshaper: 'tanh',
  modifier: 0,
})

const { audioContext, registerModule, unregisterModule } = useAudioContextStore()

const waveshaperTables = useWaveshapersStore()

const { onViewportChange, getViewport } = useVueFlow()

const waveshaperNode = new WaveShaperNode(audioContext, {
  curve: waveshaperTables[props.waveshaper][props.modifier],
  oversample: '4x',
})
const waveshaper = useOptionParam('waveshaper', props.waveshaper, (value) => {
  waveshaperNode.curve = waveshaperTables[value][modifier.value]
})
const waveshaperOptions = [
  { label: 'sin', value: 'sin' as const },
  { label: 'sig', value: 'sigmoid' as const },
  { label: 'tanh', value: 'tanh' as const },
  { label: 'x-root', value: 'x-root' as const },
]
const [modifier] = useAudioParam('modifier', props.modifier, (value) => {
  waveshaperNode.curve = waveshaperTables[waveshaper.value][value]
})

registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        waveshaperNode.connect(target, 0)
        return
      }
      waveshaperNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        waveshaperNode.disconnect(target, 0)
        return
      }
      waveshaperNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', node: waveshaperNode, inputIndex: 0 },
  },
})

const canvasWrap = ref<HTMLDivElement>()
const canvasEl = ref<HTMLCanvasElement>()
const ctx = shallowRef<CanvasRenderingContext2D | null>(null)

function resizeCanvas() {
  const wrap = canvasWrap.value!
  const canvas = canvasEl.value!
  const scale = (window.devicePixelRatio || 1) * getViewport().zoom

  const width = wrap.clientWidth * scale
  const height = wrap.clientHeight * scale
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
    const c = ctx.value!
    c.setTransform(scale, 0, 0, scale, 0, 0)
  }
}

function drawCurve() {
  const table = waveshaperTables[waveshaper.value][modifier.value]
  if (!table?.length) {
    return
  }
  const wrap = canvasWrap.value!
  const c = ctx.value!
  const width = wrap.clientWidth
  const height = wrap.clientHeight

  c.clearRect(0, 0, width, height)
  c.fillStyle = '#111'
  c.fillRect(0, 0, width, height)
  c.beginPath()

  const n = table.length
  const padding = 20
  const xScale = width / (n - 1)
  const yScale = height - 2 * padding
  for (let i = 0; i < n; i++) {
    const x = i * xScale
    const y = padding + ((1 - table[i]) * 0.5) * yScale
    if (i === 0) {
      c.moveTo(x, y)
    }
    else {
      c.lineTo(x, y)
    }
  }
  c.strokeStyle = '#fff'
  c.lineWidth = 2
  c.stroke()
}

let raf = 0
watch(canvasEl, () => {
  ctx.value = canvasEl.value!.getContext('2d')!
  resizeCanvas()
  drawCurve()

  window.addEventListener('resize', resizeCanvas)
}, { once: true })

watch([waveshaper, modifier], () => {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(drawCurve)
})

onViewportChange(() => {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    resizeCanvas()
    drawCurve()
  })
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resizeCanvas)
  ctx.value = null
  waveshaperNode.disconnect()
  unregisterModule(props.id)
})
</script>

<template>
  <ModuleToolbar />
  <div class="flex flex-col gap-2 border px-1 py-1">
    <span class="text-sm pl-1">{{ title }}</span>
    <div class="flex gap-2 items-start">
      <div class="flex flex-col gap-4">
        <HandleLabel>
          in
        </HandleLabel>
        <Handle id="input" class="!top-10" type="target" :position="Position.Left" />
        <div class="flex items-center gap-1 border border-white/80 rounded-md p-2 nodrag mt-2">
          <Knob v-model="modifier" :size="40" :min="0" :max="100" />
          <Dropdown v-model="waveshaper" class="border h-6 w-full" :pt="{
            input: tw`p-1 text-xs`,
          }" :options="waveshaperOptions" option-label="label" option-value="value" placeholder="Waveshaper" />
        </div>
      </div>
      <div ref="canvasWrap"
        class="relative flex-1 min-w-[180px] min-h-[120px] max-h-[200px] max-w-[320px] border border-white/30 rounded overflow-hidden">
        <canvas ref="canvasEl" class="absolute inset-0 w-full h-full bg-[#111]" />
      </div>
      <div class="flex flex-col gap-4">
        <HandleLabel>
          out
        </HandleLabel>
        <Handle id="output" class="!top-10" type="source" :position="Position.Right" />
      </div>
    </div>
  </div>
</template>
