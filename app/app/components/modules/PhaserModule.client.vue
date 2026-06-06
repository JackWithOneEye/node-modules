<script lang="ts" setup>
export type PhaserModuleProps = {
  id: string
  type: string
  title?: string
  rate?: number
}
const props = withDefaults(defineProps<PhaserModuleProps>(), {
  title: 'Phaser',
  rate: 0.5,
})

const { getAudioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const phaserNode = new PhaserWorkletNode(getAudioContext(), { rate: props.rate })

const [rate] = useAudioParam('rate', props.rate, value => setParamValue(phaserNode.rate, value))

registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        phaserNode.connect(target, 0)
        return
      }
      phaserNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        phaserNode.disconnect(target, 0)
        return
      }
      phaserNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input: { type: 'audioNode', node: phaserNode, inputIndex: 0 },
    rate: { type: 'param', param: phaserNode.rate },
  },
  onSuspend: () => {
    phaserNode.reset()
  },
})

onUnmounted(() => {
  phaserNode.destroy()
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
        :ports="[
          { id: 'input', label: 'in', signal: 'audio' },
          { id: 'rate', label: 'rate', signal: 'cv' },
        ]"
      />
      <KnobInput
        v-model="rate"
        label="rate"
        :min="0.1"
        :max="20"
        :step="0.1"
        :format-fn="(v) => v.toFixed(1) + 'Hz'"
      />
      <ModulePortRail
        position="right"
        :ports="[{ id: 'output', label: 'out', signal: 'audio' }]"
      />
    </div>
  </BaseModuleShell>
</template>
