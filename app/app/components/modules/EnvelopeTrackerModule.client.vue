<script lang="ts" setup>
export type EnvelopeTrackerModuleProps = {
  id: string
  type: string
  title?: string
  sensitivity?: number
  threshold?: number
}
const props = withDefaults(defineProps<EnvelopeTrackerModuleProps>(), {
  title: 'Envelope Tracker',
  sensitivity: 1.0,
  threshold: -60.0,
})

const { getAudioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const envelopeTrackerNode = new EnvelopeTrackerWorkletNode(getAudioContext(), {
  sensitivity: props.sensitivity,
  threshold: props.threshold,
})

const sourcePorts = [
  { id: 'modulation', label: 'mod', signal: 'cv' },
  { id: 'trigger', label: 'trig', signal: 'gate' },
] satisfies ModulePort[]
const targetPorts = [
  { id: 'input', label: 'in', signal: 'audio' },
  { id: 'sensitivity', label: 'sens', signal: 'cv' },
  { id: 'threshold', label: 'thresh', signal: 'cv' },
] satisfies ModulePort[]

registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (outputId, target, targetIndex) => {
      const outputIndex = outputId === 'modulation' ? 0 : 1
      if (target instanceof AudioParam) {
        envelopeTrackerNode.connect(target, outputIndex)
        return
      }
      envelopeTrackerNode.connect(target, outputIndex, targetIndex)
    },
    disconnect: (outputId, target, targetIndex) => {
      const outputIndex = outputId === 'modulation' ? 0 : 1
      if (target instanceof AudioParam) {
        envelopeTrackerNode.disconnect(target, outputIndex)
        return
      }
      envelopeTrackerNode.disconnect(target, outputIndex, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', node: envelopeTrackerNode, inputIndex: 0 },
    sensitivity: { type: 'param', param: envelopeTrackerNode.sensitivity },
    threshold: { type: 'param', param: envelopeTrackerNode.threshold },
  },
  onSuspend: () => {
    envelopeTrackerNode.reset()
  },
})

onUnmounted(() => {
  envelopeTrackerNode.destroy()
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
        :ports="targetPorts"
        position="left"
      />
      <div class="nodrag flex flex-col gap-3 border border-white rounded-md p-2">
        <div class="flex gap-1">
          <ParamController
            name="sensitivity"
            :default-value="sensitivity"
            label="SENS"
            :min="0.25"
            :max="5.0"
            :step="0.01"
            unit=""
            @on-change="value => setParamValue(envelopeTrackerNode.sensitivity, value)"
          />
          <ParamController
            name="threshold"
            :default-value="threshold"
            label="THRESH"
            :min="-60.0"
            :max="0.0"
            :step="1"
            unit="dB"
            @on-change="value => setParamValue(envelopeTrackerNode.threshold, value)"
          />
        </div>
      </div>
      <ModulePortRail
        :ports="sourcePorts"
        position="right"
      />
    </div>
  </BaseModuleShell>
</template>
