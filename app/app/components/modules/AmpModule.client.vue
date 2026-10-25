<script lang="ts" setup>
export type AmpModuleProps = {
  id: string
  type: string
  title?: string
  gain?: number
  bass?: number
  mid?: number
  treble?: number
  bright?: boolean
  master?: number
}
const props = withDefaults(defineProps<AmpModuleProps>(), {
  title: 'Amp',
  gain: 0,
  bass: 0,
  mid: 0,
  treble: 0,
  bright: false,
  master: 0,
})

const { getAudioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const ampNode = new AmpWorkletNode(getAudioContext(), {
  gain: props.gain,
  bass: props.bass,
  mid: props.mid,
  treble: props.treble,
  bright: props.bright ? 1 : 0,
  master: props.master,
})

const formatDb = (v: number) => `${v.toFixed(1)}dB`
const knobs = reactive(([
  { name: 'gain', label: 'Gain', tooltip: 'Input gain: clean up to the rails, then soft clipping' },
  { name: 'bass', label: 'Bass', tooltip: 'Low shelf at 120 Hz' },
  { name: 'mid', label: 'Mid', tooltip: 'Peak at 750 Hz' },
  { name: 'treble', label: 'Treble', tooltip: 'High shelf at 2.5 kHz' },
  { name: 'master', label: 'Master', tooltip: 'Output volume' },
] as const).map(knob => ({
  ...knob,
  min: ampNode[knob.name].minValue,
  max: ampNode[knob.name].maxValue,
  value: useAudioParam(knob.name, props[knob.name], value => setParamValue(ampNode[knob.name], value))[0],
})))

const bright = ref(props.bright)
const { updateNodeData } = useVueFlow()
watch(bright, (curr) => {
  setParamValue(ampNode.bright, curr ? 1 : 0)
  updateNodeData<AmpModuleProps>(props.id, { bright: curr })
})

registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        ampNode.connect(target, 0)
        return
      }
      ampNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        ampNode.disconnect(target, 0)
        return
      }
      ampNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', node: ampNode, inputIndex: 0 },
    gain: { type: 'param', param: ampNode.gain },
    bass: { type: 'param', param: ampNode.bass },
    mid: { type: 'param', param: ampNode.mid },
    treble: { type: 'param', param: ampNode.treble },
    master: { type: 'param', param: ampNode.master },
  },
  onSuspend: () => {
    ampNode.reset()
  },
})

onUnmounted(() => {
  ampNode.destroy()
  unregisterModule(props.id)
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
        :ports="[{ id: 'input', label: 'in', signal: 'audio' }]"
      />
      <div class="nodrag grid grid-cols-3 gap-x-1 gap-y-2 items-end">
        <WithHandle
          v-for="knob in knobs"
          :key="knob.name"
          :handle-id="knob.name"
          handle-signal="cv"
        >
          <span class="text-xs font-mono text-white/50">{{ knob.label }}</span>
          <KnobInput
            v-model="knob.value"
            :label="knob.tooltip"
            :min="knob.min"
            :max="knob.max"
            :step="0.1"
            :format-fn="formatDb"
          />
        </WithHandle>
        <div class="flex flex-col items-center gap-1 pb-5">
          <span class="text-xs font-mono text-white/50">Bright</span>
          <USwitch
            v-model="bright"
            size="sm"
            aria-label="Bright: +6 dB treble boost above 3.5 kHz"
          />
        </div>
      </div>
      <ModulePortRail
        position="right"
        :ports="[{ id: 'output', label: 'out', signal: 'audio' }]"
      />
    </div>
  </BaseModuleShell>
</template>
