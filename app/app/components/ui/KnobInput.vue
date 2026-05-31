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
}

const props = withDefaults(defineProps<Props>(), {
  min: 0,
  max: 100,
  step: 1,
  size: 40,
  formatFn: undefined,
  unit: '',
  disabled: false,
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

const startAngleDeg = 210
const sweepDeg = 300

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
  <div
    ref="knobRef"
    class="knob-input select-none"
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
      :width="size"
      :height="size"
      viewBox="0 0 100 100"
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
      <text
        x="50"
        :y="50 + strokeWidth * 0.6"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="#a1a1aa"
        :font-size="size * 0.13"
        class="pointer-events-none"
      >
        {{ displayValue }}
      </text>
    </svg>
  </div>
</template>
