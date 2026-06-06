<script lang="ts" setup>
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
const multiFilterNode = new MultiFilterWorkletNode(store.getAudioContext(), { cutoff: props.cutoff, q: props.q })

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
      const outputIndex = outputIndexMap[outputId]!
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
  <BaseModuleShell
    :id="id"
    :type="type"
    :title="props.title"
  >
    <div class="flex">
      <ModulePortRail
        position="left"
        :ports="[
          { id: 'input', label: 'in', signal: 'audio' },
          { id: 'cutoff', label: 'cutoff', signal: 'cv' },
          { id: 'q', label: 'q', signal: 'cv' },
        ]"
      />
      <div class="flex gap-1">
        <KnobInput
          v-model="cutoffScaled"
          label="Cutoff"
          :min="0"
          :max="cutoffControlRange"
          :format-fn="() => cutoffHz.toFixed() + 'Hz'"
        />
        <KnobInput
          v-model="q"
          label="Q"
          :min="0.707"
          :max="20"
          :step="0.001"
          :format-fn="(v) => v.toFixed()"
        />
      </div>
      <ModulePortRail
        position="right"
        :ports="[
          { id: 'bpfOut', label: 'bpf', signal: 'audio' },
          { id: 'bsfOut', label: 'bsf', signal: 'audio' },
          { id: 'hpfOut', label: 'hpf', signal: 'audio' },
          { id: 'lpfOut', label: 'lpf', signal: 'audio' },
        ]"
      />
    </div>
  </BaseModuleShell>
</template>
