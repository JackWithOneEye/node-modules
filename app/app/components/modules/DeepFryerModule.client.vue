<script lang="ts" setup>
export type DeepFryerModuleProps = {
  id: string
  type: string
  title?: string
  dryWetMix?: number
  magnitude?: number
  overlap?: number
  generations?: number
  ampBits?: number
  phaseBits?: number
  sigBits?: number
}
const props = withDefaults(defineProps<DeepFryerModuleProps>(), {
  title: 'Deep Fryer',
  dryWetMix: 1,
  magnitude: 10,
  overlap: 0.5,
  generations: 1,
  ampBits: 32,
  phaseBits: 32,
  sigBits: 32,
})

const { id, title, type, ...paramProps } = props
const { getAudioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const deepFryerNode = new DeepFryerWorkletNode(getAudioContext(), { ...paramProps })

const pctConv = linearConverter(100)
const [dryWetMix] = useAudioParam('dryWetMix', props.dryWetMix, value => setParamValue(deepFryerNode.dryWetMix, value), pctConv)
const [magnitude] = useAudioParam('magnitude', props.magnitude, value => setParamValue(deepFryerNode.magnitude, value))
const [overlap] = useAudioParam('overlap', props.overlap, value => setParamValue(deepFryerNode.overlap, value), pctConv)
const [generations] = useAudioParam('generations', props.generations, value => setParamValue(deepFryerNode.generations, value))
const [ampBits] = useAudioParam('ampBits', props.ampBits, value => setParamValue(deepFryerNode.ampBits, value))
const [phaseBits] = useAudioParam('phaseBits', props.phaseBits, value => setParamValue(deepFryerNode.phaseBits, value))
const [sigBits] = useAudioParam('sigBits', props.sigBits, value => setParamValue(deepFryerNode.sigBits, value))

const pct = (v: number) => v.toFixed(0) + '%'
const bits = (v: number) => v.toFixed(0) + 'b'
const fftSize = (v: number) => String(2 ** v)

registerModule(id, {
  meta: { id, type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        deepFryerNode.connect(target, 0)
        return
      }
      deepFryerNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        deepFryerNode.disconnect(target, 0)
        return
      }
      deepFryerNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', node: deepFryerNode, inputIndex: 0 },
    dryWetMix: { type: 'param', param: deepFryerNode.dryWetMix },
    overlap: { type: 'param', param: deepFryerNode.overlap },
    ampBits: { type: 'param', param: deepFryerNode.ampBits },
    phaseBits: { type: 'param', param: deepFryerNode.phaseBits },
    sigBits: { type: 'param', param: deepFryerNode.sigBits },
  },
  onSuspend: () => {
    deepFryerNode.reset()
  },
})

onUnmounted(() => {
  deepFryerNode.destroy()
  unregisterModule(id)
})
</script>

<template>
  <BaseModuleShell
    :id="id"
    :type="type"
    :title="title"
  >
    <div class="flex">
      <ModulePortRail
        position="left"
        :ports="[{ id: 'input', label: 'in', signal: 'audio' }]"
      />
      <WithHandle
        handle-id="dryWetMix"
        handle-signal="cv"
      >
        <KnobInput
          v-model="dryWetMix"
          label="wet mix"
          :min="0"
          :max="100"
          :format-fn="pct"
        />
      </WithHandle>
      <KnobInput
        v-model="magnitude"
        label="fft size"
        :min="2"
        :max="11"
        :format-fn="fftSize"
      />
      <WithHandle
        handle-id="overlap"
        handle-signal="cv"
      >
        <KnobInput
          v-model="overlap"
          label="overlap"
          :min="0"
          :max="50"
          :format-fn="pct"
        />
      </WithHandle>
      <KnobInput
        v-model="generations"
        label="generations"
        :min="1"
        :max="10"
      />
      <WithHandle
        handle-id="ampBits"
        handle-signal="cv"
      >
        <KnobInput
          v-model="ampBits"
          label="amp bits"
          :min="1"
          :max="32"
          :format-fn="bits"
        />
      </WithHandle>
      <WithHandle
        handle-id="phaseBits"
        handle-signal="cv"
      >
        <KnobInput
          v-model="phaseBits"
          label="phase bits"
          :min="1"
          :max="32"
          :format-fn="bits"
        />
      </WithHandle>
      <WithHandle
        handle-id="sigBits"
        handle-signal="cv"
      >
        <KnobInput
          v-model="sigBits"
          label="signal bits"
          :min="1"
          :max="32"
          :format-fn="bits"
        />
      </WithHandle>
      <ModulePortRail
        position="right"
        :ports="[{ id: 'output', label: 'out', signal: 'audio' }]"
      />
    </div>
  </BaseModuleShell>
</template>
