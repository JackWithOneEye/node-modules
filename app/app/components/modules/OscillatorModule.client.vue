<script lang="ts" setup>
export type OscillatorModuleProps = {
  id: string
  type: string
  title?: string
  frequency?: number // Hz
  detune?: number // ct
  waveform?: Exclude<OscillatorType, 'custom'>

  frequencyEnabled?: boolean
}
const props = withDefaults(defineProps<OscillatorModuleProps>(), {
  title: 'Oscillator',
  frequency: 110, // lowest value of the frequency knob
  detune: 0,
  waveform: 'sine',
  frequencyEnabled: true,
})

function updateFrequency(value: number) {
  // while disabled the knob only changes the frequency that enabling restores
  if (frequencyEnabled.value) {
    store.setParamValue(oscillatorNode.frequency, value, 'exp')
  }
}

const {
  scaled: frequencyScaled,
  hz: frequencyHz,
  controlRange: freqControlRange,
} = useFrequencyParam('frequency', props.frequency, 110, 4, value => updateFrequency(value))
const [detune] = useAudioParam('detune', props.detune, value => store.setParamValue(oscillatorNode.detune, value, 'lin'))
const waveforms = ['sine', 'triangle', 'sawtooth', 'square'] as const
const waveformIndex = ref(waveforms.indexOf(props.waveform) as 0 | 1 | 2 | 3)

const frequencyEnabled = ref(props.frequencyEnabled)

const store = useAudioContextStore()
const oscillatorNode = new OscillatorNode(store.getAudioContext(), {
  frequency: props.frequencyEnabled ? props.frequency : 0,
  detune: props.detune,
  type: props.waveform,
})
const started = ref(false)
if (store.state === 'running') {
  oscillatorNode.start()
  started.value = true
}

const { updateNodeData } = useVueFlow()

watch(waveformIndex, (waveform, oldWaveform) => {
  if (waveform !== oldWaveform) {
    oscillatorNode.type = waveforms[waveform]
  }
  updateNodeData<OscillatorModuleProps>(props.id, { waveform: waveforms[waveform] })
})

watch(frequencyEnabled, (curr, prev) => {
  if (!curr && prev) {
    store.setParamValue(oscillatorNode.frequency, 0, 'lin')
  }
  else if (curr && !prev) {
    // an exponential ramp cannot start at 0 Hz: it would hold 0 until its end
    store.setParamValue(oscillatorNode.frequency, frequencyHz.value)
  }
  updateNodeData<OscillatorModuleProps>(props.id, { frequencyEnabled: curr })
})

store.registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        oscillatorNode.connect(target, 0)
        return
      }
      oscillatorNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        oscillatorNode.disconnect(target, 0)
        return
      }
      oscillatorNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    frequency: { type: 'param', param: oscillatorNode.frequency },
    detune: { type: 'param', param: oscillatorNode.detune },
  },
  onResume: () => {
    if (!started.value) {
      oscillatorNode.start()
      started.value = true
    }
  },
})

onUnmounted(() => {
  oscillatorNode.disconnect()
  try {
    oscillatorNode.stop()
  }
  catch (e) {
    console.warn(e)
  }
  store.unregisterModule(props.id)
})
</script>

<template>
  <BaseModuleShell
    :id="id"
    :type="type"
    :title="props.title"
  >
    <div class="flex">
      <div class="flex">
        <WithHandle
          handle-id="frequency"
          handle-signal="cv"
        >
          <KnobInput
            v-model="frequencyScaled"
            label="frequency"
            :disabled="!frequencyEnabled"
            :min="0"
            :max="freqControlRange"
            :format-fn="() => frequencyHz.toFixed() + 'Hz'"
          />
        </WithHandle>
        <!-- vertical on/off switch (on = up), centred on the knob dial -->
        <div class="flex h-9 w-4.5 items-center justify-center">
          <USwitch
            v-model="frequencyEnabled"
            size="sm"
            class="-rotate-90"
          />
        </div>
        <WithHandle
          handle-id="detune"
          handle-signal="cv"
        >
          <KnobInput
            v-model="detune"
            label="detune"
            :min="0"
            :max="100"
            :format-fn="(v) => v + 'ct'"
          />
        </WithHandle>
        <KnobInput
          v-model="waveformIndex"
          label="waveform"
          :min="0"
          :max="waveforms.length - 1"
          :format-fn="(v) => waveforms[v]!"
        />
      </div>
      <ModulePortRail
        position="right"
        :ports="[{ id: 'output', label: 'out', signal: 'audio' }]"
      />
    </div>
  </BaseModuleShell>
</template>
