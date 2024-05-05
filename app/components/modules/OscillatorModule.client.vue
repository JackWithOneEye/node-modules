<script lang="ts" setup>
import { Handle } from '@vue-flow/core'

export type OscillatorModuleProps = {
  id: string
  type: string
  title: string
  frequency?: number // Hz
  detune?: number // ct
  waveform?: Exclude<OscillatorType, 'custom'>

  frequencyEnabled?: boolean
}
const props = withDefaults(defineProps<OscillatorModuleProps>(), {
  title: 'Oscillator',
  frequency: 0, // 440,
  detune: 0,
  waveform: 'sine',
  frequencyEnabled: true,
})

function updateFrequency(value: number) {
  store.setParamValue(oscillatorNode.frequency, value, 'exp')
}

const {
  scaled: frequencyScaled,
  hz: frequencyHz,
  controlRange: freqControlRange,
} = useFrequencyParam('frequency', props.frequency, 110, 4, value => updateFrequency(value))
const [detune] = useAudioParam('detune', props.detune, value => store.setParamValue(oscillatorNode.detune, value, 'lin'))
const waveform = ref(props.waveform)
const waveforms: typeof props.waveform[] = ['sine', 'triangle', 'sawtooth', 'square']

const frequencyEnabled = ref(props.frequencyEnabled)

const store = useAudioContextStore()
const oscillatorNode = new OscillatorNode(store.audioContext, {
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

watch(waveform, (waveform, oldWaveform) => {
  if (waveform !== oldWaveform) {
    oscillatorNode.type = waveform
  }
  updateNodeData<OscillatorModuleProps>(props.id, { waveform })
})

watch(frequencyEnabled, (curr, prev) => {
  if (!curr && prev) {
    store.setParamValue(oscillatorNode.frequency, 0, 'lin')
  }
  else if (curr && !prev) {
    updateFrequency(frequencyHz.value)
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
  getTarget: (id) => {
    switch (id) {
      case 'frequency':
        return {
          type: 'param',
          param: oscillatorNode.frequency,
        }
      case 'detune':
        return {
          type: 'param',
          param: oscillatorNode.detune,
        }
    }
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
  <ModuleToolbar />
  <div class="flex flex-col gap-2 border px-1 py-2">
    <span class="text-sm pl-1">{{ title }}</span>
    <div class="flex gap-2">
      <div class="flex flex-col gap-4">
        <HandleLabel class="pt-6">
          freq
        </HandleLabel>
        <Handle
          id="frequency"
          class="!top-16"
          type="target"
          :position="Position.Left"
        />
        <HandleLabel class="pt-10">
          detune
        </HandleLabel>
        <Handle
          id="detune"
          class="!top-32"
          type="target"
          :position="Position.Left"
        />
      </div>
      <div class="nodrag flex flex-col gap-3 border border-slate-500 rounded-md p-2">
        <div class="flex gap-1">
          <div class="flex flex-col items-center">
            <Knob
              v-model="frequencyScaled"
              :disabled="!frequencyEnabled"
              :size="60"
              :min="0"
              :max="freqControlRange"
              :value-template="`${frequencyHz.toFixed()}Hz`"
            />
            <span class="text-handle">Frequency</span>
            <InputSwitch
              v-model="frequencyEnabled"
              :binary="true"
            />
          </div>
          <div class="flex flex-col items-center">
            <Knob
              v-model="detune"
              :size="60"
              :min="0"
              :max="100"
              value-template="{value}ct"
            />
            <span class="text-handle">Detune</span>
          </div>
        </div>
        <Dropdown
          v-model="waveform"
          class="border h-8 text-xs w-full"
          :options="waveforms"
        />
      </div>
      <div class="flex flex-col">
        <HandleLabel class="pt-12">
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
