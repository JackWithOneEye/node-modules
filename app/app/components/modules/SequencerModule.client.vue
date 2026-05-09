<script lang="ts" setup>
import { Handle } from '@vue-flow/core'

export type SequencerModuleProps = {
  id: string
  type: string
  title?: string
  gateThreshold?: number
  numSteps?: number
  values?: number[]
}
const props = withDefaults(defineProps<SequencerModuleProps>(), {
  title: 'Sequencer',
  gateThreshold: 0,
  numSteps: 8,
  values: () => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
})

const ROWS = 4
const COLUMNS = 4

const notes = Object.keys(noteFrequencies) as (keyof typeof noteFrequencies)[]
const { audioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const currentStep = ref(-1)
const sequencerNode = new SequencerWorkletNode(
  audioContext,
  {
    gateThreshold: props.gateThreshold,
    numSteps: props.numSteps,
    values: props.values.map(val => val === 0 ? 0 : noteFrequencies[notes[val - 1]]),
  },
  (step) => {
    currentStep.value = step
  },
)
const [_gateThreshold] = useAudioParam('gateThreshold', props.gateThreshold, value => setParamValue(sequencerNode.gateThreshold, value))
const [numSteps] = useAudioParam('numSteps', props.numSteps, value => setParamValue(sequencerNode.numSteps, value))
const values = reactive(props.values)

const _valueScales = ['note', 'value'] as const
const scale = ref<typeof _valueScales[number]>('note')
const max = computed(() => scale.value === 'note' ? notes.length : 1)
function valueLabel(value: number) {
  if (scale.value === 'note') {
    return value === 0 ? '-' : notes[value - 1]
  }
  return `${value}`
}

const { updateNodeData } = useVueFlow()
watch(values, (curr) => {
  const submit = []
  if (scale.value === 'note') {
    for (const v of curr) {
      submit.push(v === 0 ? 0 : noteFrequencies[notes[v - 1]])
    }
  }
  else {
    submit.push(...curr)
  }
  sequencerNode.values = submit

  updateNodeData(props.id, { values: curr })
})

registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        sequencerNode.connect(target, 0)
        return
      }
      sequencerNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        sequencerNode.disconnect(target, 0)
        return
      }
      sequencerNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    gateIn: { type: 'audioNode', node: sequencerNode, inputIndex: 0 },
  },
  onSuspend: () => {
    sequencerNode.reset()
    currentStep.value = -1
  },
})

onUnmounted(() => {
  sequencerNode.destroy()
  unregisterModule(props.id)
})
</script>

<template>
  <ModuleToolbar />
  <div class="flex flex-col gap-2 border px-1 py-1">
    <span class="text-sm pl-1">{{ title }}</span>
    <div class="flex gap-2">
      <HandleLabel class="pt-3">
        gate
      </HandleLabel>
      <Handle
        id="gateIn"
        type="target"
        :position="Position.Left"
      />
      <div class="nodrag flex flex-col items-center gap-2 border border-white/80 rounded-md p-2">
        <div class="flex items-center gap-2">
          <span class="text-xs">Steps:</span>
          <Knob
            v-model="numSteps"
            :size="30"
            :min="1"
            :max="16"
          />
        </div>
        <div class="flex flex-col gap-2">
          <div
            v-for="row in ROWS"
            :key="row"
            class="flex gap-2"
          >
            <Knob
              v-for="col in COLUMNS"
              :key="`${row}-${col}`"
              v-model="values[(row - 1) * COLUMNS + (col - 1)]"
              :class="{
                'bg-red-400': currentStep === (row - 1) * COLUMNS + (col - 1) && values[(row - 1) * COLUMNS + (col - 1)] !== 0,
                'bg-gray-400': currentStep === (row - 1) * COLUMNS + (col - 1) && values[(row - 1) * COLUMNS + (col - 1)] === 0,
                'opacity-50': (row - 1) * COLUMNS + (col - 1) >= numSteps,
              }"
              :size="40"
              :min="0"
              :max="max"
              :value-template="(row - 1) * COLUMNS + (col - 1) >= numSteps ? () => '' : valueLabel"
              :disabled="(row - 1) * COLUMNS + (col - 1) >= numSteps"
            />
          </div>
        </div>
      </div>
      <div class="flex flex-col">
        <HandleLabel class="pt-3">
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
