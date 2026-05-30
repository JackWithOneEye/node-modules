<script lang="ts" setup>
export type LFOModuleProps = {
  id: string
  type: string
  title?: string
  frequency?: number
  phase?: number
  polarity?: LFOPolarity
  waveform?: LFOWaveform
}
const props = withDefaults(defineProps<LFOModuleProps>(), {
  title: 'LFO',
  frequency: 0.1,
  phase: 0,
  polarity: LFOPolarity.Bipolar,
  waveform: LFOWaveform.Sine,
})

const { getAudioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const lfoNode = new LFOWorkletNode(getAudioContext(), {
  frequency: props.frequency,
  phase: props.phase,
  polarity: props.polarity,
  waveform: props.waveform,
})
const [frequency] = useAudioParam('frequency', props.frequency, value => setParamValue(lfoNode.frequency, value))
const [phase] = useAudioParam('phase', props.phase, value => setParamValue(lfoNode.phase, value * 2 * Math.PI, 'lin'))
const polarity = useOptionParam('polarity', props.polarity, value => setParamValue(lfoNode.polarity, value))
const polarityOptions = [
  { label: 'bipolar', value: LFOPolarity.Bipolar },
  { label: 'unipolar', value: LFOPolarity.Unipolar },
]
const waveform = useOptionParam('waveform', props.waveform, value => setParamValue(lfoNode.waveform, value))
const waveformOptions = [
  { label: 'sine', value: LFOWaveform.Sine },
  { label: 'triangle', value: LFOWaveform.Triangle },
  { label: 'saw', value: LFOWaveform.Saw },
  { label: 'ramp', value: LFOWaveform.Ramp },
  { label: 'sqare', value: LFOWaveform.Square },
  { label: 'S&H', value: LFOWaveform.RSH },
]

registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        lfoNode.connect(target, 0)
        return
      }
      lfoNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        lfoNode.disconnect(target, 0)
        return
      }
      lfoNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    phase: { type: 'param', param: lfoNode.phase },
  },
  onSuspend: () => {
    lfoNode.reset()
  },
})

onUnmounted(() => {
  lfoNode.destroy()
  unregisterModule(props.id)
})
</script>

<template>
  <BaseModuleShell
    :id="id"
    :type="type"
    :title="props.title"
  >
    <div class="flex gap-2">
      <ModulePortRail
        position="left"
        :ports="[{ id: 'phase', label: 'phse', signal: 'cv' }]"
      />
      <div class="nodrag flex flex-col gap-2 border border-white/80 rounded-md p-2">
        <div class="flex items-center gap-2">
          <div class="flex flex-col items-center">
            <KnobInput
              v-model="frequency"
              :size="60"
              :min="0.1"
              :max="20"
              :step="0.1"
              :format-fn="(v) => v.toFixed(1) + 'Hz'"
            />
            <span class="text-handle">Frequency</span>
          </div>
          <div class="flex flex-col items-center">
            <KnobInput
              v-model="phase"
              :size="60"
              :min="0"
              :max="1"
              :step="1 / 180"
              :format-fn="(v) => (v * 180).toFixed() + '°'"
            />
            <span class="text-handle">Phase</span>
          </div>
        </div>
        <div class="flex gap-2">
          <USelect
            v-model="polarity"
            :items="polarityOptions"
            label-key="label"
            value-key="value"
            placeholder="Polarity"
            class="w-full text-xs"
            size="sm"
          />
          <USelect
            v-model="waveform"
            :items="waveformOptions"
            label-key="label"
            value-key="value"
            placeholder="Waveform"
            class="w-full text-xs"
            size="sm"
          />
        </div>
      </div>
      <ModulePortRail
        position="right"
        :ports="[{ id: 'output', label: 'out', signal: 'cv' }]"
      />
    </div>
  </BaseModuleShell>
</template>
