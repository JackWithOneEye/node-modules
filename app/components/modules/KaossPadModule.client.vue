<script lang="ts" setup>
import { Handle } from '@vue-flow/core'

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

const xyNodes = { x: new ConstantSourceNode(audioContext, { offset: 0 }), y: new ConstantSourceNode(audioContext, { offset: 0 }) }
xyNodes.x.start()
xyNodes.y.start()

const x = ref(0)
const y = ref(0)

const padRef = ref<HTMLDivElement>()
const isDragging = ref(false)

const updateFromPointer = (event: PointerEvent) => {
  if (!padRef.value) {
    return
  }

  const rect = padRef.value.getBoundingClientRect()
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
    [xyNodes.x.offset, x.value, 'lin', 0.0001],
    [xyNodes.y.offset, y.value, 'lin', 0.0001],
  )
}

const onPointerDown = (event: PointerEvent) => {
  if (event.pointerType === 'mouse' && event.button !== 0) {
    return // only left button
  }
  isDragging.value = true
  updateFromPointer(event)
}

const onPointerMove = (event: PointerEvent) => {
  if (isDragging.value) {
    updateFromPointer(event)
  }
}

const onPointerUp = () => {
  isDragging.value = false
}

registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (sourceHandle, target, targetIndex) => {
      const node = xyNodes[sourceHandle as 'x' | 'y']
      if (target instanceof AudioParam) {
        node.connect(target, 0)
        return
      }
      node.connect(target, 0, targetIndex)
    },
    disconnect: (sourceHandle, target, targetIndex) => {
      const node = xyNodes[sourceHandle as 'x' | 'y']
      if (target instanceof AudioParam) {
        node.disconnect(target, 0)
        return
      }
      node.disconnect(target, 0, targetIndex)
    },
  },
})

onUnmounted(() => {
  xyNodes.x.disconnect()
  xyNodes.x.stop()
  xyNodes.y.disconnect()
  xyNodes.y.stop()
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
          ref="padRef"
          class="nodrag w-48 h-48 bg-black border-2 border-white/50 relative cursor-crosshair select-none"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointerleave="onPointerUp"
        >
          <!-- Crosshair indicator -->
          <div
            class="absolute w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            :style="{
              left: `${((x + 1) / 2) * 100}%`,
              top: `${((1 - y) / 2) * 100}%`,
            }"
          />
          <!-- Grid lines -->
          <div class="absolute inset-0 border-white/20">
            <div class="absolute top-1/2 left-0 w-full h-px bg-white/20" />
            <div class="absolute left-1/2 top-0 w-px h-full bg-white/20" />
          </div>
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
        <HandleLabel>
          X
        </HandleLabel>
        <Handle
          id="x"
          class="!top-12"
          type="source"
          :position="Position.Right"
        />
        <HandleLabel>
          Y
        </HandleLabel>
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
