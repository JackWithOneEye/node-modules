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
const waveform = useOptionParam('waveform', props.waveform, value => setParamValue(lfoNode.waveform, value))
const waveformOptLabels = {
  [LFOWaveform.Sine]: 'sin',
  [LFOWaveform.Triangle]: 'tri',
  [LFOWaveform.Saw]: 'saw',
  [LFOWaveform.Ramp]: 'rmp',
  [LFOWaveform.Square]: 'sqr',
  [LFOWaveform.RSH]: 's&h',
} as const

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
    <div class="flex">
      <ModulePortRail
        position="left"
        :ports="[{ id: 'phase', label: 'phse', signal: 'cv' }]"
      />
      <div class="flex">
        <KnobInput
          v-model="frequency"
          label="frequency"
          :min="0.1"
          :max="20"
          :step="0.1"
          :format-fn="(v) => v.toFixed(1) + 'Hz'"
        />
        <KnobInput
          v-model="phase"
          label="phase"
          :min="0"
          :max="1"
          :step="1 / 180"
          :format-fn="(v) => (v * 180).toFixed() + '°'"
        />
        <KnobInput
          v-model="polarity"
          label="polarity"
          :min="LFOPolarity.Bipolar"
          :max="LFOPolarity.Unipolar"
          :format-fn="(v) => v === LFOPolarity.Bipolar ? 'bi' : 'uni'"
        />
        <KnobInput
          v-model="waveform"
          label="waveform"
          :min="LFOWaveform.Sine"
          :max="LFOWaveform.RSH"
          :format-fn="(v) => waveformOptLabels[v as LFOWaveform]"
        />
      </div>
      <ModulePortRail
        position="right"
        :ports="[{ id: 'output', label: 'out', signal: 'cv' }]"
      />
    </div>
  </BaseModuleShell>
</template>
