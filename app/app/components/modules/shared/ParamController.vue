<script lang="ts" setup>
import KnobInput from '~/components/ui/KnobInput.vue'

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

const [paramRef] = useAudioParam(props.name, props.defaultValue, value => emit('onChange', value), linearConverter(props.scalingFactor))
</script>

<template>
  <div class="flex flex-col items-center">
    <KnobInput
      v-model="paramRef"
      :size="60"
      :min="min"
      :max="max"
      :step="step"
      :format-fn="(v) => v.toFixed() + unit"
    />
    <span class="text-handle">{{ label }}</span>
  </div>
</template>
