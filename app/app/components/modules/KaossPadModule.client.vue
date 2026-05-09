<script lang="ts" setup>
import { Handle, Position, useVueFlow } from '@vue-flow/core'

export type KaossPadModuleProps = {
  id: string
  type: string
  title?: string
}

const props = withDefaults(defineProps<KaossPadModuleProps>(), {
  title: 'Kaoss Pad',
})

const {
  audioContext,
  registerModule,
  setMultipleParamValues,
  unregisterModule,
} = useAudioContextStore()

const { onViewportChange, getViewport } = useVueFlow()

const nodes = {
  x: new ConstantSourceNode(audioContext, { offset: 0 }),
  y: new ConstantSourceNode(audioContext, { offset: 0 }),
}
nodes.x.start()
nodes.y.start()

const x = ref(0)
const y = ref(0)

const canvasWrap = ref<HTMLDivElement>()
const canvasEl = ref<HTMLCanvasElement>()
const ctx = shallowRef<CanvasRenderingContext2D | null>(null)
const isDragging = ref(false)

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

function drawPad() {
  if (!ctx.value || !canvasWrap.value) {
    return
  }

  const wrap = canvasWrap.value
  const c = ctx.value
  const width = wrap.clientWidth
  const height = wrap.clientHeight

  // Clear canvas
  c.clearRect(0, 0, width, height)

  // Draw background
  c.fillStyle = '#000'
  c.fillRect(0, 0, width, height)

  // Draw grid lines
  c.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  c.lineWidth = 1
  c.beginPath()
  // Center horizontal line
  const halfHeight = height * 0.5
  c.moveTo(0, halfHeight)
  c.lineTo(width, halfHeight)
  // Center vertical line
  const halfWidth = width * 0.5
  c.moveTo(halfWidth, 0)
  c.lineTo(halfWidth, height)
  c.stroke()

  // Draw crosshair
  const crosshairX = (x.value + 1) * halfWidth
  const crosshairY = (1 - y.value) * halfHeight

  c.fillStyle = '#fff'
  c.beginPath()
  c.arc(crosshairX, crosshairY, 4, 0, 2 * Math.PI)
  c.fill()
}

const updateFromPointer = (event: PointerEvent) => {
  if (!canvasWrap.value) {
    return
  }

  const rect = canvasWrap.value.getBoundingClientRect()
  const relativeX = (event.clientX - rect.left) / rect.width
  const relativeY = (event.clientY - rect.top) / rect.height

  // Convert to -1 to 1 range
  const newX = relativeX * 2 - 1
  const newY = (1 - relativeY) * 2 - 1 // Invert Y so top is +1

  // Clamp values to -1 to 1
  x.value = Math.max(-1, Math.min(1, newX))
  y.value = Math.max(-1, Math.min(1, newY))

  // Update the ConstantSourceNode offsets
  setMultipleParamValues(
    [nodes.x.offset, x.value, 'none'],
    [nodes.y.offset, y.value, 'none'],
  )
}

const onPointerDown = (event: PointerEvent) => {
  if (event.pointerType === 'mouse' && event.button !== 0) {
    return // only left button
  }
  isDragging.value = true
  updateFromPointer(event)
  document.addEventListener('pointermove', onPointerMove, { signal: abortCtrlr.signal })
  document.addEventListener('pointerup', onPointerUp, { signal: abortCtrlr.signal })
}

const onPointerMove = (event: PointerEvent) => {
  if (isDragging.value) {
    updateFromPointer(event)
  }
}

const onPointerUp = () => {
  isDragging.value = false
  document.removeEventListener('pointermove', onPointerMove)
  document.removeEventListener('pointerup', onPointerUp)
}

registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (sourceHandle, target, targetIndex) => {
      const node = nodes[sourceHandle as 'x' | 'y']
      if (target instanceof AudioParam) {
        node.connect(target, 0)
        return
      }
      node.connect(target, 0, targetIndex)
    },
    disconnect: (sourceHandle, target, targetIndex) => {
      const node = nodes[sourceHandle as 'x' | 'y']
      if (target instanceof AudioParam) {
        node.disconnect(target, 0)
        return
      }
      node.disconnect(target, 0, targetIndex)
    },
  },
})

const abortCtrlr = new AbortController()
let raf = 0
watch(
  canvasEl,
  () => {
    ctx.value = canvasEl.value!.getContext('2d')!
    resizeCanvas()
    drawPad()

    window.addEventListener('resize', resizeCanvas, { signal: abortCtrlr.signal })
  },
  { once: true },
)

watch([x, y], () => {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(drawPad)
})

onViewportChange(() => {
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => {
    resizeCanvas()
    drawPad()
  })
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  abortCtrlr.abort()
  ctx.value = null
  nodes.x.disconnect()
  nodes.x.stop()
  nodes.y.disconnect()
  nodes.y.stop()
  unregisterModule(props.id)
})
</script>

<template>
  <ModuleToolbar />
  <div class="flex flex-col gap-2 border px-2 py-2">
    <span class="text-sm pl-1">{{ title }}</span>
    <div class="flex gap-2">
      <div class="flex flex-col gap-2">
        <div
          ref="canvasWrap"
          class="nodrag w-48 h-48 border-2 border-white/50 relative cursor-crosshair select-none"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
        >
          <canvas
            ref="canvasEl"
            class="absolute inset-0 w-full h-full"
          />
        </div>
        <div class="flex gap-4 text-xs">
          <div class="flex items-center gap-1">
            <span>X:</span>
            <span class="font-mono w-12">{{ x.toFixed(2) }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span>Y:</span>
            <span class="font-mono w-12">{{ y.toFixed(2) }}</span>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <HandleLabel> X </HandleLabel>
        <Handle
          id="x"
          class="!top-12"
          type="source"
          :position="Position.Right"
        />
        <HandleLabel> Y </HandleLabel>
        <Handle
          id="y"
          class="!top-20"
          type="source"
          :position="Position.Right"
        />
      </div>
    </div>
  </div>
</template>
