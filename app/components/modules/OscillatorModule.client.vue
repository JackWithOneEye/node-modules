<script lang="ts" setup>
import { Handle } from '@vue-flow/core'

export type OscillatorModuleProps = {
  id: string
  type: string
  frequency?: number // Hz
  detune?: number // ct
  waveform?: Exclude<OscillatorType, 'custom'>
}
const props = withDefaults(defineProps<OscillatorModuleProps>(), {
  frequency: 440,
  detune: 0,
  waveform: 'sine',
})

const { scaled: frequencyScaled, hz: frequencyHz, controlRange: freqControlRange } = useFrequencyParam(props.frequency, 110, 4)
const detune = ref(props.detune)
const waveform = ref(props.waveform)
const waveforms: typeof props.waveform[] = ['sine', 'triangle', 'sawtooth', 'square']

const store = useAudioContextStore()
const oscillatorNode = new OscillatorNode(store.audioContext, { frequency: props.frequency, detune: props.detune, type: props.waveform })
const started = ref(false)
if (store.state === 'running') {
  oscillatorNode.start()
  started.value = true
}

const { updateNodeData } = useVueFlow()

watch([frequencyHz, detune, waveform], ([frequency, detune, waveform], [oldFrequency, oldDetune, oldWaveform]) => {
  if (frequency !== oldFrequency) {
    store.setParamValue(oscillatorNode.frequency, frequency, 'exp')
  }
  if (detune !== oldDetune) {
    store.setParamValue(oscillatorNode.detune, detune, 'lin')
  }
  if (waveform !== oldWaveform) {
    oscillatorNode.type = waveform
  }
  updateNodeData<OscillatorModuleProps>(props.id, { frequency, detune, waveform })
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
  // onSuspend: () => {
  //   oscillatorNode.stop()
  // },
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
  <div class="flex flex-col gap-2 border px-1 py-2">
    <span class="text-sm pl-1">Oscillator</span>
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
        <!-- <div class="flex flex-col gap-2">
          <Button
            class="w-5 text-xs"
            icon="pi pi-plus"
            icon-class="!text-xs"
            :disabled="gain >= maxGain"
            @click="gain++"
          />
          <Button
            class="w-5 text-xs"
            icon="pi pi-minus"
            icon-class="!text-xs"
            :disabled="gain <= minGain"
            @click="gain--"
          />
        </div> -->
        <div class="flex gap-1">
          <div class="flex flex-col items-center">
            <Knob
              v-model="frequencyScaled"
              :size="60"
              :min="0"
              :max="freqControlRange"
              :value-template="`${frequencyHz.toFixed()}Hz`"
            />
            <span class="text-handle">Frequency</span>
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
