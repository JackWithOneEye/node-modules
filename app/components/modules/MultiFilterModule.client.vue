<script lang="ts" setup>
import { Handle } from '@vue-flow/core'

export type MultiFilterModuleProps = {
  id: string
  type: string
  title?: string
  cutoff?: number // Hz
  q?: number
}
const props = withDefaults(defineProps<MultiFilterModuleProps>(), {
  title: 'Multi Filter',
  cutoff: 1000,
  q: 0.707,
})
const {
  scaled: cutoffScaled,
  hz: cutoffHz,
  controlRange: cutoffControlRange,
} = useFrequencyParam('cutoff', props.cutoff, 20, 10, value => store.setParamValue(multiFilterNode.cutoff, value, 'lin', 0.01))
const [q] = useAudioParam('q', props.q, value => store.setParamValue(multiFilterNode.q, value, 'lin'))

const store = useAudioContextStore()
const multiFilterNode = new MultiFilterWorkletNode(store.audioContext, { cutoff: props.cutoff, q: props.q })

const outputIndexMap: Record<string, number> = {
  bpfOut: 0,
  bsfOut: 1,
  hpfOut: 2,
  lpfOut: 3,
}
store.registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (outputId, target, targetIndex) => {
      const outputIndex = outputIndexMap[outputId]
      if (target instanceof AudioParam) {
        multiFilterNode.connect(target, outputIndex)
        return
      }
      multiFilterNode.connect(target, outputIndex, targetIndex)
    },
    disconnect: (outputId, target, targetIndex) => {
      const outputIndex = outputIndexMap[outputId]
      if (target instanceof AudioParam) {
        multiFilterNode.disconnect(target, outputIndex)
        return
      }
      multiFilterNode.disconnect(target, outputIndex, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', node: multiFilterNode, inputIndex: 0 },
    cutoff: { type: 'param', param: multiFilterNode.cutoff },
    q: { type: 'param', param: multiFilterNode.q },
  },
  onSuspend: () => {
    multiFilterNode.reset()
  },
})

onUnmounted(() => {
  multiFilterNode.destroy()
  store.unregisterModule(props.id)
})
</script>

<template>
  <ModuleToolbar />
  <div class="flex flex-col gap-2 border px-1 py-2">
    <span class="text-sm pl-1">{{ title }}</span>
    <div class="flex gap-2">
      <div class="flex flex-col gap-4">
        <HandleLabel class="pt-0">
          in
        </HandleLabel>
        <Handle
          id="input"
          class="!top-10"
          type="target"
          :position="Position.Left"
        />
        <HandleLabel>
          cutoff
        </HandleLabel>
        <Handle
          id="cutoff"
          class="!top-16"
          type="target"
          :position="Position.Left"
        />
        <HandleLabel>
          q
        </HandleLabel>
        <Handle
          id="q"
          class="!top-[5.5rem]"
          type="target"
          :position="Position.Left"
        />
      </div>
      <div class="nodrag flex flex-col gap-3 border border-slate-500 rounded-md p-2">
        <div class="flex gap-1">
          <div class="flex flex-col items-center">
            <Knob
              v-model="cutoffScaled"
              :size="60"
              :min="0"
              :max="cutoffControlRange"
              :value-template="() => `${cutoffHz.toFixed()}Hz`"
            />
            <span class="text-handle">Cutoff</span>
          </div>
          <div class="flex flex-col items-center">
            <Knob
              v-model="q"
              :size="60"
              :min="0.707"
              :max="20"
              :step="0.001"
              :value-template="() => `${q.toFixed()}`"
            />
            <span class="text-handle">Q</span>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-4">
        <HandleLabel class="pt-0">
          bpf
        </HandleLabel>
        <Handle
          id="bpfOut"
          class="!top-10"
          type="source"
          :position="Position.Right"
        />

        <HandleLabel>
          bsf
        </HandleLabel>
        <Handle
          id="bsfOut"
          class="!top-16"
          type="source"
          :position="Position.Right"
        />

        <HandleLabel>
          hpf
        </HandleLabel>
        <Handle
          id="hpfOut"
          class="!top-[5.5rem]"
          type="source"
          :position="Position.Right"
        />

        <HandleLabel>
          lpf
        </HandleLabel>
        <Handle
          id="lpfOut"
          class="!top-[7rem]"
          type="source"
          :position="Position.Right"
        />
      </div>
    </div>
  </div>
</template>
