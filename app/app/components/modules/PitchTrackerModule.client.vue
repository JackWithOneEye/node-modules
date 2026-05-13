<script lang="ts" setup>
export type PitchTrackerModuleProps = {
  id: string
  type: string
  title?: string
  harmonicThreshold?: number
}
const props = withDefaults(defineProps<PitchTrackerModuleProps>(), {
  title: 'Pitch Tracker',
  harmonicThreshold: 0.1,
})

const { audioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const pitchTrackerNode = new PitchTrackerWorkletNode(audioContext, {
  harmonicThreshold: props.harmonicThreshold,
  windowSizeSamples: 0.0275 * audioContext.sampleRate,
})

const sourcePorts = [
  { id: 'output', label: 'out', signal: 'cv' },
] satisfies ModulePort[]
const targetPorts = [
  { id: 'input', label: 'in', signal: 'audio' },
  { id: 'harmonicThreshold', label: 'thresh', signal: 'cv' },
] satisfies ModulePort[]

registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        pitchTrackerNode.connect(target)
        return
      }
      pitchTrackerNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        pitchTrackerNode.disconnect(target)
        return
      }
      pitchTrackerNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', node: pitchTrackerNode, inputIndex: 0 },
    harmonicThreshold: { type: 'param', param: pitchTrackerNode.harmonicThreshold },
  },
  onSuspend: () => {
    pitchTrackerNode.reset()
  },
})

onUnmounted(() => {
  pitchTrackerNode.destroy()
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
            name="harmonicThreshold"
            :default-value="harmonicThreshold"
            label="HTHRESH"
            :min="0.01"
            :max="1.0"
            :step="0.01"
            unit=""
            @on-change="value => setParamValue(pitchTrackerNode.harmonicThreshold, value)"
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
