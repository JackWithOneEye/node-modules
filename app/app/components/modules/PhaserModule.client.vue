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

const { audioContext, registerModule, setParamValue, unregisterModule } = useAudioContextStore()
const phaserNode = new PhaserWorkletNode(audioContext, { rate: props.rate })

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
    :title="title"
  >
    <div class="flex gap-2">
      <ModulePortRail
        position="left"
        :ports="[
          { id: 'input', label: 'in' },
          { id: 'rate', label: 'rate' },
        ]"
      />
      <div class="nodrag flex gap-1 border border-white/80 rounded-md p-2">
        <div class="flex flex-col items-center">
          <Knob v-model="rate" :size="60" :min="0.1" :max="20" :step="0.1" :value-template="() => `${rate.toFixed(1)}Hz`" />
          <span class="text-handle">Rate</span>
        </div>
      </div>
      <ModulePortRail
        position="right"
        :ports="[{ id: 'output', label: 'out' }]"
      />
    </div>
  </BaseModuleShell>
</template>
