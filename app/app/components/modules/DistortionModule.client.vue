<script lang="ts" setup>
export type DistortionModuleProps = {
  id: string
  type: string
  title?: string
  inputGain?: number
  wf?: number
  wh?: number
  uf?: number
  uh?: number
  bf?: number
  outputGain?: number
  dcFilter?: boolean
}
const props = withDefaults(defineProps<DistortionModuleProps>(), {
  title: 'Distortion',
  inputGain: 0,
  wf: 2,
  wh: 1,
  uf: 0,
  uh: 0,
  bf: 0,
  outputGain: 0,
  dcFilter: false,
})

const { getAudioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const distortionNode = new DistortionWorkletNode(getAudioContext(), {
  inputGain: props.inputGain,
  wf: props.wf,
  wh: props.wh,
  uf: props.uf,
  uh: props.uh,
  bf: props.bf,
  outputGain: props.outputGain,
  dcFilter: props.dcFilter ? 1 : 0,
})

const formatDb = (v: number) => `${v.toFixed(1)}dB`
const formatCoeff = (v: number) => v.toFixed(2)
const knobs = reactive(([
  // user-facing names for the yaGRUd GRU parameters (W_h, W_f, U_f, U_h, b_f); the tooltips say what each does
  { name: 'inputGain', label: 'Drive', tooltip: 'Input gain', step: 0.1, formatFn: formatDb },
  { name: 'wh', label: 'Fuzz', tooltip: 'Saturation: warm to square fuzz', step: 0.01, formatFn: formatCoeff },
  { name: 'wf', label: 'Bias', tooltip: 'Asymmetry: lopsided, tube-like', step: 0.01, formatFn: formatCoeff },
  { name: 'uf', label: 'Velcro', tooltip: 'Stickiness: clings to one side', step: 0.01, formatFn: formatCoeff },
  { name: 'uh', label: 'Melt', tooltip: 'Feedback: thick, dark, then collapses', step: 0.01, formatFn: formatCoeff },
  { name: 'bf', label: 'Battery', tooltip: 'Response: dying battery to fresh', step: 0.01, formatFn: formatCoeff },
  { name: 'outputGain', label: 'Level', tooltip: 'Output volume', step: 0.1, formatFn: formatDb },
] as const).map(knob => ({
  ...knob,
  min: distortionNode[knob.name].minValue,
  max: distortionNode[knob.name].maxValue,
  value: useAudioParam(knob.name, props[knob.name], value => setParamValue(distortionNode[knob.name], value))[0],
})))

const dcFilter = ref(props.dcFilter)
const { updateNodeData } = useVueFlow()
watch(dcFilter, (curr) => {
  setParamValue(distortionNode.dcFilter, curr ? 1 : 0)
  updateNodeData<DistortionModuleProps>(props.id, { dcFilter: curr })
})

registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        distortionNode.connect(target, 0)
        return
      }
      distortionNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        distortionNode.disconnect(target, 0)
        return
      }
      distortionNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', node: distortionNode, inputIndex: 0 },
    inputGain: { type: 'param', param: distortionNode.inputGain },
    wf: { type: 'param', param: distortionNode.wf },
    wh: { type: 'param', param: distortionNode.wh },
    uf: { type: 'param', param: distortionNode.uf },
    uh: { type: 'param', param: distortionNode.uh },
    bf: { type: 'param', param: distortionNode.bf },
    outputGain: { type: 'param', param: distortionNode.outputGain },
  },
  onSuspend: () => {
    distortionNode.reset()
  },
})

onUnmounted(() => {
  distortionNode.destroy()
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
      <div class="nodrag grid grid-cols-4 gap-x-1 gap-y-2 items-end">
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
            :step="knob.step"
            :format-fn="knob.formatFn"
          />
        </WithHandle>
        <div class="flex flex-col items-center gap-1 pb-5">
          <span class="text-xs font-mono text-white/50">Tight</span>
          <USwitch
            v-model="dcFilter"
            size="sm"
            aria-label="Tight: DC filter, removes off-center drift"
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
