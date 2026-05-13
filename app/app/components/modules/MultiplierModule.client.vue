<script lang="ts" setup>
export type MultiplierModuleProps = {
  id: string
  type: string
  title?: string
}
const props = withDefaults(defineProps<MultiplierModuleProps>(), {
  title: 'Multiplier',
})
const store = useAudioContextStore()
const multiplierNode = new MultiplierWorkletNode(store.audioContext)

store.registerModule(props.id, {
  meta: { id: props.id, type: props.type },
  sourceInterfaces: {
    connect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        multiplierNode.connect(target, 0)
        return
      }
      multiplierNode.connect(target, 0, targetIndex)
    },
    disconnect: (_, target, targetIndex) => {
      if (target instanceof AudioParam) {
        multiplierNode.disconnect(target, 0)
        return
      }
      multiplierNode.disconnect(target, 0, targetIndex)
    },
  },
  getTarget: {
    input1: { type: 'audioNode', node: multiplierNode, inputIndex: 0 },
    input2: { type: 'audioNode', node: multiplierNode, inputIndex: 1 },
  },
})

onUnmounted(() => {
  multiplierNode.destroy()
  store.unregisterModule(props.id)
})
</script>

<template>
  <BaseModuleShell
    :id="id"
    :type="type"
    :title="props.title"
  >
    <ModulePortRow
      :input="{ id: 'input1', label: 'in1', signal: 'audio' }"
      :output="{ id: 'output', label: 'out', signal: 'audio' }"
    />
    <ModulePortRow :input="{ id: 'input2', label: 'in2', signal: 'audio' }" />
  </BaseModuleShell>
</template>
