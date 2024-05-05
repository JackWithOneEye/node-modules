<script lang="ts" setup>
export type ParamControllerProps = {
  name: string
  defaultValue: number
  label: string
  min: number
  max: number

  scalingFactor?: number
  step?: number
  unit?: string
}
const props = withDefaults(defineProps<ParamControllerProps>(), {
  scalingFactor: 1,
  step: 1,
  unit: '',
})
const emit = defineEmits<{ (e: 'onChange', value: number): void }>()

const [param] = useAudioParam(props.name, props.defaultValue, value => emit('onChange', value), linearConverter(props.scalingFactor))
</script>

<template>
  <div class="flex flex-col items-center">
    <Knob
      v-model="param"
      :size="60"
      :min="min"
      :max="max"
      :step="step"
      :value-template="`${param.toFixed()}${unit}`"
    />
    <span class="text-handle">{{ label }}</span>
  </div>
</template>
