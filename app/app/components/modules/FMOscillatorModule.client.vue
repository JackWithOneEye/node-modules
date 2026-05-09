<script lang="ts" setup>
import { Handle, Position } from '@vue-flow/core'

export type FMOscillatorModuleProps = {
  id: string
  type: string
  title?: string
  frequency?: number
  pitchShift?: number
}

const props = withDefaults(defineProps<FMOscillatorModuleProps>(), {
  title: 'FM Oscillator',
  frequency: 0.0,
  pitchShift: 0,
})

const { id, title, type, ...paramProps } = props
const { audioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const fmOscillatorNode = new FMOscillatorWorkletNode(audioContext, { ...paramProps })

const [frequency] = useAudioParam('frequency', props.frequency, value => setParamValue(fmOscillatorNode.frequency, value))
const [pitchShift] = useAudioParam('pitchShift', props.pitchShift, value => setParamValue(fmOscillatorNode.pitchShift, value))

registerModule(id, {
  meta: { id, type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        fmOscillatorNode.connect(target, 0)
        return
      }
      fmOscillatorNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        fmOscillatorNode.disconnect(target, 0)
        return
      }
      fmOscillatorNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    frequency: { type: 'param', param: fmOscillatorNode.frequency },
    phaseShift: { type: 'param', param: fmOscillatorNode.phaseShift },
  },
  onSuspend: () => {
    fmOscillatorNode.reset()
  },
})

onUnmounted(() => {
  fmOscillatorNode.destroy()
  unregisterModule(props.id)
})
</script>

<template>
  <ModuleToolbar />
  <div class="flex flex-col gap-2 border px-1 py-2">
    <span class="text-sm pl-1">{{ title }}</span>
    <div class="flex gap-2">
      <div class="flex flex-col gap-4">
        <HandleBar
          :handles="[
            { id: 'frequency', label: 'freq', type: 'target' as const },
            { id: 'phaseShift', label: 'phse', type: 'target' as const },
          ]"
          position="left"
        />
      </div>
      <div class="nodrag flex flex-col gap-2 border border-white/80 rounded-md p-2">
        <div class="flex gap-1">
          <div class="flex flex-col items-center">
            <Knob
              v-model="frequency"
              :size="60"
              :min="0.0"
              :max="4186.009"
              :step="0.1"
              :value-template="() => `${frequency.toFixed(1)}Hz`"
            />
            <span class="text-handle">Frequency</span>
          </div>
          <div class="flex flex-col items-center">
            <Knob
              v-model="pitchShift"
              :size="60"
              :min="-24"
              :max="24"
              :step="1"
            />
            <span class="text-handle">Pitch Shift</span>
          </div>
        </div>
      </div>
      <div class="flex flex-col">
        <HandleLabel class="pt-6">
          out
        </HandleLabel>
        <Handle
          id="output"
          type="source"
          :position="Position.Right"
        />
      </div>
    </div>
  </div>
</template>
