<script lang="ts" setup>
interface Props {
  modelValue: number
  min?: number
  max?: number
  step?: number
  size?: number
  formatFn?: (value: number) => string
  unit?: string
  disabled?: boolean
  label?: string
  centerLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  size: 60,
  formatFn: undefined,
  unit: '',
  disabled: false,
  label: undefined,
  centerLabel: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const knobRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const dragStartY = ref(0)
const dragStartValue = ref(0)

const cx = 50
const cy = 50
const radius = computed(() => props.size * 0.44)
const strokeWidth = computed(() => Math.max(props.size * 0.14, 5))

const startAngleDeg = 230
const sweepDeg = 260

function degToRad(deg: number) {
  return (deg * Math.PI) / 180
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = degToRad(angleDeg - 90)
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle)
  const end = polarToCartesian(cx, cy, r, endAngle)
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`
}

const arcBoundingBox = computed(() => {
  const r = radius.value
  const sw = strokeWidth.value
  const pad = sw / 2
  const minX = cx - r - pad
  const maxX = cx + r + pad
  const minY = cy - r - pad
  const maxY = cy + r * Math.sqrt(3) / 2 + pad
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
})

const arcBaseSize = computed(() => {
  const bounds = arcBoundingBox.value
  return Math.max(bounds.width, bounds.height)
})

const viewBoxMargin = computed(() => {
  return Math.max(strokeWidth.value * 0.05, 1)
})

const viewBoxSize = computed(() => {
  return arcBaseSize.value + viewBoxMargin.value * 2
})

const svgViewBox = computed(() => {
  const bounds = arcBoundingBox.value
  const size = viewBoxSize.value
  const centerX = bounds.x + bounds.width / 2
  const centerY = bounds.y + bounds.height / 2
  return `${centerX - size / 2} ${centerY - size / 2} ${size} ${size}`
})

const svgSize = computed(() => {
  return arcBaseSize.value * (props.size / 100)
})

const backgroundArc = computed(() => {
  return describeArc(cx, cy, radius.value, startAngleDeg, startAngleDeg + sweepDeg)
})

const valueAngleDeg = computed(() => {
  const pct = (props.modelValue - props.min) / (props.max - props.min)
  return startAngleDeg + pct * sweepDeg
})

const valueArc = computed(() => {
  if (props.modelValue <= props.min) {
    return ''
  }
  const endAngle = valueAngleDeg.value
  if (endAngle <= startAngleDeg) {
    return ''
  }
  return describeArc(cx, cy, radius.value, startAngleDeg, endAngle)
})

const displayValue = computed(() => {
  if (props.formatFn) {
    return props.formatFn(props.modelValue)
  }
  return `${props.modelValue}${props.unit}`
})

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function onPointerDown(e: PointerEvent) {
  if (props.disabled) {
    return
  }
  e.preventDefault()
  isDragging.value = true
  dragStartY.value = e.clientY
  dragStartValue.value = props.modelValue
  knobRef.value?.setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value || props.disabled) {
    return
  }
  const dy = dragStartY.value - e.clientY
  const range = props.max - props.min
  const sensitivity = Math.max(range / 120, props.step)
  const delta = dy * sensitivity
  const raw = dragStartValue.value + delta
  const stepped = Math.round(raw / props.step) * props.step
  emit('update:modelValue', clamp(stepped, props.min, props.max))
}

function onPointerUp(e: PointerEvent) {
  isDragging.value = false
  knobRef.value?.releasePointerCapture(e.pointerId)
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) {
    return
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
    e.preventDefault()
    const next = Math.min(props.max, props.modelValue + props.step)
    emit('update:modelValue', next)
  }
  else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
    e.preventDefault()
    const next = Math.max(props.min, props.modelValue - props.step)
    emit('update:modelValue', next)
  }
  else if (e.key === 'Home') {
    e.preventDefault()
    emit('update:modelValue', props.min)
  }
  else if (e.key === 'End') {
    e.preventDefault()
    emit('update:modelValue', props.max)
  }
}
</script>

<template>
  <UTooltip
    :text="label"
    arrow
    :delay-duration="0"
    :disable-closing-trigger="true"
    :content="{ side: 'top', sideOffset: 0 }"
  >
    <div
      ref="knobRef"
      class="knob-input select-none flex flex-col items-center"
      :class="{ 'cursor-grab': !disabled, 'cursor-not-allowed opacity-50': disabled }"
      role="slider"
      :tabindex="disabled ? -1 : 0"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="modelValue"
      :aria-disabled="disabled"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @keydown="onKeydown"
    >
      <svg
        :width="svgSize"
        :height="svgSize"
        :viewBox="svgViewBox"
      >
        <path
          :d="backgroundArc"
          fill="none"
          stroke="var(--theme-accent-track)"
          :stroke-width="strokeWidth"
          stroke-linecap="round"
        />
        <path
          v-if="valueArc"
          :d="valueArc"
          fill="none"
          stroke="var(--theme-accent)"
          :stroke-width="strokeWidth"
          stroke-linecap="round"
        />
      </svg>
      <span
        class="text-xs text-center font-mono w-12"
        :class="{ '-mt-1 pb-0.5': !centerLabel, '-mt-6 pb-3': centerLabel }"
      >
        {{ displayValue }}
      </span>
    </div>
  </UTooltip>
</template>
