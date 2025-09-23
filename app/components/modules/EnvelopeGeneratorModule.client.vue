<script lang="ts" setup>
export type EnvelopeGeneratorModuleProps = {
  id: string
  type: string
  title?: string

  attack?: number
  decay?: number
  sustain?: number
  release?: number
  applyVelocity?: boolean
}
const props = withDefaults(defineProps<EnvelopeGeneratorModuleProps>(), {
  title: 'Envelope Generator',
  attack: 1,
  decay: 1,
  sustain: 1,
  release: 1,
  applyVelocity: false,
})

const { audioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const envelopeGeneratorNode = new EnvelopeGeneratorWorkletNode(audioContext, {
  attack: props.attack,
  decay: props.decay,
  sustain: props.sustain,
  release: props.release,
  applyVelocity: props.applyVelocity ? 1 : 0,
})

const applyVelocity = ref(props.applyVelocity)
const { updateNodeData } = useVueFlow()

watch(applyVelocity, (curr) => {
  setParamValue(envelopeGeneratorNode.applyVelocity, curr ? 1 : 0)
  updateNodeData<EnvelopeGeneratorModuleProps>(props.id, { applyVelocity: curr })
})

const sourceHandles = [
  { id: 'output', label: 'out', type: 'source' as const },
]
const targetHandles = [
  { id: 'trigger', label: 'trig', type: 'target' as const },
  { id: 'retrigger', label: 'retrig', type: 'target' as const },
  { id: 'velocity', label: 'vel', type: 'target' as const },
  { id: 'attack', label: 'atk', type: 'target' as const },
  { id: 'decay', label: 'dec', type: 'target' as const },
  { id: 'sustain', label: 'sus', type: 'target' as const },
  { id: 'release', label: 'rel', type: 'target' as const },
  { id: 'applyVelocity', label: 'vel en', type: 'target' as const },
]
registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        envelopeGeneratorNode.connect(target, 0)
        return
      }
      envelopeGeneratorNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        envelopeGeneratorNode.disconnect(target, 0)
        return
      }
      envelopeGeneratorNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    trigger: { type: 'audioNode', node: envelopeGeneratorNode, inputIndex: 0 },
    retrigger: { type: 'audioNode', node: envelopeGeneratorNode, inputIndex: 1 },
    velocity: { type: 'audioNode', node: envelopeGeneratorNode, inputIndex: 2 },
    attack: { type: 'param', param: envelopeGeneratorNode.attack },
    decay: { type: 'param', param: envelopeGeneratorNode.decay },
    sustain: { type: 'param', param: envelopeGeneratorNode.sustain },
    release: { type: 'param', param: envelopeGeneratorNode.release },
    applyVelocity: { type: 'param', param: envelopeGeneratorNode.applyVelocity },
  },
  onSuspend: () => {
    envelopeGeneratorNode.reset()
  },
})

onUnmounted(() => {
  envelopeGeneratorNode.destroy()
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
            :max="5000"
            unit="ms"
            @on-change="value => setParamValue(envelopeGeneratorNode.attack, value)"
          />
          <ParamController
            name="decay"
            :default-value="decay"
            label="DEC"
            :min="0"
            :max="5000"
            unit="ms"
            @on-change="value => setParamValue(envelopeGeneratorNode.decay, value)"
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
            @on-change="value => setParamValue(envelopeGeneratorNode.sustain, value)"
          />
          <ParamController
            name="release"
            :default-value="release"
            label="REL"
            :min="0"
            :max="5000"
            unit="ms"
            @on-change="value => setParamValue(envelopeGeneratorNode.release, value)"
          />
        </div>

        <div class="flex gap-1 items-center">
          <label class="text-xs">VEL EN</label>
          <InputSwitch
            v-model="applyVelocity"
            :binary="true"
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
