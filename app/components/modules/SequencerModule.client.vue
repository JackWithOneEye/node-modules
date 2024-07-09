<script lang="ts" setup>
import { Handle } from '@vue-flow/core'

export type SequencerModuleProps = {
  id: string
  type: string
  title: string
  gateThreshold?: number
  numSteps?: number
  values?: number[]
}
const props = withDefaults(defineProps<SequencerModuleProps>(), {
  title: 'Sequencer',
  gateThreshold: 0,
  numSteps: 4,
  values: () => [0, 0, 0, 0],
})

const notes = Object.keys(noteFrequencies) as (keyof typeof noteFrequencies)[]
const { audioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const currentStep = ref(-1)
const sequencerNode = new SequencerWorkletNode(
  audioContext,
  {
    gateThreshold: props.gateThreshold,
    numSteps: props.numSteps,
    values: props.values.map(val => noteFrequencies[notes[val]]),
  },
  (step) => {
    currentStep.value = step
  },
)
const [gateThreshold] = useAudioParam('gateThreshold', props.gateThreshold, value => setParamValue(sequencerNode.gateThreshold, value))
const [numSteps] = useAudioParam('numSteps', props.numSteps, value => setParamValue(sequencerNode.numSteps, value))
const values = reactive(props.values)

const valueScales = ['note', 'value'] as const
const scale = ref<typeof valueScales[number]>('note')
const max = computed(() => scale.value === 'note' ? notes.length - 1 : 1)
function valueLabel(value: number) {
  if (scale.value === 'note') {
    return notes[value]
  }
  return `${value}`
}

const { updateNodeData } = useVueFlow()
watch(values, (curr) => {
  const submit = []
  if (scale.value === 'note') {
    for (const v of curr) {
      submit.push(noteFrequencies[notes[v]])
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
      <div class="nodrag flex items-center gap-1 border border-white/80 rounded-md p-2">
        <div class="flex gap-2">
          <Knob
            v-for="n in numSteps"
            :key="n"
            v-model="values[n - 1]"
            :class="{ 'bg-red-400': currentStep === n - 1 }"
            :size="40"
            :min="0"
            :max="max"
            :value-template="valueLabel"
          />
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
