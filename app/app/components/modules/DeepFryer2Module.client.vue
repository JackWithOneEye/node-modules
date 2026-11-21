<script lang="ts" setup>
export type DeepFryer2ModuleProps = {
  id: string
  type: string
  title?: string
  dryWetMix?: number
  kbps?: number
  hopSize?: number
}
const props = withDefaults(defineProps<DeepFryer2ModuleProps>(), {
  title: 'Deep Fryer 2',
  dryWetMix: 1,
  kbps: 32,
  hopSize: 5,
})

const { id, title, type, ...paramProps } = props
const { getAudioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const deepFryer2Node = new DeepFryer2WorkletNode(getAudioContext(), { ...paramProps })

const pctConv = linearConverter(100)
const [dryWetMix] = useAudioParam('dryWetMix', props.dryWetMix, value => setParamValue(deepFryer2Node.dryWetMix, value), pctConv)
const [kbps] = useAudioParam('kbps', props.kbps, value => setParamValue(deepFryer2Node.kbps, value))
const [hopSize] = useAudioParam('hopSize', props.hopSize, value => setParamValue(deepFryer2Node.hopSize, value))

const pct = (v: number) => v.toFixed(0) + '%'
const kbpsFmt = (v: number) => v.toFixed(0) + 'k'
const hopFmt = (v: number) => String(DEEP_FRYER_2_HOP_SIZES[Math.round(v)])

registerModule(id, {
  meta: { id, type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        deepFryer2Node.connect(target, 0)
        return
      }
      deepFryer2Node.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        deepFryer2Node.disconnect(target, 0)
        return
      }
      deepFryer2Node.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', node: deepFryer2Node, inputIndex: 0 },
    dryWetMix: { type: 'param', param: deepFryer2Node.dryWetMix },
    kbps: { type: 'param', param: deepFryer2Node.kbps },
  },
  onSuspend: () => {
    deepFryer2Node.reset()
  },
})

onUnmounted(() => {
  deepFryer2Node.destroy()
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
      <WithHandle
        handle-id="kbps"
        handle-signal="cv"
      >
        <KnobInput
          v-model="kbps"
          label="kbps"
          :min="8"
          :max="320"
          :format-fn="kbpsFmt"
        />
      </WithHandle>
      <KnobInput
        v-model="hopSize"
        label="hop size"
        :min="0"
        :max="9"
        :format-fn="hopFmt"
      />
      <ModulePortRail
        position="right"
        :ports="[{ id: 'output', label: 'out', signal: 'audio' }]"
      />
    </div>
  </BaseModuleShell>
</template>
