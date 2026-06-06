<script lang="ts" setup>
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
const { getAudioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const fmOscillatorNode = new FMOscillatorWorkletNode(getAudioContext(), { ...paramProps })

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
  <BaseModuleShell
    :id="id"
    :type="type"
    :title="props.title"
  >
    <div class="flex">
      <ModulePortRail
        position="left"
        :ports="[
          { id: 'frequency', label: 'freq', signal: 'cv' },
          { id: 'phaseShift', label: 'phse', signal: 'cv' },
        ]"
      />
      <div class="nodrag flex gap-1">
        <KnobInput
          v-model="frequency"
          label="frequency"
          :size="60"
          :min="0.0"
          :max="4186.009"
          :step="0.1"
          :format-fn="(v) => v.toFixed(1) + 'Hz'"
        />
        <KnobInput
          v-model="pitchShift"
          label="pitch shift"
          :size="60"
          :min="-24"
          :max="24"
          :step="1"
        />
      </div>
      <ModulePortRail
        position="right"
        :ports="[{ id: 'output', label: 'out', signal: 'audio' }]"
      />
    </div>
  </BaseModuleShell>
</template>
