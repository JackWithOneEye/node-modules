<script lang="ts" setup>
export type ADSRModuleProps = {
  id: string
  type: string
  title: string

  attack: number
  decay: number
  sustain: number
  release: number
}
const props = withDefaults(defineProps<ADSRModuleProps>(), {
  title: 'ADSR',
  attack: 0,
  decay: 0,
  sustain: 1,
  release: 0.001,
})

const { audioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const adsrNode = new ADSRWorkletNode(audioContext, { attack: props.attack, decay: props.decay, sustain: props.sustain, release: props.release })

const sourceHandles = [
  { id: 'output', label: 'out', type: 'source' as const },
]
const targetHandles = [
  { id: 'trigger', label: 'trig', type: 'target' as const },
  { id: 'retrigger', label: 'retrig', type: 'target' as const },
  { id: 'attack', label: 'atk', type: 'target' as const },
  { id: 'decay', label: 'dec', type: 'target' as const },
  { id: 'sustain', label: 'sus', type: 'target' as const },
  { id: 'release', label: 'rel', type: 'target' as const },
]
const targetsMap: Record<string, Target> = {
  trigger: { type: 'audioNode', node: adsrNode, inputIndex: 0 },
  retrigger: { type: 'audioNode', node: adsrNode, inputIndex: 1 },
  attack: { type: 'param', param: adsrNode.attack },
  decay: { type: 'param', param: adsrNode.decay },
  sustain: { type: 'param', param: adsrNode.sustain },
  release: { type: 'param', param: adsrNode.release },
}
registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        adsrNode.connect(target, 0)
        return
      }
      adsrNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        adsrNode.disconnect(target, 0)
        return
      }
      adsrNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: (id) => {
    return targetsMap[id]
  },
  onSuspend: () => {
    adsrNode.reset()
  },
})

onUnmounted(() => {
  adsrNode.destroy()
  unregisterModule(props.id)
})
</script>

<template>
  <ModuleToolbar />
  <div class="flex flex-col gap-2 border px-2 py-2">
    <span class="text-sm pl-1">{{ title }}</span>
    <div class="flex gap-2">
      <HandleBar
        :handles="targetHandles"
        position="left"
      />
      <div class="nodrag flex flex-col gap-3 border border-white rounded-md p-2">
        <div class="flex gap-1">
          <ParamController
            name="attack"
            :default-value="attack"
            label="ATK"
            :min="0"
            :max="2000"
            :scaling-factor="1000"
            unit="ms"
            @on-change="value => setParamValue(adsrNode.attack, value)"
          />
          <ParamController
            name="decay"
            :default-value="decay"
            label="DEC"
            :min="0"
            :max="2000"
            :scaling-factor="1000"
            unit="ms"
            @on-change="value => setParamValue(adsrNode.decay, value)"
          />
        </div>

        <div class="flex gap-1">
          <ParamController
            name="sustain"
            :default-value="sustain"
            label="SUS"
            :min="0"
            :max="100"
            :scaling-factor="100"
            unit="%"
            @on-change="value => setParamValue(adsrNode.sustain, value)"
          />
          <ParamController
            name="release"
            :default-value="release"
            label="REL"
            :min="0"
            :max="2000"
            :scaling-factor="1000"
            unit="ms"
            @on-change="value => setParamValue(adsrNode.release, value)"
          />
        </div>
      </div>
      <HandleBar
        :handles="sourceHandles"
        position="right"
      />
    </div>
  </div>
</template>
